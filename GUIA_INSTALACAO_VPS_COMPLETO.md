# 🚀 Guia Completo: Instalar FlowEdu do Zero em VPS

## 📋 O que este guia faz?

Este guia te ensina a instalar o FlowEdu **do zero** em um servidor VPS novo, usando um **script automático** que faz tudo para você. Você só precisa responder algumas perguntas e esperar!

---

## 🎯 O que será instalado?

| Software | O que faz |
|----------|-----------|
| **Node.js 22** | Linguagem que roda o FlowEdu |
| **pnpm** | Gerenciador de pacotes (como uma "loja de ferramentas") |
| **PM2** | Mantém o FlowEdu rodando 24/7 (mesmo se der erro) |
| **Nginx** | Servidor web que entrega o site para os usuários |
| **Certbot** | Cria certificados SSL (cadeado verde no navegador) |
| **Git** | Baixa o código do GitHub |

---

## ✅ Pré-requisitos (O que você precisa ANTES de começar)

### 1. **VPS com Ubuntu 22.04**
- Pode ser da Contabo, DigitalOcean, AWS, etc.
- **Sistema operacional:** Ubuntu 22.04 LTS
- **Memória mínima:** 1GB RAM
- **Disco:** 20GB

### 2. **Domínio configurado**
- Você precisa ter um domínio (ex: `flowedu.app`)
- O domínio deve estar **apontando para o IP da VPS**
  
**Como apontar o domínio:**
1. Entre no painel do seu provedor de domínio (Registro.br, GoDaddy, etc.)
2. Crie um registro **A** apontando para o IP da VPS:
   ```
   Tipo: A
   Nome: @
   Valor: SEU_IP_DA_VPS
   TTL: 3600
   ```
3. Crie outro registro **A** para www:
   ```
   Tipo: A
   Nome: www
   Valor: SEU_IP_DA_VPS
   TTL: 3600
   ```
4. Aguarde 5-30 minutos para propagar

### 3. **Banco de Dados MySQL/TiDB**
- Você precisa ter a **URL de conexão** do banco de dados
- Formato: `mysql://usuario:senha@host:porta/nome_do_banco`
- Exemplo: `mysql://root:senha123@db.example.com:3306/flowedu`

### 4. **Email válido**
- Para receber avisos sobre o certificado SSL

### 5. **Acesso SSH à VPS**
- Você precisa conseguir conectar na VPS via SSH
- Comando: `ssh root@SEU_IP_DA_VPS`

---

## 🛠️ Passo a Passo - Instalação Completa

### **Passo 1: Conectar na VPS via SSH**

Abra o terminal (ou PuTTY no Windows) e conecte:

```bash
ssh root@SEU_IP_DA_VPS
```

> 💡 **Dica:** Substitua `SEU_IP_DA_VPS` pelo IP real da sua VPS (ex: `45.123.45.67`)

Digite a senha quando solicitado.

---

### **Passo 2: Baixar o Script de Instalação**

```bash
cd /root
wget https://raw.githubusercontent.com/EberSantana/flowedu/main/install-flowedu.sh
```

> 📥 **O que faz:** Baixa o script de instalação automática do GitHub

---

### **Passo 3: Dar Permissão de Execução ao Script**

```bash
chmod +x install-flowedu.sh
```

> 🔓 **O que faz:** Permite que o script seja executado

---

### **Passo 4: Executar o Script**

```bash
./install-flowedu.sh
```

> ⚙️ **O que faz:** Inicia a instalação automática

---

### **Passo 5: Responder as Perguntas**

O script vai fazer algumas perguntas. Responda com atenção:

#### **Pergunta 1: Digite seu domínio**
```
Digite seu domínio (ex: flowedu.app): 
```
**Resposta:** Digite seu domínio SEM `http://` ou `https://`  
**Exemplo:** `flowedu.app`

---

#### **Pergunta 2: Digite seu email**
```
Digite seu email (para certificado SSL): 
```
**Resposta:** Digite um email válido  
**Exemplo:** `contato@flowedu.app`

---

#### **Pergunta 3: URL do banco de dados**
```
Digite a URL do banco de dados MySQL/TiDB: 
```
**Resposta:** Cole a URL completa do banco  
**Exemplo:** `mysql://root:senha123@db.example.com:3306/flowedu`

---

#### **Pergunta 4: Confirmar informações**
```
Confirme as informações:
  Domínio: flowedu.app
  Email: contato@flowedu.app
  Banco de Dados: mysql://root:senha123@db.exam...

Está correto? (s/n): 
```
**Resposta:** Digite `s` e pressione Enter

