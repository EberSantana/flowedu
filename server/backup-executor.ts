import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { updateBackupStatus, markBackupAsRestored, getDb } from './db';
import { backups } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const execAsync = promisify(exec);

/**
 * Obter informações de um backup pelo ID
 */
async function getBackupById(backupId: number) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");
  
  const [backup] = await dbInstance.select().from(backups).where(eq(backups.id, backupId)).limit(1);
  return backup || null;
}

/**
 * Executar backup do banco de dados
 */
export async function executeBackup(backupId: number) {
  try {
    const timestamp = Date.now();
    const filename = `backup_${timestamp}.sql.gz`;
    const backupDir = '/root/flowedu/backups';
    const filepath = path.join(backupDir, filename);

    // Criar diretório se não existir
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (error) {
      console.log('Diretório de backup já existe ou erro ao criar:', error.message);
    }

    // Obter credenciais do banco (do DATABASE_URL)
    const databaseUrl = process.env.DATABASE_URL || '';
    const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    
    if (!urlMatch) {
      throw new Error('DATABASE_URL inválida');
    }

    const [, dbUser, dbPass, dbHost, dbPort, dbName] = urlMatch;

    // Executar mysqldump
    const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p'${dbPass}' ${dbName} | gzip > ${filepath}`;
    await execAsync(command);

    // Obter tamanho do arquivo
    const stats = await fs.stat(filepath);
    const filesizeKB = Math.round(stats.size / 1024);

    // Atualizar registro no banco com filepath e filesize corretos
    const dbInstance = await db();
    if (!dbInstance) throw new Error("Database not available");
    
    await dbInstance
      .update(backups)
      .set({
        filepath,
        filesize: filesizeKB,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(backups.id, backupId));

    console.log(`✅ Backup criado: ${filename} (${filesizeKB} KB)`);
    return { success: true, filepath, filesize: filesizeKB };
  } catch (error: any) {
    console.error('❌ Erro ao criar backup:', error);
    await updateBackupStatus(backupId, 'failed', error.message);
    throw error;
  }
}

/**
 * Executar restauração de backup
 */
export async function executeRestore(backupId: number) {
  try {
    // Buscar informações do backup
    const backup = await getBackupById(backupId);
    if (!backup) throw new Error('Backup não encontrado');

    // Verificar se arquivo existe
    try {
      await fs.access(backup.filepath);
    } catch {
      throw new Error('Arquivo de backup não encontrado no sistema');
    }

    // Obter credenciais do banco
    const databaseUrl = process.env.DATABASE_URL || '';
    const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    
    if (!urlMatch) {
      throw new Error('DATABASE_URL inválida');
    }

    const [, dbUser, dbPass, dbHost, dbPort, dbName] = urlMatch;

    // Executar restauração
    const command = `gunzip < ${backup.filepath} | mysql -h ${dbHost} -P ${dbPort} -u ${dbUser} -p'${dbPass}' ${dbName}`;
    await execAsync(command);

    // Marcar como restaurado
    await markBackupAsRestored(backupId);

    console.log(`✅ Backup restaurado: ${backup.filename}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Erro ao restaurar backup:', error);
    await updateBackupStatus(backupId, 'failed', error.message);
    throw error;
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
