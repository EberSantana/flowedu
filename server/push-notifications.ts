/**
 * Sistema de Notificações Push - FlowEdu
 * Usa Web Push API para enviar lembretes sobre aulas e eventos
 */
import { createRequire as _createRequire } from 'module';
// web-push é um módulo CommonJS; usar createRequire para compatibilidade ESM
const _require = _createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const webpush = _require('web-push') as typeof import('web-push');
import { getDb } from './db';
import { pushSubscriptions, notificationPreferences, pushNotificationLog, pushNotificationQueue, scheduledClasses, calendarEvents, timeSlots, subjects, classes, tasks } from '../drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

// VAPID keys - geradas uma vez e armazenadas
// Em produção, use variáveis de ambiente
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = 'mailto:admin@flowedu.app';

let vapidConfigured = false;

/**
 * Inicializa as VAPID keys para Web Push
 */
export function initializeVapid() {
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      vapidConfigured = true;
      console.log('[Push] VAPID keys configuradas com sucesso');
    } catch (error) {
      console.error('[Push] Erro ao configurar VAPID keys:', error);
    }
  } else {
    console.warn('[Push] VAPID keys não configuradas. Gere com: npx web-push generate-vapid-keys');
  }
}

/**
 * Gera um novo par de VAPID keys (usado apenas na configuração inicial)
 */
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}

/**
 * Retorna a chave pública VAPID para o frontend
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Salva uma subscription push no banco de dados
 */
export async function savePushSubscription(
  userId: number,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Verificar se já existe uma subscription com o mesmo endpoint
  const existing = await db.select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, subscription.endpoint)
      )
    );
  
  if (existing.length > 0) {
    // Atualizar subscription existente
    await db.update(pushSubscriptions)
      .set({
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        isActive: true,
        userAgent: userAgent || null,
      })
      .where(eq(pushSubscriptions.id, existing[0].id));
    return existing[0].id;
  }
  
  // Criar nova subscription
  const [result] = await db.insert(pushSubscriptions).values({
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userAgent: userAgent || null,
    isActive: true,
  });
  
  return result.insertId;
}

/**
 * Remove uma subscription push
 */
export async function removePushSubscription(userId: number, endpoint: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(pushSubscriptions)
    .set({ isActive: false })
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    );
}

/**
 * Obtém as preferências de notificação do usuário
 */
export async function getNotificationPrefs(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [prefs] = await db.select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
  
  if (!prefs) {
    // Retornar preferências padrão
    return {
      classReminders: true,
      eventReminders: true,
      taskReminders: true,
      dailySummary: false,
      classReminderMinutes: 15,
      eventReminderMinutes: 60,
      dailySummaryTime: '07:00',
      activeDays: [1, 2, 3, 4, 5],
      quietHoursStart: '22:00',
      quietHoursEnd: '06:00',
    };
  }
  
  return {
    ...prefs,
    activeDays: (() => { try { const v = prefs.activeDays; if (Array.isArray(v)) return v; const s = String(v || '[1,2,3,4,5]').trim(); return JSON.parse(s.startsWith('[') ? s : '[1,2,3,4,5]'); } catch { return [1,2,3,4,5]; } })(),
  };
}

/**
 * Salva as preferências de notificação do usuário
 */
export async function saveNotificationPrefs(userId: number, prefs: any) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  // Original prefs type:

  
  const data = {
    userId,
    classReminders: prefs.classReminders ?? true,
    eventReminders: prefs.eventReminders ?? true,
    taskReminders: prefs.taskReminders ?? true,
    dailySummary: prefs.dailySummary ?? false,
    classReminderMinutes: prefs.classReminderMinutes ?? 15,
    eventReminderMinutes: prefs.eventReminderMinutes ?? 60,
    dailySummaryTime: prefs.dailySummaryTime ?? '07:00',
    activeDays: JSON.stringify(prefs.activeDays ?? [1, 2, 3, 4, 5]),
    quietHoursStart: prefs.quietHoursStart ?? '22:00',
    quietHoursEnd: prefs.quietHoursEnd ?? '06:00',
  };
  
  // Upsert: inserir ou atualizar
  const existing = await db.select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
  
  if (existing.length > 0) {
    await db.update(notificationPreferences)
      .set(data)
      .where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values(data);
  }
  
  return data;
}

