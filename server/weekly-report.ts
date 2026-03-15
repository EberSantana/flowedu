/**
 * Relatório Semanal Automático de Acessos
 * Envia toda segunda-feira às 8h BRT um resumo dos acessos da semana anterior
 * para cada professor cadastrado no sistema.
 */

import cron from 'node-cron';
import { getDb } from './db';
import { sendEmail } from './_core/email';
import { users, accessLogs, classes, students } from '../drizzle/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

let weeklyReportTask: ReturnType<typeof cron.schedule> | null = null;

/**
 * Gera o HTML do relatório semanal para um professor
 */
async function generateWeeklyReportHTML(
  teacherId: number,
  teacherName: string,
  weekStart: Date,
  weekEnd: Date
): Promise<{ html: string; totalAccesses: number; uniqueStudents: number }> {
  const database = await getDb();
  if (!database) return { html: '', totalAccesses: 0, uniqueStudents: 0 };

  // Buscar logs de alunos da semana
  const logs = await database
    .select({
      id: accessLogs.id,
      studentId: accessLogs.studentId,
      userName: accessLogs.userName,
      accessedAt: accessLogs.accessedAt,
      browser: accessLogs.browser,
      os: accessLogs.os,
    })
    .from(accessLogs)
    .where(and(
      eq(accessLogs.userType, 'student'),
      eq(accessLogs.teacherId, teacherId),
      gte(accessLogs.accessedAt, weekStart),
      lte(accessLogs.accessedAt, weekEnd),
    ))
    .orderBy(desc(accessLogs.accessedAt));

  const totalAccesses = logs.length;
  const uniqueStudents = new Set(logs.map(l => l.studentId).filter(Boolean)).size;

  // Agrupar por aluno
  const byStudent: Record<string, { name: string; count: number; lastAccess: Date }> = {};
  for (const log of logs) {
    const key = log.studentId?.toString() ?? log.userName ?? 'desconhecido';
    const name = log.userName ?? 'Aluno desconhecido';
    if (!byStudent[key]) {
      byStudent[key] = { name, count: 0, lastAccess: log.accessedAt };
    }
    byStudent[key].count++;
    if (log.accessedAt > byStudent[key].lastAccess) {
      byStudent[key].lastAccess = log.accessedAt;
    }
  }

  // Ordenar por contagem de acessos
  const studentList = Object.values(byStudent).sort((a, b) => b.count - a.count);

  // Calcular mapa de calor por dia da semana
  const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Dom, Seg, ..., Sáb
  for (const log of logs) {
    const d = new Date(log.accessedAt);
    dayCount[d.getUTCDay()]++;
  }
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const maxDay = Math.max(...dayCount, 1);

  // Formatar datas
  const fmtDate = (d: Date) =>
    `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Semanal FlowEdu</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 28px 32px; }
    .header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; }
    .header p { margin: 0; opacity: 0.85; font-size: 14px; }
    .content { padding: 28px 32px; }
    .stats { display: flex; gap: 16px; margin-bottom: 28px; }
    .stat { flex: 1; background: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; color: #1e40af; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    h2 { font-size: 15px; font-weight: 600; color: #374151; margin: 0 0 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .day-bars { display: flex; gap: 8px; align-items: flex-end; height: 60px; margin-bottom: 24px; }
    .day-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
    .day-bar { width: 100%; background: #3b82f6; border-radius: 3px 3px 0 0; min-height: 2px; }
    .day-label { font-size: 10px; color: #64748b; }
    .day-count { font-size: 10px; font-weight: 600; color: #1e40af; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 10px; background: #f8fafc; color: #64748b; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; background: #dbeafe; color: #1e40af; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
    .footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e5e7eb; }
    .empty { text-align: center; color: #94a3b8; padding: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Relatório Semanal de Acessos</h1>
      <p>FlowEdu · ${fmtDate(weekStart)} a ${fmtDate(weekEnd)} · Olá, ${teacherName}!</p>
    </div>
    <div class="content">
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${totalAccesses}</div>
          <div class="stat-label">Total de acessos</div>
        </div>
        <div class="stat">
          <div class="stat-value">${uniqueStudents}</div>
          <div class="stat-label">Alunos únicos</div>
        </div>
        <div class="stat">
          <div class="stat-value">${studentList.length > 0 ? studentList[0].count : 0}</div>
          <div class="stat-label">Maior engajamento</div>
        </div>
      </div>

      <h2>Acessos por Dia da Semana</h2>
      <div class="day-bars">
        ${dayNames.map((name, i) => {
          const pct = maxDay > 0 ? Math.round((dayCount[i] / maxDay) * 52) : 0;
          return `
          <div class="day-bar-wrap">
            <div class="day-count">${dayCount[i] > 0 ? dayCount[i] : ''}</div>
            <div class="day-bar" style="height: ${pct}px;"></div>
            <div class="day-label">${name}</div>
          </div>`;
        }).join('')}
      </div>

      <h2>Alunos com Mais Acessos</h2>
      ${studentList.length === 0 ? `
        <div class="empty">Nenhum acesso registrado nesta semana.</div>
      ` : `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Aluno</th>
              <th>Acessos</th>
              <th>Último acesso</th>
            </tr>
          </thead>
          <tbody>
            ${studentList.slice(0, 15).map((s, i) => `
            <tr>
              <td style="color:#94a3b8">${i + 1}º</td>
              <td>${s.name}</td>
              <td><span class="badge">${s.count}</span></td>
              <td style="color:#64748b">${fmtDate(s.lastAccess)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      `}
    </div>
    <div class="footer">
      Este relatório foi gerado automaticamente pelo FlowEdu toda segunda-feira.<br>
      Para desativar, acesse Configurações → Notificações no painel do professor.
    </div>
  </div>
</body>
</html>`;

  return { html, totalAccesses, uniqueStudents };
}

/**
 * Envia o relatório semanal para todos os professores
 */
export async function sendWeeklyReports() {
  const database = await getDb();
  if (!database) {
    console.warn('[WeeklyReport] Banco de dados não disponível');
    return;
  }

  // Calcular intervalo da semana anterior (BRT → banco já está em BRT)
  const now = new Date();
  // Semana anterior: segunda-feira até domingo
  const dayOfWeek = now.getUTCDay(); // 0=Dom, 1=Seg, ...
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(now);
  thisMonday.setUTCDate(now.getUTCDate() - daysToLastMonday);
  thisMonday.setUTCHours(0, 0, 0, 0);

  const lastMonday = new Date(thisMonday);
  lastMonday.setUTCDate(thisMonday.getUTCDate() - 7);

  const lastSunday = new Date(thisMonday);
  lastSunday.setUTCDate(thisMonday.getUTCDate() - 1);
  lastSunday.setUTCHours(23, 59, 59, 999);

  console.log(`[WeeklyReport] Gerando relatórios para semana ${lastMonday.toISOString()} – ${lastSunday.toISOString()}`);

  // Buscar todos os professores com e-mail
  const teachers = await database
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, 'admin'));

  let sent = 0;
  let skipped = 0;

  for (const teacher of teachers) {
    if (!teacher.email) {
      skipped++;
      continue;
    }

    try {
      const { html, totalAccesses, uniqueStudents } = await generateWeeklyReportHTML(
        teacher.id,
        teacher.name || 'Professor',
        lastMonday,
        lastSunday
      );

      if (totalAccesses === 0) {
        console.log(`[WeeklyReport] Sem acessos para ${teacher.email} — pulando`);
        skipped++;
        continue;
      }

      const fmtDate = (d: Date) =>
        `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

      const result = await sendEmail({
        to: teacher.email,
        subject: `📊 Relatório Semanal FlowEdu — ${fmtDate(lastMonday)} a ${fmtDate(lastSunday)} (${totalAccesses} acessos, ${uniqueStudents} alunos)`,
        html,
      });

      if (result.success) {
        sent++;
        console.log(`[WeeklyReport] Enviado para ${teacher.email} (${totalAccesses} acessos)`);
      } else {
        console.error(`[WeeklyReport] Falha ao enviar para ${teacher.email}:`, result.error);
      }
    } catch (err) {
      console.error(`[WeeklyReport] Erro ao processar professor ${teacher.id}:`, err);
    }
  }

  console.log(`[WeeklyReport] Concluído: ${sent} enviados, ${skipped} pulados`);
}

/**
 * Inicia o job de relatório semanal (toda segunda-feira às 8h Manaus)
 * Manaus = UTC-4, portanto 8h Manaus = 12h UTC → cron: '0 12 * * 1'
 */
export function startWeeklyReportJob() {
  if (weeklyReportTask) {
    weeklyReportTask.stop();
  }

  // Toda segunda-feira às 12h UTC (= 8h Manaus UTC-4)
  weeklyReportTask = cron.schedule('0 12 * * 1', async () => {
    console.log('[WeeklyReport] Iniciando envio de relatórios semanais...');
    try {
      await sendWeeklyReports();
    } catch (err) {
      console.error('[WeeklyReport] Erro no job semanal:', err);
    }
  }, { timezone: 'UTC' });

  console.log('[WeeklyReport] Job de relatório semanal iniciado (toda segunda-feira às 8h Manaus)');
}

export function stopWeeklyReportJob() {
  if (weeklyReportTask) {
    weeklyReportTask.stop();
    weeklyReportTask = null;
  }
}
