import cron, { ScheduledTask } from 'node-cron';
import { getBackupSchedule } from './db';
import { executeBackup } from './backup-executor';
import { createBackupRecord } from './db';

let scheduledTask: ScheduledTask | null = null;

/**
 * Converter configuração de agendamento para expressão cron
 */
function buildCronExpression(config: {
  frequency: 'daily' | 'weekly' | 'monthly';
  scheduleTime: string; // Formato: "HH:MM"
  dayOfWeek?: number; // 0-6 (0 = Domingo)
  dayOfMonth?: number; // 1-31
}): string {
  const [hours, minutes] = config.scheduleTime.split(':');

  switch (config.frequency) {
    case 'daily':
      return `${minutes} ${hours} * * *`;
    case 'weekly': {
      const dayOfWeek = config.dayOfWeek ?? 0;
      return `${minutes} ${hours} * * ${dayOfWeek}`;
    }
    case 'monthly': {
      const dayOfMonth = config.dayOfMonth ?? 1;
      return `${minutes} ${hours} ${dayOfMonth} * *`;
    }
    default:
      throw new Error(`Frequência inválida: ${config.frequency}`);
  }
}

/**
 * Calcular próxima execução baseada na expressão cron
 */
export function getNextExecution(cronExpression: string): Date | null {
  try {
    const now = new Date();
    const parts = cronExpression.split(' ');
    const targetMinute = parseInt(parts[0]);
    const targetHour = parseInt(parts[1]);

    const next = new Date(now);
    next.setHours(targetHour, targetMinute, 0, 0);

    // Se o horário já passou hoje, avançar para amanhã
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  } catch (error) {
    console.error('[Scheduler] Erro ao calcular próxima execução:', error);
    return null;
  }
}

/**
 * Executar backup agendado
 */
async function runScheduledBackup() {
  console.log('[Scheduler] Iniciando backup agendado...');

  try {
    const timestamp = Date.now();
    const filename = `backup_scheduled_${timestamp}.sql.gz`;
    const filepath = `/root/flowedu/backups/${filename}`;

    const backupRecord = await createBackupRecord({
      filename,
      filepath,
      filesize: 0,
      backupType: 'scheduled',
      status: 'pending',
      createdBy: 1, // Sistema
    });

    await executeBackup(backupRecord.id);
    console.log('[Scheduler] Backup agendado concluído com sucesso');
  } catch (error) {
    console.error('[Scheduler] Erro ao executar backup agendado:', error);
  }
}

/**
 * Inicializar agendamento de backups
 */
export async function initializeBackupScheduler() {
  console.log('[Scheduler] Inicializando agendamento de backups...');

  try {
    const config = await getBackupSchedule();

    if (!config || !config.isEnabled) {
      console.log('[Scheduler] Agendamento de backups desabilitado');
      return;
    }

    const cronExpression = buildCronExpression({
      frequency: config.frequency,
      scheduleTime: config.scheduleTime,
      dayOfWeek: config.dayOfWeek ?? undefined,
      dayOfMonth: config.dayOfMonth ?? undefined,
    });

    console.log(`[Scheduler] Expressão cron: ${cronExpression}`);
    console.log(`[Scheduler] Próxima execução: ${getNextExecution(cronExpression)}`);

    // Cancelar tarefa anterior se existir
    if (scheduledTask) {
      scheduledTask.stop();
      scheduledTask = null;
    }

    // Criar nova tarefa agendada (node-cron v4: sem 'scheduled' nas options)
    scheduledTask = cron.schedule(cronExpression, runScheduledBackup, {
      timezone: 'America/Sao_Paulo',
    });

    console.log('[Scheduler] Agendamento de backups iniciado com sucesso');
  } catch (error) {
    console.error('[Scheduler] Erro ao inicializar agendamento:', error);
  }
}

/**
 * Atualizar agendamento de backups
 */
export async function updateBackupScheduler() {
  console.log('[Scheduler] Atualizando agendamento de backups...');
  await initializeBackupScheduler();
}

/**
 * Parar agendamento de backups
 */
export function stopBackupScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[Scheduler] Agendamento de backups parado');
  }
}
