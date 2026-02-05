#!/bin/bash

################################################################################
# Script de Verificação de Instalação do FlowEdu
# Versão: 1.0
# Data: 03/02/2026
# 
# Este script verifica se TUDO foi instalado corretamente:
# - Node.js, pnpm, PM2, Nginx, Certbot, Git
# - Aplicação rodando
# - Banco de dados acessível
# - SSL configurado
# - Portas abertas
################################################################################

# Cores para mensagens
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sem cor

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

# Função para imprimir resultado
print_check() {
    local status=$1
    local message=$2
    
    if [ "$status" = "OK" ]; then
        echo -e "${GREEN}✓${NC} $message"
        ((PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $message"
        ((FAILED++))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
        ((WARNINGS++))
    else
        echo -e "${BLUE}ℹ${NC} $message"
    fi
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

################################################################################
# INÍCIO DA VERIFICAÇÃO
################################################################################

clear
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}║       🔍 VERIFICAÇÃO DE INSTALAÇÃO DO FLOWEDU 🔍              ║${NC}"
echo -e "${GREEN}║                                                               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

################################################################################
# 1. VERIFICAR SISTEMA OPERACIONAL
################################################################################

print_header "1. SISTEMA OPERACIONAL"

if [ -f /etc/lsb-release ]; then
    OS_NAME=$(grep DISTRIB_DESCRIPTION /etc/lsb-release | cut -d'"' -f2)
    print_check "OK" "Sistema: $OS_NAME"
else
    print_check "WARN" "Não foi possível identificar o sistema operacional"
fi

KERNEL=$(uname -r)
print_check "INFO" "Kernel: $KERNEL"

UPTIME=$(uptime -p)
print_check "INFO" "Uptime: $UPTIME"

################################################################################
# 2. VERIFICAR NODE.JS
################################################################################

print_header "2. NODE.JS"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_check "OK" "Node.js instalado: $NODE_VERSION"
    
    # Verificar se é versão 22
    if [[ $NODE_VERSION == v22* ]]; then
        print_check "OK" "Versão do Node.js está correta (v22.x)"
    else
        print_check "WARN" "Versão do Node.js não é v22.x (recomendado: v22.x)"
    fi
else
    print_check "FAIL" "Node.js NÃO está instalado"
fi

################################################################################
# 3. VERIFICAR PNPM
################################################################################

print_header "3. PNPM"

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_check "OK" "pnpm instalado: v$PNPM_VERSION"
else
    print_check "FAIL" "pnpm NÃO está instalado"
fi

################################################################################
# 4. VERIFICAR PM2
################################################################################

print_header "4. PM2 (GERENCIADOR DE PROCESSOS)"

if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    print_check "OK" "PM2 instalado: v$PM2_VERSION"
    
    # Verificar se há processos rodando
    PM2_PROCESSES=$(pm2 jlist 2>/dev/null | jq -r '. | length' 2>/dev/null || echo "0")
    
    if [ "$PM2_PROCESSES" -gt 0 ]; then
        print_check "OK" "PM2 tem $PM2_PROCESSES processo(s) rodando"
        
        # Verificar se flowedu está rodando
        if pm2 jlist 2>/dev/null | jq -r '.[].name' 2>/dev/null | grep -q "flowedu"; then
            FLOWEDU_STATUS=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="flowedu") | .pm2_env.status' 2>/dev/null)
            
            if [ "$FLOWEDU_STATUS" = "online" ]; then
                print_check "OK" "Aplicação 'flowedu' está ONLINE"
                
                # Ver uptime
                FLOWEDU_UPTIME=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="flowedu") | .pm2_env.pm_uptime' 2>/dev/null)
                if [ ! -z "$FLOWEDU_UPTIME" ]; then
                    UPTIME_SECONDS=$(( ($(date +%s) - $FLOWEDU_UPTIME / 1000) ))
                    UPTIME_HUMAN=$(printf '%dd %dh %dm' $(($UPTIME_SECONDS/86400)) $(($UPTIME_SECONDS%86400/3600)) $(($UPTIME_SECONDS%3600/60)))
                    print_check "INFO" "Uptime da aplicação: $UPTIME_HUMAN"
                fi
            else
                print_check "FAIL" "Aplicação 'flowedu' está $FLOWEDU_STATUS (não está online)"
            fi
        else
            print_check "FAIL" "Aplicação 'flowedu' NÃO está rodando no PM2"
        fi
    else
        print_check "WARN" "PM2 não tem nenhum processo rodando"
    fi
else
    print_check "FAIL" "PM2 NÃO está instalado"
fi

################################################################################
# 5. VERIFICAR NGINX
################################################################################

print_header "5. NGINX (SERVIDOR WEB)"