/**
 * Envia uma notificação push para um usuário
 */
export async function sendPushNotification(
  userId: number,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
    type: 'class_reminder' | 'event_reminder' | 'task_reminder' | 'daily_summary' | 'announcement' | 'activity' | 'mural';
    referenceId?: string;
    referenceDate?: string;
    urgent?: boolean; // Se true, ignora horário silencioso
  }
) {
  if (!vapidConfigured) {
    console.warn('[Push] VAPID não configurado, notificação não enviada');
    return { sent: 0, failed: 0 };
  }

  // ── Horário silencioso fixo: só envia entre 07:00 e 21:59 (Manaus UTC-4) ──
  // Push urgente IGNORA o horário silencioso
  const nowManaus = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Manaus' }));
  const hora = nowManaus.getHours();
  if (!payload.urgent && (hora < 7 || hora >= 22)) {
    // Enfileirar para envio às 07:00
    try {
      const db = await getDb();
      if (db) {
        await db.insert(pushNotificationQueue).values({
          userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          icon: payload.icon || null,
          badge: payload.badge || null,
          tag: payload.tag || null,
          url: payload.url || null,
          referenceId: payload.referenceId || null,
          referenceDate: payload.referenceDate || null,
          status: 'pending',
        });
        console.log(`[Push] Horário silencioso (${hora}h Manaus). Notificação enfileirada para userId=${userId} - será enviada às 07:00`);
      }
    } catch (queueError) {
      console.error('[Push] Erro ao enfileirar notificação:', queueError);
    }
    return { sent: 0, failed: 0, silenced: true, queued: true };
  }
  
  // Log quando push urgente ignora horário silencioso
  if (payload.urgent && (hora < 7 || hora >= 22)) {
    console.log(`[Push] ⚠️ Push URGENTE enviado fora do horário ativo (${hora}h Manaus) para userId=${userId}: ${payload.title}`);
  }
  
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Buscar todas as subscriptions ativas do usuário
  const subs = await db.select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, true)
      )
    );
  
  if (subs.length === 0) {
    return { sent: 0, failed: 0 };
  }
  
  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || `flowedu-${payload.type}-${Date.now()}`,
    data: {
      url: payload.url || '/',
      type: payload.type,
    },
  });
  
  let sent = 0;
  let failed = 0;
  
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        notificationPayload
      );
      sent++;
    } catch (error: any) {
      failed++;
      console.error(`[Push] Erro ao enviar para subscription ${sub.id}:`, error.message);
      
      // Se o endpoint não é mais válido (410 Gone ou 404), desativar
      if (error.statusCode === 410 || error.statusCode === 404) {
        await db.update(pushSubscriptions)
          .set({ isActive: false })
          .where(eq(pushSubscriptions.id, sub.id));
        console.log(`[Push] Subscription ${sub.id} desativada (endpoint inválido)`);
      }
    }
  }
  
  // Registrar no log
  try {
    await db.insert(pushNotificationLog).values({
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      referenceId: payload.referenceId || null,
      referenceDate: payload.referenceDate || null,
      delivered: sent > 0,
      error: failed > 0 ? `${failed} de ${subs.length} falhou` : null,
    });
  } catch (logError) {
    console.error('[Push] Erro ao salvar log:', logError);
  }
  
  return { sent, failed };
}

/**
 * Verifica se uma notificação já foi enviada (evita duplicatas)
 */
async function wasNotificationSent(
  userId: number,
  type: string,
  referenceId: string,
  referenceDate: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [existing] = await db.select()
    .from(pushNotificationLog)
    .where(
      and(
        eq(pushNotificationLog.userId, userId),
        eq(pushNotificationLog.type, type as any),
        eq(pushNotificationLog.referenceId, referenceId),
        eq(pushNotificationLog.referenceDate, referenceDate)
      )
    );
  return !!existing;
}

/**
 * Verifica se estamos dentro do horário silencioso
 */