---

#### **Pergunta 5: Domínio já está apontando?**
```
Domínio já está apontando para este servidor? (s/n): 
```
**Resposta:**  
- Digite `s` se você já configurou o DNS (Passo 2 dos Pré-requisitos)
- Digite `n` se ainda não configurou (você pode configurar SSL depois)

---

### **Passo 6: Aguardar a Instalação**

O script vai instalar tudo automaticamente. Isso pode demorar **5-10 minutos**.

Você verá mensagens como:
```
==> Atualizando sistema operacional...
==> Instalando Node.js 22...
==> Instalando pnpm...
==> Clonando repositório do FlowEdu...
==> Fazendo build do projeto...
```

> ☕ **Dica:** Pegue um café enquanto espera!

---

### **Passo 7: Verificar se Funcionou**

Quando terminar, você verá uma mensagem assim:

```
===================================================================
                   INSTALAÇÃO CONCLUÍDA! 🎉                        
===================================================================

✅ Node.js: v22.x.x
✅ pnpm: 9.x.x
✅ PM2: Instalado
✅ Nginx: Rodando
✅ Aplicação: Rodando na porta 3000

🌐 Acesse seu site em: http://flowedu.app
```

---

### **Passo 8: Configurar Variáveis de Ambiente**

O script criou um arquivo `.env` com configurações básicas, mas você precisa adicionar o **App ID do Manus**.

#### **8.1: Editar o arquivo .env**

```bash
nano /home/app/.env
```

#### **8.2: Procurar a linha `VITE_APP_ID`**

```
VITE_APP_ID=seu_app_id_aqui
```

#### **8.3: Substituir `seu_app_id_aqui` pelo seu App ID real**

Exemplo:
```
VITE_APP_ID=abc123xyz456
```

#### **8.4: Salvar e sair**

- Pressione `Ctrl + O` (salvar)
- Pressione `Enter` (confirmar)
- Pressione `Ctrl + X` (sair)

---

### **Passo 9: Reiniciar a Aplicação**

```bash
cd /home/app
pm2 restart flowedu
```

---

### **Passo 10: Testar o Site**

Abra o navegador e acesse: `https://flowedu.app` (ou seu domínio)

Você deve ver a tela de login do FlowEdu! 🎉

---

## 🔧 Configurar SSL (Se não configurou no Passo 5)

Se você pulou a configuração SSL, faça agora:

```bash
sudo certbot --nginx -d flowedu.app -d www.flowedu.app
```

> 🔒 **O que faz:** Instala certificado SSL (cadeado verde no navegador)

---

## 📊 Comandos Úteis

### **Ver status da aplicação**
```bash
pm2 status
```

### **Ver logs (erros e mensagens)**
```bash
pm2 logs flowedu
```

### **Ver apenas erros**
```bash
pm2 logs flowedu --err
```

### **Reiniciar aplicação**
```bash
pm2 restart flowedu
```

### **Parar aplicação**
```bash
pm2 stop flowedu
```

### **Iniciar aplicação (se estiver parada)**
```bash
pm2 start flowedu
```

### **Atualizar código do GitHub**
```bash
cd /home/app
git pull origin main
pnpm install
pnpm build
pm2 restart flowedu
```

### **Ver uso de memória e CPU**
```bash
pm2 monit
```

### **Reiniciar Nginx**
```bash
sudo systemctl restart nginx
```

### **Ver logs do Nginx**
```bash
sudo tail -f /var/log/nginx/error.log
```

---

## ❓ Perguntas Frequentes

### **1. O site não abre. O que fazer?**

**Verifique se a aplicação está rodando:**
```bash
pm2 status
```

Se estiver **stopped** (parada), inicie:
```bash
pm2 start flowedu
```

**Verifique os logs:**
```bash
pm2 logs flowedu --lines 50
```

**Verifique se o Nginx está rodando:**
```bash
sudo systemctl status nginx
```

---

### **2. Aparece "502 Bad Gateway". O que fazer?**

Isso significa que o Nginx não consegue se conectar à aplicação Node.js.

**Verifique se a aplicação está rodando:**
```bash
pm2 status
```

**Reinicie a aplicação:**
```bash
pm2 restart flowedu
```

**Verifique os logs:**
```bash
pm2 logs flowedu
```

---

### **3. Como atualizar o FlowEdu quando houver nova versão?**

```bash
cd /home/app
git pull origin main
pnpm install
pnpm build
pm2 restart flowedu
```

