# 🚀 Guia Completo: Migrar FlowEdu do Manus para sua VPS

## 📋 Índice
1. [O que você vai precisar](#1-o-que-você-vai-precisar)
2. [Glossário - Entenda os termos](#2-glossário---entenda-os-termos)
3. [ETAPA 1: Baixar o código do Manus](#etapa-1-baixar-o-código-do-manus)
4. [ETAPA 2: Contratar uma VPS](#etapa-2-contratar-uma-vps)
5. [ETAPA 3: Acessar sua VPS](#etapa-3-acessar-sua-vps)
6. [ETAPA 4: Preparar a VPS](#etapa-4-preparar-a-vps)
7. [ETAPA 5: Criar o banco de dados](#etapa-5-criar-o-banco-de-dados)
8. [ETAPA 6: Enviar o código para a VPS](#etapa-6-enviar-o-código-para-a-vps)
9. [ETAPA 7: Configurar variáveis de ambiente](#etapa-7-configurar-variáveis-de-ambiente)
10. [ETAPA 8: Instalar e iniciar o sistema](#etapa-8-instalar-e-iniciar-o-sistema)
11. [ETAPA 9: Configurar o Nginx](#etapa-9-configurar-o-nginx)
12. [ETAPA 10: Configurar domínio e SSL](#etapa-10-configurar-domínio-e-ssl)
13. [ETAPA 11: Testar tudo](#etapa-11-testar-tudo)
14. [Solução de problemas](#solução-de-problemas)
15. [Checklist final](#checklist-final)

---

## 1. O que você vai precisar

Antes de começar, tenha em mãos:

| Item | Descrição | Onde conseguir | Custo |
|------|-----------|----------------|-------|
| 💻 Computador | Windows, Mac ou Linux | Você já tem | - |
| 💳 Cartão de crédito | Para contratar VPS | Você já tem | - |
| 📧 E-mail | Para criar contas | Você já tem | - |
| 🌐 Domínio | Ex: flowedu.com.br | Registro.br ou Hostinger | R$40-60/ano |
| 🖥️ VPS | Servidor na nuvem | Hostinger ou DigitalOcean | R$30-50/mês |
| 🗄️ Banco de dados | TiDB Cloud (gratuito) | tidbcloud.com | Grátis |

**⏱️ Tempo estimado:** 2-3 horas (primeira vez)

---

## 2. Glossário - Entenda os termos

Antes de começar, vamos entender alguns termos técnicos usando analogias do dia a dia:

| Termo | O que é | Analogia |
|-------|---------|----------|
| **VPS** | Um computador que fica ligado 24h na internet | Como alugar um apartamento na nuvem |
| **SSH** | Forma de acessar a VPS remotamente | Como uma ligação telefônica para o computador |
| **Terminal** | Tela preta onde você digita comandos | Como o WhatsApp, mas para falar com o computador |
| **Domínio** | O endereço do seu site (ex: flowedu.com.br) | Como o endereço da sua casa |
| **SSL** | Cadeado verde que aparece no navegador | Como um selo de segurança |
| **Nginx** | Programa que recebe visitantes do site | Como um porteiro do prédio |
| **PM2** | Programa que mantém o sistema rodando | Como um vigia que reinicia se algo parar |
| **Node.js** | Programa que executa o FlowEdu | Como o motor de um carro |
| **Git** | Sistema para baixar e atualizar código | Como um Dropbox para programadores |
| **Banco de dados** | Onde ficam salvos os dados (alunos, notas) | Como um arquivo de fichas |

---

## ETAPA 1: Baixar o código do Manus

### 1.1 Acessar o painel do Manus

1. Abra o navegador (Chrome, Firefox, etc.)
2. Acesse o projeto FlowEdu no Manus
3. Clique no ícone de **Código** (Code) no painel direito
4. Clique em **"Download All Files"** (Baixar todos os arquivos)

### 1.2 Salvar o arquivo

1. O navegador vai baixar um arquivo chamado `teacher_schedule_system.zip` (ou similar)
2. Salve na pasta **Downloads** do seu computador
3. **NÃO descompacte ainda** - vamos fazer isso na VPS

### 1.3 Alternativa: Usar o GitHub

Se você conectou o projeto ao GitHub:

1. Acesse: https://github.com/SEU_USUARIO/flowedu
2. Clique no botão verde **"Code"**
3. Clique em **"Download ZIP"**
4. Salve na pasta Downloads

**✅ Checkpoint:** Você tem o arquivo .zip do projeto salvo no seu computador.

---

## ETAPA 2: Contratar uma VPS

Vou mostrar como contratar na **Hostinger** (mais fácil para iniciantes).

### 2.1 Criar conta na Hostinger

1. Abra o navegador
2. Acesse: **https://www.hostinger.com.br**
3. Clique em **"VPS"** no menu superior
4. Escolha o plano **"KVM 1"** (o mais barato, suficiente para começar)
   - 1 vCPU
   - 4 GB RAM
   - 50 GB SSD
   - Preço: ~R$30-40/mês

### 2.2 Finalizar a compra

1. Clique em **"Adicionar ao carrinho"**
2. Crie uma conta com seu e-mail
3. Escolha o período (1 mês para testar, 12 meses para desconto)
4. Pague com cartão de crédito ou PIX

### 2.3 Configurar a VPS

Após o pagamento, você será direcionado para configurar:

1. **Sistema Operacional:** Escolha **Ubuntu 22.04** (importante!)
2. **Localização:** Escolha **São Paulo** (mais perto = mais rápido)
3. **Senha de root:** 
   - Crie uma senha FORTE (mínimo 12 caracteres)
   - Exemplo: `FlowEdu@2024#Seguro!`
   - **ANOTE ESSA SENHA EM UM LUGAR SEGURO!**

4. Clique em **"Criar VPS"**
5. Aguarde 2-5 minutos para a VPS ser criada

### 2.4 Anotar informações importantes

Após a criação, anote:

```
IP da VPS: ___.___.___.___  (ex: 189.123.45.67)
Usuário: root
Senha: _________________ (a que você criou)
```

**✅ Checkpoint:** Você tem uma VPS criada com Ubuntu 22.04 e anotou o IP e senha.

---

## ETAPA 3: Acessar sua VPS

Agora vamos "entrar" na sua VPS usando SSH.

### 3.1 Se você usa Windows

#### Opção A: Usar o PowerShell (mais fácil)

1. Clique no botão **Iniciar** do Windows
2. Digite **"PowerShell"**
3. Clique com botão direito e escolha **"Executar como administrador"**
4. Uma janela azul escura vai abrir

#### Opção B: Usar o PuTTY (alternativa)

1. Baixe o PuTTY: https://www.putty.org/
2. Instale normalmente
3. Abra o PuTTY
4. Em "Host Name" digite o IP da sua VPS
5. Clique em "Open"

### 3.2 Se você usa Mac

1. Pressione **Command + Espaço**
2. Digite **"Terminal"**
3. Pressione **Enter**
4. Uma janela branca/preta vai abrir

### 3.3 Conectar na VPS

Na janela do terminal (PowerShell, Terminal ou PuTTY), digite:

```bash
ssh root@SEU_IP_AQUI
```

**Exemplo real:**
```bash
ssh root@189.123.45.67
```

**O que vai acontecer:**

1. Primeira vez: vai aparecer uma mensagem perguntando se confia no servidor
   - Digite: `yes` e pressione Enter

2. Vai pedir a senha
   - Digite a senha que você criou (não aparece nada na tela, é normal!)
   - Pressione Enter

3. Se deu certo, você verá algo assim:
```
Welcome to Ubuntu 22.04 LTS
root@vps-12345:~#
```

**🎉 Parabéns! Você está dentro da sua VPS!**

### 3.4 Se der erro de conexão

| Erro | Solução |
|------|---------|
| "Connection refused" | A VPS ainda está iniciando. Aguarde 5 minutos. |
| "Connection timed out" | Verifique se o IP está correto. |
| "Permission denied" | Senha incorreta. Tente novamente. |

**✅ Checkpoint:** Você conseguiu acessar a VPS via SSH.

---

## ETAPA 4: Preparar a VPS

Agora vamos instalar tudo que o FlowEdu precisa para funcionar.

### 4.1 Atualizar o sistema

**O que é:** Como atualizar o Windows Update, mas para Linux.

Digite cada comando e pressione Enter. Aguarde cada um terminar antes de digitar o próximo:

```bash
apt update
```
(Aguarde terminar - pode levar 1-2 minutos)

```bash
apt upgrade -y
```
(Aguarde terminar - pode levar 3-5 minutos. Se perguntar algo, digite `Y` e Enter)

### 4.2 Instalar o Node.js

**O que é:** O "motor" que faz o FlowEdu funcionar.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
```
(Aguarde terminar)

```bash
apt install -y nodejs
```
(Aguarde terminar)

**Verificar se instalou corretamente:**
```bash
node --version
```

Deve aparecer algo como: `v22.x.x`

### 4.3 Instalar o pnpm

**O que é:** Gerenciador de pacotes (como uma loja de apps para o Node.js).

```bash
npm install -g pnpm
```

**Verificar:**
```bash
pnpm --version
```

Deve aparecer algo como: `9.x.x`

### 4.4 Instalar o PM2

**O que é:** O "vigia" que mantém o sistema rodando 24h.

```bash
npm install -g pm2
```

**Verificar:**
```bash
pm2 --version
```

### 4.5 Instalar o Nginx

**O que é:** O "porteiro" que recebe os visitantes do site.

```bash
apt install -y nginx
```

**Verificar se está rodando:**
```bash
systemctl status nginx
```

Deve aparecer: `Active: active (running)`

Pressione `q` para sair.

### 4.6 Instalar o Git

**O que é:** Sistema para baixar código do GitHub.

```bash
apt install -y git
```

### 4.7 Instalar ferramentas extras

```bash
apt install -y unzip curl wget
```

**✅ Checkpoint:** Sua VPS tem Node.js, pnpm, PM2, Nginx e Git instalados.

---

## ETAPA 5: Criar o banco de dados

Vamos usar o **TiDB Cloud** (gratuito e fácil).

### 5.1 Criar conta no TiDB Cloud

1. Abra o navegador no seu computador (não na VPS)
2. Acesse: **https://tidbcloud.com**
3. Clique em **"Start Free"**
4. Crie conta com Google, GitHub ou e-mail

### 5.2 Criar um cluster (banco de dados)

1. Após login, clique em **"Create Cluster"**
2. Escolha **"Serverless"** (gratuito)
3. **Cluster Name:** Digite `flowedu`
4. **Region:** Escolha **São Paulo** (ou a mais próxima)
5. Clique em **"Create"**
6. Aguarde 1-2 minutos

### 5.3 Configurar acesso

1. Clique no cluster `flowedu` que você criou
2. Clique em **"Connect"** (botão azul)
3. Clique em **"Create Password"**
4. **ANOTE A SENHA GERADA!** (ela só aparece uma vez)

### 5.4 Obter a string de conexão

1. Na mesma tela, em "Connect With", escolha **"General"**
2. Copie a **Connection String** que aparece
3. Ela será algo assim:

```
mysql://SEU_USUARIO:SUA_SENHA@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/flowedu?ssl={"rejectUnauthorized":true}
```

### 5.5 Montar sua DATABASE_URL

Substitua os valores na string:

```
mysql://USUARIO:SENHA@SERVIDOR:4000/flowedu?ssl={"rejectUnauthorized":true}
```

**Exemplo completo:**
```
mysql://3rK9xHj2.root:AbCdEf123456@gateway01.sa-saopaulo-1.prod.aws.tidbcloud.com:4000/flowedu?ssl={"rejectUnauthorized":true}
```

**ANOTE ESSA URL COMPLETA!** Você vai precisar dela.

**✅ Checkpoint:** Você tem o banco de dados criado e a DATABASE_URL anotada.

---

## ETAPA 6: Enviar o código para a VPS

### 6.1 Opção A: Usando GitHub (Recomendado)

Se seu código está no GitHub:

**Na VPS, digite:**

```bash
cd /var/www
```

```bash
git clone https://github.com/SEU_USUARIO/flowedu.git
```

**Exemplo:**
```bash
git clone https://github.com/EberSantana/flowedu.git
```

Se pedir usuário e senha do GitHub:
- Usuário: seu e-mail do GitHub
- Senha: use um **Personal Access Token** (não a senha normal)
  - Crie em: GitHub → Settings → Developer settings → Personal access tokens

### 6.2 Opção B: Enviando o arquivo ZIP

Se você baixou o ZIP do Manus:

**No seu computador (não na VPS):**

#### Windows (PowerShell):
```powershell
scp C:\Users\SEU_USUARIO\Downloads\teacher_schedule_system.zip root@SEU_IP:/var/www/
```

#### Mac (Terminal):
```bash
scp ~/Downloads/teacher_schedule_system.zip root@SEU_IP:/var/www/
```

**Na VPS, descompacte:**

```bash
cd /var/www
```

```bash
unzip teacher_schedule_system.zip
```

```bash
mv teacher_schedule_system flowedu
```

### 6.3 Verificar se o código está lá

```bash
ls /var/www/flowedu
```

Deve aparecer arquivos como: `package.json`, `client`, `server`, etc.

**✅ Checkpoint:** O código do FlowEdu está na pasta /var/www/flowedu

---

## ETAPA 7: Configurar variáveis de ambiente

As variáveis de ambiente são como "configurações secretas" do sistema.

### 7.1 Criar o arquivo .env

```bash
cd /var/www/flowedu
```

```bash
nano .env
```

**O que é nano:** Um editor de texto simples. Vai abrir uma tela para você digitar.

### 7.2 Colar as variáveis

Cole o seguinte conteúdo (substitua os valores em MAIÚSCULAS):

```env
# Banco de Dados (cole sua DATABASE_URL do TiDB)
DATABASE_URL="mysql://USUARIO:SENHA@SERVIDOR:4000/flowedu?ssl={\"rejectUnauthorized\":true}"

# Segurança (gere uma senha aleatória longa)
JWT_SECRET="GERE_UMA_SENHA_ALEATORIA_DE_32_CARACTERES_AQUI"

# Configurações do App
NODE_ENV="production"
PORT="3000"

# Configurações visuais
VITE_APP_TITLE="FlowEdu"
VITE_APP_LOGO="/logo.png"

# E-mail (opcional - para recuperação de senha)
# RESEND_API_KEY="sua_chave_resend"
# EMAIL_FROM="noreply@seudominio.com.br"
```

### 7.3 Gerar JWT_SECRET

Para gerar uma senha aleatória segura, abra outro terminal e digite:

```bash
openssl rand -base64 32
```

Copie o resultado e cole no lugar de `GERE_UMA_SENHA_ALEATORIA_DE_32_CARACTERES_AQUI`

### 7.4 Salvar o arquivo

1. Pressione **Ctrl + X** (para sair)
2. Digite **Y** (para confirmar que quer salvar)
3. Pressione **Enter** (para confirmar o nome do arquivo)

### 7.5 Verificar se salvou

```bash
cat .env
```

Deve mostrar o conteúdo que você digitou.

**✅ Checkpoint:** Arquivo .env criado com as configurações.

---

## ETAPA 8: Instalar e iniciar o sistema

### 8.1 Instalar dependências

```bash
cd /var/www/flowedu
```

```bash
pnpm install
```

**Aguarde!** Isso pode levar 3-5 minutos. Vai baixar todos os pacotes necessários.

### 8.2 Criar as tabelas no banco de dados

```bash
pnpm db:push
```

Se aparecer uma pergunta, digite `y` e Enter.

### 8.3 Fazer o build de produção

```bash
pnpm build
```

**Aguarde!** Isso pode levar 2-3 minutos.

Se aparecer "Build completed" ou similar, deu certo!

### 8.4 Testar se funciona

```bash
pnpm start
```

Deve aparecer algo como:
```
Server running on http://localhost:3000/
```

Pressione **Ctrl + C** para parar (vamos configurar o PM2 para rodar permanentemente).

### 8.5 Configurar o PM2

Criar arquivo de configuração:

```bash
nano ecosystem.config.cjs
```

Cole este conteúdo:

```javascript
module.exports = {
  apps: [{
    name: 'flowedu',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Salve: **Ctrl + X**, depois **Y**, depois **Enter**

### 8.6 Iniciar com PM2

```bash
pm2 start ecosystem.config.cjs
```

### 8.7 Verificar se está rodando

```bash
pm2 status
```

Deve mostrar:
```
│ id │ name     │ status │ cpu │ memory │
│ 0  │ flowedu  │ online │ 0%  │ 50mb   │
```

### 8.8 Configurar para iniciar automaticamente

```bash
pm2 startup
```

Copie e execute o comando que aparecer (começa com `sudo env PATH=...`)

```bash
pm2 save
```

**✅ Checkpoint:** FlowEdu está rodando com PM2.

---

## ETAPA 9: Configurar o Nginx

O Nginx vai receber as visitas e direcionar para o FlowEdu.

### 9.1 Criar arquivo de configuração

```bash
nano /etc/nginx/sites-available/flowedu
```

Cole este conteúdo (substitua `seudominio.com.br` pelo seu domínio real):

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    # Tamanho máximo de upload (75MB para materiais)
    client_max_body_size 75M;

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
}
```

Salve: **Ctrl + X**, depois **Y**, depois **Enter**

### 9.2 Ativar o site

```bash
ln -s /etc/nginx/sites-available/flowedu /etc/nginx/sites-enabled/
```

### 9.3 Remover configuração padrão

```bash
rm /etc/nginx/sites-enabled/default
```

### 9.4 Testar configuração

```bash
nginx -t
```

Deve aparecer:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 9.5 Reiniciar Nginx

```bash
systemctl restart nginx
```

### 9.6 Testar acesso

No seu navegador, acesse:
```
http://SEU_IP_DA_VPS
```

Exemplo: `http://189.123.45.67`

Se aparecer a tela do FlowEdu, funcionou! 🎉

**✅ Checkpoint:** Nginx configurado e site acessível pelo IP.

---

## ETAPA 10: Configurar domínio e SSL

### 10.1 Apontar domínio para a VPS

No painel do seu registrador de domínio (Registro.br, Hostinger, etc.):

1. Acesse a área de **DNS** ou **Zona DNS**
2. Crie ou edite o registro **A**:
   - **Tipo:** A
   - **Nome:** @ (ou deixe vazio)
   - **Valor:** IP da sua VPS (ex: 189.123.45.67)
   - **TTL:** 3600

3. Crie outro registro para www:
   - **Tipo:** A
   - **Nome:** www
   - **Valor:** IP da sua VPS
   - **TTL:** 3600

4. **Aguarde 15-30 minutos** para propagar

### 10.2 Verificar se o domínio está apontando

No terminal do seu computador (não na VPS):

```bash
ping seudominio.com.br
```

Deve mostrar o IP da sua VPS.

### 10.3 Instalar SSL gratuito (Let's Encrypt)

**Na VPS:**

```bash
apt install -y certbot python3-certbot-nginx
```

```bash
certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

**O que vai acontecer:**

1. Vai pedir seu e-mail (para avisos de renovação)
2. Vai pedir para aceitar os termos (digite `Y`)
3. Vai perguntar se quer redirecionar HTTP para HTTPS (escolha `2` para sim)

Se aparecer "Congratulations!", deu certo!

### 10.4 Testar o SSL

No navegador, acesse:
```
https://seudominio.com.br
```

Deve aparecer o cadeado verde 🔒 e o site do FlowEdu!

### 10.5 Configurar renovação automática

O certificado expira em 90 dias, mas o certbot renova automaticamente. Verifique:

```bash
certbot renew --dry-run
```

**✅ Checkpoint:** Domínio configurado com SSL (HTTPS).

---

## ETAPA 11: Testar tudo

### 11.1 Checklist de testes

Acesse seu site e teste:

| Teste | Como testar | Esperado |
|-------|-------------|----------|
| Página inicial | Acessar https://seudominio.com.br | Tela de login aparece |
| Cadastro professor | Clicar em "Cadastrar" | Formulário funciona |
| Login professor | Fazer login | Dashboard aparece |
| Criar disciplina | Menu → Disciplinas → Nova | Disciplina criada |
| Criar turma | Menu → Turmas → Nova | Turma criada |
| Portal aluno | Acessar como aluno | Dashboard do aluno |

### 11.2 Verificar logs se algo der errado

```bash
pm2 logs flowedu
```

Pressione **Ctrl + C** para sair.

### 11.3 Verificar uso de recursos

```bash
pm2 monit
```

Pressione **Ctrl + C** para sair.

**✅ Checkpoint:** Sistema funcionando em produção!

---

## Solução de problemas

### Problema: Site não abre

**Verificar se o PM2 está rodando:**
```bash
pm2 status
```

Se estiver "stopped" ou "errored":
```bash
pm2 restart flowedu
pm2 logs flowedu
```

**Verificar se o Nginx está rodando:**
```bash
systemctl status nginx
```

Se não estiver:
```bash
systemctl start nginx
```

### Problema: Erro 502 Bad Gateway

O FlowEdu não está respondendo. Verifique:

```bash
pm2 logs flowedu --lines 50
```

Provavelmente é erro no banco de dados. Verifique a DATABASE_URL no .env.

### Problema: Erro de banco de dados

Verifique se a DATABASE_URL está correta:

```bash
cat /var/www/flowedu/.env | grep DATABASE
```

Teste a conexão:
```bash
cd /var/www/flowedu && pnpm db:push
```

### Problema: Certificado SSL não funciona

```bash
certbot --nginx -d seudominio.com.br --force-renewal
```

### Problema: Sem espaço em disco

```bash
df -h
```

Se /dev/sda1 estiver em 100%, limpe logs antigos:
```bash
pm2 flush
apt autoremove -y
apt clean
```

---

## Checklist final

Antes de considerar o deploy completo, verifique:

- [ ] Site abre em https://seudominio.com.br
- [ ] Cadeado verde aparece (SSL funcionando)
- [ ] Login de professor funciona
- [ ] Login de aluno funciona
- [ ] Criar disciplina funciona
- [ ] Criar turma funciona
- [ ] Upload de material funciona
- [ ] PM2 está configurado para auto-restart
- [ ] Backup do banco de dados configurado

---

## 🎉 Parabéns!

Se você chegou até aqui, seu FlowEdu está rodando na sua própria VPS!

**Comandos úteis para o dia a dia:**

| Comando | O que faz |
|---------|-----------|
| `pm2 status` | Ver se o sistema está rodando |
| `pm2 restart flowedu` | Reiniciar o sistema |
| `pm2 logs flowedu` | Ver logs de erro |
| `pm2 monit` | Monitorar uso de recursos |

**Precisa de ajuda?**

Se algo der errado, você pode:
1. Verificar os logs: `pm2 logs flowedu`
2. Reiniciar o sistema: `pm2 restart flowedu`
3. Reiniciar a VPS: `reboot` (último recurso)

---

*Guia criado em Janeiro/2026 para o FlowEdu*