function isQuietHours(quietStart: string, quietEnd: string, now: Date): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = quietStart.split(':').map(Number);
  const [endH, endM] = quietEnd.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  if (startMinutes > endMinutes) {
    // Horário silencioso cruza meia-noite (ex: 22:00 - 06:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Job principal: verifica aulas e eventos próximos e envia lembretes
 * Deve ser chamado a cada 5 minutos
 */
export async function checkAndSendReminders() {
  if (!vapidConfigured) return;
  
  const db = await getDb();
  if (!db) return;
  
  // Timezone: America/Manaus (UTC-4)
  const now = new Date();
  const manausOffset = -4 * 60; // -4 horas em minutos
  const utcOffset = now.getTimezoneOffset(); // offset local em minutos
  const manausNow = new Date(now.getTime() + (utcOffset + manausOffset) * 60000);
  
  const today = manausNow.toISOString().split('T')[0]; // YYYY-MM-DD
  const currentDayOfWeek = manausNow.getDay(); // 0=Dom, 1=Seg, ...
  const currentHour = manausNow.getHours();
  const currentMinute = manausNow.getMinutes();
  const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
  
  console.log(`[Push] Verificando lembretes: ${today} ${currentTimeStr} (dia ${currentDayOfWeek})`);
  
  // ── Processar fila de notificações adiadas às 07:00-07:04 ──
  if (currentHour === 7 && currentMinute < 5) {
    try {
      await processQueuedNotifications();
    } catch (qErr) {
      console.error('[Push] Erro ao processar fila:', qErr);
    }
  }
  
  // Buscar todos os usuários com subscriptions ativas
  const activeUsers = await db.selectDistinct({ userId: pushSubscriptions.userId })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.isActive, true));
  
  for (const { userId } of activeUsers) {
    try {
      const prefs = await getNotificationPrefs(userId);
      
      // Verificar se é dia ativo
      const activeDays = Array.isArray(prefs.activeDays) ? prefs.activeDays : (typeof prefs.activeDays === 'string' && prefs.activeDays.startsWith('[') ? JSON.parse(prefs.activeDays) : [1,2,3,4,5]);
      if (!activeDays.includes(currentDayOfWeek)) continue;
      
      // Verificar horário silencioso
      if (isQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd, manausNow)) continue;
      
      // 1. Lembretes de aulas
      if (prefs.classReminders) {
        await checkClassReminders(userId, currentDayOfWeek, currentHour, currentMinute, prefs.classReminderMinutes, today);
      }
      
      // 2. Lembretes de eventos do calendário
      if (prefs.eventReminders) {
        await checkEventReminders(userId, today, currentHour, currentMinute, prefs.eventReminderMinutes);
      }
      
      // 3. Lembretes de tarefas
      if (prefs.taskReminders) {
        await checkTaskReminders(userId, today);
      }
      
      // 4. Resumo diário
      if (prefs.dailySummary) {
        await checkDailySummary(userId, today, currentTimeStr, prefs.dailySummaryTime, currentDayOfWeek);
      }
    } catch (error) {
      console.error(`[Push] Erro ao processar lembretes para usuário ${userId}:`, error);
    }
  }
}

/**
 * Verifica e envia lembretes de aulas próximas
 */
async function checkClassReminders(
  userId: number,
  dayOfWeek: number,
  currentHour: number,
  currentMinute: number,
  reminderMinutes: number,
  today: string
) {
  const db = await getDb();
  if (!db) return;
  
  // Buscar aulas do dia
  const todayClasses = await db.select({
    id: scheduledClasses.id,
    subjectName: subjects.name,
    className: classes.name,
    startTime: timeSlots.startTime,
    endTime: timeSlots.endTime,
  })
  .from(scheduledClasses)
  .innerJoin(subjects, eq(scheduledClasses.subjectId, subjects.id))
  .innerJoin(classes, eq(scheduledClasses.classId, classes.id))
  .innerJoin(timeSlots, eq(scheduledClasses.timeSlotId, timeSlots.id))
  .where(
    and(
      eq(scheduledClasses.userId, userId),
      eq(scheduledClasses.dayOfWeek, dayOfWeek)
    )
  );
  
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  
  for (const cls of todayClasses) {
    const [startH, startM] = cls.startTime.split(':').map(Number);
    const classStartMinutes = startH * 60 + startM;
    const diff = classStartMinutes - currentTotalMinutes;
    
    // Enviar lembrete se estiver dentro da janela de antecedência (±2 minutos)
    if (diff >= (reminderMinutes - 2) && diff <= (reminderMinutes + 2)) {
      const refId = `class-${cls.id}`;
      const alreadySent = await wasNotificationSent(userId, 'class_reminder', refId, today);
      
      if (!alreadySent) {
        await sendPushNotification(userId, {
          title: `📚 Aula em ${diff} minutos`,
          body: `${cls.subjectName} - Turma ${cls.className} (${cls.startTime} - ${cls.endTime})`,
          type: 'class_reminder',
          referenceId: refId,
          referenceDate: today,
          url: '/schedule',
          tag: `class-${cls.id}-${today}`,
        });
        console.log(`[Push] Lembrete de aula enviado: ${cls.subjectName} para user ${userId}`);
      }
    }
  }
}

