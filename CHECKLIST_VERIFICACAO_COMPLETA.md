# ✅ Checklist de Verificação Completa - FlowEdu

> **Para quem é:** Leigos em informática que querem verificar se tudo está funcionando  
> **Tempo estimado:** 15-20 minutos  
> **Última atualização:** 04/02/2026

---

## 📋 ÍNDICE

1. [Verificações no Hostinger (Painel de Controle)](#1-verificações-no-hostinger)
2. [Verificações de DNS (Domínio)](#2-verificações-de-dns)
3. [Verificações de Banco de Dados](#3-verificações-de-banco-de-dados)
4. [Verificações na VPS (Servidor)](#4-verificações-na-vps)
5. [Verificações de SSL (Certificado)](#5-verificações-de-ssl)
6. [Verificações do Site (Funcionamento)](#6-verificações-do-site)
7. [Comandos Rápidos](#7-comandos-rápidos)

---

## 1. VERIFICAÇÕES NO HOSTINGER

### 📍 **Onde:** Painel do Hostinger (hpanel.hostinger.com)

| Item | O que verificar | Como verificar | Status esperado |
|------|----------------|----------------|-----------------|
| **VPS Status** | VPS está ligada | Painel → VPS → Status | 🟢 Running (Rodando) |
| **IP da VPS** | IP público está ativo | Painel → VPS → Detalhes | IP visível (ex: 123.45.67.89) |
| **Acesso SSH** | Consegue conectar via SSH | Terminal: `ssh root@SEU_IP` | Conexão bem-sucedida |
| **Plano VPS** | Recursos contratados | Painel → VPS → Plano | RAM, CPU, Disco conforme contratado |
| **Backup** | Backups automáticos ativos | Painel → VPS → Backups | ✅ Ativo (se contratado) |

---

## 2. VERIFICAÇÕES DE DNS

### 📍 **Onde:** Painel do Hostinger → Domínios

| Item | O que verificar | Como verificar | Status esperado |
|------|----------------|----------------|-----------------|
| **Registro A** | Domínio aponta para VPS | Domínios → flowedu.app → DNS | `A` record → IP da VPS |
| **Registro A (www)** | www aponta para VPS | Domínios → flowedu.app → DNS | `A` record → IP da VPS |
| **Propagação DNS** | DNS propagou globalmente | Site: https://dnschecker.org | ✅ Verde em vários locais |
| **Nameservers** | NS estão corretos | Domínios → flowedu.app → Nameservers | Nameservers do Hostinger |

### 🔍 **Teste rápido de DNS (no terminal da VPS):**

```bash
# Verificar se domínio aponta para IP correto
dig flowedu.app +short
dig www.flowedu.app +short

# Deve retornar o IP da sua VPS
```

---

## 3. VERIFICAÇÕES DE BANCO DE DADOS

### 📍 **Onde:** Painel do Hostinger → Banco de Dados MySQL

| Item | O que verificar | Como verificar | Status esperado |
|------|----------------|----------------|-----------------|
| **Banco criado** | Banco de dados existe | Painel → MySQL → Bancos | flowedu_db (ou nome escolhido) |
| **Usuário criado** | Usuário tem permissões | Painel → MySQL → Usuários | Usuário com acesso ao banco |
| **Acesso remoto** | VPS pode conectar | Painel → MySQL → Acesso Remoto | IP da VPS liberado |
| **URL de conexão** | DATABASE_URL correto | VPS: `cat /home/app/.env \| grep DATABASE_URL` | mysql://usuario:senha@host:3306/banco |

### 🔍 **Teste de conexão ao banco (na VPS):**

```bash
# Testar conexão com o banco
mysql -h SEU_HOST_MYSQL -u SEU_USUARIO -p SEU_BANCO

# Se conectar com sucesso, digite:
SHOW TABLES;
EXIT;
```

---

## 4. VERIFICAÇÕES NA VPS

### 📍 **Onde:** Terminal SSH conectado na VPS

| Item | O que verificar | Comando | Status esperado |
|------|----------------|---------|-----------------|
| **Sistema atualizado** | Ubuntu atualizado | `lsb_release -a` | Ubuntu 22.04 LTS |
| **Node.js** | Versão 22.x instalada | `node --version` | v22.x.x |
| **pnpm** | Gerenciador instalado | `pnpm --version` | 9.x.x ou superior |
| **PM2** | Gerenciador de processos | `pm2 --version` | 5.x.x ou superior |
| **Nginx** | Servidor web rodando | `sudo systemctl status nginx` | 🟢 active (running) |
| **Certbot** | SSL configurado | `sudo certbot certificates` | Certificados válidos |
| **Aplicação** | FlowEdu rodando | `pm2 list` | flowedu 🟢 online |
| **Logs** | Sem erros críticos | `pm2 logs flowedu --lines 50` | Sem erros em vermelho |
| **Portas** | 80, 443, 3000 abertas | `sudo netstat -tulpn \| grep -E '80\|443\|3000'` | Portas LISTEN |
| **Disco** | Espaço disponível | `df -h` | Uso < 80% |
| **RAM** | Memória disponível | `free -h` | Memória livre > 200MB |

### 🔍 **Script de verificação automática:**

```bash
# Baixar e executar script de verificação
cd /home/app
./verify-installation.sh
```

---

## 5. VERIFICAÇÕES DE SSL

### 📍 **Onde:** Terminal SSH + Navegador

| Item | O que verificar | Como verificar | Status esperado |
|------|----------------|----------------|-----------------|
| **Certificado instalado** | SSL ativo | `sudo certbot certificates` | Certificado para flowedu.app |
| **Validade** | Não expirado | `sudo certbot certificates` | Expiry Date > hoje + 30 dias |
| **Renovação automática** | Cron job ativo | `sudo systemctl status certbot.timer` | 🟢 active (running) |
| **HTTPS funciona** | Site abre com HTTPS | Navegador: https://flowedu.app | 🔒 Cadeado verde |
| **Redirecionamento** | HTTP → HTTPS | Navegador: http://flowedu.app | Redireciona para HTTPS |

### 🔍 **Teste de SSL:**

```bash
# Verificar certificado SSL
curl -I https://flowedu.app | grep -i "HTTP\|ssl"

# Testar renovação (dry-run)
sudo certbot renew --dry-run
```

---

## 6. VERIFICAÇÕES DO SITE

### 📍 **Onde:** Navegador (Chrome, Edge, Firefox)

| Item | O que verificar | Como testar | Status esperado |
|------|----------------|-------------|-----------------|
| **Site carrega** | Página abre | https://flowedu.app | Página carrega em < 3s |
| **Sem erros JS** | Console limpo | F12 → Console | Sem erros vermelhos críticos |
| **Login funciona** | Autenticação OK | Fazer login como professor/aluno | Login bem-sucedido |
| **Páginas funcionam** | Navegação OK | Testar Disciplinas, Turmas, etc. | Páginas carregam |
| **Cache ativo** | Headers corretos | F12 → Network → Arquivo → Headers | Cache-Control presente |
| **Responsivo** | Mobile funciona | F12 → Toggle device toolbar | Layout adapta ao mobile |

### 🔍 **Teste de performance:**

- **Google PageSpeed Insights:** https://pagespeed.web.dev/
  - Digite: https://flowedu.app
  - Score esperado: > 70 (Mobile e Desktop)

---

## 7. COMANDOS RÁPIDOS

### 🚀 **Verificação Rápida (copie e cole na VPS):**

```bash
echo "=== VERIFICAÇÃO RÁPIDA FLOWEDU ==="
echo ""
echo "1. Node.js: $(node --version)"
echo "2. pnpm: $(pnpm --version)"
echo "3. PM2: $(pm2 --version)"
echo ""
echo "4. Nginx status:"
sudo systemctl is-active nginx
echo ""
echo "5. Aplicação FlowEdu:"
pm2 list | grep flowedu
echo ""
echo "6. Certificado SSL:"
sudo certbot certificates 2>/dev/null | grep -A 2 "flowedu.app" || echo "Não encontrado"
echo ""
echo "7. Uso de disco:"
df -h | grep -E "Filesystem|/$"
echo ""
echo "8. Uso de RAM:"
free -h | grep -E "total|Mem"
echo ""
echo "=== FIM DA VERIFICAÇÃO ==="
```

---

## 📊 RESUMO - TUDO OK?

### ✅ **Checklist Final:**

- [ ] VPS rodando no Hostinger
- [ ] DNS apontando para VPS (A records)
- [ ] Banco de dados acessível
- [ ] Node.js, pnpm, PM2, Nginx instalados
- [ ] SSL ativo e válido
- [ ] Aplicação FlowEdu online
- [ ] Site carregando em HTTPS
- [ ] Login funcionando
- [ ] Cache do Nginx ativo
- [ ] Sem erros críticos nos logs

---

## 🆘 PROBLEMAS COMUNS

### ❌ **Site não carrega:**
1. Verificar se Nginx está rodando: `sudo systemctl status nginx`
2. Verificar se aplicação está online: `pm2 list`
3. Verificar logs: `pm2 logs flowedu --lines 50`

### ❌ **Erro de banco de dados:**
1. Verificar DATABASE_URL no .env: `cat /home/app/.env | grep DATABASE_URL`
2. Testar conexão: `mysql -h HOST -u USER -p DATABASE`
3. Verificar se IP da VPS está liberado no Hostinger

### ❌ **SSL não funciona:**
1. Verificar certificados: `sudo certbot certificates`
2. Renovar manualmente: `sudo certbot renew`
3. Reiniciar Nginx: `sudo systemctl restart nginx`

### ❌ **DNS não propaga:**
1. Aguardar 24-48h para propagação completa
2. Verificar nameservers: https://dnschecker.org
3. Limpar cache DNS local: `ipconfig /flushdns` (Windows) ou `sudo systemd-resolve --flush-caches` (Linux)

---

## 📞 SUPORTE

Se após verificar tudo ainda houver problemas:

1. **Execute o script de verificação:**
   ```bash
   cd /home/app
   ./verify-installation.sh
   ```

2. **Copie TODO o resultado** e envie para análise

3. **Tire prints** do painel do Hostinger mostrando:
   - Status da VPS
   - Configurações de DNS
   - Configurações do banco de dados

---

## 📝 NOTAS

- **Frequência recomendada:** Verificar semanalmente
- **Após mudanças:** Sempre verificar após atualizar código ou configurações
- **Monitoramento:** Configurar alertas no Hostinger para VPS offline

---

**Última atualização:** 04/02/2026  
**Versão:** 1.0  
**Autor:** Manus AI Assistant
