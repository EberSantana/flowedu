# Guia de Configuração: Logs Centralizados e Rotação

**Autor:** Manus AI  
**Data:** 19 de Janeiro de 2026  
**Prioridade:** Média  
**Tempo estimado:** 1-1.5 horas

---

## Visão Geral

Um sistema robusto de logs é essencial para debugging, auditoria e monitoramento. Este guia apresenta a configuração de logs centralizados com rotação automática para o FlowEdu.

---

## Arquitetura de Logs

O FlowEdu gerará logs em três categorias principais:

| Categoria | Descrição | Arquivo |
|-----------|-----------|---------|
| **Application** | Logs da aplicação (info, warn, error) | `app.log` |
| **Access** | Logs de requisições HTTP | `access.log` |
| **Error** | Logs de erros críticos | `error.log` |
| **PM2** | Logs do gerenciador de processos | `pm2-*.log` |

---

## Passo 1: Configurar Winston (Logger)

Winston é a biblioteca de logging mais popular para Node.js, oferecendo flexibilidade e múltiplos transportes.

### Instalação

```bash
cd /home/ubuntu/teacher_schedule_system
pnpm add winston winston-daily-rotate-file
```

### Configuração

```typescript
// server/_core/logger.ts

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logDir = '/var/log/flowedu';

// Formato personalizado
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Transporte: Arquivo de aplicação (rotação diária)
const appFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d', // Manter logs por 14 dias
  format: logFormat,
  level: 'info'
});

// Transporte: Arquivo de erros (rotação diária)
const errorFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d', // Manter erros por 30 dias
  format: logFormat,
  level: 'error'
});

// Criar logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    appFileTransport,
    errorFileTransport
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

// Adicionar console em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Funções auxiliares
export const log = {
  info: (message: string, meta?: any) => logger.info(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  error: (message: string, meta?: any) => logger.error(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
};
```

---

## Passo 2: Integrar Logger na Aplicação

### Substituir console.log por logger

```typescript
// server/routers.ts

import { log } from './_core/logger';

// Exemplo de uso
auth: router({
  login: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      log.info('Tentativa de login', { email: input.email });
      
      try {
        // ... lógica de login
        log.info('Login bem-sucedido', { email: input.email });
        return { success: true };
      } catch (error: any) {
        log.error('Erro no login', { email: input.email, error: error.message });
        throw error;
      }
    }),
}),
```

### Middleware de Logging de Requisições

```typescript
// server/_core/index.ts

import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

// Criar stream para access.log
const accessLogStream = fs.createWriteStream(
  path.join('/var/log/flowedu', 'access.log'),
  { flags: 'a' }
);

// Adicionar middleware Morgan
app.use(morgan('combined', { stream: accessLogStream }));
```

Instalar Morgan:

```bash
pnpm add morgan @types/morgan
```

---

## Passo 3: Configurar Rotação de Logs do PM2

PM2 gera logs próprios que também precisam de rotação.

### Instalar PM2 Logrotate

```bash
pm2 install pm2-logrotate
```

### Configurar Rotação

```bash
# Rotacionar logs diariamente
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'

# Manter logs por 14 dias
pm2 set pm2-logrotate:retain 14

# Comprimir logs antigos
pm2 set pm2-logrotate:compress true

# Tamanho máximo antes de rotacionar (10MB)
pm2 set pm2-logrotate:max_size 10M
```

---

## Passo 4: Configurar Logrotate do Sistema (Backup)

Logrotate é uma ferramenta nativa do Linux para rotação de logs.

### Criar Configuração

```bash
sudo nano /etc/logrotate.d/flowedu
```

Adicionar:

```
/var/log/flowedu/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Testar Configuração

```bash
sudo logrotate -d /etc/logrotate.d/flowedu
```

---

## Passo 5: Criar Diretório de Logs

```bash
# Criar diretório
sudo mkdir -p /var/log/flowedu