/**
 * Verifica e envia lembretes de eventos do calendário
 */
async function checkEventReminders(
  userId: number,
  today: string,
  currentHour: number,
  currentMinute: number,
  reminderMinutes: number
) {
  const db = await getDb();
  if (!db) return;
  
  // Buscar eventos de hoje e amanhã
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const events = await db.select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, userId),
        sql`${calendarEvents.eventDate} IN (${today}, ${tomorrowStr})`
      )
    );
  
  for (const event of events) {
    const isToday = event.eventDate === today;
    const refId = `event-${event.id}`;
    
    // Para eventos de hoje, enviar lembrete pela manhã (8h)
    if (isToday && currentHour === 8 && currentMinute < 5) {
      const alreadySent = await wasNotificationSent(userId, 'event_reminder', refId, today);
      if (!alreadySent) {
        const typeLabel = event.eventType === 'holiday' ? '🏖️ Feriado' :
                         event.eventType === 'school_event' ? '🏫 Evento Escolar' :
                         event.eventType === 'commemorative' ? '🎉 Data Comemorativa' : '📌 Evento';
        
        await sendPushNotification(userId, {
          title: `${typeLabel} Hoje`,
          body: event.title + (event.description ? ` - ${event.description}` : ''),
          type: 'event_reminder',
          referenceId: refId,
          referenceDate: today,
          url: '/calendar',
          tag: `event-${event.id}-${today}`,
        });
        console.log(`[Push] Lembrete de evento enviado: ${event.title} para user ${userId}`);
      }
    }
    
    // Para eventos de amanhã, enviar lembrete à noite (20h)
    if (!isToday && currentHour === 20 && currentMinute < 5) {
      const alreadySent = await wasNotificationSent(userId, 'event_reminder', `${refId}-eve`, today);
      if (!alreadySent) {
        await sendPushNotification(userId, {
          title: '📅 Evento Amanhã',
          body: event.title + (event.description ? ` - ${event.description}` : ''),
          type: 'event_reminder',
          referenceId: `${refId}-eve`,
          referenceDate: today,
          url: '/calendar',
          tag: `event-${event.id}-eve-${today}`,
        });
      }
    }
  }
}

/**
 * Verifica e envia lembretes de tarefas com prazo
 */
async function checkTaskReminders(userId: number, today: string) {
  const db = await getDb();
  if (!db) return;
  
  // Buscar tarefas com prazo para hoje ou amanhã que não foram concluídas
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const pendingTasks = await db.select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.completed, false),
        sql`${tasks.dueDate} IN (${today}, ${tomorrowStr})`
      )
    );
  
  // Enviar apenas 1 lembrete consolidado por dia (às 8h)
  const now = new Date();
  const manausNow = new Date(now.getTime() - 4 * 60 * 60000);
  if (manausNow.getHours() !== 8 || manausNow.getMinutes() >= 5) return;
  
  const todayTasks = pendingTasks.filter(t => t.dueDate === today);
  const tomorrowTasks = pendingTasks.filter(t => t.dueDate === tomorrowStr);
  
  if (todayTasks.length > 0) {
    const refId = `tasks-today-${today}`;
    const alreadySent = await wasNotificationSent(userId, 'task_reminder', refId, today);
    if (!alreadySent) {
      const taskNames = todayTasks.slice(0, 3).map(t => t.title).join(', ');
      const extra = todayTasks.length > 3 ? ` e mais ${todayTasks.length - 3}` : '';
      
      await sendPushNotification(userId, {
        title: `⚡ ${todayTasks.length} tarefa(s) vencem hoje`,
        body: taskNames + extra,
        type: 'task_reminder',
        referenceId: refId,
        referenceDate: today,
        url: '/tasks',
        tag: `tasks-today-${today}`,
      });
    }
  }
  
  if (tomorrowTasks.length > 0) {
    const refId = `tasks-tomorrow-${today}`;
    const alreadySent = await wasNotificationSent(userId, 'task_reminder', refId, today);
    if (!alreadySent) {
      await sendPushNotification(userId, {
        title: `📋 ${tomorrowTasks.length} tarefa(s) vencem amanhã`,
        body: tomorrowTasks.slice(0, 3).map(t => t.title).join(', '),
        type: 'task_reminder',
        referenceId: refId,
        referenceDate: today,
        url: '/tasks',
        tag: `tasks-tomorrow-${today}`,
      });
    }
  }
}

