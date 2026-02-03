#!/bin/bash

################################################################################
# Script de Instalação Automática do FlowEdu - VPS Ubuntu 22.04
# Versão: 1.0
# Data: 03/02/2026
# 
# Este script instala TUDO que você precisa para rodar o FlowEdu do zero:
# - Node.js 22
# - pnpm (gerenciador de pacotes)
# - PM2 (gerenciador de processos)
# - Nginx (servidor web)
# - Certbot (certificados SSL)
# - Git
# - Configuração completa do sistema
################################################################################

set -e  # Para o script se houver erro

# Cores para mensagens
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sem cor

# Função para imprimir mensagens coloridas
print_step() {
    echo -e "${BLUE}==>${NC} ${GREEN}$1${NC}"
}

print_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

################################################################################
# PASSO 1: Verificações Iniciais
################################################################################

print_step "Verificando sistema operacional..."

if [ "$(id -u)" != "0" ]; then
   print_error "Este script precisa ser executado como root (sudo)"
   exit 1
fi

if [ ! -f /etc/lsb-release ]; then
    print_error "Este script foi feito para Ubuntu. Sistema não suportado."
    exit 1
fi

print_success "Sistema compatível!"

################################################################################
# PASSO 2: Coletar Informações do Usuário
################################################################################

echo ""
print_step "Vamos coletar algumas informações necessárias..."
echo ""

# Domínio
read -p "Digite seu domínio (ex: flowedu.app): " DOMAIN
if [ -z "$DOMAIN" ]; then
    print_error "Domínio não pode ser vazio!"
    exit 1
fi

# Email para SSL
read -p "Digite seu email (para certificado SSL): " EMAIL
if [ -z "$EMAIL" ]; then
    print_error "Email não pode ser vazio!"
    exit 1
fi

# URL do banco de dados
read -p "Digite a URL do banco de dados MySQL/TiDB: " DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    print_error "URL do banco de dados não pode ser vazia!"
    exit 1
fi

# Confirmar informações
echo ""
print_warning "Confirme as informações:"
echo "  Domínio: $DOMAIN"
echo "  Email: $EMAIL"
echo "  Banco de Dados: ${DATABASE_URL:0:30}..."
echo ""
read -p "Está correto? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    print_error "Instalação cancelada pelo usuário"
    exit 1
fi

################################################################################
# PASSO 3: Atualizar Sistema
################################################################################

print_step "Atualizando sistema operacional..."
apt update -y
apt upgrade -y
print_success "Sistema atualizado!"

################################################################################
# PASSO 4: Instalar Dependências Básicas
################################################################################

print_step "Instalando dependências básicas..."
apt install -y curl wget git build-essential
print_success "Dependências instaladas!"

################################################################################
# PASSO 5: Instalar Node.js 22
################################################################################

print_step "Instalando Node.js 22..."

# Remover versões antigas do Node.js (se existirem)
apt remove -y nodejs npm || true

# Adicionar repositório do Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -

# Instalar Node.js
apt install -y nodejs

# Verificar instalação
NODE_VERSION=$(node --version)
print_success "Node.js instalado: $NODE_VERSION"

################################################################################
# PASSO 6: Instalar pnpm
################################################################################

print_step "Instalando pnpm..."
npm install -g pnpm
PNPM_VERSION=$(pnpm --version)
print_success "pnpm instalado: $PNPM_VERSION"

################################################################################
# PASSO 7: Instalar PM2
################################################################################

print_step "Instalando PM2 (gerenciador de processos)..."
npm install -g pm2
pm2 startup systemd -u root --hp /root
print_success "PM2 instalado!"

################################################################################
# PASSO 8: Instalar Nginx
################################################################################

print_step "Instalando Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
print_success "Nginx instalado e rodando!"

################################################################################
# PASSO 9: Instalar Certbot (SSL)
################################################################################

print_step "Instalando Certbot para certificados SSL..."
apt install -y certbot python3-certbot-nginx
print_success "Certbot instalado!"

################################################################################
# PASSO 10: Clonar Repositório do GitHub
################################################################################

print_step "Clonando repositório do FlowEdu..."

# Criar diretório /home/app se não existir
mkdir -p /home/app

# Se já existir, fazer backup
if [ -d "/home/app/.git" ]; then
    print_warning "Repositório já existe. Fazendo backup..."
    mv /home/app /home/app.backup.$(date +%Y%m%d_%H%M%S)
    mkdir -p /home/app
fi

cd /home/app
git clone https://github.com/EberSantana/flowedu.git .

print_success "Repositório clonado!"

################################################################################
# PASSO 11: Configurar Variáveis de Ambiente
################################################################################

