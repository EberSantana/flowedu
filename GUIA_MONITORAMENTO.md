# Guia de Configuração: Monitoramento e Alertas de Uptime

**Autor:** Manus AI  
**Data:** 19 de Janeiro de 2026  
**Prioridade:** Alta  
**Tempo estimado:** 1-2 horas

---

## Visão Geral

O monitoramento de uptime é essencial para garantir a disponibilidade do FlowEdu e detectar problemas rapidamente. Este guia apresenta três soluções de monitoramento gratuitas e fáceis de configurar.

---

## Opção 1: UptimeRobot (Recomendado)

**Características:**
- Gratuito para até 50 monitores
- Verificação a cada 5 minutos
- Alertas por e-mail, SMS, Slack, Telegram
- Dashboard público opcional
- Fácil configuração

### Passo a Passo

**1. Criar Conta**

Acesse [uptimerobot.com](https://uptimerobot.com) e crie uma conta gratuita.

**2. Adicionar Monitor**

1. Clique em "+ Add New Monitor"
2. Preencha os campos:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** FlowEdu - Produção
   - **URL:** `https://seudominio.com.br`
   - **Monitoring Interval:** 5 minutes
3. Clique em "Create Monitor"

**3. Configurar Alertas**

1. Vá em "My Settings" → "Alert Contacts"
2. Adicione seu e-mail principal
3. (Opcional) Adicione Slack/Telegram para alertas instantâneos

**4. Monitores Recomendados**

| Monitor | URL | Descrição |
|---------|-----|-----------|
| Homepage | `https://seudominio.com.br` | Página inicial |
| API Health | `https://seudominio.com.br/api/health` | Endpoint de saúde da API |
| Login | `https://seudominio.com.br/login` | Página de login |
| Portal do Professor | `https://seudominio.com.br/dashboard` | Dashboard principal |

**5. Criar Endpoint de Health Check**

Adicionar rota de health check no backend:

```typescript
// server/routers.ts

system: router({
  health: publicProcedure.query(async () => {
    // Verificar conexão com banco
    const db = await getDb();
    const dbStatus = db ? 'ok' : 'error';
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime(),
      version: '1.0.0'
    };
  }),
}),
```

---

## Opção 2: Pingdom (Alternativa)

**Características:**
- Gratuito para 1 monitor
- Verificação a cada 1 minuto
- Alertas por e-mail
- Relatórios detalhados

### Configuração Rápida

1. Acesse [pingdom.com](https://www.pingdom.com)
2. Crie conta gratuita
3. Adicione monitor HTTP
4. Configure e-mail de alerta

---

## Opção 3: Monitoramento com PM2 (Interno)

**Características:**
- Gratuito e integrado ao PM2
- Monitora CPU, memória, restarts
- Dashboard web opcional
- Ideal para monitoramento interno

### Configuração

**1. Instalar PM2 Plus (Opcional)**

```bash
pm2 install pm2-server-monit
```

**2. Configurar Alertas de Restart**

Editar `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'flowedu',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    
    // Alertas
    min_uptime: '10s',
    max_restarts: 5,
    autorestart: true,
    
    // Notificações (via webhook)
    error_file: '/var/log/flowedu/error.log',
    out_file: '/var/log/flowedu/out.log',
    
    // Script de alerta personalizado
    post_update: ['echo "App atualizado" | mail -s "FlowEdu Deploy" admin@seudominio.com'],
  }]
};
```

**3. Criar Script de Alerta**

```bash
#!/bin/bash
# /home/ubuntu/teacher_schedule_system/scripts/alert-restart.sh

APP_NAME="FlowEdu"
EMAIL="admin@seudominio.com"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Enviar e-mail de alerta
echo "O aplicativo $APP_NAME foi reiniciado em $TIMESTAMP" | \
  mail -s "⚠️ Alerta: $APP_NAME Reiniciado" $EMAIL
```

Tornar executável:

```bash
chmod +x /home/ubuntu/teacher_schedule_system/scripts/alert-restart.sh
```

---

## Configuração de Alertas por E-mail (Resend)

Usar a integração Resend já configurada no FlowEdu:

```typescript
// server/_core/monitoring.ts

import { Resend } from 'resend';
import { ENV } from './env';

const resend = new Resend(ENV.RESEND_API_KEY);

export async function sendUptimeAlert(
  type: 'down' | 'up' | 'slow',
  details: string
) {
  const subject = type === 'down' 
    ? '🔴 FlowEdu está OFFLINE'
    : type === 'up'
    ? '✅ FlowEdu voltou ONLINE'
    : '⚠️ FlowEdu está LENTO';
  
  try {
    await resend.emails.send({
      from: ENV.EMAIL_FROM || 'FlowEdu Monitoring <monitoring@flowedu.com>',
      to: 'admin@seudominio.com',
      subject,
      html: `
        <h2>${subject}</h2>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Detalhes:</strong> ${details}</p>
        <hr>
        <p>Acesse o painel de monitoramento para mais informações.</p>
      `
    });
  } catch (error) {
    console.error('[Monitoring] Erro ao enviar alerta:', error);
  }
}
```

---

## Integração com Slack (Opcional)

**1. Criar Webhook do Slack**

1. Acesse [api.slack.com/apps](https://api.slack.com/apps)
2. Crie novo app
3. Ative "Incoming Webhooks"
4. Copie a Webhook URL

**2. Adicionar ao .env**

```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**3. Criar Função de Alerta**

```typescript
// server/_core/monitoring.ts

export async function sendSlackAlert(message: string) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        username: 'FlowEdu Monitor',
        icon_emoji: ':robot_face:'
      })
    });
  } catch (error) {
    console.error('[Monitoring] Erro ao enviar alerta Slack:', error);
  }
}
```

---

## Dashboard de Status Público (Opcional)

Criar página pública de status para transparência:

```typescript
// client/src/pages/Status.tsx

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function Status() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/trpc/system.health')
      .then(res => res.json())
      .then(data => {
        setStatus(data.result.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Status do FlowEdu</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status?.status === 'ok' ? (
                <><CheckCircle className="text-green-600" /> Sistema Operacional</>
              ) : (
                <><XCircle className="text-red-600" /> Sistema com Problemas</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Banco de Dados</p>
                <p className="font-semibold">{status?.database === 'ok' ? '✅ Online' : '❌ Offline'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="font-semibold">{Math.floor(status?.uptime / 3600)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ServiceStatus name="API" status="operational" />
              <ServiceStatus name="Portal do Professor" status="operational" />
              <ServiceStatus name="Portal do Aluno" status="operational" />
              <ServiceStatus name="Upload de Arquivos" status="operational" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ServiceStatus({ name, status }: { name: string; status: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
      <span>{name}</span>
      <span className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        Operacional
      </span>
    </div>
  );
}
```

---

## Métricas a Monitorar

| Métrica | Threshold | Ação |
|---------|-----------|------|
| Uptime | < 99% | Investigar causa |
| Tempo de resposta | > 3s | Otimizar queries |
| Taxa de erro | > 1% | Verificar logs |
| Uso de CPU | > 80% | Escalar recursos |
| Uso de memória | > 80% | Reiniciar/escalar |
| Espaço em disco | > 90% | Limpar logs |

---

## Checklist de Implementação

- [ ] Criar conta no UptimeRobot
- [ ] Adicionar 4 monitores (homepage, API, login, dashboard)
- [ ] Configurar alertas por e-mail
- [ ] Criar endpoint `/api/health` no backend
- [ ] Testar endpoint de health check
- [ ] (Opcional) Configurar alertas no Slack
- [ ] (Opcional) Criar página pública de status
- [ ] Documentar procedimento de resposta a incidentes

---

## Procedimento de Resposta a Incidentes

**Quando receber alerta de downtime:**

1. **Verificar status** - Acessar servidor VPS via SSH
2. **Verificar logs** - `pm2 logs flowedu`
3. **Verificar recursos** - `htop` ou `pm2 monit`
4. **Reiniciar se necessário** - `pm2 restart flowedu`
5. **Documentar** - Anotar causa e solução
6. **Comunicar** - Informar usuários se downtime > 5min

---

## Estimativa de Tempo

| Tarefa | Tempo Estimado |
|--------|----------------|
| Criar conta UptimeRobot | 5 minutos |
| Configurar 4 monitores | 15 minutos |
| Criar endpoint de health | 10 minutos |
| Configurar alertas | 10 minutos |
| Testes | 15 minutos |
| (Opcional) Slack integration | 20 minutos |
| (Opcional) Página de status | 30 minutos |
| **Total** | **1h 45min** |

---

*Guia criado por Manus AI em 19/01/2026*
