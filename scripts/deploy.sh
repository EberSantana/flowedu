#!/bin/bash
# =============================================================================
# FlowEdu - Script de Deploy Automatizado
# =============================================================================
# Este script faz:
# 1. Incrementa a versão automaticamente no package.json (patch: x.y.Z+1)
# 2. Faz o build do projeto
# 3. Substitui __SW_VERSION__ no sw.js pela versão atual
# 4. Reinicia o PM2
#
# Uso:
#   ./scripts/deploy.sh          → incrementa versão patch (2.5.0 → 2.5.1)
#   ./scripts/deploy.sh minor    → incrementa versão minor (2.5.0 → 2.6.0)
#   ./scripts/deploy.sh major    → incrementa versão major (2.5.0 → 3.0.0)
#   ./scripts/deploy.sh skip     → não incrementa versão (usa a atual)
# =============================================================================

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  FlowEdu - Deploy Automatizado${NC}"
echo -e "${BLUE}========================================${NC}"

# Diretório do projeto
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo -e "${YELLOW}📁 Diretório: ${PROJECT_DIR}${NC}"

# ---- PASSO 1: Incrementar versão ----
INCREMENT_TYPE="${1:-patch}"

# Ler versão atual
CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")
echo -e "${YELLOW}📌 Versão atual: v${CURRENT_VERSION}${NC}"

if [ "$INCREMENT_TYPE" != "skip" ]; then
    # Separar major.minor.patch
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
    
    case "$INCREMENT_TYPE" in
        major)
            MAJOR=$((MAJOR + 1))
            MINOR=0
            PATCH=0
            ;;
        minor)
            MINOR=$((MINOR + 1))
            PATCH=0
            ;;
        patch)
            PATCH=$((PATCH + 1))
            ;;
        *)
            echo -e "${RED}❌ Tipo de incremento inválido: ${INCREMENT_TYPE}${NC}"
            echo "Use: patch, minor, major ou skip"
            exit 1
            ;;
    esac
    
    NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
    
    # Atualizar package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
    pkg.version = '${NEW_VERSION}';
    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
    "
    
    echo -e "${GREEN}✅ Versão atualizada: v${CURRENT_VERSION} → v${NEW_VERSION}${NC}"
else
    NEW_VERSION="$CURRENT_VERSION"
    echo -e "${YELLOW}⏭️  Mantendo versão atual: v${NEW_VERSION}${NC}"
fi

# ---- PASSO 2: Git pull (se houver mudanças remotas) ----
echo -e "${YELLOW}📥 Verificando atualizações do Git...${NC}"
git pull origin main 2>/dev/null || git pull 2>/dev/null || echo "Sem repositório remoto configurado"

# ---- PASSO 3: Instalar dependências (se necessário) ----
echo -e "${YELLOW}📦 Verificando dependências...${NC}"
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências...${NC}"
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
fi

# ---- PASSO 4: Build do projeto ----
echo -e "${YELLOW}🔨 Fazendo build do projeto...${NC}"
pnpm build

# ---- PASSO 5: Substituir __SW_VERSION__ no sw.js ----
SW_FILE="$PROJECT_DIR/dist/public/sw.js"
if [ -f "$SW_FILE" ]; then
    sed -i "s/__SW_VERSION__/${NEW_VERSION}/g" "$SW_FILE"
    echo -e "${GREEN}✅ Service Worker atualizado com versão v${NEW_VERSION}${NC}"
else
    echo -e "${RED}⚠️  sw.js não encontrado em dist/public/${NC}"
fi

# ---- PASSO 6: Commit da versão (se incrementou) ----
if [ "$INCREMENT_TYPE" != "skip" ]; then
    git add package.json 2>/dev/null || true
    git commit -m "chore: bump version to v${NEW_VERSION}" 2>/dev/null || true
    git push 2>/dev/null || echo "Push falhou (sem remote configurado)"
fi

# ---- PASSO 7: Reiniciar PM2 ----
echo -e "${YELLOW}🔄 Reiniciando servidor...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 restart flowedu 2>/dev/null || pm2 restart all 2>/dev/null || echo "PM2 restart falhou"
    echo -e "${GREEN}✅ PM2 reiniciado${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 não encontrado, reinicie o servidor manualmente${NC}"
fi

# ---- RESULTADO ----
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}  📌 Versão: v${NEW_VERSION}${NC}"
echo -e "${GREEN}  📅 Data: $(date '+%d/%m/%Y %H:%M:%S')${NC}"
echo -e "${GREEN}========================================${NC}"
