#!/bin/bash
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
BACKUP_DIR="/home/backups/flowedu"
LOG_FILE="/home/app/restore.log"
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}   RESTAURAÇÃO DE BANCO DE DADOS${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo -e "${GREEN}Backups disponíveis:${NC}"
echo ""
ls -lh $BACKUP_DIR/*.sql.gz 2>/dev/null | awk '{print NR". "$9" ("$5")"}'
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Nenhum backup encontrado em $BACKUP_DIR${NC}"
  exit 1
fi
echo ""
echo -e "${YELLOW}Digite o número do backup que deseja restaurar:${NC}"
read -p "> " BACKUP_NUM
BACKUP_FILE=$(ls $BACKUP_DIR/*.sql.gz 2>/dev/null | sed -n "${BACKUP_NUM}p")
if [ -z "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Backup inválido!${NC}"
  exit 1
fi
echo ""
echo -e "${GREEN}Backup selecionado:${NC} $BACKUP_FILE"
echo ""
echo -e "${RED}⚠️  ATENÇÃO: Esta operação irá SUBSTITUIR todos os dados atuais!${NC}"
echo -e "${YELLOW}Deseja continuar? (digite 'SIM' para confirmar):${NC}"
read -p "> " CONFIRM
if [ "$CONFIRM" != "SIM" ]; then
  echo -e "${YELLOW}Restauração cancelada.${NC}"
  exit 0
fi
echo "========================================" >> $LOG_FILE
echo "Restauração iniciada em: $(date)" >> $LOG_FILE
echo "Arquivo: $BACKUP_FILE" >> $LOG_FILE
echo ""
echo -e "${GREEN}Descomprimindo backup...${NC}"
TEMP_FILE="/tmp/restore_temp.sql"
gunzip -c $BACKUP_FILE > $TEMP_FILE
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Erro ao descomprimir backup!${NC}"
  echo "❌ Erro ao descomprimir" >> $LOG_FILE
  exit 1
fi
echo -e "${GREEN}Restaurando banco de dados...${NC}"
mysql -h gateway01.us-east-1.prod.aws.tidbcloud.com -P 4000 -u 3L6VQmCyn9cEeAf.root -p'Wwz5D3yH6WV1500C' --ssl-mode=REQUIRED < $TEMP_FILE 2>> $LOG_FILE
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Restauração concluída com sucesso!${NC}"
  echo "✅ Restauração bem-sucedida" >> $LOG_FILE
  echo ""
  echo -e "${GREEN}Reiniciando aplicação...${NC}"
  pm2 restart flowedu >> $LOG_FILE 2>&1
  echo -e "${GREEN}✅ Aplicação reiniciada!${NC}"
else
  echo -e "${RED}❌ Erro ao restaurar banco de dados!${NC}"
  echo -e "${YELLOW}Verifique o log: $LOG_FILE${NC}"
  echo "❌ Erro na restauração" >> $LOG_FILE
fi
rm -f $TEMP_FILE
echo "Restauração finalizada em: $(date)" >> $LOG_FILE
echo "========================================" >> $LOG_FILE
echo ""
echo -e "${YELLOW}========================================${NC}"
