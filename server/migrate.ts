/**
 * migrate.ts — Migração automática de banco de dados
 *
 * Este script é executado automaticamente no startup do servidor.
 * Ele adiciona colunas e tabelas que possam estar faltando no banco de produção,
 * garantindo que o schema esteja sempre atualizado sem perda de dados.
 *
 * Cada operação usa "IF NOT EXISTS" ou trata o erro de coluna duplicada,
 * tornando o script idempotente (seguro para rodar múltiplas vezes).
 */

import { getDb } from './db';
import { sql } from 'drizzle-orm';

interface MigrationResult {
  name: string;
  status: 'applied' | 'skipped' | 'error';
  message?: string;
}

async function runMigration(
  name: string,
  fn: () => Promise<void>
): Promise<MigrationResult> {
  try {
    await fn();
    return { name, status: 'applied' };
  } catch (err: any) {
    // O Drizzle encapsula o erro do MySQL no campo `cause`
    // Verificar tanto a mensagem principal quanto a causa
    const msg: string = err?.message ?? '';
    const causeMsg: string = err?.cause?.message ?? err?.cause?.sqlMessage ?? '';
    const fullMsg = `${msg} ${causeMsg}`;

    // Erros de "coluna já existe" (MySQL errno 1060) ou "tabela já existe" são esperados
    const isDuplicate =
      fullMsg.includes('Duplicate column name') ||
      fullMsg.includes('already exists') ||
      fullMsg.includes('duplicate key') ||
      fullMsg.includes('Column already exists') ||
      err?.cause?.errno === 1060 || // MySQL: Duplicate column name
      err?.cause?.errno === 1050;   // MySQL: Table already exists

    if (isDuplicate) {
      return { name, status: 'skipped', message: 'já existe' };
    }
    console.error(`[Migrate] ERRO em "${name}":`, msg);
    return { name, status: 'error', message: msg };
  }
}

export async function runAutoMigrations(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn('[Migrate] Banco de dados não disponível, pulando migrações.');
    return;
  }

  console.log('[Migrate] Iniciando migrações automáticas...');
  const results: MigrationResult[] = [];

  // Helper: verifica se uma coluna existe na tabela antes de adicionar
  const dbConn = db; // garantir que TypeScript sabe que não é null aqui
  async function addColumnIfMissing(
    table: string,
    column: string,
    definition: string
  ): Promise<MigrationResult> {
    const name = `${table}.${column}`;
    return runMigration(name, async () => {
      // Verificar se a coluna já existe via INFORMATION_SCHEMA
      const rows = await dbConn.execute(
        sql`SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = ${table} AND COLUMN_NAME = ${column}`
      );
      // rows pode ser array de arrays ou array de objetos dependendo do driver
      const rowData = Array.isArray(rows) ? rows[0] : (rows as any).rows?.[0];
      const cnt = rowData ? (Number(rowData.cnt ?? (rowData as any)[0]) || 0) : 0;
      if (cnt > 0) {
        // Coluna já existe, simular erro de duplicata para ser capturado como 'skipped'
        throw new Error('Duplicate column name');
      }
      await dbConn.execute(sql.raw(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`));
    });
  }

  // ── access_logs: colunas adicionadas na v3.4.0 ──────────────────────────────────────────────
  results.push(await addColumnIfMissing('access_logs', 'browser', 'VARCHAR(100) NULL'));
  results.push(await addColumnIfMissing('access_logs', 'os', 'VARCHAR(100) NULL'));
  results.push(await addColumnIfMissing('access_logs', 'teacherId', 'INT NULL'));

  // ── access_logs: popular teacherId nos registros legados ──────────────────────────────────
  results.push(await runMigration('access_logs.populate_teacherId', async () => {
    await db.execute(sql`
      UPDATE access_logs al
      JOIN students s ON s.id = al.studentId
      SET al.teacherId = s.userId
      WHERE al.teacherId IS NULL AND al.studentId IS NOT NULL
    `);
  }));

  // ── access_log_archives: coluna teacherId ──────────────────────────────────────────────
  results.push(await addColumnIfMissing('access_log_archives', 'teacherId', 'INT NULL'));

  // ── access_logs: colunas para análise acadêmica (v3.5.3) ──────────────────────────────────
  results.push(await addColumnIfMissing('access_logs', 'pageVisited', 'VARCHAR(100) NULL'));
  results.push(await addColumnIfMissing('access_logs', 'sessionDurationSec', 'INT NULL'));

  // ── Resumo ──────────────────────────────────────────────────────────────────
  const applied = results.filter(r => r.status === 'applied').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const errors  = results.filter(r => r.status === 'error').length;

  console.log(`[Migrate] Concluído: ${applied} aplicadas, ${skipped} já existiam, ${errors} erros.`);

  if (errors > 0) {
    results
      .filter(r => r.status === 'error')
      .forEach(r => console.error(`[Migrate]   ✗ ${r.name}: ${r.message}`));
  }
}
