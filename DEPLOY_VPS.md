# Guia de Deploy em VPS - FlowEdu

Este documento descreve o processo completo para deploy do FlowEdu em um servidor VPS Ubuntu.

## Requisitos do Servidor

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| CPU | 1 vCPU | 2+ vCPUs |
| RAM | 2 GB | 4+ GB |
| Disco | 20 GB SSD | 40+ GB SSD |
| SO | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

## 1. Preparação do Servidor

### 1.1 Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalar Dependências

```bash
# Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm
npm install -g pnpm

# PM2
npm install -g pm2

# Nginx
sudo apt install -y nginx

# MySQL Client (para backups)
sudo apt install -y mysql-client

# Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Ferramentas úteis
sudo apt install -y git curl wget htop
```

### 1.3 Criar Usuário da Aplicação

```bash
sudo useradd -m -s /bin/bash flowedu
sudo usermod -aG sudo flowedu
```

### 1.4 Criar Diretórios

```bash
sudo mkdir -p /var/www/flowedu
sudo mkdir -p /var/log/flowedu
sudo mkdir -p /home/ubuntu/backups
sudo chown -R ubuntu:ubuntu /var/www/flowedu
sudo chown -R ubuntu:ubuntu /var/log/flowedu
```

## 2. Configuração do Banco de Dados

### 2.1 Opção A: MySQL Local

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Criar banco e usuário
sudo mysql -e "CREATE DATABASE flowedu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'flowedu'@'localhost' IDENTIFIED BY 'SUA_SENHA_SEGURA';"
sudo mysql -e "GRANT ALL PRIVILEGES ON flowedu.* TO 'flowedu'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 2.2 Opção B: MySQL Remoto (TiDB, PlanetScale, etc.)

Configure a variável `DATABASE_URL` no arquivo `.env` com a string de conexão fornecida pelo serviço.

### 2.3 Aplicar Índices de Performance

```bash
mysql -u flowedu -p flowedu < scripts/add-indexes.sql
```

## 3. Deploy da Aplicação

### 3.1 Clonar Repositório

```bash
cd /var/www/flowedu
git clone https://github.com/SEU_USUARIO/flowedu.git .
```

### 3.2 Instalar Dependências

```bash
pnpm install --frozen-lockfile
```

### 3.3 Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:

```bash
nano .env
```

Conteúdo do `.env`:

```env
# Ambiente
NODE_ENV=production
PORT=3000

# Banco de Dados
DATABASE_URL=mysql://flowedu:SUA_SENHA@localhost:3306/flowedu

# Autenticação
JWT_SECRET=SUA_CHAVE_JWT_SUPER_SECRETA_COM_PELO_MENOS_32_CARACTERES

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@seu-dominio.com.br

# Manus API (se usar funcionalidades de IA)
BUILT_IN_FORGE_API_KEY=sua_chave_api
BUILT_IN_FORGE_API_URL=https://api.manus.im
```

### 3.4 Build da Aplicação

```bash
pnpm build
```

### 3.5 Migrar Banco de Dados

```bash
pnpm db:push
```

## 4. Configuração do PM2

### 4.1 Iniciar Aplicação

```bash
pm2 start ecosystem.config.js --env production
```

### 4.2 Configurar Inicialização Automática

```bash
pm2 startup
pm2 save
```

### 4.3 Comandos Úteis do PM2

```bash
pm2 status          # Ver status dos processos
pm2 logs flowedu    # Ver logs em tempo real
pm2 monit           # Monitor interativo
pm2 restart flowedu # Reiniciar aplicação
pm2 reload flowedu  # Reload sem downtime
```

## 5. Configuração do Nginx

### 5.1 Copiar Configuração

```bash
sudo cp nginx.conf /etc/nginx/sites-available/flowedu
sudo ln -s /etc/nginx/sites-available/flowedu /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### 5.2 Editar Domínio

```bash
sudo nano /etc/nginx/sites-available/flowedu
# Substituir "seu-dominio.com.br" pelo seu domínio real
```

### 5.3 Testar e Reiniciar

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 6. Configuração SSL (Let's Encrypt)

### 6.1 Obter Certificado

```bash
sudo certbot --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br
```

### 6.2 Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Cron job para renovação automática (já configurado pelo certbot)
sudo systemctl status certbot.timer
```

## 7. Configuração de Backup

### 7.1 Configurar Script de Backup

```bash
# Editar variáveis no script
nano scripts/backup-database.sh

# Testar backup
./scripts/backup-database.sh
```

### 7.2 Agendar Backup Automático

```bash
# Editar crontab
crontab -e

# Adicionar linha para backup diário às 3h da manhã
0 3 * * * /var/www/flowedu/scripts/backup-database.sh >> /var/log/flowedu/backup.log 2>&1
```

## 8. Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH, HTTP e HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Verificar status
sudo ufw status
```

## 9. Monitoramento

### 9.1 Logs da Aplicação

```bash
# Logs do PM2
pm2 logs flowedu

# Logs do Nginx
sudo tail -f /var/log/nginx/flowedu_access.log
sudo tail -f /var/log/nginx/flowedu_error.log
```

### 9.2 Recursos do Sistema

```bash
htop                    # Monitor de processos
df -h                   # Espaço em disco
free -m                 # Memória
pm2 monit               # Monitor do PM2
```

## 10. Atualização da Aplicação

### 10.1 Script de Deploy

```bash
cd /var/www/flowedu
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pm2 reload flowedu
```

### 10.2 Deploy Automatizado (Opcional)

Configure o deploy automático no `ecosystem.config.js` e use:

```bash
pm2 deploy production
```

## Troubleshooting

### Aplicação não inicia

```bash
pm2 logs flowedu --lines 100
```

### Erro de conexão com banco

```bash
# Testar conexão
mysql -u flowedu -p -h localhost flowedu -e "SELECT 1"
```

### Nginx retorna 502

```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/flowedu_error.log
```

### SSL não funciona

```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal
```

## Checklist de Deploy

- [ ] Servidor atualizado
- [ ] Node.js, pnpm, PM2 instalados
- [ ] Nginx instalado e configurado
- [ ] Banco de dados configurado
- [ ] Índices aplicados
- [ ] Variáveis de ambiente configuradas
- [ ] Build executado com sucesso
- [ ] PM2 iniciado e configurado para startup
- [ ] SSL configurado
- [ ] Firewall configurado
- [ ] Backup automático configurado
- [ ] Domínio apontando para o servidor

---

**Autor:** Manus AI  
**Última atualização:** 19/01/2026
