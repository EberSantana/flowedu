#!/usr/bin/env node
/**
 * validate-sql-schema.mjs
 * 
 * Script de validação automática: cruza queries SQL raw do código-fonte
 * com o schema real do banco TiDB para detectar incompatibilidades de
 * nomes de colunas antes do deploy.
 *
 * Uso:
 *   node scripts/validate-sql-schema.mjs [--fetch-schema] [--report]
 *
 * Flags:
 *   --fetch-schema   Busca o schema atual do TiDB e salva em scripts/tidb-schema-cache.json
 *   --report         Gera relatório detalhado em scripts/sql-audit-report.md
 *   --strict         Retorna exit code 1 se encontrar problemas reais (útil em CI/CD)
 *
 * Exemplos:
 *   node scripts/validate-sql-schema.mjs --fetch-schema
 *   node scripts/validate-sql-schema.mjs --report --strict
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createConnection } from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const SCHEMA_CACHE = join(__dirname, 'tidb-schema-cache.json');

// ─── Configuração ────────────────────────────────────────────────────────────

const FILES_TO_AUDIT = [
  join(projectRoot, 'server/routers.ts'),
  join(projectRoot, 'server/db.ts'),
  join(projectRoot, 'server/_core/llm.ts'),
  join(projectRoot, 'server/push-notifications.ts'),
];

// Palavras reservadas SQL (não são nomes de colunas)
const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'JOIN',
  'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AS', 'CASE', 'WHEN',
  'THEN', 'ELSE', 'END', 'GROUP', 'BY', 'ORDER', 'LIMIT', 'OFFSET',
  'HAVING', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'DATE',
  'NOW', 'INTERVAL', 'DAY', 'MONTH', 'YEAR', 'DATE_SUB', 'DATE_ADD',
  'COALESCE', 'IFNULL', 'IF', 'CONCAT', 'LENGTH', 'TRIM', 'UPPER',
  'LOWER', 'SUBSTRING', 'REPLACE', 'LIKE', 'BETWEEN', 'EXISTS',
  'UNION', 'ALL', 'ASC', 'DESC', 'TRUE', 'FALSE', 'FLOOR', 'CEIL',
  'ROUND', 'ABS', 'MOD', 'DIV', 'CAST', 'CONVERT', 'CHAR', 'VARCHAR',
  'INT', 'BIGINT', 'DECIMAL', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'TIMESTAMP',
  'DATETIME', 'TEXT', 'JSON', 'DESCRIBE', 'SHOW', 'CREATE', 'ALTER',
  'DROP', 'INDEX', 'TABLE', 'DATABASE', 'COLUMN', 'PRIMARY', 'KEY',
  'FOREIGN', 'REFERENCES', 'UNIQUE', 'DEFAULT', 'AUTO_INCREMENT',
  'CURRENT_TIMESTAMP', 'ON', 'UPDATE',
]);

// Aliases de resultado SQL comuns (não são colunas do banco)
const KNOWN_RESULT_ALIASES = new Set([
  'date', 'tokens', 'calls', 'totalCalls', 'totalTokens', 'promptTokens',
  'completionTokens', 'successCalls', 'errorCalls', 'totalAccesses',
  'errorMessage', 'pricingLabel', 'estimatedCost', 'subjectName',
  'className', 'completedExercises', 'avgScore', 'totalAttempts',
  'maxScore', 'avgCompletion', 'totalStudents', 'lastAttempt', 'lastStatus',
  'attemptCount', 'totalScore', 'avgTime', 'completionRate', 'passRate',
  'totalQuestions', 'correctAnswers', 'wrongAnswers', 'score', 'rank',
  'totalPoints', 'weeklyPoints', 'monthlyPoints', 'dailyPoints',
]);

// ─── Funções auxiliares ───────────────────────────────────────────────────────

function parseDatabaseUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/([^?]+)/);
  if (!match) throw new Error(`DATABASE_URL inválida: ${url.substring(0, 50)}...`);
  const [, user, password, host, port, database] = match;
  return { user, password, host, port: parseInt(port || '4000'), database };
}

async function fetchSchemaFromTiDB() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL não está definida no ambiente');

  const creds = parseDatabaseUrl(dbUrl);
  console.log(`Conectando ao TiDB: ${creds.host}:${creds.port}/${creds.database}`);

  const conn = await createConnection({
    ...creds,
    ssl: { rejectUnauthorized: false },
  });

  const [rows] = await conn.execute(
    `SELECT TABLE_NAME, COLUMN_NAME 
     FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = ? 
     ORDER BY TABLE_NAME, ORDINAL_POSITION`,
    [creds.database]
  );

  await conn.end();

  // Construir mapa: tabela -> [colunas]
  const schema = {};
  for (const row of rows) {
    const { TABLE_NAME, COLUMN_NAME } = row;
    if (!schema[TABLE_NAME]) schema[TABLE_NAME] = [];
    schema[TABLE_NAME].push(COLUMN_NAME);
  }

  return schema;
}

function extractTablesFromSQL(sql) {
  const tables = [];
  const patterns = [
    /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    /\bINTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    /\bUPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
    /\bJOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi,
  ];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(sql)) !== null) {
      const tbl = m[1];
      if (!SQL_KEYWORDS.has(tbl.toUpperCase())) {
        tables.push(tbl);
      }
    }
  }
  return [...new Set(tables)];
}

/**
 * Extrai mapeamento de alias -> tabela real da query SQL.
 * Ex: "FROM students st JOIN classes c" -> { st: 'students', c: 'classes' }
 */
