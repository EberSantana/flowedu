# Guia Completo de Deploy - FlowEdu em VPS Ubuntu/Debian

Este guia detalha o processo completo para instalar e configurar o sistema FlowEdu em uma VPS com Ubuntu 22.04 ou Debian 12. O documento cobre desde a preparação inicial do servidor até a configuração de SSL e monitoramento.

---

## Sumário

1. [Requisitos Mínimos](#1-requisitos-mínimos)
2. [Preparação Inicial do Servidor](#2-preparação-inicial-do-servidor)
3. [Instalação do MySQL](#3-instalação-do-mysql)
4. [Instalação do Node.js](#4-instalação-do-nodejs)
5. [Configuração do Projeto](#5-configuração-do-projeto)
6. [Configuração do Nginx (Proxy Reverso)](#6-configuração-do-nginx-proxy-reverso)
7. [Configuração do SSL (HTTPS)](#7-configuração-do-ssl-https)
8. [Configuração do PM2 (Gerenciador de Processos)](#8-configuração-do-pm2-gerenciador-de-processos)
9. [Configuração do Firewall](#9-configuração-do-firewall)
10. [Backup Automático](#10-backup-automático)
11. [Monitoramento e Logs](#11-monitoramento-e-logs)
12. [Solução de Problemas](#12-solução-de-problemas)

---

## 1. Requisitos Mínimos

Antes de iniciar, certifique-se de que sua VPS atende aos seguintes requisitos:

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **CPU** | 1 vCPU | 2 vCPUs |
| **RAM** | 1 GB | 2 GB |
| **Armazenamento** | 20 GB SSD | 40 GB SSD |
| **Sistema Operacional** | Ubuntu 20.04+ ou Debian 11+ | Ubuntu 22.04 LTS |
| **Banda** | 1 TB/mês | Ilimitada |

Provedores recomendados: DigitalOcean, Vultr, Linode, Contabo, Hostinger VPS.

---

## 2. Preparação Inicial do Servidor

### 2.1 Conectar via SSH

```bash
ssh root@seu_ip_da_vps
```

### 2.2 Atualizar o Sistema

```bash
# Atualizar lista de pacotes
sudo apt update

# Atualizar pacotes instalados
sudo apt upgrade -y

# Instalar pacotes essenciais
sudo apt install -y curl wget git unzip software-properties-common
```

### 2.3 Criar Usuário para a Aplicação (Recomendado)

Por segurança, evite rodar a aplicação como root:

```bash
# Criar usuário
sudo adduser flowedu

# Adicionar ao grupo sudo
sudo usermod -aG sudo flowedu

# Mudar para o novo usuário
su - flowedu
```

### 2.4 Configurar Timezone

```bash
sudo timedatectl set-timezone America/Sao_Paulo
```

---

## 3. Instalação do MySQL

### 3.1 Instalar MySQL Server

```bash
# Instalar MySQL
sudo apt install -y mysql-server

# Verificar se está rodando
sudo systemctl status mysql
```

### 3.2 Configuração de Segurança

```bash
# Executar script de segurança
sudo mysql_secure_installation
```

Responda às perguntas:
- **VALIDATE PASSWORD COMPONENT**: `Y` (recomendado)
- **Nível de validação**: `1` (MEDIUM)
- **Definir senha root**: Digite uma senha forte
- **Remover usuários anônimos**: `Y`
- **Desabilitar login root remoto**: `Y`
- **Remover banco de teste**: `Y`
- **Recarregar privilégios**: `Y`

### 3.3 Criar Banco de Dados e Usuário

```bash
# Acessar MySQL como root
sudo mysql

# Dentro do MySQL, execute:
```

```sql
-- Criar banco de dados
CREATE DATABASE flowedu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário
CREATE USER 'flowedu_user'@'localhost' IDENTIFIED BY 'SuaSenhaSegura123!';

-- Conceder permissões
GRANT ALL PRIVILEGES ON flowedu_db.* TO 'flowedu_user'@'localhost';

-- Aplicar permissões
FLUSH PRIVILEGES;

-- Sair
EXIT;
```

### 3.4 Testar Conexão

```bash
mysql -u flowedu_user -p flowedu_db
# Digite a senha quando solicitado
# Se conectar, digite EXIT para sair
```

---

## 4. Instalação do Node.js

### 4.1 Instalar Node.js via NVM (Recomendado)

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Carregar NVM no terminal atual
source ~/.bashrc

# Verificar instalação
nvm --version

# Instalar Node.js 22 (LTS)
nvm install 22

# Definir como padrão
nvm alias default 22

# Verificar versões
node --version  # Deve mostrar v22.x.x
npm --version   # Deve mostrar 10.x.x
```

### 4.2 Instalar PNPM (Gerenciador de Pacotes)

```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Verificar instalação
pnpm --version
```

### 4.3 Instalar PM2 (Gerenciador de Processos)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Verificar instalação
pm2 --version
```

---

## 5. Configuração do Projeto

### 5.1 Clonar ou Transferir o Projeto

**Opção A: Via Git (se tiver repositório)**
```bash
cd /home/flowedu
git clone https://github.com/seu-usuario/flowedu.git
cd flowedu
```

**Opção B: Via SCP (transferir arquivos locais)**
```bash
# No seu computador local, execute:
scp -r ./teacher_schedule_system flowedu@seu_ip:/home/flowedu/flowedu
```

**Opção C: Via SFTP (usando FileZilla ou similar)**
- Conecte ao servidor via SFTP
- Transfira a pasta do projeto para `/home/flowedu/flowedu`

### 5.2 Criar Arquivo de Configuração (.env)

```bash
cd /home/flowedu/flowedu

# Criar arquivo .env
nano .env
```

Cole o seguinte conteúdo (ajuste os valores):

```env
# ============================================
# BANCO DE DADOS
# ============================================
DATABASE_URL=mysql://flowedu_user:SuaSenhaSegura123!@localhost:3306/flowedu_db

# ============================================
# SEGURANÇA
# ============================================
JWT_SECRET=cole_aqui_uma_chave_de_64_caracteres_gerada_aleatoriamente

# ============================================
# EMAIL (Resend)
# ============================================
RESEND_API_KEY=re_sua_api_key_do_resend
EMAIL_FROM=noreply@seudominio.com.br

# ============================================
# APLICAÇÃO
# ============================================
VITE_APP_TITLE=FlowEdu
VITE_APP_LOGO=/logo.png
VITE_APP_ID=flowedu-production
PORT=3000
NODE_ENV=production
```

Salve com `Ctrl+O`, `Enter`, `Ctrl+X`.

**Gerar JWT_SECRET:**
```bash
openssl rand -hex 32
```

### 5.3 Instalar Dependências

```bash
cd /home/flowedu/flowedu

# Instalar dependências
pnpm install
```

### 5.4 Executar Migrations do Banco

```bash
# Criar tabelas no banco de dados
pnpm db:push
```

### 5.5 Fazer Build de Produção

```bash
# Compilar aplicação
pnpm build
```

### 5.6 Testar Aplicação

```bash
# Iniciar em modo de teste
pnpm start

# Acesse http://seu_ip:3000 no navegador
# Ctrl+C para parar
```

---

## 6. Configuração do Nginx (Proxy Reverso)

### 6.1 Instalar Nginx

```bash
sudo apt install -y nginx

# Verificar status
sudo systemctl status nginx
```

### 6.2 Criar Configuração do Site

```bash
sudo nano /etc/nginx/sites-available/flowedu
```

Cole o seguinte conteúdo:

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    # Logs
    access_log /var/log/nginx/flowedu_access.log;
    error_log /var/log/nginx/flowedu_error.log;

    # Tamanho máximo de upload (100MB)
    client_max_body_size 100M;

    # Proxy para a aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Cache para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.3 Ativar o Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/flowedu /etc/nginx/sites-enabled/

# Remover site padrão (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 7. Configuração do SSL (HTTPS)

### 7.1 Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2 Obter Certificado SSL

```bash
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

Siga as instruções:
- Digite seu email
- Aceite os termos
- Escolha redirecionar HTTP para HTTPS (recomendado)

### 7.3 Renovação Automática

O Certbot configura renovação automática. Para testar:

```bash
sudo certbot renew --dry-run
```

---

## 8. Configuração do PM2 (Gerenciador de Processos)

### 8.1 Criar Arquivo de Configuração PM2

```bash
cd /home/flowedu/flowedu
nano ecosystem.config.js
```

Cole o conteúdo:

```javascript
module.exports = {
  apps: [{
    name: 'flowedu',
    script: 'pnpm',
    args: 'start',
    cwd: '/home/flowedu/flowedu',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/flowedu/logs/flowedu-error.log',
    out_file: '/home/flowedu/logs/flowedu-out.log',
    log_file: '/home/flowedu/logs/flowedu-combined.log',
    time: true
  }]
};
```

### 8.2 Criar Diretório de Logs

```bash
mkdir -p /home/flowedu/logs
```

### 8.3 Iniciar Aplicação com PM2

```bash
cd /home/flowedu/flowedu

# Iniciar aplicação
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs em tempo real
pm2 logs flowedu
```

### 8.4 Configurar Inicialização Automática

```bash
# Gerar script de startup
pm2 startup

# Executar o comando que aparecer (copie e cole)
# Exemplo: sudo env PATH=$PATH:/home/flowedu/.nvm/versions/node/v22.x.x/bin pm2 startup systemd -u flowedu --hp /home/flowedu

# Salvar lista de processos
pm2 save
```

### 8.5 Comandos Úteis do PM2

| Comando | Descrição |
|---------|-----------|
| `pm2 status` | Ver status dos processos |
| `pm2 logs flowedu` | Ver logs em tempo real |
| `pm2 restart flowedu` | Reiniciar aplicação |
| `pm2 stop flowedu` | Parar aplicação |
| `pm2 delete flowedu` | Remover do PM2 |
| `pm2 monit` | Monitor interativo |

---

## 9. Configuração do Firewall

### 9.1 Configurar UFW

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH (importante!)
sudo ufw allow ssh

# Permitir HTTP e HTTPS
sudo ufw allow 'Nginx Full'

# Verificar regras
sudo ufw status
```

### 9.2 Resultado Esperado

```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
22/tcp (v6)                ALLOW       Anywhere (v6)
Nginx Full (v6)            ALLOW       Anywhere (v6)
```

---

## 10. Backup Automático

### 10.1 Criar Script de Backup

```bash
sudo nano /home/flowedu/backup.sh
```

Cole o conteúdo:

```bash
#!/bin/bash

# Configurações
BACKUP_DIR="/home/flowedu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_USER="flowedu_user"
DB_PASS="SuaSenhaSegura123!"
DB_NAME="flowedu_db"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Compactar
gzip $BACKUP_DIR/db_$DATE.sql

# Remover backups com mais de 7 dias
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup concluído: db_$DATE.sql.gz"
```

### 10.2 Configurar Permissões

```bash
chmod +x /home/flowedu/backup.sh
mkdir -p /home/flowedu/backups
```

### 10.3 Agendar Backup Diário (Cron)

```bash
crontab -e
```

Adicione a linha:

```
0 3 * * * /home/flowedu/backup.sh >> /home/flowedu/logs/backup.log 2>&1
```

Isso executa o backup todos os dias às 3h da manhã.

---

## 11. Monitoramento e Logs

### 11.1 Logs da Aplicação

```bash
# Logs do PM2
pm2 logs flowedu

# Logs de erro
tail -f /home/flowedu/logs/flowedu-error.log

# Logs de saída
tail -f /home/flowedu/logs/flowedu-out.log
```

### 11.2 Logs do Nginx

```bash
# Logs de acesso
sudo tail -f /var/log/nginx/flowedu_access.log

# Logs de erro
sudo tail -f /var/log/nginx/flowedu_error.log
```

### 11.3 Logs do MySQL

```bash
sudo tail -f /var/log/mysql/error.log
```

### 11.4 Monitoramento de Recursos

```bash
# Uso de CPU e memória
htop

# Espaço em disco
df -h

# Uso de memória
free -h
```

---

## 12. Solução de Problemas

### Problema: Aplicação não inicia

```bash
# Verificar logs
pm2 logs flowedu --lines 100

# Verificar se a porta está em uso
sudo lsof -i :3000

# Reiniciar aplicação
pm2 restart flowedu
```

### Problema: Erro de conexão com banco de dados

```bash
# Testar conexão
mysql -u flowedu_user -p flowedu_db

# Verificar se MySQL está rodando
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql
```

### Problema: Nginx retorna 502 Bad Gateway

```bash
# Verificar se a aplicação está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/flowedu_error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema: Certificado SSL expirado

```bash
# Renovar certificado
sudo certbot renew

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema: Falta de memória

```bash
# Verificar uso de memória
free -h

# Criar swap (se não existir)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Checklist Final

Antes de considerar o deploy concluído, verifique:

- [ ] MySQL instalado e configurado
- [ ] Node.js 22 instalado via NVM
- [ ] Projeto clonado/transferido
- [ ] Arquivo .env configurado
- [ ] Dependências instaladas (`pnpm install`)
- [ ] Migrations executadas (`pnpm db:push`)
- [ ] Build de produção (`pnpm build`)
- [ ] Nginx configurado como proxy reverso
- [ ] SSL/HTTPS configurado com Certbot
- [ ] PM2 configurado com startup automático
- [ ] Firewall configurado (UFW)
- [ ] Backup automático configurado
- [ ] Teste de acesso via navegador

---

## Comandos de Manutenção Rápida

| Ação | Comando |
|------|---------|
| Reiniciar aplicação | `pm2 restart flowedu` |
| Ver logs | `pm2 logs flowedu` |
| Reiniciar Nginx | `sudo systemctl restart nginx` |
| Reiniciar MySQL | `sudo systemctl restart mysql` |
| Atualizar aplicação | `git pull && pnpm install && pnpm build && pm2 restart flowedu` |
| Verificar espaço | `df -h` |
| Verificar memória | `free -h` |
| Backup manual | `/home/flowedu/backup.sh` |

---

**Documento criado por Manus AI**  
*Última atualização: Janeiro 2026*