# Dar permissões
sudo chown -R ubuntu:ubuntu /var/log/flowedu
sudo chmod -R 755 /var/log/flowedu
```

---

## Passo 6: Monitoramento de Logs em Tempo Real

### Comando para Ver Logs

```bash
# Logs da aplicação
tail -f /var/log/flowedu/app-2026-01-19.log

# Logs de erro
tail -f /var/log/flowedu/error-2026-01-19.log

# Logs do PM2
pm2 logs flowedu

# Logs de acesso HTTP
tail -f /var/log/flowedu/access.log
```

### Script de Monitoramento

```bash
#!/bin/bash
# /home/ubuntu/teacher_schedule_system/scripts/monitor-logs.sh

echo "=== FlowEdu - Monitor de Logs ==="
echo ""
echo "1. Logs da Aplicação"
echo "2. Logs de Erro"
echo "3. Logs de Acesso"
echo "4. Logs do PM2"
echo "5. Todos os Logs"
echo ""
read -p "Escolha uma opção: " option

case $option in
  1)
    tail -f /var/log/flowedu/app-*.log
    ;;
  2)
    tail -f /var/log/flowedu/error-*.log
    ;;
  3)
    tail -f /var/log/flowedu/access.log
    ;;
  4)
    pm2 logs flowedu
    ;;
  5)
    tail -f /var/log/flowedu/*.log
    ;;
  *)
    echo "Opção inválida"
    ;;
esac
```

Tornar executável:

```bash
chmod +x /home/ubuntu/teacher_schedule_system/scripts/monitor-logs.sh
```

---

## Passo 7: Análise de Logs

### Buscar Erros

```bash
# Erros das últimas 24h
grep -i "error" /var/log/flowedu/app-$(date +%Y-%m-%d).log

# Contar erros por tipo
grep -i "error" /var/log/flowedu/error-*.log | cut -d':' -f3 | sort | uniq -c | sort -rn
```

### Estatísticas de Acesso

```bash
# Requisições por hora
awk '{print $4}' /var/log/flowedu/access.log | cut -d: -f2 | sort | uniq -c

# Top 10 IPs
awk '{print $1}' /var/log/flowedu/access.log | sort | uniq -c | sort -rn | head -10

# Códigos de status HTTP
awk '{print $9}' /var/log/flowedu/access.log | sort | uniq -c | sort -rn
```

---

## Passo 8: Alertas de Erro (Opcional)

Criar script para enviar alerta quando muitos erros ocorrem:

```bash
#!/bin/bash
# /home/ubuntu/teacher_schedule_system/scripts/alert-errors.sh

LOG_FILE="/var/log/flowedu/error-$(date +%Y-%m-%d).log"
THRESHOLD=10
EMAIL="admin@seudominio.com"

# Contar erros na última hora
ERROR_COUNT=$(grep -c "error" $LOG_FILE 2>/dev/null || echo 0)

if [ $ERROR_COUNT -gt $THRESHOLD ]; then
  echo "ALERTA: $ERROR_COUNT erros detectados na última hora" | \
    mail -s "⚠️ FlowEdu: Muitos Erros Detectados" $EMAIL
fi
```

Adicionar ao crontab (executar a cada hora):

```bash
crontab -e
```

Adicionar linha:

```
0 * * * * /home/ubuntu/teacher_schedule_system/scripts/alert-errors.sh
```

---

## Passo 9: Limpeza Automática de Logs Antigos

```bash
#!/bin/bash
# /home/ubuntu/teacher_schedule_system/scripts/cleanup-logs.sh

LOG_DIR="/var/log/flowedu"
DAYS_TO_KEEP=30

# Remover logs mais antigos que 30 dias
find $LOG_DIR -name "*.log" -type f -mtime +$DAYS_TO_KEEP -delete

# Remover logs comprimidos mais antigos que 60 dias
find $LOG_DIR -name "*.gz" -type f -mtime +60 -delete

echo "Limpeza de logs concluída em $(date)"
```

Adicionar ao crontab (executar diariamente às 3h):

```bash
crontab -e
```

Adicionar linha:

```
0 3 * * * /home/ubuntu/teacher_schedule_system/scripts/cleanup-logs.sh
```

---

## Estrutura de Logs Recomendada

```
/var/log/flowedu/
├── app-2026-01-19.log          # Logs gerais da aplicação
├── app-2026-01-18.log
├── error-2026-01-19.log        # Logs de erros
├── error-2026-01-18.log
├── access.log                  # Logs de acesso HTTP
├── exceptions-2026-01-19.log   # Exceções não tratadas
├── rejections-2026-01-19.log   # Promise rejections
└── archived/                   # Logs comprimidos antigos
    ├── app-2026-01-01.log.gz
    └── error-2026-01-01.log.gz
```

---

## Níveis de Log

| Nível | Uso | Exemplo |
|-------|-----|---------|
| **error** | Erros críticos que precisam atenção | Falha na conexão com banco |
| **warn** | Avisos que não impedem funcionamento | API externa lenta |
| **info** | Informações importantes | Login de usuário |
| **debug** | Informações detalhadas para debugging | Valores de variáveis |

---

## Boas Práticas

**O que logar:**
- Tentativas de login (sucesso e falha)
- Operações críticas (criação de usuário, alteração de senha)
- Erros e exceções
- Performance de queries lentas (> 1s)
- Requisições de APIs externas

**O que NÃO logar:**
- Senhas ou tokens de autenticação
- Dados sensíveis (CPF, cartão de crédito)
- Informações pessoais identificáveis (PII)
- Dados completos de requisições (podem conter dados sensíveis)

---

## Checklist de Implementação

- [ ] Instalar Winston e winston-daily-rotate-file
- [ ] Criar arquivo `server/_core/logger.ts`
- [ ] Criar diretório `/var/log/flowedu` com permissões
- [ ] Substituir console.log por logger em rotas críticas
- [ ] Instalar e configurar Morgan para access logs
- [ ] Instalar pm2-logrotate
- [ ] Configurar logrotate do sistema
- [ ] Criar scripts de monitoramento
- [ ] Configurar alertas de erro (opcional)
- [ ] Configurar limpeza automática de logs
- [ ] Testar rotação de logs
- [ ] Documentar comandos úteis

---

## Comandos Úteis

```bash
# Ver logs em tempo real
pm2 logs flowedu

# Ver logs de erro
pm2 logs flowedu --err

# Ver últimas 100 linhas
pm2 logs flowedu --lines 100

# Limpar logs do PM2
pm2 flush

# Recarregar logs
pm2 reloadLogs

# Ver espaço usado pelos logs
du -sh /var/log/flowedu

# Buscar erro específico
grep -r "Database connection failed" /var/log/flowedu/
```

---

## Estimativa de Tempo

| Tarefa | Tempo Estimado |
|--------|----------------|
| Instalar dependências | 5 minutos |
| Configurar Winston | 20 minutos |
| Integrar logger na aplicação | 20 minutos |
| Configurar PM2 logrotate | 10 minutos |
| Configurar logrotate do sistema | 10 minutos |
| Criar scripts de monitoramento | 15 minutos |
| Testes | 10 minutos |
| **Total** | **1h 30min** |

---

## Solução de Problemas

**Problema: Logs não estão sendo criados**
- Verificar permissões do diretório `/var/log/flowedu`
- Verificar se o caminho está correto no logger.ts
- Verificar logs de erro do PM2: `pm2 logs flowedu --err`

**Problema: Logs crescendo muito rápido**
- Reduzir nível de log para 'info' em produção
- Aumentar frequência de rotação
- Revisar código para remover logs desnecessários

**Problema: Rotação não está funcionando**
- Verificar configuração do pm2-logrotate: `pm2 conf pm2-logrotate`
- Testar logrotate manualmente: `sudo logrotate -f /etc/logrotate.d/flowedu`

---

*Guia criado por Manus AI em 19/01/2026*
