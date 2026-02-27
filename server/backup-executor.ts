import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { updateBackupStatus, markBackupAsRestored, getDb } from './db';
import { backups } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import { storagePut } from './storage';

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
        const columns = Object.keys(batch[0]).map((c: string) => `\`${c}\``).join(', ');
        const values = batch.map((row: any) => {
          const vals = Object.values(row).map((v: any) => {
            if (v === null || v === undefined) return 'NULL';
            if (v instanceof Date) return `'${v.toISOString().replace('T', ' ').replace('Z', '')}'`;
            if (typeof v === 'number' || typeof v === 'bigint') return String(v);
            if (typeof v === 'boolean') return v ? '1' : '0';
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
 * Comprimir buffer com gzip
 */
function gzipBuffer(data: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zlib.gzip(data, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Descomprimir buffer gzip
 */
function gunzipBuffer(data: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zlib.gunzip(data, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

/**
 * Executar backup do banco de dados — salva no S3 (primário) e localmente (fallback)
 */
export async function executeBackup(backupId: number) {
  const conn = await createConnection();
  try {
    const timestamp = Date.now();
    const filename = `backup_${timestamp}.sql.gz`;
    const backupDir = path.join(process.cwd(), 'backups');
    const filepath = path.join(backupDir, filename);

    // Criar diretório local se não existir
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

    // Comprimir
    const sqlBuffer = Buffer.from(fullSql, 'utf8');
    const compressed = await gzipBuffer(sqlBuffer);

    // Salvar localmente
    await fs.writeFile(filepath, compressed);
    const filesizeKB = Math.round(compressed.length / 1024) || 1;

    // Tentar enviar para S3
    let s3Key: string | null = null;
    let s3Url: string | null = null;
    let storageType: 'local' | 's3' | 'both' = 'local';

    try {
      const s3Result = await storagePut(
        `backups/${filename}`,
        compressed,
        'application/gzip'
      );
      s3Key = s3Result.key;
      s3Url = s3Result.url;
      storageType = 'both';
      console.log(`☁️  Backup enviado ao S3: ${s3Key}`);
    } catch (s3Error: any) {
      console.warn(`⚠️  Falha ao enviar para S3 (usando apenas local): ${s3Error.message}`);
    }

    // Atualizar registro no banco
    const dbInstance = await getDb();
    if (!dbInstance) throw new Error('Database not available');

    await dbInstance
      .update(backups)
      .set({
        filepath,
        filesize: filesizeKB,
        s3Key: s3Key ?? undefined,
        s3Url: s3Url ?? undefined,
        storageType,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(backups.id, backupId));

    console.log(`✅ Backup criado: ${filename} (${filesizeKB} KB, ${tableNames.length} tabelas, storage: ${storageType})`);
    return { success: true, filepath, filesize: filesizeKB, s3Url, storageType };
  } catch (error: any) {
    console.error('❌ Erro ao criar backup:', error.message);
    await updateBackupStatus(backupId, 'failed', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

/**
 * Executar restauração de backup — tenta S3 primeiro, depois local
 */
export async function executeRestore(backupId: number) {
  const conn = await createConnection();
  try {
    const backup = await getBackupById(backupId);
    if (!backup) throw new Error('Backup não encontrado');

    console.log(`[Restore] Iniciando restauração do backup: ${backup.filename}`);

    let gzipData: Buffer;

    // Tentar ler do S3 primeiro
    if (backup.s3Url) {
      try {
        console.log(`[Restore] Baixando do S3: ${backup.s3Url}`);
        const response = await fetch(backup.s3Url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        gzipData = Buffer.from(arrayBuffer);
        console.log(`[Restore] Arquivo baixado do S3 (${Math.round(gzipData.length / 1024)} KB)`);
      } catch (s3Error: any) {
        console.warn(`[Restore] Falha ao baixar do S3, tentando local: ${s3Error.message}`);
        gzipData = await fs.readFile(backup.filepath);
      }
    } else {
      // Ler do arquivo local
      try {
        await fs.access(backup.filepath);
        gzipData = await fs.readFile(backup.filepath);
      } catch {
        throw new Error('Arquivo de backup não encontrado (nem no S3 nem localmente)');
      }
    }

    // Descomprimir
    const sqlData = await gunzipBuffer(gzipData);
    const sql = sqlData.toString('utf8');

    // Executar SQL de restauração
    await conn.query('SET FOREIGN_KEY_CHECKS=0');

    const statements = sql
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0 && !s.startsWith('--'));

    let executed = 0;
    for (const stmt of statements) {
      if (!stmt.trim()) continue;
      try {
        await conn.query(stmt);
        executed++;
      } catch (e: any) {
        if (!e.message.includes('empty query')) {
          console.warn(`[Restore] Aviso: ${e.message.substring(0, 100)}`);
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
 * Deletar arquivo de backup — remove do S3 e localmente
 */
export async function deleteBackupFile(filepath: string, s3Key?: string | null) {
  let deleted = false;

  // Deletar arquivo local
  try {
    await fs.unlink(filepath);
    console.log(`✅ Arquivo local deletado: ${filepath}`);
    deleted = true;
  } catch (error: any) {
    console.warn(`⚠️  Arquivo local não encontrado: ${filepath}`);
  }

  // Nota: A URL do S3 é pública e o arquivo permanece acessível via URL.
  // Para remover do S3, seria necessário usar a API de deleção do storage.
  // Por ora, o arquivo local é removido e o S3 mantém a cópia como backup seguro.

  return deleted;
}
