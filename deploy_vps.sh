#!/bin/bash
set -e

echo "=== Deploy FlowEdu para VPS ==="
echo ""

# Configurações
VPS_HOST="76.13.67.5"
VPS_USER="root"
VPS_PASS="325476@Flowedu"

# Caminhos no VPS onde o Node.js serve os arquivos estáticos:
# 1. /root/flowedu/public/         (backup / referência)
# 2. /var/www/flowedu/dist/public/ (caminho REAL usado pelo PM2/Node.js)
VPS_PATH_1="/root/flowedu/public"
VPS_PATH_2="/var/www/flowedu/dist/public"

cd /home/ubuntu/teacher_schedule_system

echo "1. Sincronizando build para $VPS_PATH_1 ..."
sshpass -p "$VPS_PASS" rsync -az --delete \
  -e "ssh -o StrictHostKeyChecking=no" \
  dist/public/ ${VPS_USER}@${VPS_HOST}:${VPS_PATH_1}/
echo "✓ Concluído"

echo ""
echo "2. Sincronizando build para $VPS_PATH_2 (caminho principal do Node.js) ..."
sshpass -p "$VPS_PASS" rsync -az --delete \
  -e "ssh -o StrictHostKeyChecking=no" \
  dist/public/ ${VPS_USER}@${VPS_HOST}:${VPS_PATH_2}/
echo "✓ Concluído"

echo ""
echo "3. Reiniciando PM2..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} \
  "pm2 restart flowedu && pm2 save && pm2 status | grep flowedu"

echo ""
echo "=== Deploy Finalizado ==="
echo "Acesse: https://flowedu.app"
