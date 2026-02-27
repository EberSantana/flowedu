import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { updateBackupStatus, markBackupAsRestored, getDb } from './db';
import { backups } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';

/**
 * Criar conexão MySQL com SSL para TiDB Cloud
 */
async function createConnection() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!urlMatch) throw new Error('DATABASE_URL inválida ou não configurada');

  const [, user, password, host, port, database] = urlMatch;
  return mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
    database,
    ssl: { rejectUnauthorized: true },
    multipleStatements: true,
  });
}

/**
 * Obter informações de um backup pelo ID
 */
async function getBackupById(backupId: number) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error('Database not available');
  const [backup] = await dbInstance.select().from(backups).where(eq(backups.id, backupId)).limit(1);
  return backup || null;
}

/**
 * Gerar SQL de backup de uma tabela
 */
async function dumpTable(conn: mysql.Connection, tableName: string): Promise<string> {
  let sql = `-- Tabela: ${tableName}\n`;

  // DROP + CREATE TABLE
  try {
    const [rows] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``) as any;
    if (rows && rows[0]) {
      const createSql = rows[0]['Create Table'] || rows[0]['Create View'] || '';
      sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sql += createSql + ';\n\n';
    }
  } catch (e: any) {
    sql += `-- Erro ao obter estrutura de ${tableName}: ${e.message}\n\n`;
    return sql;
  }

  // Dados da tabela
  try {
    const [rows] = await conn.query(`SELECT * FROM \`${tableName}\``) as any;
    if (rows && rows.length > 0) {
      // Inserir em lotes de 100
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const columns = Object.keys(batch[0]).map(c => `\`${c}\``).join(', ');
        const values = batch.map((row: any) => {
          const vals = Object.values(row).map((v: any) => {
            if (v === null || v === undefined) return 'NULL';
            if (v instanceof Date) return `'${v.toISOString().replace('T', ' ').replace('Z', '')}'`;
            if (typeof v === 'number' || typeof v === 'bigint') return String(v);
            if (typeof v === 'boolean') return v ? '1' : '0';
            // Escapar strings
            const escaped = String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
            return `'${escaped}'`;
          });
          return `(${vals.join(', ')})`;
        }).join(',\n  ');
        sql += `INSERT INTO \`${tableName}\` (${columns}) VALUES\n  ${values};\n`;
      }
      sql += '\n';
    }
  } catch (e: any) {
    sql += `-- Erro ao exportar dados de ${tableName}: ${e.message}\n\n`;
  }

  return sql;
}

/**
 * Executar backup do banco de dados via Node.js (sem mysqldump)
 */
export async function executeBackup(backupId: number) {
  const conn = await createConnection();
  try {
    const timestamp = Date.now();
    const filename = `backup_${timestamp}.sql.gz`;
    const backupDir = path.join(process.cwd(), 'backups');
    const filepath = path.join(backupDir, filename);

    // Criar diretório se não existir
    await fs.mkdir(backupDir, { recursive: true });

    console.log(`[Backup] Iniciando backup ID=${backupId}...`);

    // Listar todas as tabelas
    const [tables] = await conn.query("SHOW TABLES") as any;
    const tableNames: string[] = tables.map((t: any) => Object.values(t)[0] as string);

    console.log(`[Backup] ${tableNames.length} tabelas encontradas`);

    // Gerar SQL completo
    let fullSql = `-- FlowEdu Database Backup\n`;
    fullSql += `-- Data: ${new Date().toISOString()}\n`;
    fullSql += `-- Tabelas: ${tableNames.length}\n\n`;
    fullSql += `SET FOREIGN_KEY_CHECKS=0;\n\n`;

    for (const tableName of tableNames) {
      console.log(`[Backup] Exportando tabela: ${tableName}`);
      fullSql += await dumpTable(conn, tableName);
    }

    fullSql += `\nSET FOREIGN_KEY_CHECKS=1;\n`;
    fullSql += `-- Fim do backup\n`;

    // Comprimir e salvar como .sql.gz
    const sqlBuffer = Buffer.from(fullSql, 'utf8');
    const gzipBuffer = await new Promise<Buffer>((resolve, reject) => {
      zlib.gzip(sqlBuffer, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    await fs.writeFile(filepath, gzipBuffer);

    // Obter tamanho do arquivo
    const stats = await fs.stat(filepath);
    const filesizeKB = Math.round(stats.size / 1024) || 1;

    // Atualizar registro no banco
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error('Database not available');

    await dbInstance
      .update(backups)
      .set({
        filepath,
        filesize: filesizeKB,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(backups.id, backupId));

    console.log(`✅ Backup criado: ${filename} (${filesizeKB} KB, ${tableNames.length} tabelas)`);
    return { success: true, filepath, filesize: filesizeKB };
  } catch (error: any) {
    console.error('❌ Erro ao criar backup:', error.message);
    await updateBackupStatus(backupId, 'failed', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

/**
 * Executar restauração de backup
 */
export async function executeRestore(backupId: number) {
  const conn = await createConnection();
  try {
    const backup = await getBackupById(backupId);
    if (!backup) throw new Error('Backup não encontrado');

    // Verificar se arquivo existe
    try {
      await fs.access(backup.filepath);
    } catch {
      throw new Error('Arquivo de backup não encontrado no sistema');
    }

    console.log(`[Restore] Iniciando restauração do backup: ${backup.filename}`);

    // Ler e descomprimir o arquivo
    const gzipData = await fs.readFile(backup.filepath);
    const sqlData = await new Promise<Buffer>((resolve, reject) => {
      zlib.gunzip(gzipData, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    const sql = sqlData.toString('utf8');

    // Executar SQL de restauração
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    
    // Dividir em statements e executar um por um
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let executed = 0;
    for (const stmt of statements) {
      if (!stmt.trim()) continue;
      try {
        await conn.query(stmt);
        executed++;
      } catch (e: any) {
        // Ignorar erros de comentários ou statements vazios
        if (!e.message.includes('empty query')) {
          console.warn(`[Restore] Aviso ao executar statement: ${e.message.substring(0, 100)}`);
        }
      }
    }

    await conn.query('SET FOREIGN_KEY_CHECKS=1');

    await markBackupAsRestored(backupId);

    console.log(`✅ Backup restaurado: ${backup.filename} (${executed} statements executados)`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao restaurar backup:', error.message);
    await updateBackupStatus(backupId, 'failed', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

/**
 * Deletar arquivo de backup do sistema de arquivos
 */
export async function deleteBackupFile(filepath: string) {
  try {
    await fs.unlink(filepath);
    console.log(`✅ Arquivo de backup deletado: ${filepath}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Erro ao deletar arquivo: ${filepath}`, error.message);
    return false;
  }
}
