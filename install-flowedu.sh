#!/bin/bash

#############################################
#  SCRIPT DE INSTALAÇÃO DO FLOWEDU NA VPS   #
#  Versão: 2.0                              #
#  Data: Fevereiro 2026                     #
#############################################

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
step() { echo ""; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${CYAN}📌 $1${NC}"; echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║     🎓 INSTALAÇÃO DO FLOWEDU NA VPS                        ║${NC}"
echo -e "${GREEN}║     Versão 2.0 - Instalação Completa do Zero               ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Variáveis
APP_DIR="/root/flowedu"
DOMAIN="flowedu.app"

# ===== VERIFICAÇÕES =====
step "PASSO 1/10: Verificações Iniciais"

if [ "$EUID" -ne 0 ]; then
  fail "Execute como root: sudo bash install-flowedu.sh"
fi
ok "Executando como root"

# Verificar memória e criar swap se necessário
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
info "Memória: ${TOTAL_MEM}MB"
if [ "$TOTAL_MEM" -lt 1024 ] && [ ! -f /swapfile ]; then
  info "Criando swap de 2GB..."
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ok "Swap de 2GB criado"
fi

# ===== ATUALIZAR SISTEMA =====
step "PASSO 2/10: Atualizando Sistema"

info "Atualizando pacotes (pode demorar 1-2 min)..."
apt-get update -y > /dev/null 2>&1
apt-get upgrade -y > /dev/null 2>&1
ok "Sistema atualizado"

info "Instalando pacotes essenciais..."
apt-get install -y curl wget git build-essential nginx certbot python3-certbot-nginx jq > /dev/null 2>&1
ok "Pacotes instalados"

# ===== INSTALAR NODE.JS =====
step "PASSO 3/10: Instalando Node.js"

if command -v node &> /dev/null; then
  CURRENT_NODE=$(node --version | cut -d. -f1 | tr -d 'v')
  if [ "$CURRENT_NODE" -ge 20 ]; then
    ok "Node.js $(node --version) já instalado"
  else
    info "Atualizando Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
    ok "Node.js $(node --version) instalado"
  fi
else
  info "Instalando Node.js v22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
  apt-get install -y nodejs > /dev/null 2>&1
  ok "Node.js $(node --version) instalado"
fi

# PM2
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2 > /dev/null 2>&1
fi
ok "PM2 instalado"

# ===== PARAR SERVIÇOS =====
step "PASSO 4/10: Parando Serviços Existentes"

pm2 delete flowedu > /dev/null 2>&1 || true
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
ok "Serviços anteriores parados"

# ===== PREPARAR DIRETÓRIO =====
step "PASSO 5/10: Preparando Diretório"

# Backup se existir
if [ -d "$APP_DIR" ]; then
  BACKUP_NAME="flowedu-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
  info "Fazendo backup em /root/$BACKUP_NAME..."
  tar -czf "/root/$BACKUP_NAME" -C /root flowedu/ 2>/dev/null || true
  ok "Backup criado"
  rm -rf "$APP_DIR"
fi

mkdir -p "$APP_DIR"

# Procurar arquivo tar.gz
TAR_FILE=$(ls /root/flowedu-completo-*.tar.gz 2>/dev/null | sort -r | head -1)

if [ -z "$TAR_FILE" ]; then
  fail "Arquivo de instalação não encontrado em /root/!
  
  Você precisa enviar o arquivo primeiro.
  No seu computador, execute:
    scp flowedu-completo-*.tar.gz root@76.13.67.5:~/
  
  Depois execute este script novamente:
    bash install-flowedu.sh"
fi

info "Extraindo: $(basename $TAR_FILE)"
tar -xzf "$TAR_FILE" -C "$APP_DIR"
ok "Projeto extraído"

# ===== CONFIGURAR PARA PRODUÇÃO =====
step "PASSO 6/10: Configurando para Produção"

cd "$APP_DIR"

# Criar vite.config.ts limpo (sem plugins do Manus)
info "Criando configuração de build para produção..."
cat > vite.config.ts << 'VITEEOF'
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: [
      'react', 'react-dom', 'react/jsx-runtime',
      'react/jsx-dev-runtime', '@tanstack/react-query', '@trpc/react-query',
    ],
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          trpc: ['@trpc/client', '@trpc/react-query'],
          query: ['@tanstack/react-query'],
        },
      },
    },
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  },
});
VITEEOF
ok "Configuração de build criada"

