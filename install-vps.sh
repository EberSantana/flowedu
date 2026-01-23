#!/bin/bash

################################################################################
# Script de Instalacao Automatizado do FlowEdu para VPS
# Versao: 1.0
# Autor: Manus AI
# Data: 22/01/2026
#
# Este script automatiza a instalacao completa do FlowEdu em uma VPS Ubuntu
################################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "Este script precisa ser executado como root"
        print_info "Execute: sudo bash install-vps.sh"
        exit 1
    fi
}

check_os() {
    if [ ! -f /etc/os-release ]; then
        print_error "Sistema operacional nao suportado"
        exit 1
    fi
    
    . /etc/os-release
    
    if [ "$ID" != "ubuntu" ]; then
        print_error "Este script foi feito para Ubuntu"
        print_info "Sistema detectado: $ID"
        exit 1
    fi
    
    print_success "Sistema operacional: Ubuntu $VERSION"
}

show_banner() {
    clear
    echo -e "${BLUE}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗██╗      ██████╗ ██╗    ██╗███████╗██████╗ ██╗   ██╗║
║   ██╔════╝██║     ██╔═══██╗██║    ██║██╔════╝██╔══██╗██║   ██║║
║   █████╗  ██║     ██║   ██║██║ █╗ ██║█████╗  ██║  ██║██║   ██║║
║   ██╔══╝  ██║     ██║   ██║██║███╗██║██╔══╝  ██║  ██║██║   ██║║
║   ██║     ███████╗╚██████╔╝╚███╔███╔╝███████╗██████╔╝╚██████╔╝║
║   ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝ ╚══════╝╚═════╝  ╚═════╝ ║
║                                                               ║
║            Script de Instalacao Automatizado v1.0            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
    print_info "Este script vai instalar automaticamente:"
    echo "  • Node.js 20.x"
    echo "  • PM2 (gerenciador de processos)"
    echo "  • Nginx (servidor web)"
    echo "  • FlowEdu (codigo do GitHub)"
    echo "  • Configuracoes de producao"
    echo ""
    print_warning "Tempo estimado: 10-15 minutos"
    echo ""
}

collect_info() {
    print_header "CONFIGURACAO INICIAL"
    
    read -p "Digite seu dominio (ex: flowedu.com.br): " DOMAIN
    while [ -z "$DOMAIN" ]; do
        print_error "Dominio nao pode ficar vazio"
        read -p "Digite seu dominio: " DOMAIN
    done
    
    read -p "Digite seu e-mail (para certificado SSL): " EMAIL
    while [ -z "$EMAIL" ]; do
        print_error "E-mail nao pode ficar vazio"
        read -p "Digite seu e-mail: " EMAIL
    done
    
    echo ""
    print_info "Cole a CONNECTION STRING do TiDB Cloud"
    print_info "Exemplo: mysql://usuario.root:senha@gateway01.sa-east-1.prod.aws.tidbcloud.com:4000/test"
    read -p "DATABASE_URL: " DATABASE_URL
    while [ -z "$DATABASE_URL" ]; do
        print_error "DATABASE_URL nao pode ficar vazio"
        read -p "DATABASE_URL: " DATABASE_URL
    done
    
    JWT_SECRET=$(openssl rand -base64 32)
    
    echo ""
    print_header "CONFIRMACAO"
    echo "Dominio: $DOMAIN"
    echo "E-mail: $EMAIL"
    echo "DATABASE_URL: ${DATABASE_URL:0:50}..."
    echo "JWT_SECRET: (gerado automaticamente)"
    echo ""
    read -p "Tudo correto? (s/n): " CONFIRM
    
    if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
        print_error "Instalacao cancelada"
        exit 1
    fi
}

update_system() {
    print_header "ETAPA 1/8: Atualizando Sistema"
    
    print_info "Atualizando lista de pacotes..."
    apt update -qq
    
    print_info "Instalando atualizacoes..."
    DEBIAN_FRONTEND=noninteractive apt upgrade -y -qq
    
    print_info "Instalando dependencias basicas..."
    apt install -y -qq curl wget git build-essential
    
    print_success "Sistema atualizado"
}

install_nodejs() {
    print_header "ETAPA 2/8: Instalando Node.js"
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_warning "Node.js ja instalado: $NODE_VERSION"
        read -p "Deseja reinstalar? (s/n): " REINSTALL
        if [ "$REINSTALL" != "s" ] && [ "$REINSTALL" != "S" ]; then
            print_info "Pulando instalacao do Node.js"
            return
        fi
    fi
    
    print_info "Baixando instalador do Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null 2>&1
    
    print_info "Instalando Node.js..."
    apt install -y -qq nodejs
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    print_success "Node.js instalado: $NODE_VERSION"
    print_success "npm instalado: $NPM_VERSION"
}

install_pm2() {
    print_header "ETAPA 3/8: Instalando PM2"
    
    if command_exists pm2; then
        print_warning "PM2 ja instalado"
        PM2_VERSION=$(pm2 --version)
        print_info "Versao atual: $PM2_VERSION"
    else
        print_info "Instalando PM2..."
        npm install -g pm2 >/dev/null 2>&1
        
        print_info "Configurando PM2 para iniciar automaticamente..."
        pm2 startup systemd -u root --hp /root >/dev/null 2>&1
        
        PM2_VERSION=$(pm2 --version)
        print_success "PM2 instalado: $PM2_VERSION"
    fi
}

install_nginx() {
    print_header "ETAPA 4/8: Instalando Nginx"
    
    if command_exists nginx; then
        print_warning "Nginx ja instalado"
    else
        print_info "Instalando Nginx..."
        apt install -y -qq nginx
        
        print_info "Iniciando Nginx..."
        systemctl start nginx
        systemctl enable nginx >/dev/null 2>&1
        
        print_success "Nginx instalado e iniciado"
    fi
}