---

### **4. Como fazer backup do banco de dados?**

O banco de dados está no TiDB/MySQL externo, então você precisa fazer backup lá.

Se quiser fazer backup via linha de comando:
```bash
mysqldump -h HOST -u USUARIO -p NOME_DO_BANCO > backup.sql
```

---

### **5. Como ver quanto de memória RAM está sendo usado?**

```bash
free -h
```

---

### **6. Como ver quanto de disco está sendo usado?**

```bash
df -h
```

---

### **7. O certificado SSL vai expirar?**

Não! O Certbot renova automaticamente a cada 60 dias.

Para testar a renovação manualmente:
```bash
sudo certbot renew --dry-run
```

---

### **8. Como adicionar outro domínio (ex: www2.flowedu.app)?**

```bash
sudo certbot --nginx -d www2.flowedu.app
```

Depois edite `/etc/nginx/sites-available/flowedu` e adicione o novo domínio em `server_name`.

---

### **9. Como mudar a porta da aplicação?**

Edite o arquivo `.env`:
```bash
nano /home/app/.env
```

Mude a linha:
```
PORT=3000
```

Para:
```
PORT=4000
```

Salve e reinicie:
```bash
pm2 restart flowedu
```

**Importante:** Você também precisa atualizar a configuração do Nginx em `/etc/nginx/sites-available/flowedu`.

---

### **10. Como desinstalar tudo?**

```bash
pm2 delete flowedu
pm2 save
rm -rf /home/app
sudo rm /etc/nginx/sites-available/flowedu
sudo rm /etc/nginx/sites-enabled/flowedu
sudo systemctl reload nginx
```

---

## 🆘 Problemas Comuns e Soluções

### **Erro: "Cannot connect to database"**

**Causa:** URL do banco de dados incorreta ou banco inacessível.

**Solução:**
1. Verifique se a URL está correta em `/home/app/.env`
2. Teste a conexão:
   ```bash
   mysql -h HOST -u USUARIO -p NOME_DO_BANCO
   ```
3. Verifique se o firewall permite conexões na porta 3306

---

### **Erro: "Port 3000 already in use"**

**Causa:** Outro processo está usando a porta 3000.

**Solução:**
```bash
# Ver o que está usando a porta 3000
sudo lsof -i :3000

# Matar o processo
sudo kill -9 PID_DO_PROCESSO
```

---

### **Erro: "npm ERR! code EACCES"**

**Causa:** Permissões incorretas.

**Solução:**
```bash
cd /home/app
sudo chown -R root:root .
```

---

### **Site lento ou travando**

**Causa:** Pouca memória RAM ou CPU.

**Solução:**
1. Ver uso de recursos:
   ```bash
   pm2 monit
   ```
2. Aumentar memória da VPS (upgrade de plano)
3. Otimizar banco de dados (adicionar índices)

---

## 📈 Próximos Passos Após Instalação

1. ✅ **Configurar cache do Nginx** (seguir `GUIA_CACHE_NGINX.md`)
2. ✅ **Criar dados de demonstração** (disciplinas, turmas, alunos)
3. ✅ **Configurar backup automático** do banco de dados
4. ✅ **Monitorar logs** regularmente com `pm2 logs`
5. ✅ **Atualizar sistema** mensalmente com `apt update && apt upgrade`

---

## 📞 Suporte

Se você encontrar problemas:

1. **Veja os logs:**
   ```bash
   pm2 logs flowedu --lines 100
   ```

2. **Reinicie tudo:**
   ```bash
   pm2 restart flowedu
   sudo systemctl restart nginx
   ```

3. **Verifique o status:**
   ```bash
   pm2 status
   sudo systemctl status nginx
   ```

---

## ✅ Checklist Final

- [ ] VPS com Ubuntu 22.04 criada
- [ ] Domínio apontando para IP da VPS
- [ ] Banco de dados MySQL/TiDB configurado
- [ ] Script `install-flowedu.sh` executado com sucesso
- [ ] Arquivo `.env` configurado com `VITE_APP_ID`
- [ ] Aplicação rodando (`pm2 status`)
- [ ] Nginx rodando (`systemctl status nginx`)
- [ ] SSL configurado (cadeado verde no navegador)
- [ ] Site acessível em `https://seudominio.com`
- [ ] Login funcionando
- [ ] Cache do Nginx configurado (opcional, mas recomendado)

---

**🎉 Parabéns!** Seu FlowEdu está instalado e rodando em produção!