function extractTableAliases(sql) {
  const aliases = {};
  // FROM table alias ou FROM table AS alias
  const patterns = [
    /\bFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)(?:\s|$|,|\n)/gi,
    /\bJOIN\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)(?:\s|$|\n|ON)/gi,
    /\bUPDATE\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*)(?:\s|$|\n|SET)/gi,
  ];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(sql)) !== null) {
      const [, tableName, alias] = m;
      if (!SQL_KEYWORDS.has(tableName.toUpperCase()) && !SQL_KEYWORDS.has(alias.toUpperCase()) && alias !== tableName) {
        aliases[alias] = tableName;
      }
    }
  }
  return aliases;
}

function extractColumnReferences(sql) {
  // Retorna [{col, ctx, aliasPrefix}] onde aliasPrefix é o alias de tabela (se houver)
  const cols = [];

  // SELECT col1, alias.col2 FROM
  const selectMatch = sql.match(/\bSELECT\s+([\s\S]+?)\s+FROM\b/i);
  if (selectMatch) {
    const selectPart = selectMatch[1];
    for (const item of selectPart.split(',')) {
      let clean = item.trim().replace(/\s+AS\s+\w+/gi, '').trim();
      let aliasPrefix = null;
      if (clean.includes('.')) {
        const parts = clean.split('.');
        aliasPrefix = parts[0].trim();
        clean = parts[1].trim();
      }
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(clean) && !SQL_KEYWORDS.has(clean.toUpperCase())) {
        cols.push({ col: clean, ctx: 'SELECT', aliasPrefix });
      }
    }
  }

  // WHERE/AND/OR [alias.]col =
  for (const m of sql.matchAll(/\b(?:WHERE|AND|OR)\s+(\w+\.)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|!=|<|>|<=|>=|IS|LIKE|IN)/gi)) {
    const aliasPrefix = m[1] ? m[1].replace('.', '') : null;
    const col = m[2];
    if (!SQL_KEYWORDS.has(col.toUpperCase())) cols.push({ col, ctx: 'WHERE', aliasPrefix });
  }

  // SET col =
  for (const m of sql.matchAll(/\bSET\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gi)) {
    const col = m[1];
    if (!SQL_KEYWORDS.has(col.toUpperCase())) cols.push({ col, ctx: 'SET', aliasPrefix: null });
  }

  // INSERT INTO table (col1, col2, ...)
  const insertMatch = sql.match(/\bINSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
  if (insertMatch) {
    for (const col of insertMatch[1].split(',')) {
      const c = col.trim();
      if (c && !SQL_KEYWORDS.has(c.toUpperCase())) cols.push({ col: c, ctx: 'INSERT', aliasPrefix: null });
    }
  }

  // ORDER BY [alias.]col
  for (const m of sql.matchAll(/\bORDER\s+BY\s+(\w+\.)?([a-zA-Z_][a-zA-Z0-9_]*)/gi)) {
    const aliasPrefix = m[1] ? m[1].replace('.', '') : null;
    const col = m[2];
    if (!SQL_KEYWORDS.has(col.toUpperCase())) cols.push({ col, ctx: 'ORDER BY', aliasPrefix });
  }

  // GROUP BY [alias.]col
  for (const m of sql.matchAll(/\bGROUP\s+BY\s+(\w+\.)?([a-zA-Z_][a-zA-Z0-9_]*)/gi)) {
    const aliasPrefix = m[1] ? m[1].replace('.', '') : null;
    const col = m[2];
    if (!SQL_KEYWORDS.has(col.toUpperCase())) cols.push({ col, ctx: 'GROUP BY', aliasPrefix });
  }

  // SUM([alias.]col), COUNT([alias.]col), etc.
  for (const m of sql.matchAll(/\b(?:SUM|COUNT|AVG|MAX|MIN)\s*\(\s*(\w+\.)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/gi)) {
    const aliasPrefix = m[1] ? m[1].replace('.', '') : null;
    const col = m[2];
    if (!SQL_KEYWORDS.has(col.toUpperCase()) && col !== '*') cols.push({ col, ctx: 'AGGREGATE', aliasPrefix });
  }

  return cols;
}

function isFalsePositive(col, sql, allTableColumns) {
  // Alias de tabela (1-2 chars)
  if (col.length <= 2) return true;
  // Alias de resultado SQL conhecido
  if (KNOWN_RESULT_ALIASES.has(col)) return true;
  // É usado como alias (AS col) na query
  if (new RegExp(`\\bAS\\s+${col}\\b`, 'i').test(sql)) return true;
  // Query tem múltiplas tabelas (JOIN) - coluna pode pertencer a qualquer tabela
  const tables = extractTablesFromSQL(sql);
  if (tables.length > 1) {
    // Verificar se a coluna existe em QUALQUER tabela do JOIN
    for (const t of tables) {
      if (allTableColumns[t] && allTableColumns[t].includes(col)) return true;
    }
  }
  return false;
}

function auditFiles(tableColumns) {
  const issues = [];
  let okCount = 0;

  const SQL_TEMPLATE_RE = /sql`([\s\S]+?)`/g;

  for (const filepath of FILES_TO_AUDIT) {
    if (!existsSync(filepath)) {
      console.warn(`⚠️  Arquivo não encontrado: ${filepath}`);
      continue;
    }

    const content = readFileSync(filepath, 'utf-8');
    let match;
    SQL_TEMPLATE_RE.lastIndex = 0;

    while ((match = SQL_TEMPLATE_RE.exec(content)) !== null) {
      const sqlRaw = match[1];
      // Remover interpolações ${...}
      const sql = sqlRaw.replace(/\$\{[^}]+\}/g, '?');

      const tables = extractTablesFromSQL(sql);
      if (tables.length === 0) continue;

      const lineNum = content.substring(0, match.index).split('\n').length;
        const colRefs = extractColumnReferences(sql);
        const tableAliases = extractTableAliases(sql);

      for (const table of tables) {
        if (!tableColumns[table]) continue; // Tabela não no schema (pode ser alias/subquery)

        const validCols = new Set(tableColumns[table]);

        for (const { col, ctx, aliasPrefix } of colRefs) {
          // Se tem prefixo de alias, resolver a tabela real
          if (aliasPrefix) {
            const resolvedTable = tableAliases[aliasPrefix] || aliasPrefix;
            // Se o alias resolve para uma tabela diferente da atual, pular
            if (resolvedTable !== table && tableColumns[resolvedTable]) {
              okCount++;
              continue;
            }
            // Verificar se a coluna existe na tabela resolvida
            if (tableColumns[resolvedTable] && tableColumns[resolvedTable].includes(col)) {
              okCount++;
              continue;
            }
          }

          if (isFalsePositive(col, sql, tableColumns)) {
            okCount++;
            continue;
          }

          if (validCols.has(col)) {
            okCount++;
          } else if (!tableColumns[col]) {
            // Não é nome de tabela nem coluna válida — verificar se existe em alguma tabela do JOIN
            const allTables = extractTablesFromSQL(sql);
            let foundInAny = false;
            for (const t of allTables) {
              if (tableColumns[t] && tableColumns[t].includes(col)) {
                foundInAny = true;
                break;
              }
            }
            if (!foundInAny) {
              issues.push({
                file: filepath.split('/').pop(),
                filepath,
                line: lineNum,
                table,
                column: col,
                context: ctx,
                validColumns: tableColumns[table],
                sqlSnippet: sql.replace(/\s+/g, ' ').substring(0, 200),
              });
            } else {
              okCount++;
            }
          } else {
            okCount++; // É nome de outra tabela
          }
        }
      }
    }
  }

  return { issues, okCount };
}