download_flowedu() {
    print_header "ETAPA 5/8: Baixando FlowEdu"
    
    INSTALL_DIR="/home/flowedu"
    
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Diretorio $INSTALL_DIR ja existe"
        read -p "Deseja sobrescrever? (s/n): " OVERWRITE
        if [ "$OVERWRITE" == "s" ] || [ "$OVERWRITE" == "S" ]; then
            print_info "Removendo diretorio antigo..."
            rm -rf "$INSTALL_DIR"
        else
            print_info "Usando diretorio existente"
            return
        fi
    fi
    
    print_info "Clonando repositorio do GitHub..."
    git clone -q https://github.com/EberSantana/flowedu.git "$INSTALL_DIR"
    
    print_success "Codigo baixado em $INSTALL_DIR"
}

configure_env() {
    print_header "ETAPA 6/8: Configurando Variaveis de Ambiente"
    
    INSTALL_DIR="/home/flowedu"
    ENV_FILE="$INSTALL_DIR/.env"
    
    print_info "Criando arquivo .env..."
    
    cat > "$ENV_FILE" << ENVEOF
# Banco de Dados
DATABASE_URL="$DATABASE_URL"

# Seguranca
JWT_SECRET="$JWT_SECRET"

# Servidor
NODE_ENV="production"
PORT=3000

# OAuth Manus
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"

# E-mail
EMAIL_FROM="noreply@$DOMAIN"

# App
VITE_APP_TITLE="FlowEdu"
VITE_APP_LOGO=""
ENVEOF
    
    print_success "Variaveis de ambiente configuradas"
}

build_flowedu() {
    print_header "ETAPA 7/8: Instalando Dependencias e Fazendo Build"
    
    INSTALL_DIR="/home/flowedu"
    cd "$INSTALL_DIR"
    
    print_info "Instalando dependencias (isso pode demorar 3-5 minutos)..."
    npm install --production=false >/dev/null 2>&1
    
    print_info "Fazendo build do projeto..."
    npm run build >/dev/null 2>&1
    
    print_info "Aplicando schema do banco de dados..."
    npm run db:push >/dev/null 2>&1 || print_warning "Erro ao aplicar schema (pode ser normal se ja existir)"
    
    print_success "Build concluido"
}

configure_nginx_ssl() {
    print_header "ETAPA 8/8: Configurando Nginx e SSL"
    
    NGINX_CONF="/etc/nginx/sites-available/flowedu"
    
    print_info "Criando configuracao do Nginx..."
    
    cat > "$NGINX_CONF" << 'NGINXEOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF
    
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$NGINX_CONF"
    
    print_info "Ativando configuracao..."
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/flowedu
    
    print_info "Removendo configuracao padrao..."
    rm -f /etc/nginx/sites-enabled/default
    
    print_info "Testando configuracao do Nginx..."
    nginx -t >/dev/null 2>&1
    
    print_info "Recarregando Nginx..."
    systemctl reload nginx
    
    print_success "Nginx configurado"
    
    print_info "Instalando Certbot..."
    apt install -y -qq certbot python3-certbot-nginx
    
    print_info "Configurando SSL (pode demorar 1-2 minutos)..."
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        print_success "SSL configurado com sucesso"
    else
        print_warning "Erro ao configurar SSL (pode ser problema de DNS)"
        print_info "Execute manualmente depois: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    fi
}

start_flowedu() {
    print_header "INICIANDO FLOWEDU"
    
    INSTALL_DIR="/home/flowedu"
    cd "$INSTALL_DIR"
    
    print_info "Parando processos antigos (se existirem)..."
    pm2 delete flowedu >/dev/null 2>&1 || true
    
    print_info "Iniciando FlowEdu com PM2..."
    pm2 start ecosystem.config.js >/dev/null 2>&1
    
    print_info "Salvando configuracao do PM2..."
    pm2 save >/dev/null 2>&1
    
    sleep 3
    
    PM2_STATUS=$(pm2 jlist | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ "$PM2_STATUS" == "online" ]; then
        print_success "FlowEdu iniciado com sucesso"
    else
        print_error "Erro ao iniciar FlowEdu"
        print_info "Veja os logs: pm2 logs flowedu"
        exit 1
    fi
}

show_summary() {
    print_header "INSTALACAO CONCLUIDA"
    
    echo -e "${GREEN}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║              ✓ INSTALACAO CONCLUIDA COM SUCESSO!         ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}\n"
    
    print_success "FlowEdu instalado e rodando"
    echo ""
    echo "🌐 Acesse seu sistema em:"
    echo "   https://$DOMAIN"
    echo ""
    echo "📊 Comandos uteis:"
    echo "   pm2 status          - Ver status do sistema"
    echo "   pm2 logs flowedu    - Ver logs"
    echo "   pm2 restart flowedu - Reiniciar sistema"
    echo "   pm2 stop flowedu    - Parar sistema"
    echo ""
    echo "📁 Diretorio de instalacao:"
    echo "   /home/flowedu"
    echo ""
    echo "📝 Arquivo de configuracao:"
    echo "   /home/flowedu/.env"
    echo ""
    print_info "Aguarde 2-3 minutos para o sistema inicializar completamente"
    echo ""
}

main() {
    show_banner
    check_root
    check_os
    collect_info
    
    update_system
    install_nodejs
    install_pm2
    install_nginx
    download_flowedu
    configure_env
    build_flowedu
    configure_nginx_ssl
    start_flowedu
    
    show_summary
}

main "$@"
