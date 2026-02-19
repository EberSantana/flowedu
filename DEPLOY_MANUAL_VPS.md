# 🚀 Guia de Deploy Manual - FlowEdu v2.6.0

## Arquivos Prontos para Deploy

O build já foi gerado e está pronto em:
- **Arquivo compactado**: `/home/ubuntu/teacher_schedule_system/dist.tar.gz` (2.2 MB)
- **Diretório de build**: `/home/ubuntu/teacher_schedule_system/dist/`

---

## Opção 1: Deploy via SCP (Recomendado)

### Passo 1: Fazer upload do arquivo compactado
```bash
# No seu computador local, faça download do arquivo dist.tar.gz do Manus
# Depois, execute:
scp dist.tar.gz 325476@76.13.67.5:/root/flowedu/
```

### Passo 2: Conectar na VPS via SSH
```bash
ssh 325476@76.13.67.5
# Senha: 325476@Flowedu
```

### Passo 3: Extrair e substituir arquivos na VPS
```bash
cd /root/flowedu
tar -xzf dist.tar.gz
rm dist.tar.gz
```

### Passo 4: Reiniciar o PM2
```bash
pm2 restart flowedu
pm2 save
```

### Passo 5: Verificar status
```bash
pm2 status
pm2 logs flowedu --lines 50
```

---

## Opção 2: Deploy via Git (Alternativa)

Se você tiver acesso ao repositório Git:

```bash
# Na VPS
cd /root/flowedu
git pull origin main
pnpm install
pnpm build
pm2 restart flowedu
pm2 save
```

---

## Opção 3: Deploy Manual via SFTP

1. Use um cliente SFTP (FileZilla, WinSCP, Cyberduck)
2. Conecte-se em: `sftp://76.13.67.5`
   - Usuário: `325476`
   - Senha: `325476@Flowedu`
3. Navegue até `/root/flowedu/`
4. Faça upload da pasta `dist/` completa
5. Conecte via SSH e execute:
   ```bash
   pm2 restart flowedu
   pm2 save
   ```

---

## Verificação Pós-Deploy

1. **Verificar versão no site**: Acesse https://flowedu.app e verifique o rodapé (deve mostrar v2.6.0)

2. **Testar Dashboard de Estatísticas**: 
   - Login como professor
   - Menu lateral → Análise e Desempenho → Dashboard de Exercícios
   - Verificar se os 3 cards e 2 tabelas aparecem

3. **Verificar logs do PM2**:
   ```bash
   pm2 logs flowedu --lines 100
   ```

4. **Verificar status do servidor**:
   ```bash
   pm2 status
   ```

---

## Troubleshooting

### Erro: "Module not found"
```bash
cd /root/flowedu
pnpm install --prod
pm2 restart flowedu
```

### Erro: "Port already in use"
```bash
pm2 delete flowedu
pm2 start ecosystem.config.cjs
pm2 save
```

### Erro: "Permission denied"
```bash
sudo chown -R 325476:325476 /root/flowedu
chmod -R 755 /root/flowedu
```

### Cache do navegador (assets antigos)
```bash
# Limpar cache do Nginx
sudo systemctl restart nginx
```

---

## Informações Técnicas

- **Versão**: 2.6.0
- **Checkpoint**: a40cd127
- **Novidades**: Dashboard de Estatísticas de Desempenho
- **Tamanho do build**: 2.2 MB (compactado)
- **Backend**: dist/index.js (800.9 KB)
- **Frontend**: dist/public/ (múltiplos chunks)

---

## Contato de Suporte

Se houver problemas durante o deploy, verifique:
1. Logs do PM2: `pm2 logs flowedu`
2. Logs do Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Espaço em disco: `df -h`
4. Memória disponível: `free -h`
