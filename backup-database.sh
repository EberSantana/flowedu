#!/bin/bash
BACKUP_DIR="/home/backups/flowedu"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/flowedu_$DATE.sql"
LOG_FILE="/home/app/backup.log"
mkdir -p $BACKUP_DIR
echo "========================================" >> $LOG_FILE
echo "Backup iniciado em: $(date)" >> $LOG_FILE
mysqldump -h gateway01.us-east-1.prod.aws.tidbcloud.com -P 4000 -u 3L6VQmCyn9cEeAf.root -p'Wwz5D3yH6WV1500C' --ssl-mode=REQUIRED --single-transaction --routines --triggers --databases flowedu > $BACKUP_FILE 2>> $LOG_FILE
if [ -f "$BACKUP_FILE" ]; then
  gzip $BACKUP_FILE
  SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
  echo "✅ Backup concluído: $BACKUP_FILE.gz ($SIZE)" >> $LOG_FILE
  find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
  echo "🗑️  Backups antigos removidos (>30 dias)" >> $LOG_FILE
else
  echo "❌ ERRO: Backup falhou!" >> $LOG_FILE
fi
echo "Backup finalizado em: $(date)" >> $LOG_FILE
echo "========================================" >> $LOG_FILE
