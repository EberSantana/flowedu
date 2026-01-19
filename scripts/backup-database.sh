#!/bin/bash
# ============================================
# SCRIPT DE BACKUP DO BANCO DE DADOS
# FlowEdu - Sistema de Gestão de Tempo para Professores
# ============================================

# Configurações (ajustar conforme ambiente)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-flowedu}"

# Diretório de backup
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/flowedu_backup_${DATE}.sql"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

echo "============================================"
echo "Iniciando backup do banco de dados FlowEdu"
echo "Data: $(date)"
echo "============================================"

# Executar backup
if [ -z "$DB_PASSWORD" ]; then
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
else
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"
fi

# Verificar se backup foi criado com sucesso
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
    # Comprimir backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    # Calcular tamanho do backup
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo "✅ Backup criado com sucesso!"
    echo "   Arquivo: $BACKUP_FILE"
    echo "   Tamanho: $BACKUP_SIZE"
    
    # Limpar backups antigos (manter últimos 7 dias)
    echo ""
    echo "Limpando backups antigos (mantendo últimos 7 dias)..."
    find "$BACKUP_DIR" -name "flowedu_backup_*.sql.gz" -mtime +7 -delete
    
    # Listar backups existentes
    echo ""
    echo "Backups disponíveis:"
    ls -lh "$BACKUP_DIR"/flowedu_backup_*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
else
    echo "❌ Erro ao criar backup!"
    exit 1
fi

echo ""
echo "============================================"
echo "Backup finalizado: $(date)"
echo "============================================"
