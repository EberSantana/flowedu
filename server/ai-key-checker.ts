/**
 * Verificação Diária de Chaves de API de IA
 * Roda todo dia às 7h (Manaus UTC-4 = 11h UTC)
 * Testa cada chave configurada e notifica o admin se alguma estiver inválida.
 */

import cron from 'node-cron';
import { getDb } from './db';
import { notifyOwner } from './_core/notification';
import { sql } from 'drizzle-orm';

let keyCheckerTask: ReturnType<typeof cron.schedule> | null = null;

const PROVIDER_NAMES: Record<string, string> = {
  groq: 'Groq',
  openai: 'OpenAI (ChatGPT)',
  anthropic: 'Anthropic (Claude)',
  gemini: 'Google Gemini',
  manus: 'Manus AI',
};

interface CheckResult {
  provider: string;
  valid: boolean;
  message: string;
}

async function testProvider(provider: string, url: string, opts: RequestInit): Promise<CheckResult> {
  try {
    const r = await fetch(url, opts);
    if (r.ok) return { provider, valid: true, message: 'OK' };
    const err = await r.json().catch(() => ({})) as any;
    return { provider, valid: false, message: err?.error?.message || err?.message || `HTTP ${r.status}` };
  } catch (e: any) {
    return { provider, valid: false, message: e.message || 'Erro de rede' };
  }
}

export async function checkAllApiKeys(): Promise<void> {
  console.log('[AIKeyChecker] Iniciando verificação diária de chaves de API...');

  const dbConn = await getDb();
  if (!dbConn) {
    console.warn('[AIKeyChecker] Banco de dados não disponível, pulando verificação.');
    return;
  }

  let settings: any = null;
  try {
    const rows = await dbConn.execute(
      sql`SELECT groqApiKey, geminiApiKey, openaiApiKey, anthropicApiKey FROM ai_settings LIMIT 1`
    ) as any[];
    const rowList = (rows[0] as any[]) || [];
    if (rowList.length > 0) settings = rowList[0];
  } catch (e: any) {
    console.warn('[AIKeyChecker] Erro ao buscar configurações:', e.message);
    return;
  }

  if (!settings) {
    console.log('[AIKeyChecker] Nenhuma configuração de IA encontrada, pulando.');
    return;
  }

  const results: CheckResult[] = [];

  if (settings.groqApiKey) {
    results.push(await testProvider('groq', 'https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${settings.groqApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'OK' }], max_tokens: 3 }),
    }));
  }
  if (settings.openaiApiKey) {
    results.push(await testProvider('openai', 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${settings.openaiApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'OK' }], max_tokens: 3 }),
    }));
  }
  if (settings.anthropicApiKey) {
    results.push(await testProvider('anthropic', 'https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': settings.anthropicApiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-3-haiku-20240307', messages: [{ role: 'user', content: 'OK' }], max_tokens: 3 }),
    }));
  }
  if (settings.geminiApiKey) {
    results.push(await testProvider('gemini', `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'OK' }] }] }),
    }));
  }

  const invalidKeys = results.filter(r => !r.valid);
  const validCount = results.length - invalidKeys.length;
  console.log(`[AIKeyChecker] Verificação concluída: ${validCount}/${results.length} chaves válidas.`);

  if (invalidKeys.length > 0) {
    const invalidList = invalidKeys
      .map(k => `• ${PROVIDER_NAMES[k.provider] || k.provider}: ${k.message}`)
      .join('\n');
    const allList = results
      .map(r => `${r.valid ? '✅' : '❌'} ${PROVIDER_NAMES[r.provider] || r.provider}: ${r.valid ? 'Válida' : r.message}`)
      .join('\n');

    try {
      await notifyOwner({
        title: `⚠️ ${invalidKeys.length} chave(s) de API de IA inválida(s)`,
        content: `A verificação diária automática detectou ${invalidKeys.length} chave(s) com problema:\n\n${invalidList}\n\n---\nResumo:\n${allList}\n\nAcesse Administração → Configurações de IA para atualizar.`,
      });
      console.log(`[AIKeyChecker] Notificação enviada: ${invalidKeys.length} chave(s) inválida(s).`);
    } catch (e: any) {
      console.warn('[AIKeyChecker] Erro ao enviar notificação:', e.message);
    }
  }
}

export function startApiKeyCheckerJob(): void {
  if (keyCheckerTask) keyCheckerTask.stop();
  // Todo dia às 11h UTC (= 7h Manaus UTC-4)
  keyCheckerTask = cron.schedule('0 11 * * *', async () => {
    try {
      await checkAllApiKeys();
    } catch (err) {
      console.error('[AIKeyChecker] Erro no job de verificação de chaves:', err);
    }
  }, { timezone: 'UTC' });
  console.log('[AIKeyChecker] Job de verificação de chaves iniciado (todo dia às 7h Manaus)');
}

export function stopApiKeyCheckerJob(): void {
  if (keyCheckerTask) {
    keyCheckerTask.stop();
    keyCheckerTask = null;
  }
}