function generateReport(issues, okCount, fetchedAt) {
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  let md = `# Relatório de Auditoria SQL — FlowEdu\n\n`;
  md += `**Gerado em:** ${now}  \n`;
  md += `**Schema capturado em:** ${fetchedAt || 'cache local'}  \n`;
  md += `**Referências verificadas:** ${okCount + issues.length}  \n`;
  md += `**Referências OK:** ${okCount}  \n`;
  md += `**Problemas encontrados:** ${issues.length}  \n\n`;

  if (issues.length === 0) {
    md += `## ✅ Nenhum problema encontrado\n\n`;
    md += `Todas as queries SQL raw estão compatíveis com o schema do TiDB.\n`;
  } else {
    md += `## ⚠️ Problemas Detectados\n\n`;
    md += `| # | Arquivo | Linha | Tabela | Coluna Inválida | Contexto |\n`;
    md += `|---|---------|-------|--------|-----------------|----------|\n`;
    for (let i = 0; i < issues.length; i++) {
      const { file, line, table, column, context } = issues[i];
      md += `| ${i + 1} | \`${file}\` | ${line} | \`${table}\` | \`${column}\` | ${context} |\n`;
    }
    md += `\n### Detalhes\n\n`;
    for (let i = 0; i < issues.length; i++) {
      const { file, line, table, column, context, validColumns, sqlSnippet } = issues[i];
      md += `#### [${i + 1}] \`${file}\` linha ${line}\n\n`;
      md += `- **Tabela:** \`${table}\`\n`;
      md += `- **Coluna inválida:** \`${column}\` (contexto: ${context})\n`;
      md += `- **Colunas válidas:** \`${validColumns.join('`, `')}\`\n`;
      md += `- **SQL:** \`${sqlSnippet}\`\n\n`;
    }
  }

  md += `---\n\n`;
  md += `## Como usar este script\n\n`;
  md += `\`\`\`bash\n`;
  md += `# Atualizar cache do schema e auditar\n`;
  md += `node scripts/validate-sql-schema.mjs --fetch-schema --report\n\n`;
  md += `# Apenas auditar (usa cache)\n`;
  md += `node scripts/validate-sql-schema.mjs --report\n\n`;
  md += `# Modo estrito para CI/CD (falha se encontrar problemas)\n`;
  md += `node scripts/validate-sql-schema.mjs --strict\n`;
  md += `\`\`\`\n`;

  return md;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FETCH_SCHEMA = args.includes('--fetch-schema');
const GENERATE_REPORT = args.includes('--report');
const STRICT_MODE = args.includes('--strict');

console.log('🔍 FlowEdu — Validador de Queries SQL vs Schema TiDB\n');

let tableColumns;

if (FETCH_SCHEMA) {
  console.log('📡 Buscando schema atual do TiDB...');
  try {
    tableColumns = await fetchSchemaFromTiDB();
    const cacheData = { fetchedAt: new Date().toISOString(), schema: tableColumns };
    writeFileSync(SCHEMA_CACHE, JSON.stringify(cacheData, null, 2));
    console.log(`✅ Schema salvo: ${Object.keys(tableColumns).length} tabelas → ${SCHEMA_CACHE}\n`);
  } catch (e) {
    console.error(`❌ Erro ao buscar schema: ${e.message}`);
    process.exit(1);
  }
} else if (existsSync(SCHEMA_CACHE)) {
  const cache = JSON.parse(readFileSync(SCHEMA_CACHE, 'utf-8'));
  tableColumns = cache.schema;
  console.log(`📦 Usando cache do schema (${cache.fetchedAt}) — ${Object.keys(tableColumns).length} tabelas`);
  console.log(`   Use --fetch-schema para atualizar o cache\n`);
} else {
  console.error('❌ Cache do schema não encontrado. Execute com --fetch-schema primeiro.');
  process.exit(1);
}

console.log('🔎 Auditando queries SQL raw nos arquivos do servidor...\n');
const { issues, okCount } = auditFiles(tableColumns);

// Exibir resultado
console.log(`📊 Resultado:`);
console.log(`   ✅ Referências OK: ${okCount}`);
console.log(`   ${issues.length === 0 ? '✅' : '⚠️ '} Problemas encontrados: ${issues.length}`);

if (issues.length > 0) {
  console.log('\n⚠️  Problemas detectados:\n');
  for (let i = 0; i < issues.length; i++) {
    const { file, line, table, column, context } = issues[i];
    console.log(`  [${i + 1}] ${file}:${line}`);
    console.log(`       Tabela: ${table} | Coluna inválida: "${column}" | Contexto: ${context}`);
  }
}

if (GENERATE_REPORT) {
  const cache = existsSync(SCHEMA_CACHE) ? JSON.parse(readFileSync(SCHEMA_CACHE, 'utf-8')) : {};
  const reportContent = generateReport(issues, okCount, cache.fetchedAt);
  const reportPath = join(__dirname, 'sql-audit-report.md');
  writeFileSync(reportPath, reportContent);
  console.log(`\n📄 Relatório gerado: ${reportPath}`);
}

if (STRICT_MODE && issues.length > 0) {
  console.log('\n❌ Modo estrito: encerrando com código de erro 1');
  process.exit(1);
}

console.log('\n✅ Auditoria concluída!');