/**
 * Envia resumo diário das aulas
 */
async function checkDailySummary(
  userId: number,
  today: string,
  currentTime: string,
  summaryTime: string,
  dayOfWeek: number
) {
  // Verificar se é o horário do resumo (±2 minutos)
  const [curH, curM] = currentTime.split(':').map(Number);
  const [sumH, sumM] = summaryTime.split(':').map(Number);
  const curTotal = curH * 60 + curM;
  const sumTotal = sumH * 60 + sumM;
  
  if (Math.abs(curTotal - sumTotal) > 2) return;
  
  const refId = `daily-summary-${today}`;
  const alreadySent = await wasNotificationSent(userId, 'daily_summary', refId, today);
  if (alreadySent) return;
  
  const db = await getDb();
  if (!db) return;
  
  // Contar aulas do dia
  const todayClasses = await db.select({
    subjectName: subjects.name,
    className: classes.name,
    startTime: timeSlots.startTime,
  })
  .from(scheduledClasses)
  .innerJoin(subjects, eq(scheduledClasses.subjectId, subjects.id))
  .innerJoin(classes, eq(scheduledClasses.classId, classes.id))
  .innerJoin(timeSlots, eq(scheduledClasses.timeSlotId, timeSlots.id))
  .where(
    and(
      eq(scheduledClasses.userId, userId),
      eq(scheduledClasses.dayOfWeek, dayOfWeek)
    )
  );
  
  // Contar eventos do dia
  const todayEvents = await db.select()
    .from(calendarEvents)
    .where(
      and(
        eq(calendarEvents.userId, userId),
        eq(calendarEvents.eventDate, today)
      )
    );
  
  if (todayClasses.length === 0 && todayEvents.length === 0) {
    await sendPushNotification(userId, {
      title: '☀️ Bom dia! Sem aulas hoje',
      body: 'Aproveite o dia para planejar ou descansar!',
      type: 'daily_summary',
      referenceId: refId,
      referenceDate: today,
      url: '/dashboard',
      tag: `daily-${today}`,
    });
    return;
  }
  
  const parts: string[] = [];
  if (todayClasses.length > 0) {
    parts.push(`${todayClasses.length} aula(s)`);
  }
  if (todayEvents.length > 0) {
    parts.push(`${todayEvents.length} evento(s)`);
  }
  
  const firstClass = todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  const body = firstClass 
    ? `Primeira aula: ${firstClass.subjectName} às ${firstClass.startTime}`
    : todayEvents[0]?.title || '';
  
  await sendPushNotification(userId, {
    title: `☀️ Hoje: ${parts.join(' e ')}`,
    body,
    type: 'daily_summary',
    referenceId: refId,
    referenceDate: today,
    url: '/dashboard',
    tag: `daily-${today}`,
  });
}

/**
 * Envia notificação de teste para verificar se tudo funciona
 */
export async function sendTestNotification(userId: number) {
  return sendPushNotification(userId, {
    title: '🔔 Teste de Notificação',
    body: 'As notificações push estão funcionando! Você receberá lembretes sobre aulas e eventos.',
    type: 'class_reminder',
    referenceId: `test-${Date.now()}`,
    referenceDate: new Date().toISOString().split('T')[0],
    url: '/dashboard',
    tag: `test-${Date.now()}`,
  });
}

/**
 * Obtém estatísticas de notificações enviadas
 */
