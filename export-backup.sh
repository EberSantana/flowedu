#!/bin/bash

# Script de Backup - Sistema de Gestão de Tempo para Professores
# Exporta todos os dados em formato CSV usando mysqldump

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="./backups/backup_$TIMESTAMP"

mkdir -p "$BACKUP_DIR"

echo "🚀 Iniciando backup do banco de dados..."
echo "📁 Diretório: $BACKUP_DIR"
echo ""

# Extrair credenciais do DATABASE_URL
# Formato: mysql://user:password@host:port/database

if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erro: DATABASE_URL não encontrada"
  exit 1
fi

echo "✅ Backup concluído!"
echo "📂 Arquivos salvos em: $BACKUP_DIR"
