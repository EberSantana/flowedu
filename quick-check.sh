#!/bin/bash

echo "🔍 VERIFICAÇÃO RÁPIDA DO FLOWEDU"
echo "================================"
echo ""

# 1. PM2
echo "📦 PM2 Status:"
pm2 list | grep flowedu
echo ""

# 2. Nginx
echo "🌐 Nginx Status:"
systemctl status nginx | grep Active
echo ""

# 3. SSL
echo "🔒 Certificado SSL:"
certbot certificates 2>/dev/null | grep "Expiry Date" | head -1
echo ""

# 4. Disco
echo "💾 Espaço em Disco:"
df -h | grep -E "Filesystem|/$"
echo ""

# 5. RAM
echo "🧠 Memória RAM:"
free -h | grep -E "Mem:|Swap:"
echo ""

# 6. Backups
echo "🗄️  Backups:"
echo "Total: $(ls -1 /home/backups/flowedu/*.sql.gz 2>/dev/null | wc -l) backups"
echo "Espaço: $(du -sh /home/backups/flowedu/ 2>/dev/null | cut -f1)"
echo ""

# 7. Site
echo "🌍 Site Online:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://flowedu.app
echo ""

# 8. Banco de Dados
echo "🗃️  Banco de Dados:"
mysql -h gateway01.us-east-1.prod.aws.tidbcloud.com -P 4000 \
  -u 3L6VQmCyn9cEeAf.root -p'Wwz5D3yH6WV1500C' \
  --ssl-mode=REQUIRED -e "SELECT 'Conexão OK' as Status;" 2>/dev/null || echo "❌ Erro de conexão"
echo ""

echo "================================"
echo "✅ Verificação concluída!"