export async function getNotificationStats(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const stats = await db.select({
    total: sql<number>`COUNT(*)`,
    delivered: sql<number>`SUM(CASE WHEN ${pushNotificationLog.delivered} = true THEN 1 ELSE 0 END)`,
    failed: sql<number>`SUM(CASE WHEN ${pushNotificationLog.delivered} = false THEN 1 ELSE 0 END)`,
  })
  .from(pushNotificationLog)
  .where(eq(pushNotificationLog.userId, userId));
  
  const subscriptionCount = await db.select({
    count: sql<number>`COUNT(*)`,
  })
  .from(pushSubscriptions)
  .where(
    and(
      eq(pushSubscriptions.userId, userId),
      eq(pushSubscriptions.isActive, true)
    )
  );
  
  return {
    totalSent: stats[0]?.total || 0,
    delivered: stats[0]?.delivered || 0,
    failed: stats[0]?.failed || 0,
    activeSubscriptions: subscriptionCount[0]?.count || 0,
  };
}

// Intervalo do job de verificação (5 minutos)
let reminderInterval: NodeJS.Timeout | null = null;

/**
 * Processa a fila de notificações adiadas (enviadas durante horário silencioso)
 * Chamada automaticamente às 07:00-07:04 pelo job de lembretes
 */
export async function processQueuedNotifications() {
  if (!vapidConfigured) return;
  
  const db = await getDb();
  if (!db) return;
  
  // Buscar todas as notificações pendentes na fila
  const pending = await db.select()
    .from(pushNotificationQueue)
    .where(eq(pushNotificationQueue.status, 'pending'));
  
  if (pending.length === 0) return;
  
  console.log(`[Push] Processando fila: ${pending.length} notificação(ões) adiada(s)`);
  
  let processed = 0;
  let errors = 0;
  
  for (const item of pending) {
    try {
      // Buscar subscriptions ativas do usuário
      const subs = await db.select()
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, item.userId),
            eq(pushSubscriptions.isActive, true)
          )
        );
      
      if (subs.length === 0) {
        // Sem dispositivos ativos, marcar como enviado (não há destino)
        await db.update(pushNotificationQueue)
          .set({ status: 'sent', sentAt: new Date() })
          .where(eq(pushNotificationQueue.id, item.id));
        continue;
      }
      
      const notificationPayload = JSON.stringify({
        title: item.title,
        body: item.body,
        icon: item.icon || '/icon-192.png',
        badge: item.badge || '/icon-192.png',
        tag: item.tag || `flowedu-${item.type}-queued-${Date.now()}`,
        data: {
          url: item.url || '/',
          type: item.type,
        },
      });
      
      let sent = 0;
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            notificationPayload
          );
          sent++;
        } catch (sendErr: any) {
          if (sendErr.statusCode === 410 || sendErr.statusCode === 404) {
            await db.update(pushSubscriptions)
              .set({ isActive: false })
              .where(eq(pushSubscriptions.id, sub.id));
          }
        }
      }
      
      // Marcar como enviado
      await db.update(pushNotificationQueue)
        .set({ status: 'sent', sentAt: new Date() })
        .where(eq(pushNotificationQueue.id, item.id));
      
      // Registrar no log
      try {
        await db.insert(pushNotificationLog).values({
          userId: item.userId,
          type: item.type,
          title: `[Adiada] ${item.title}`,
          body: item.body,
          referenceId: item.referenceId || null,
          referenceDate: item.referenceDate || null,
          delivered: sent > 0,
          error: null,
        });
      } catch (_) { /* log error silently */ }
      
      processed++;
    } catch (err: any) {
      errors++;
      console.error(`[Push] Erro ao processar fila item ${item.id}:`, err.message);
      await db.update(pushNotificationQueue)
        .set({ status: 'failed', error: err.message })
        .where(eq(pushNotificationQueue.id, item.id));
    }
  }
  
  console.log(`[Push] Fila processada: ${processed} enviada(s), ${errors} erro(s)`);
}

/**
 * Limpa registros antigos da fila (sent/failed com mais de 30 dias)
 * Chamada automaticamente pelo job semanal
 */
export async function cleanOldQueueItems() {
  const db = await getDb();
  if (!db) return { deleted: 0 };
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  try {
    // Deletar registros sent ou failed com mais de 30 dias
    const result = await db.delete(pushNotificationQueue)
      .where(
        and(
          sql`${pushNotificationQueue.status} IN ('sent', 'failed')`,
          lte(pushNotificationQueue.queuedAt, thirtyDaysAgo)
        )
      );
    
    const deleted = (result as any)[0]?.affectedRows || 0;
    console.log(`[Push] Limpeza da fila: ${deleted} registro(s) antigo(s) removido(s)`);
    return { deleted };
  } catch (error) {
    console.error('[Push] Erro na limpeza da fila:', error);
    return { deleted: 0 };
  }
}

