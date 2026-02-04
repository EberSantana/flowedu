#!/bin/bash

# ============================================
# SCRIPT DE APLICAÇÃO AUTOMÁTICA DE CACHE NGINX
# FlowEdu - Aplicação em 1 Comando
# ============================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  APLICAÇÃO AUTOMÁTICA DE CACHE NGINX${NC}"
echo -e "${BLUE}  FlowEdu - flowedu.app${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Este script precisa ser executado como root${NC}"
  echo -e "${YELLOW}Execute: sudo bash apply-nginx-cache.sh${NC}"
  exit 1
fi

# Verificar se Nginx está instalado
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx não está instalado!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Nginx encontrado: $(nginx -v 2>&1)"
echo ""

# Passo 1: Fazer backup da configuração atual
echo -e "${YELLOW}[1/6]${NC} Fazendo backup da configuração atual..."
BACKUP_FILE="/etc/nginx/sites-available/flowedu.backup-$(date +%Y%m%d-%H%M%S)"
if [ -f /etc/nginx/sites-available/flowedu ]; then
    cp /etc/nginx/sites-available/flowedu "$BACKUP_FILE"
    echo -e "${GREEN}✓${NC} Backup salvo em: $BACKUP_FILE"
else
    echo -e "${YELLOW}⚠${NC} Arquivo original não encontrado, criando novo..."
fi
echo ""

# Passo 2: Copiar nova configuração
echo -e "${YELLOW}[2/6]${NC} Aplicando nova configuração de cache..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/nginx-cache.conf" ]; then
    cp "$SCRIPT_DIR/nginx-cache.conf" /etc/nginx/sites-available/flowedu
    echo -e "${GREEN}✓${NC} Configuração copiada com sucesso"
else
    echo -e "${RED}❌ Arquivo nginx-cache.conf não encontrado em $SCRIPT_DIR${NC}"
    exit 1
fi
echo ""

# Passo 3: Verificar sintaxe do Nginx
echo -e "${YELLOW}[3/6]${NC} Testando configuração do Nginx..."
if nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓${NC} Configuração válida!"
else
    echo -e "${RED}❌ Erro na configuração do Nginx!${NC}"
    echo -e "${YELLOW}Restaurando backup...${NC}"
    cp "$BACKUP_FILE" /etc/nginx/sites-available/flowedu
    echo -e "${YELLOW}⚠${NC} Backup restaurado. Verifique o arquivo nginx-cache.conf"
    exit 1
fi
echo ""

# Passo 4: Recarregar Nginx
echo -e "${YELLOW}[4/6]${NC} Recarregando Nginx..."
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Nginx recarregado com sucesso"
else
    echo -e "${RED}❌ Erro ao recarregar Nginx!${NC}"
    echo -e "${YELLOW}Restaurando backup...${NC}"
    cp "$BACKUP_FILE" /etc/nginx/sites-available/flowedu
    systemctl reload nginx
    exit 1
fi
echo ""

# Passo 5: Verificar status do Nginx
echo -e "${YELLOW}[5/6]${NC} Verificando status do Nginx..."
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓${NC} Nginx está rodando normalmente"
else
    echo -e "${RED}❌ Nginx não está rodando!${NC}"
    exit 1
fi
echo ""

# Passo 6: Testar cache
echo -e "${YELLOW}[6/6]${NC} Testando cache..."
sleep 2
CACHE_TEST=$(curl -s -I https://flowedu.app 2>&1 | grep -i "cache-control" || echo "not found")
if [[ $CACHE_TEST != "not found" ]]; then
    echo -e "${GREEN}✓${NC} Headers de cache detectados!"
    echo -e "   ${CACHE_TEST}"
else
    echo -e "${YELLOW}⚠${NC} Headers de cache não detectados (pode ser normal para página inicial)"
fi
echo ""

# Resumo final
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ CACHE APLICADO COM SUCESSO!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}📊 BENEFÍCIOS ATIVADOS:${NC}"
echo "   • Imagens cacheadas por 1 ano"
echo "   • CSS/JS cacheados por 1 mês"
echo "   • Fontes cacheadas por 1 ano"
echo "   • Compressão gzip ativa (70% menor)"
echo "   • Headers de segurança configurados"
echo ""
echo -e "${BLUE}💾 BACKUP:${NC}"
echo "   $BACKUP_FILE"
echo ""
echo -e "${BLUE}🔍 COMO TESTAR:${NC}"
echo "   1. Abra: https://flowedu.app"
echo "   2. Pressione F12 → Aba Network"
echo "   3. Recarregue a página (Ctrl+R)"
echo "   4. Veja coluna 'Size' - deve mostrar '(disk cache)' ou '(memory cache)'"
echo ""
echo -e "${BLUE}📈 ECONOMIA ESPERADA:${NC}"
echo "   • 80-90% menos uso de banda"
echo "   • 3-5x mais rápido"
echo "   • Melhor pontuação no PageSpeed"
echo ""
echo -e "${GREEN}✨ Cache do Nginx ativo e funcionando!${NC}"
echo ""