if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    print_check "OK" "Nginx instalado: v$NGINX_VERSION"
    
    # Verificar se está rodando
    if systemctl is-active --quiet nginx; then
        print_check "OK" "Nginx está RODANDO"
    else
        print_check "FAIL" "Nginx está PARADO"
    fi
    
    # Verificar se está habilitado para iniciar no boot
    if systemctl is-enabled --quiet nginx; then
        print_check "OK" "Nginx está habilitado para iniciar no boot"
    else
        print_check "WARN" "Nginx NÃO está habilitado para iniciar no boot"
    fi
    
    # Verificar configuração
    if [ -f /etc/nginx/sites-available/flowedu ]; then
        print_check "OK" "Configuração do FlowEdu encontrada"
        
        if [ -L /etc/nginx/sites-enabled/flowedu ]; then
            print_check "OK" "Configuração do FlowEdu está ATIVA"
        else
            print_check "FAIL" "Configuração do FlowEdu NÃO está ativa"
        fi
    else
        print_check "FAIL" "Configuração do FlowEdu NÃO encontrada"
    fi
    
    # Testar configuração
    if nginx -t &> /dev/null; then
        print_check "OK" "Configuração do Nginx está VÁLIDA"
    else
        print_check "FAIL" "Configuração do Nginx tem ERROS"
    fi
else
    print_check "FAIL" "Nginx NÃO está instalado"
fi

################################################################################
# 6. VERIFICAR CERTBOT (SSL)
################################################################################

print_header "6. CERTBOT (CERTIFICADOS SSL)"

if command -v certbot &> /dev/null; then
    CERTBOT_VERSION=$(certbot --version 2>&1 | cut -d' ' -f2)
    print_check "OK" "Certbot instalado: v$CERTBOT_VERSION"
    
    # Verificar certificados
    CERT_COUNT=$(certbot certificates 2>/dev/null | grep "Certificate Name:" | wc -l)
    
    if [ "$CERT_COUNT" -gt 0 ]; then
        print_check "OK" "$CERT_COUNT certificado(s) SSL encontrado(s)"
        
        # Listar domínios
        certbot certificates 2>/dev/null | grep "Domains:" | while read line; do
            DOMAINS=$(echo $line | cut -d':' -f2 | xargs)
            print_check "INFO" "Domínios: $DOMAINS"
        done
        
        # Verificar validade
        certbot certificates 2>/dev/null | grep "Expiry Date:" | while read line; do
            EXPIRY=$(echo $line | cut -d':' -f2- | xargs)
            print_check "INFO" "Validade: $EXPIRY"
        done
    else
        print_check "WARN" "Nenhum certificado SSL configurado"
    fi
    
    # Verificar renovação automática
    if systemctl is-active --quiet certbot.timer; then
        print_check "OK" "Renovação automática de SSL está ATIVA"
    else
        print_check "WARN" "Renovação automática de SSL NÃO está ativa"
    fi
else
    print_check "FAIL" "Certbot NÃO está instalado"
fi

################################################################################
# 7. VERIFICAR GIT
################################################################################

print_header "7. GIT"

if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    print_check "OK" "Git instalado: v$GIT_VERSION"
else
    print_check "FAIL" "Git NÃO está instalado"
fi

################################################################################
# 8. VERIFICAR REPOSITÓRIO
################################################################################

print_header "8. REPOSITÓRIO DO FLOWEDU"

if [ -d /home/app ]; then
    print_check "OK" "Diretório /home/app existe"
    
    if [ -d /home/app/.git ]; then
        print_check "OK" "Repositório Git encontrado"
        
        cd /home/app
        
        # Verificar branch
        CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
        if [ ! -z "$CURRENT_BRANCH" ]; then
            print_check "INFO" "Branch atual: $CURRENT_BRANCH"
        fi
        
        # Verificar último commit
        LAST_COMMIT=$(git log -1 --pretty=format:"%h - %s (%ar)" 2>/dev/null)
        if [ ! -z "$LAST_COMMIT" ]; then
            print_check "INFO" "Último commit: $LAST_COMMIT"
        fi
        
        # Verificar se há mudanças não commitadas
        if git diff-index --quiet HEAD -- 2>/dev/null; then
            print_check "OK" "Não há mudanças não commitadas"
        else
            print_check "WARN" "Há mudanças não commitadas no repositório"
        fi
    else
        print_check "FAIL" "Repositório Git NÃO encontrado em /home/app"
    fi
    
    # Verificar arquivos importantes
    if [ -f /home/app/package.json ]; then
        print_check "OK" "package.json encontrado"
    else
        print_check "FAIL" "package.json NÃO encontrado"
    fi
    
    if [ -f /home/app/.env ]; then
        print_check "OK" "Arquivo .env encontrado"
    else
        print_check "FAIL" "Arquivo .env NÃO encontrado"
    fi
    
    if [ -d /home/app/node_modules ]; then
        print_check "OK" "node_modules instalado"
    else
        print_check "FAIL" "node_modules NÃO encontrado (execute: pnpm install)"
    fi
    
    if [ -d /home/app/dist ]; then
        print_check "OK" "Build (dist/) encontrado"
    else
        print_check "WARN" "Build (dist/) NÃO encontrado (execute: pnpm build)"
    fi
else
    print_check "FAIL" "Diretório /home/app NÃO existe"
fi

################################################################################
# 9. VERIFICAR PORTAS
################################################################################

print_header "9. PORTAS E CONEXÕES"