/**
 * Reenvia uma notificação que falhou (retry manual)
 */
export async function retryFailedNotification(queueItemId: number) {
  if (!vapidConfigured) {
    return { success: false, error: 'VAPID não configurado' };
  }
  
  const db = await getDb();
  if (!db) return { success: false, error: 'Database não disponível' };
  
  // Buscar o item da fila
  const [item] = await db.select()
    .from(pushNotificationQueue)
    .where(eq(pushNotificationQueue.id, queueItemId));
  
  if (!item) return { success: false, error: 'Item não encontrado' };
  if (item.status === 'sent') return { success: false, error: 'Notificação já foi enviada' };
  
  // Buscar subscriptions ativas do usuário
  const subs = await db.select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, item.userId),
        eq(pushSubscriptions.isActive, true)
      )
    );
  
  if (subs.length === 0) {
    await db.update(pushNotificationQueue)
      .set({ status: 'failed', error: 'Sem dispositivos ativos' })
      .where(eq(pushNotificationQueue.id, queueItemId));
    return { success: false, error: 'Usuário sem dispositivos ativos' };
  }
  
  const notificationPayload = JSON.stringify({
    title: item.title,
    body: item.body,
    icon: item.icon || '/icon-192.png',
    badge: item.badge || '/icon-192.png',
    tag: item.tag || `flowedu-${item.type}-retry-${Date.now()}`,
    data: {
      url: item.url || '/',
      type: item.type,
    },
  });
  
  let sent = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload
      );
      sent++;
    } catch (sendErr: any) {
      if (sendErr.statusCode === 410 || sendErr.statusCode === 404) {
        await db.update(pushSubscriptions)
          .set({ isActive: false })
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
  
  if (sent > 0) {
    await db.update(pushNotificationQueue)
      .set({ status: 'sent', sentAt: new Date(), error: null })
      .where(eq(pushNotificationQueue.id, queueItemId));
    
    // Registrar no log
    try {
      await db.insert(pushNotificationLog).values({
        userId: item.userId,
        type: item.type,
        title: `[Reenvio] ${item.title}`,
        body: item.body,
        referenceId: item.referenceId || null,
        referenceDate: item.referenceDate || null,
        delivered: true,
        error: null,
      });
    } catch (_) { /* log error silently */ }
    
    return { success: true, sent };
  } else {
    await db.update(pushNotificationQueue)
      .set({ error: 'Falha ao reenviar para todos os dispositivos' })
      .where(eq(pushNotificationQueue.id, queueItemId));
    return { success: false, error: 'Falha ao enviar' };
  }
}

/**
 * Inicia o job periódico de verificação de lembretes
 */
export function startReminderJob() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
  }
  
  // Verificar a cada 5 minutos
  reminderInterval = setInterval(async () => {
    try {
      await checkAndSendReminders();
    } catch (error) {
      console.error('[Push] Erro no job de lembretes:', error);
    }
  }, 5 * 60 * 1000); // 5 minutos
  
  console.log('[Push] Job de lembretes iniciado (intervalo: 5 minutos)');
  
  // Executar imediatamente na primeira vez
  setTimeout(() => {
    checkAndSendReminders().catch(err => 
      console.error('[Push] Erro na primeira verificação:', err)
    );
  }, 10000); // 10 segundos após iniciar
  
  // Job semanal de limpeza da fila (todo domingo às 03:00 Manaus)
  setInterval(async () => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Manaus' }));
    // Executar apenas no domingo (0) às 03:00-03:04
    if (now.getDay() === 0 && now.getHours() === 3 && now.getMinutes() < 5) {
      console.log('[Push] Executando limpeza semanal da fila...');
      await cleanOldQueueItems();
    }
  }, 5 * 60 * 1000); // Verificar a cada 5 minutos (mesmo intervalo do job principal)
}

/**
 * Para o job periódico
 */
export function stopReminderJob() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    console.log('[Push] Job de lembretes parado');
  }
}