print_step "Configurando variáveis de ambiente..."

cat > /home/app/.env << EOF
# Banco de Dados
DATABASE_URL="$DATABASE_URL"

# Servidor
NODE_ENV=production
PORT=3000

# JWT Secret (gerado automaticamente)
JWT_SECRET=$(openssl rand -base64 32)

# OAuth Manus (usar valores padrão ou configurar depois)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=seu_app_id_aqui

# Domínio
VITE_APP_TITLE=FlowEdu
DOMAIN=$DOMAIN
EOF

print_success "Variáveis de ambiente configuradas!"
print_warning "IMPORTANTE: Edite /home/app/.env e configure VITE_APP_ID com seu App ID do Manus"

################################################################################
# PASSO 12: Instalar Dependências do Projeto
################################################################################

print_step "Instalando dependências do projeto (pode demorar 2-3 minutos)..."
cd /home/app
pnpm install
print_success "Dependências instaladas!"

################################################################################
# PASSO 13: Build do Projeto
################################################################################

print_step "Fazendo build do projeto (pode demorar 1-2 minutos)..."
pnpm build
print_success "Build concluído!"

################################################################################
# PASSO 14: Configurar Nginx
################################################################################

print_step "Configurando Nginx..."

cat > /etc/nginx/sites-available/flowedu << 'NGINX_EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    # Redirecionar HTTP para HTTPS (será configurado após SSL)
    # return 301 https://$server_name$request_uri;

    # Temporariamente, fazer proxy para Node.js
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
    }
}
NGINX_EOF

# Substituir placeholder pelo domínio real
sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/flowedu

# Ativar site
ln -sf /etc/nginx/sites-available/flowedu /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Recarregar Nginx
systemctl reload nginx

print_success "Nginx configurado!"

################################################################################
# PASSO 15: Iniciar Aplicação com PM2
################################################################################

print_step "Iniciando aplicação com PM2..."

cd /home/app

# Parar processo antigo se existir
pm2 delete flowedu 2>/dev/null || true

# Iniciar aplicação
pm2 start pnpm --name flowedu -- start

# Salvar lista de processos
pm2 save

print_success "Aplicação iniciada!"

################################################################################
# PASSO 16: Configurar SSL com Certbot
################################################################################

print_step "Configurando certificado SSL..."
print_warning "Certifique-se de que o domínio $DOMAIN está apontando para este servidor!"

read -p "Domínio já está apontando para este servidor? (s/n): " DNS_READY

if [ "$DNS_READY" = "s" ] || [ "$DNS_READY" = "S" ]; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL
    print_success "Certificado SSL configurado!"
else
    print_warning "Pule a configuração SSL por enquanto. Execute depois:"
    echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

################################################################################
# PASSO 17: Configurar Renovação Automática SSL
################################################################################

print_step "Configurando renovação automática de SSL..."
systemctl enable certbot.timer
systemctl start certbot.timer
print_success "Renovação automática configurada!"

################################################################################
# PASSO 18: Verificações Finais
################################################################################

print_step "Verificando instalação..."

echo ""
echo "==================================================================="
echo "                   INSTALAÇÃO CONCLUÍDA! 🎉                        "
echo "==================================================================="
echo ""
echo "✅ Node.js: $(node --version)"
echo "✅ pnpm: $(pnpm --version)"
echo "✅ PM2: Instalado"
echo "✅ Nginx: Rodando"
echo "✅ Aplicação: Rodando na porta 3000"
echo ""
echo "🌐 Acesse seu site em: http://$DOMAIN"
echo ""
echo "==================================================================="
echo "                   PRÓXIMOS PASSOS                                 "
echo "==================================================================="
echo ""
echo "1. Edite o arquivo .env e configure VITE_APP_ID:"
echo "   sudo nano /home/app/.env"
echo ""
echo "2. Reinicie a aplicação:"
echo "   cd /home/app && pm2 restart flowedu"
echo ""
echo "3. Veja os logs da aplicação:"
echo "   pm2 logs flowedu"
echo ""
echo "4. Se o SSL não foi configurado, execute:"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "==================================================================="
echo "                   COMANDOS ÚTEIS                                  "
echo "==================================================================="
echo ""
echo "Ver status:        pm2 status"
echo "Ver logs:          pm2 logs flowedu"
echo "Reiniciar:         pm2 restart flowedu"
echo "Parar:             pm2 stop flowedu"
echo "Atualizar código:  cd /home/app && git pull && pnpm install && pnpm build && pm2 restart flowedu"
echo ""
echo "==================================================================="
echo ""

print_success "Instalação completa! Verifique o site em http://$DOMAIN"