# Porta 80 (HTTP)
if ss -tuln | grep -q ":80 "; then
    print_check "OK" "Porta 80 (HTTP) está ABERTA"
else
    print_check "WARN" "Porta 80 (HTTP) NÃO está aberta"
fi

# Porta 443 (HTTPS)
if ss -tuln | grep -q ":443 "; then
    print_check "OK" "Porta 443 (HTTPS) está ABERTA"
else
    print_check "WARN" "Porta 443 (HTTPS) NÃO está aberta"
fi

# Porta 3000 (Node.js)
if ss -tuln | grep -q ":3000 "; then
    print_check "OK" "Porta 3000 (Node.js) está ABERTA"
else
    print_check "FAIL" "Porta 3000 (Node.js) NÃO está aberta"
fi

################################################################################
# 10. VERIFICAR BANCO DE DADOS
################################################################################

print_header "10. BANCO DE DADOS"

if [ -f /home/app/.env ]; then
    DATABASE_URL=$(grep DATABASE_URL /home/app/.env | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    
    if [ ! -z "$DATABASE_URL" ]; then
        print_check "OK" "DATABASE_URL configurada"
        
        # Extrair host e porta
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        
        if [ ! -z "$DB_HOST" ]; then
            print_check "INFO" "Host do banco: $DB_HOST"
            
            # Testar conexão (apenas ping, não testa credenciais)
            if command -v nc &> /dev/null; then
                if nc -z -w5 $DB_HOST ${DB_PORT:-3306} 2>/dev/null; then
                    print_check "OK" "Conexão com banco de dados está ACESSÍVEL"
                else
                    print_check "WARN" "Não foi possível conectar ao banco de dados (pode ser firewall)"
                fi
            else
                print_check "INFO" "Comando 'nc' não disponível para testar conexão"
            fi
        fi
    else
        print_check "FAIL" "DATABASE_URL NÃO está configurada"
    fi
else
    print_check "FAIL" "Arquivo .env não encontrado"
fi

################################################################################
# 11. VERIFICAR RECURSOS DO SISTEMA
################################################################################

print_header "11. RECURSOS DO SISTEMA"

# Memória RAM
TOTAL_RAM=$(free -h | awk '/^Mem:/ {print $2}')
USED_RAM=$(free -h | awk '/^Mem:/ {print $3}')
FREE_RAM=$(free -h | awk '/^Mem:/ {print $4}')
RAM_PERCENT=$(free | awk '/^Mem:/ {printf "%.0f", $3/$2 * 100}')

print_check "INFO" "RAM Total: $TOTAL_RAM | Usada: $USED_RAM ($RAM_PERCENT%) | Livre: $FREE_RAM"

if [ "$RAM_PERCENT" -gt 90 ]; then
    print_check "WARN" "Uso de RAM está ALTO (>90%)"
elif [ "$RAM_PERCENT" -gt 80 ]; then
    print_check "WARN" "Uso de RAM está moderado (>80%)"
fi

# Disco
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
DISK_TOTAL=$(df -h / | awk 'NR==2 {print $2}')
DISK_USED=$(df -h / | awk 'NR==2 {print $3}')
DISK_FREE=$(df -h / | awk 'NR==2 {print $4}')

print_check "INFO" "Disco Total: $DISK_TOTAL | Usado: $DISK_USED ($DISK_USAGE%) | Livre: $DISK_FREE"

if [ "$DISK_USAGE" -gt 90 ]; then
    print_check "WARN" "Uso de disco está ALTO (>90%)"
elif [ "$DISK_USAGE" -gt 80 ]; then
    print_check "WARN" "Uso de disco está moderado (>80%)"
fi

# CPU Load
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | xargs)
print_check "INFO" "Load Average: $LOAD_AVG"

################################################################################
# RESUMO FINAL
################################################################################

print_header "RESUMO DA VERIFICAÇÃO"

echo ""
echo -e "${GREEN}✓ Passou:${NC} $PASSED testes"
echo -e "${YELLOW}⚠ Avisos:${NC} $WARNINGS"
echo -e "${RED}✗ Falhou:${NC} $FAILED testes"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}║       🎉 INSTALAÇÃO COMPLETA E FUNCIONANDO! 🎉                ║${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    
    if [ "$WARNINGS" -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Há $WARNINGS aviso(s) que você pode corrigir para melhorar o sistema.${NC}"
    fi
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                               ║${NC}"
    echo -e "${RED}║       ⚠️  INSTALAÇÃO INCOMPLETA ⚠️                             ║${NC}"
    echo -e "${RED}║                                                               ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}Há $FAILED problema(s) que precisam ser corrigidos.${NC}"
    echo ""
    echo -e "${YELLOW}Recomendações:${NC}"
    echo "1. Revise os itens marcados com ✗ acima"
    echo "2. Execute os comandos de instalação novamente"
    echo "3. Verifique os logs: pm2 logs flowedu"
    echo "4. Consulte o GUIA_INSTALACAO_VPS_COMPLETO.md"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Código de saída
if [ "$FAILED" -eq 0 ]; then
    exit 0
else
    exit 1
fi
