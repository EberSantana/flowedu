# 🚀 Guia Completo de Deploy do FlowEdu em VPS

**Para Iniciantes - Passo a Passo Detalhado**

**Autor:** Manus AI  
**Data:** 19 de Janeiro de 2026  
**Tempo estimado:** 2-3 horas (primeira vez)

---

## 📋 Índice

1. [O que você vai precisar](#1-o-que-você-vai-precisar)
2. [Contratar um VPS](#2-contratar-um-vps)
3. [Acessar seu VPS pela primeira vez](#3-acessar-seu-vps-pela-primeira-vez)
4. [Preparar o servidor](#4-preparar-o-servidor)
5. [Instalar o Node.js](#5-instalar-o-nodejs)
6. [Instalar o PM2](#6-instalar-o-pm2)
7. [Configurar o banco de dados](#7-configurar-o-banco-de-dados)
8. [Baixar o código do FlowEdu](#8-baixar-o-código-do-flowedu)
9. [Configurar variáveis de ambiente](#9-configurar-variáveis-de-ambiente)
10. [Compilar e iniciar a aplicação](#10-compilar-e-iniciar-a-aplicação)
11. [Configurar o Nginx](#11-configurar-o-nginx)
12. [Configurar domínio e SSL](#12-configurar-domínio-e-ssl)
13. [Verificar se tudo está funcionando](#13-verificar-se-tudo-está-funcionando)
14. [Solução de problemas](#14-solução-de-problemas)

---

## 1. O que você vai precisar

Antes de começar, certifique-se de ter:

| Item | Descrição | Onde conseguir |
|------|-----------|----------------|
| **VPS** | Servidor virtual na nuvem | Hostinger, DigitalOcean, Contabo |
| **Domínio** | Endereço do seu site (ex: flowedu.com.br) | Registro.br, GoDaddy, Hostinger |
| **Banco de dados MySQL** | Onde os dados serão armazenados | TiDB Cloud (gratuito) ou MySQL no VPS |
| **Conta Resend** | Para envio de e-mails | resend.com (gratuito até 100 e-mails/dia) |

**Requisitos mínimos do VPS:**
- **RAM:** 2GB (mínimo) ou 4GB (recomendado)
- **CPU:** 1 vCPU (mínimo) ou 2 vCPU (recomendado)
- **Disco:** 20GB SSD
- **Sistema:** Ubuntu 22.04 LTS

---

## 2. Contratar um VPS

### Opção A: Hostinger (Recomendado para iniciantes)

A Hostinger é uma das opções mais fáceis para quem está começando, com painel em português e suporte 24h.

**Passo 1:** Acesse [hostinger.com.br](https://www.hostinger.com.br/servidor-vps)

**Passo 2:** Escolha o plano **VPS 2** (2GB RAM, 2 vCPU) - aproximadamente R$ 30-50/mês

**Passo 3:** Durante a configuração, selecione:
- **Sistema operacional:** Ubuntu 22.04
- **Localização:** São Paulo (para menor latência no Brasil)

**Passo 4:** Defina uma **senha forte** para o usuário root (anote em lugar seguro!)

**Passo 5:** Após a compra, você receberá:
- **Endereço IP** do servidor (ex: 123.45.67.89)
- **Usuário:** root
- **Senha:** a que você definiu

### Opção B: DigitalOcean

**Passo 1:** Acesse [digitalocean.com](https://www.digitalocean.com)

**Passo 2:** Crie uma conta (pode usar cartão de crédito ou PayPal)

**Passo 3:** Clique em **Create** → **Droplets**

**Passo 4:** Configure:
- **Image:** Ubuntu 22.04 (LTS) x64
- **Plan:** Basic → Regular → $12/mês (2GB RAM)
- **Datacenter:** São Paulo (se disponível) ou New York
- **Authentication:** Password (defina uma senha forte)

**Passo 5:** Clique em **Create Droplet** e aguarde 1-2 minutos

---

## 3. Acessar seu VPS pela primeira vez

Agora você precisa "entrar" no seu servidor para configurá-lo. Isso é feito através de um programa chamado **SSH** (Secure Shell).

### No Windows

**Passo 1:** Baixe e instale o **PuTTY** (programa gratuito para acessar servidores)
- Acesse: [putty.org](https://www.putty.org/)
- Clique em "Download PuTTY"
- Baixe a versão **64-bit x86** para Windows
- Execute o instalador e siga as instruções

**Passo 2:** Abra o PuTTY

**Passo 3:** Na tela inicial, preencha:
- **Host Name:** Digite o IP do seu VPS (ex: 123.45.67.89)
- **Port:** 22
- **Connection type:** SSH

**Passo 4:** Clique em **Open**

**Passo 5:** Se aparecer um aviso de segurança, clique em **Accept**

**Passo 6:** Digite:
- **login as:** `root`
- **Password:** sua senha (não aparece enquanto digita, é normal!)

**Passo 7:** Se tudo deu certo, você verá algo como:
```
Welcome to Ubuntu 22.04 LTS
root@servidor:~#
```

🎉 **Parabéns! Você está dentro do seu servidor!**

### No Mac ou Linux

**Passo 1:** Abra o **Terminal** (no Mac: Cmd+Espaço, digite "Terminal")

**Passo 2:** Digite o comando abaixo (substitua pelo seu IP):
```bash
ssh root@123.45.67.89
```

**Passo 3:** Digite **yes** se perguntar sobre a conexão

**Passo 4:** Digite sua senha (não aparece enquanto digita)

---

## 4. Preparar o servidor

Agora vamos atualizar o sistema e instalar programas básicos. **Copie e cole cada comando** no terminal (um de cada vez) e pressione Enter.

> 💡 **Dica:** No PuTTY, para colar use o botão direito do mouse. No Mac/Linux, use Cmd+V ou Ctrl+Shift+V.

### Passo 4.1: Atualizar o sistema

```bash
apt update && apt upgrade -y
```

**O que esse comando faz:** Atualiza a lista de programas disponíveis e instala as versões mais recentes. Pode demorar alguns minutos.

### Passo 4.2: Instalar programas essenciais

```bash
apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx
```

**O que esse comando faz:**
- `curl` e `wget`: Programas para baixar arquivos da internet
- `git`: Programa para baixar código de repositórios
- `build-essential`: Ferramentas para compilar programas
- `nginx`: Servidor web (vai receber as requisições dos usuários)
- `certbot`: Programa para gerar certificado SSL (HTTPS) gratuito

### Passo 4.3: Criar um usuário para a aplicação

Por segurança, não devemos rodar a aplicação como root. Vamos criar um usuário específico:

```bash
adduser flowedu
```

**O que vai acontecer:**
1. Vai pedir para criar uma senha para o usuário (crie uma senha forte e anote!)
2. Vai pedir informações como nome completo - pode deixar em branco e apertar Enter
3. No final, digite `Y` para confirmar

### Passo 4.4: Dar permissões ao usuário

```bash
usermod -aG sudo flowedu
```

**O que esse comando faz:** Permite que o usuário flowedu execute comandos administrativos quando necessário.

---

## 5. Instalar o Node.js

O FlowEdu é feito em Node.js, então precisamos instalá-lo.

### Passo 5.1: Instalar o NVM (gerenciador de versões do Node)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### Passo 5.2: Ativar o NVM

```bash
source ~/.bashrc
```

### Passo 5.3: Instalar o Node.js versão 22

```bash
nvm install 22
```

### Passo 5.4: Verificar se instalou corretamente

```bash
node --version
```

**Resultado esperado:** Deve mostrar algo como `v22.13.0` ou similar.

### Passo 5.5: Instalar o PNPM (gerenciador de pacotes)

```bash
npm install -g pnpm
```

### Passo 5.6: Verificar se instalou

```bash
pnpm --version
```

**Resultado esperado:** Deve mostrar um número de versão como `8.x.x`.

---

## 6. Instalar o PM2

O PM2 é um programa que mantém sua aplicação rodando 24 horas por dia, 7 dias por semana, e reinicia automaticamente se houver algum problema.

### Passo 6.1: Instalar o PM2

```bash
npm install -g pm2
```

### Passo 6.2: Configurar para iniciar automaticamente

```bash
pm2 startup
```

**O que vai acontecer:** O PM2 vai mostrar um comando para você copiar e colar. Faça isso!

---

## 7. Configurar o banco de dados

O FlowEdu precisa de um banco de dados MySQL para armazenar as informações.

### Opção A: TiDB Cloud (Recomendado - Gratuito)

TiDB Cloud oferece um banco de dados MySQL gratuito na nuvem, perfeito para começar.

**Passo 1:** Acesse [tidbcloud.com](https://tidbcloud.com)

**Passo 2:** Crie uma conta gratuita

**Passo 3:** Clique em **Create Cluster** → **Serverless** (gratuito)

**Passo 4:** Escolha:
- **Cluster Name:** flowedu-db
- **Region:** São Paulo (se disponível) ou mais próximo

**Passo 5:** Após criar, clique no cluster e vá em **Connect**

**Passo 6:** Escolha **General** e copie a **Connection String** que será algo como:
```
mysql://usuario:senha@gateway.tidbcloud.com:4000/flowedu?ssl=true
```

**Guarde essa string! Você vai precisar dela no passo 9.**

### Opção B: MySQL no próprio VPS

Se preferir ter o banco de dados no mesmo servidor:

**Passo 1:** Instalar MySQL

```bash
apt install -y mysql-server
```

**Passo 2:** Configurar segurança

```bash
mysql_secure_installation
```

Responda às perguntas:
- **VALIDATE PASSWORD:** Y (sim)
- **Password strength:** 2 (STRONG)
- **New password:** Crie uma senha forte
- **Remove anonymous users:** Y
- **Disallow root login remotely:** Y
- **Remove test database:** Y
- **Reload privileges:** Y

**Passo 3:** Criar banco de dados e usuário

```bash
mysql -u root -p
```

Digite a senha que você criou. Depois, execute:

```sql
CREATE DATABASE flowedu;
CREATE USER 'flowedu'@'localhost' IDENTIFIED BY 'SuaSenhaForteAqui123!';
GRANT ALL PRIVILEGES ON flowedu.* TO 'flowedu'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Sua connection string será:**
```
mysql://flowedu:SuaSenhaForteAqui123!@localhost:3306/flowedu
```

---

## 8. Baixar o código do FlowEdu

Agora vamos baixar o código da aplicação para o servidor.

### Passo 8.1: Trocar para o usuário flowedu

```bash
su - flowedu
```

### Passo 8.2: Criar pasta para a aplicação

```bash
mkdir -p ~/apps
cd ~/apps
```

### Passo 8.3: Baixar o código

**Se você tem o código em um repositório Git:**

```bash
git clone https://github.com/seu-usuario/flowedu.git
cd flowedu
```

**Se você vai enviar os arquivos manualmente:**

Você pode usar um programa como **FileZilla** (gratuito) para enviar os arquivos:

1. Baixe o FileZilla: [filezilla-project.org](https://filezilla-project.org/)
2. Conecte usando:
   - **Host:** sftp://seu-ip-do-vps
   - **Username:** flowedu
   - **Password:** senha do usuário flowedu
   - **Port:** 22
3. Navegue até `/home/flowedu/apps/`
4. Arraste a pasta do projeto para lá

### Passo 8.4: Instalar dependências

```bash
cd ~/apps/flowedu
pnpm install
```

**O que esse comando faz:** Baixa todas as bibliotecas que o FlowEdu precisa para funcionar. Pode demorar alguns minutos.

---

## 9. Configurar variáveis de ambiente

As variáveis de ambiente são configurações secretas que a aplicação precisa para funcionar (senhas, chaves de API, etc.).

### Passo 9.1: Criar arquivo de configuração

```bash
nano ~/apps/flowedu/.env
```

**O que é o nano:** É um editor de texto simples no terminal. Você vai digitar as configurações nele.

### Passo 9.2: Adicionar as configurações

Cole o conteúdo abaixo, **substituindo os valores** pelos seus:

```bash
# Ambiente
NODE_ENV=production

# Banco de Dados (substitua pela sua connection string do passo 7)
DATABASE_URL="mysql://usuario:senha@servidor:porta/flowedu"

# Segurança (gere uma string aleatória longa)
JWT_SECRET="sua-chave-secreta-muito-longa-e-aleatoria-aqui-123456789"

# Aplicação
VITE_APP_TITLE="FlowEdu"
VITE_APP_URL="https://seudominio.com.br"

# E-mail (Resend - crie conta em resend.com)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
EMAIL_FROM="FlowEdu <noreply@seudominio.com.br>"

# OAuth (se estiver usando autenticação Manus)
VITE_APP_ID="seu-app-id"
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://manus.im/login"

# Dono da aplicação
OWNER_OPEN_ID="seu-open-id"
OWNER_NAME="Seu Nome"
```

### Como gerar um JWT_SECRET seguro

Você pode usar este site para gerar: [randomkeygen.com](https://randomkeygen.com/)
- Copie uma das chaves da seção "CodeIgniter Encryption Keys"
- Cole no lugar de `sua-chave-secreta-muito-longa-e-aleatoria-aqui-123456789`

### Passo 9.3: Salvar o arquivo

1. Pressione **Ctrl + X** para sair
2. Digite **Y** para confirmar que quer salvar
3. Pressione **Enter** para confirmar o nome do arquivo

---

## 10. Compilar e iniciar a aplicação

### Passo 10.1: Compilar o código

```bash
cd ~/apps/flowedu
pnpm build
```

**O que esse comando faz:** Transforma o código fonte em código otimizado para produção. Pode demorar 1-2 minutos.

**Se aparecer algum erro:** Verifique se todas as variáveis de ambiente estão corretas no arquivo `.env`.

### Passo 10.2: Executar migrações do banco de dados

```bash
pnpm db:push
```

**O que esse comando faz:** Cria as tabelas necessárias no banco de dados.

### Passo 10.3: Iniciar a aplicação com PM2

```bash
pm2 start ecosystem.config.js
```

**Se não existir o arquivo ecosystem.config.js**, crie um:

```bash
nano ~/apps/flowedu/ecosystem.config.js
```

Cole este conteúdo:

```javascript
module.exports = {
  apps: [{
    name: 'flowedu',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '500M',
    error_file: '/home/flowedu/logs/flowedu-error.log',
    out_file: '/home/flowedu/logs/flowedu-out.log',
  }]
};
```

Salve (Ctrl+X, Y, Enter) e depois:

```bash
mkdir -p ~/logs
pm2 start ecosystem.config.js
```

### Passo 10.4: Verificar se está rodando

```bash
pm2 status
```

**Resultado esperado:** Deve mostrar "flowedu" com status "online".

### Passo 10.5: Salvar configuração do PM2

```bash
pm2 save
```

**O que esse comando faz:** Garante que a aplicação reinicie automaticamente se o servidor reiniciar.

---

## 11. Configurar o Nginx

O Nginx é o servidor web que vai receber as requisições dos usuários e direcioná-las para a aplicação.

### Passo 11.1: Voltar para o usuário root

```bash
exit
```

### Passo 11.2: Criar configuração do Nginx

```bash
nano /etc/nginx/sites-available/flowedu
```

### Passo 11.3: Colar a configuração

**Substitua `seudominio.com.br` pelo seu domínio real:**

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    # Logs
    access_log /var/log/nginx/flowedu-access.log;
    error_log /var/log/nginx/flowedu-error.log;

    # Tamanho máximo de upload (75MB)
    client_max_body_size 75M;

    # Proxy para a aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Cache para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Salve o arquivo (Ctrl+X, Y, Enter).

### Passo 11.4: Ativar a configuração

```bash
ln -s /etc/nginx/sites-available/flowedu /etc/nginx/sites-enabled/
```

### Passo 11.5: Remover configuração padrão

```bash
rm /etc/nginx/sites-enabled/default
```

### Passo 11.6: Testar configuração

```bash
nginx -t
```

**Resultado esperado:** Deve mostrar "syntax is ok" e "test is successful".

### Passo 11.7: Reiniciar Nginx

```bash
systemctl restart nginx
```

---

## 12. Configurar domínio e SSL

### Passo 12.1: Apontar domínio para o VPS

Acesse o painel do seu provedor de domínio (Registro.br, GoDaddy, Hostinger, etc.) e configure:

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | IP do seu VPS (ex: 123.45.67.89) |
| A | www | IP do seu VPS (ex: 123.45.67.89) |

**Aguarde:** A propagação do DNS pode levar de 5 minutos a 48 horas. Normalmente é rápido (menos de 1 hora).

### Passo 12.2: Verificar se o domínio está apontando

```bash
ping seudominio.com.br
```

Se mostrar o IP do seu VPS, está funcionando!

### Passo 12.3: Gerar certificado SSL (HTTPS)

```bash
certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

**O que vai acontecer:**
1. Vai pedir seu e-mail (para avisos de renovação)
2. Vai pedir para aceitar os termos (digite A)
3. Vai perguntar se quer compartilhar e-mail (digite N)
4. Vai configurar automaticamente o HTTPS

**Resultado esperado:** Mensagem de sucesso dizendo que o certificado foi instalado.

### Passo 12.4: Testar renovação automática

```bash
certbot renew --dry-run
```

**O que esse comando faz:** Testa se a renovação automática do certificado está funcionando. O certificado é renovado automaticamente a cada 90 dias.

---

## 13. Verificar se tudo está funcionando

### Passo 13.1: Acessar o site

Abra seu navegador e acesse:
```
https://seudominio.com.br
```

**O que você deve ver:** A página inicial do FlowEdu com os portais de Aluno e Professor.

### Passo 13.2: Verificar status da aplicação

```bash
su - flowedu
pm2 status
```

**Resultado esperado:** Status "online" para flowedu.

### Passo 13.3: Ver logs em tempo real

```bash
pm2 logs flowedu
```

Pressione **Ctrl+C** para sair dos logs.

### Passo 13.4: Testar funcionalidades

1. ✅ Acesse a página inicial
2. ✅ Tente fazer login como professor
3. ✅ Crie uma disciplina de teste
4. ✅ Crie uma turma de teste
5. ✅ Agende uma aula

---

## 14. Solução de problemas

### Problema: Site não carrega (erro 502 Bad Gateway)

**Causa:** A aplicação Node.js não está rodando.

**Solução:**
```bash
su - flowedu
cd ~/apps/flowedu
pm2 restart flowedu
pm2 logs flowedu
```

Verifique os logs para identificar o erro.

---

### Problema: Erro de conexão com banco de dados

**Causa:** A connection string está incorreta ou o banco não está acessível.

**Solução:**
1. Verifique se a DATABASE_URL no arquivo `.env` está correta
2. Teste a conexão:
```bash
mysql -h servidor -u usuario -p
```

---

### Problema: Certificado SSL não funciona

**Causa:** O domínio ainda não está apontando para o servidor.

**Solução:**
1. Verifique se o DNS está propagado:
```bash
dig seudominio.com.br
```
2. Aguarde mais tempo (até 48h em casos extremos)
3. Tente novamente:
```bash
certbot --nginx -d seudominio.com.br
```

---

### Problema: Aplicação reinicia constantemente

**Causa:** Erro no código ou falta de memória.

**Solução:**
```bash
pm2 logs flowedu --lines 100
```

Procure por mensagens de erro. Se for falta de memória, considere aumentar o plano do VPS.

---

### Problema: Uploads não funcionam

**Causa:** Limite de tamanho no Nginx.

**Solução:** Verifique se a linha `client_max_body_size 75M;` está no arquivo de configuração do Nginx.

---

## 📝 Comandos úteis para o dia a dia

| Comando | O que faz |
|---------|-----------|
| `pm2 status` | Ver status da aplicação |
| `pm2 logs flowedu` | Ver logs em tempo real |
| `pm2 restart flowedu` | Reiniciar aplicação |
| `pm2 stop flowedu` | Parar aplicação |
| `pm2 start flowedu` | Iniciar aplicação |
| `systemctl restart nginx` | Reiniciar Nginx |
| `certbot renew` | Renovar certificado SSL |

---

## 🔄 Como atualizar a aplicação

Quando houver uma nova versão do FlowEdu:

```bash
# 1. Acessar como usuário flowedu
su - flowedu
cd ~/apps/flowedu

# 2. Baixar atualizações (se usando Git)
git pull

# 3. Instalar novas dependências
pnpm install

# 4. Compilar
pnpm build

# 5. Executar migrações (se houver)
pnpm db:push

# 6. Reiniciar aplicação
pm2 restart flowedu
```

---

## ✅ Checklist final

Antes de considerar o deploy concluído, verifique:

- [ ] Site acessível via HTTPS
- [ ] Login de professor funcionando
- [ ] Login de aluno funcionando
- [ ] Criação de disciplinas funcionando
- [ ] Criação de turmas funcionando
- [ ] Agendamento de aulas funcionando
- [ ] Upload de materiais funcionando
- [ ] PM2 configurado para iniciar automaticamente
- [ ] Certificado SSL instalado
- [ ] Backup do banco de dados configurado

---

## 🆘 Precisa de ajuda?

Se encontrar algum problema que não consegue resolver:

1. **Verifique os logs:** `pm2 logs flowedu`
2. **Verifique o Nginx:** `tail -f /var/log/nginx/flowedu-error.log`
3. **Reinicie tudo:**
   ```bash
   pm2 restart flowedu
   systemctl restart nginx
   ```

---

**Parabéns! 🎉**

Se você chegou até aqui e tudo está funcionando, você acabou de fazer o deploy de uma aplicação web completa! Isso é uma conquista significativa, especialmente se é sua primeira vez.

---

*Guia criado por Manus AI em 19/01/2026*