# Verificar/criar .env
if [ ! -f .env ]; then
  warn "Arquivo .env não encontrado! Criando template..."
  cat > .env << 'ENVEOF'
# ===== CONFIGURAÇÃO DO FLOWEDU =====
# PREENCHA TODOS OS VALORES ABAIXO

# Banco de Dados
DATABASE_URL=mysql://USUARIO:SENHA@HOST:PORTA/BANCO?ssl={"rejectUnauthorized":true}

# Segurança
JWT_SECRET=flowedu-secret-mude-isso-2026
NODE_ENV=production
PORT=3000

# OAuth Manus
VITE_APP_ID=seu-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://id.manus.im
OWNER_OPEN_ID=seu-owner-id

# APIs Manus
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua-frontend-api-key

# URL
VITE_APP_URL=https://flowedu.app
FRONTEND_URL=https://flowedu.app
ENVEOF
  warn "ATENÇÃO: Edite o .env depois com: nano /root/flowedu/.env"
else
  ok "Arquivo .env encontrado"
fi

# ===== INSTALAR E BUILD =====
step "PASSO 7/10: Instalando Dependências e Build"

info "Instalando dependências (2-5 min)..."
npm install --legacy-peer-deps 2>&1 | tail -3
ok "Dependências instaladas"

info "Fazendo build de produção (1-3 min)..."
rm -rf dist/

# Build cliente (Vite)
npx vite build 2>&1 | tail -5

# Build servidor (esbuild)
npx esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist 2>&1 | tail -3

# Verificar
if [ -f "dist/index.js" ] && [ -d "dist/public" ]; then
  ok "Build concluído!"
  info "Cliente: $(find dist/public/assets -name '*.js' 2>/dev/null | wc -l) arquivos JS"
  info "Servidor: dist/index.js ($(du -h dist/index.js | cut -f1))"
else
  fail "Build falhou! Verifique os erros acima."
fi

# ===== CONFIGURAR NGINX =====
step "PASSO 8/10: Configurando Nginx"

cat > /etc/nginx/sites-available/flowedu << NGINXEOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 50M;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/flowedu /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t 2>&1 | grep -q "successful" && ok "Nginx configurado" || fail "Erro na configuração do Nginx"
systemctl restart nginx
ok "Nginx reiniciado"

# ===== FIREWALL =====
step "PASSO 9/10: Configurando Firewall"

ufw allow 22/tcp > /dev/null 2>&1
ok "Porta 22 (SSH) liberada"
ufw allow 80/tcp > /dev/null 2>&1
ok "Porta 80 (HTTP) liberada"
ufw allow 443/tcp > /dev/null 2>&1
ok "Porta 443 (HTTPS) liberada"
echo "y" | ufw enable > /dev/null 2>&1
ok "Firewall ativado"

# ===== INICIAR APLICAÇÃO =====
step "PASSO 10/10: Iniciando FlowEdu"

cd "$APP_DIR"
pm2 start npm --name flowedu -- start
pm2 save > /dev/null 2>&1
pm2 startup > /dev/null 2>&1 || true
pm2 save > /dev/null 2>&1

info "Aguardando servidor iniciar (10 segundos)..."
sleep 10

# Verificar
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>&1)
if [ "$HTTP_CODE" = "200" ]; then
  ok "Servidor respondendo (HTTP 200)"
else
  warn "Servidor retornou HTTP $HTTP_CODE - verifique os logs: pm2 logs flowedu"
fi

# ===== RESUMO =====
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  📁 Diretório:  ${APP_DIR}"
echo -e "  🌐 Site:       http://${DOMAIN}"
echo -e "  🔧 Node.js:    $(node --version)"
echo ""
echo -e "${YELLOW}⚠️  PRÓXIMOS PASSOS:${NC}"
echo ""
echo -e "  1. Editar .env:     ${CYAN}nano ${APP_DIR}/.env${NC}"
echo -e "  2. Reiniciar:       ${CYAN}pm2 restart flowedu${NC}"
echo -e "  3. Instalar SSL:    ${CYAN}certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email seu@email.com --redirect${NC}"
echo -e "  4. Testar:          ${CYAN}https://${DOMAIN}${NC}"
echo ""
echo -e "${BLUE}📌 COMANDOS ÚTEIS:${NC}"
echo -e "  Status:    ${CYAN}pm2 status${NC}"
echo -e "  Logs:      ${CYAN}pm2 logs flowedu${NC}"
echo -e "  Reiniciar: ${CYAN}pm2 restart flowedu${NC}"
echo ""
