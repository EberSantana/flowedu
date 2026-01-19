# Guias de Implementação Pós-Deploy

**Autor:** Manus AI  
**Data:** 19 de Janeiro de 2026  
**Versão:** 1.0

---

## Visão Geral

Este documento reúne os três guias essenciais para implementação logo após o deploy do FlowEdu em VPS. Cada guia é independente e pode ser seguido na ordem de prioridade indicada.

---

## Guias Disponíveis

### 1. Verificação de E-mail no Cadastro

**Arquivo:** `GUIA_VERIFICACAO_EMAIL.md`  
**Prioridade:** Alta  
**Tempo estimado:** 2-3 horas  
**Descrição:** Implementação completa do sistema de verificação de e-mail para garantir que usuários cadastrados possuem acesso ao e-mail informado.

**Principais funcionalidades:**
- Geração de token único de verificação
- Envio de e-mail com link de confirmação
- Página de verificação de e-mail
- Reenvio de e-mail de verificação
- Banner de alerta para e-mails não verificados

**Tecnologias utilizadas:**
- Resend (envio de e-mail)
- Crypto (geração de tokens)
- tRPC (rotas de API)

---

### 2. Monitoramento e Alertas de Uptime

**Arquivo:** `GUIA_MONITORAMENTO.md`  
**Prioridade:** Alta  
**Tempo estimado:** 1-2 horas  
**Descrição:** Configuração de monitoramento de uptime e alertas automáticos para detectar problemas rapidamente.

**Principais funcionalidades:**
- Monitoramento com UptimeRobot (gratuito)
- Endpoint de health check
- Alertas por e-mail e Slack
- Dashboard de status público
- Procedimento de resposta a incidentes

**Serviços recomendados:**
- UptimeRobot (principal)
- Pingdom (alternativa)
- PM2 Monitoring (interno)

---

### 3. Logs Centralizados e Rotação

**Arquivo:** `GUIA_LOGS_CENTRALIZADOS.md`  
**Prioridade:** Média  
**Tempo estimado:** 1-1.5 horas  
**Descrição:** Sistema robusto de logs com rotação automática para debugging, auditoria e monitoramento.

**Principais funcionalidades:**
- Logger Winston com rotação diária
- Logs de aplicação, erro e acesso HTTP
- Rotação automática com PM2 e Logrotate
- Scripts de monitoramento e análise
- Alertas de erro automáticos
- Limpeza automática de logs antigos

**Tecnologias utilizadas:**
- Winston (logger)
- Winston Daily Rotate File
- Morgan (access logs)
- PM2 Logrotate
- Logrotate (sistema)

---

## Ordem de Implementação Recomendada

Após o deploy inicial do FlowEdu em VPS, siga esta ordem de implementação:

**Semana 1 (Primeiras 48h):**
1. ✅ **Monitoramento** (1-2h) - Configurar UptimeRobot para detectar problemas imediatamente
2. ✅ **Logs** (1-1.5h) - Configurar sistema de logs para facilitar debugging

**Semana 1 (Próximos 5 dias):**
3. ✅ **Verificação de E-mail** (2-3h) - Implementar após validar que sistema está estável

---

## Pré-requisitos

Antes de iniciar qualquer guia, certifique-se de que:

- [ ] FlowEdu está rodando em produção no VPS
- [ ] PM2 está configurado e gerenciando a aplicação
- [ ] Nginx está configurado como reverse proxy
- [ ] SSL/HTTPS está funcionando
- [ ] Banco de dados está acessível
- [ ] Variáveis de ambiente estão configuradas

---

## Checklist Geral

### Verificação de E-mail
- [ ] Schema do banco atualizado
- [ ] Funções de token criadas
- [ ] Template de e-mail configurado
- [ ] Rotas de verificação implementadas
- [ ] Página de verificação criada
- [ ] Banner de alerta adicionado
- [ ] Testes realizados

### Monitoramento
- [ ] Conta UptimeRobot criada
- [ ] Monitores configurados
- [ ] Endpoint de health criado
- [ ] Alertas configurados
- [ ] Procedimento de resposta documentado

### Logs Centralizados
- [ ] Winston instalado e configurado
- [ ] Diretório de logs criado
- [ ] PM2 logrotate instalado
- [ ] Logrotate do sistema configurado
- [ ] Scripts de monitoramento criados
- [ ] Limpeza automática configurada

---

## Suporte e Troubleshooting

Cada guia inclui uma seção de **Solução de Problemas** com os erros mais comuns e suas soluções.

**Problemas gerais:**
- Verificar logs do PM2: `pm2 logs flowedu`
- Verificar status do servidor: `pm2 status`
- Verificar conexão com banco: testar endpoint `/api/health`
- Verificar variáveis de ambiente: `pm2 env 0`

---

## Estimativa de Tempo Total

| Guia | Tempo Estimado |
|------|----------------|
| Verificação de E-mail | 2-3 horas |
| Monitoramento | 1-2 horas |
| Logs Centralizados | 1-1.5 horas |
| **Total** | **4.5-6.5 horas** |

---

## Recursos Adicionais

**Documentação oficial:**
- [Winston](https://github.com/winstonjs/winston)
- [UptimeRobot](https://uptimerobot.com/docs/)
- [PM2](https://pm2.keymetrics.io/docs/)
- [Logrotate](https://linux.die.net/man/8/logrotate)

**Ferramentas úteis:**
- [Resend](https://resend.com/docs) - Envio de e-mail
- [Pingdom](https://www.pingdom.com) - Monitoramento alternativo
- [Slack Webhooks](https://api.slack.com/messaging/webhooks) - Alertas no Slack

---

## Contato e Suporte

Para dúvidas ou problemas na implementação destes guias, consulte:
- Documentação oficial do FlowEdu
- Logs do sistema (`/var/log/flowedu/`)
- Issues no repositório GitHub

---

*Documento criado por Manus AI em 19/01/2026*
