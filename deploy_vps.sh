#!/bin/bash
set -e

echo "=== Deploy FlowEdu v2.6.0 para VPS ==="
echo ""

# Configurações
VPS_HOST="76.13.67.5"
VPS_USER="325476"
VPS_PASS="325476@Flowedu"
VPS_PATH="/root/flowedu"

echo "1. Compactando arquivos de build..."
cd /home/ubuntu/teacher_schedule_system
tar -czf dist.tar.gz dist/
echo "✓ Arquivo compactado: $(ls -lh dist.tar.gz | awk '{print $5}')"

echo ""
echo "2. Fazendo upload para VPS via SCP..."
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  dist.tar.gz ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/ 2>&1 | grep -v "Warning:"

if [ $? -eq 0 ]; then
  echo "✓ Upload concluído com sucesso!"
else
  echo "✗ Erro no upload. Tentando método alternativo..."
  exit 1
fi

echo ""
echo "3. Executando comandos na VPS..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  ${VPS_USER}@${VPS_HOST} << 'EOFSSH'
cd /root/flowedu

echo "  - Fazendo backup da versão atual..."
if [ -d "dist" ]; then
  mv dist dist_backup_$(date +%Y%m%d_%H%M%S)
fi

echo "  - Extraindo novo build..."
tar -xzf dist.tar.gz

echo "  - Removendo arquivo temporário..."
rm dist.tar.gz

echo "  - Verificando estrutura..."
ls -la dist/ | head -5

echo "  - Reiniciando PM2..."
pm2 restart flowedu
pm2 save

echo ""
echo "✓ Deploy concluído!"
echo ""
echo "Verificando status..."
pm2 status | grep flowedu
EOFSSH

echo ""
echo "=== Deploy Finalizado ==="
echo "Acesse: https://flowedu.app"
echo "Versão: 2.6.0"
