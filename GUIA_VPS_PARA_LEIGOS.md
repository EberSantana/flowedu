# 🚀 Guia COMPLETO de Instalação do FlowEdu em VPS
## Para Pessoas SEM Experiência em Informática

> **Autor:** Manus AI  
> **Última atualização:** 22 de janeiro de 2026  
> **Tempo estimado:** 2-3 horas (fazendo com calma)  
> **Nível:** Iniciante absoluto

---

## 📚 ANTES DE COMEÇAR: Entenda o Básico

### O que você vai fazer?

Imagine que você está montando uma loja física. A VPS é como alugar um espaço comercial vazio. Você vai:

1. **Alugar o espaço** (contratar a VPS)
2. **Instalar a infraestrutura** (luz, água = Node.js, PM2, Nginx)
3. **Colocar seus produtos** (instalar o FlowEdu)
4. **Abrir as portas** (configurar domínio e SSL)

### Glossário Expandido (Termos que você vai encontrar)

| Termo | O que significa | Analogia do dia a dia |
|-------|----------------|----------------------|
| **VPS** | Virtual Private Server - Um computador na nuvem que você aluga | Como alugar um apartamento: é só seu, mas fica em um prédio compartilhado |
| **SSH** | Secure Shell - Forma segura de acessar seu servidor remotamente | Como usar controle remoto para operar um computador à distância |
| **Terminal** | Janela preta onde você digita comandos | Como o prompt de comando do Windows, mas mais poderoso |
| **Comando** | Instrução que você digita para o computador executar | Como dar uma ordem: "abra o navegador", "copie este arquivo" |
| **Root** | Usuário administrador com todos os poderes | Como ser o dono da casa: você pode fazer qualquer coisa |
| **Porta** | Número que identifica um serviço no servidor | Como número de apartamento: cada serviço tem seu número |
| **Domínio** | Endereço do seu site (ex: flowedu.com.br) | Como endereço de uma casa: mais fácil de lembrar que coordenadas GPS |
| **SSL/HTTPS** | Certificado de segurança (cadeado verde) | Como lacre de segurança em produtos: garante que ninguém mexeu |
| **Banco de Dados** | Lugar onde ficam salvos todos os dados do sistema | Como um arquivo Excel gigante e organizado |
| **PM2** | Gerenciador que mantém seu sistema rodando 24/7 | Como um zelador que reinicia a luz se ela cair |
| **Nginx** | Servidor web que recebe as visitas e direciona | Como recepcionista de hotel: recebe visitantes e direciona para o quarto certo |
| **Node.js** | Linguagem de programação que roda o FlowEdu | Como o motor de um carro: faz tudo funcionar |
| **Git** | Sistema para baixar e atualizar código | Como Dropbox para programadores |

---

## ✅ CHECKLIST: O que você precisa ter ANTES de começar

Marque cada item conforme conseguir:

- [ ] **Cartão de crédito** (para contratar VPS e domínio)
- [ ] **E-mail ativo** (para criar contas)
- [ ] **Computador** (Windows, Mac ou Linux)
- [ ] **Conexão com internet estável**
- [ ] **2-3 horas livres** (para fazer com calma)
- [ ] **Papel e caneta** (para anotar senhas - IMPORTANTE!)
- [ ] **Paciência** (vai dar certo, prometo!)

---

## 🎯 VISÃO GERAL: As 12 Etapas

```
ETAPA 1: Contratar VPS (Hostinger)           ⏱️ 15 min
ETAPA 2: Acessar VPS via SSH                 ⏱️ 10 min
ETAPA 3: Atualizar sistema operacional       ⏱️ 5 min
ETAPA 4: Instalar Node.js                    ⏱️ 10 min
ETAPA 5: Instalar PM2                        ⏱️ 5 min
ETAPA 6: Instalar Nginx                      ⏱️ 10 min
ETAPA 7: Configurar TiDB Cloud (banco)       ⏱️ 20 min
ETAPA 8: Baixar código do FlowEdu            ⏱️ 10 min
ETAPA 9: Configurar variáveis de ambiente    ⏱️ 15 min
ETAPA 10: Fazer build e iniciar sistema      ⏱️ 15 min
ETAPA 11: Configurar domínio                 ⏱️ 20 min
ETAPA 12: Instalar SSL (HTTPS)               ⏱️ 10 min
```

**Total:** ~2h 25min

---

## 📝 ETAPA 1: Contratar VPS na Hostinger

### Por que Hostinger?

- ✅ Interface em português
- ✅ Suporte 24/7 em português
- ✅ Preço acessível (~R$30/mês)
- ✅ Fácil de usar para iniciantes

### Passo a passo DETALHADO:

**1.1** Abra seu navegador (Chrome, Firefox, Edge, Safari)

**1.2** Digite na barra de endereço: `https://www.hostinger.com.br`

**1.3** Clique em **"VPS"** no menu superior

**1.4** Escolha o plano **"KVM 1"** (o mais barato, suficiente para começar)
- 1 vCPU (processador)
- 4 GB RAM (memória)
- 50 GB SSD (espaço)
- ~R$29,99/mês

**1.5** Clique em **"Adicionar ao carrinho"**

**1.6** Escolha o período:
- **Recomendado:** 12 meses (desconto maior)
- **Mínimo:** 1 mês (para testar)

**1.7** Crie sua conta:
- E-mail
- Senha forte (anote!)
- Nome completo

**1.8** Escolha forma de pagamento:
- Cartão de crédito (mais rápido)
- Boleto (demora 1-3 dias)
- PIX (instantâneo)

**1.9** Finalize a compra

**1.10** Aguarde o e-mail de confirmação (5-15 minutos)

### O que anotar:

```
📝 ANOTE AQUI:
E-mail Hostinger: _______________________________
Senha Hostinger: _______________________________
IP da VPS: ___.___.___.___ (vai chegar por e-mail)
```

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| Cartão recusado | Tente outro cartão ou use PIX |
| Não recebi e-mail | Verifique spam/lixo eletrônico |
| IP não aparece | Aguarde 15 min e atualize a página do painel |

---

## 📝 ETAPA 2: Acessar VPS via SSH

### O que é SSH?

SSH é como usar controle remoto para operar um computador à distância. Você vai digitar comandos no seu computador, mas eles serão executados na VPS.

### Para WINDOWS:

**2.1** Abra o **PowerShell**:
- Pressione a tecla **Windows** (aquela com o logo do Windows)
- Digite: `powershell`
- Pressione **Enter**
- Uma janela azul vai abrir

**2.2** Digite o comando para conectar:

```bash
ssh root@SEU_IP_AQUI
```

**IMPORTANTE:** Substitua `SEU_IP_AQUI` pelo IP que você recebeu por e-mail.

**Exemplo real:**
```bash
ssh root@203.0.113.45
```

**2.3** Pressione **Enter**

**2.4** Vai aparecer uma pergunta:
```
The authenticity of host '203.0.113.45' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

**O que fazer:** Digite `yes` e pressione **Enter**

**2.5** Digite a senha da VPS (veio no e-mail da Hostinger)

**⚠️ IMPORTANTE:** Quando você digitar a senha, **NÃO VAI APARECER NADA NA TELA**. Isso é normal! É uma medida de segurança. Continue digitando e pressione Enter.

**2.6** Se deu certo, você vai ver algo assim:

```
Welcome to Ubuntu 22.04 LTS
root@vps-12345:~#
```

**Parabéns! Você está dentro da VPS! 🎉**

### Para MAC:

**2.1** Abra o **Terminal**:
- Pressione **Command + Espaço**
- Digite: `terminal`
- Pressione **Enter**

**2.2** Siga os mesmos passos 2.2 a 2.6 do Windows acima

### Para LINUX:

Você provavelmente já sabe abrir o Terminal 😉 Siga os passos 2.2 a 2.6 do Windows.

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| "Connection refused" | Aguarde 5 minutos e tente novamente (VPS ainda está iniciando) |
| "Permission denied" | Senha errada. Copie e cole do e-mail |
| "Host key verification failed" | Digite: `ssh-keygen -R SEU_IP` e tente novamente |

---

## 📝 ETAPA 3: Atualizar Sistema Operacional

### Por que fazer isso?

É como atualizar o Windows ou iPhone: corrige bugs e melhora segurança.

### Passo a passo:

**3.1** Você está dentro da VPS (vê `root@vps-12345:~#`)

**3.2** Digite o primeiro comando:

```bash
apt update
```

**O que esse comando faz:** Busca a lista de atualizações disponíveis (como verificar atualizações no celular)

**3.3** Pressione **Enter**

**3.4** Vai aparecer várias linhas rolando. Aguarde terminar (30 segundos a 1 minuto)

**3.5** Quando parar e aparecer `root@vps-12345:~#` novamente, digite:

```bash
apt upgrade -y
```

**O que esse comando faz:** Instala todas as atualizações. O `-y` significa "sim para tudo" (não vai ficar perguntando)

**3.6** Pressione **Enter**

**3.7** Aguarde terminar (2-5 minutos). Vai aparecer muitas linhas rolando.

**3.8** Pronto! Sistema atualizado.

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| "Could not get lock" | Aguarde 2 minutos e tente novamente |
| "Failed to fetch" | Problema de internet. Tente novamente |

---

## 📝 ETAPA 4: Instalar Node.js

### O que é Node.js?

É o "motor" que faz o FlowEdu funcionar. Sem ele, o sistema não roda.

### Passo a passo:

**4.1** Digite o comando para adicionar o repositório do Node.js:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
```

**O que esse comando faz:** Baixa o instalador oficial do Node.js versão 20

**4.2** Pressione **Enter** e aguarde (30 segundos)

**4.3** Agora instale o Node.js:

```bash
apt install -y nodejs
```

**4.4** Pressione **Enter** e aguarde (1-2 minutos)

**4.5** Verifique se instalou corretamente:

```bash
node --version
```

**4.6** Deve aparecer algo como: `v20.11.0`

**4.7** Verifique o npm (gerenciador de pacotes):

```bash
npm --version
```

**4.8** Deve aparecer algo como: `10.2.4`

**Se apareceram os números, deu certo! ✅**

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| "command not found" | Reinstale: `apt install -y nodejs` |
| Versão antiga (v14, v16) | Remova e reinstale: `apt remove nodejs && apt install -y nodejs` |

---

## 📝 ETAPA 5: Instalar PM2

### O que é PM2?

É o "zelador" do sistema. Ele garante que o FlowEdu fique rodando 24/7. Se o sistema cair, ele reinicia automaticamente.

### Passo a passo:

**5.1** Digite o comando:

```bash
npm install -g pm2
```

**O que esse comando faz:** Instala o PM2 globalmente (disponível em todo o sistema)

**5.2** Pressione **Enter** e aguarde (1 minuto)

**5.3** Verifique se instalou:

```bash
pm2 --version
```

**5.4** Deve aparecer algo como: `5.3.0`

**5.5** Configure o PM2 para iniciar automaticamente quando a VPS reiniciar:

```bash
pm2 startup
```

**5.6** Vai aparecer um comando grande. **COPIE** esse comando e **COLE** no terminal, depois pressione Enter.

**Exemplo do que vai aparecer:**
```
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

**Pronto! PM2 instalado e configurado! ✅**

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| "permission denied" | Adicione `sudo` antes: `sudo npm install -g pm2` |
| "command not found" após instalar | Feche e abra o terminal novamente |

---

## 📝 ETAPA 6: Instalar Nginx

### O que é Nginx?

É o "recepcionista" do seu sistema. Ele recebe as visitas (usuários) e direciona para o FlowEdu. Também cuida do HTTPS (cadeado verde).

### Passo a passo:

**6.1** Digite o comando:

```bash
apt install -y nginx
```

**6.2** Pressione **Enter** e aguarde (1 minuto)

**6.3** Inicie o Nginx:

```bash
systemctl start nginx
```

**6.4** Configure para iniciar automaticamente:

```bash
systemctl enable nginx
```

**6.5** Verifique se está rodando:

```bash
systemctl status nginx
```

**6.6** Deve aparecer em verde: `active (running)`

**6.7** Pressione **Q** para sair da visualização

**6.8** Teste no navegador:
- Abra seu navegador
- Digite: `http://SEU_IP_AQUI`
- Deve aparecer: **"Welcome to nginx!"**

**Se apareceu a página do Nginx, deu certo! ✅**

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| "failed to start" | Digite: `nginx -t` para ver o erro |
| Página não carrega | Verifique firewall: `ufw allow 80` e `ufw allow 443` |

---

## 📝 ETAPA 7: Configurar TiDB Cloud (Banco de Dados)

### Por que TiDB Cloud?

- ✅ **Gratuito** (5GB)
- ✅ **Fácil de usar**
- ✅ **Não precisa instalar nada na VPS**
- ✅ **Backup automático**

### Passo a passo DETALHADO:

**7.1** Abra uma nova aba no navegador

**7.2** Acesse: `https://tidbcloud.com`

**7.3** Clique em **"Sign Up"** (Cadastrar)

**7.4** Escolha uma opção:
- **Google** (mais rápido)
- **GitHub**
- **E-mail** (crie senha forte e anote!)

**7.5** Após fazer login, clique em **"Create Cluster"**

**7.6** Escolha **"Serverless"** (plano gratuito)

**7.7** Preencha:
- **Cluster Name:** `flowedu-db`
- **Cloud Provider:** AWS
- **Region:** São Paulo (sa-east-1) ou mais próximo de você

**7.8** Clique em **"Create"**

**7.9** Aguarde 2-3 minutos (vai aparecer "Creating...")

**7.10** Quando ficar verde "Active", clique no nome do cluster

**7.11** Clique em **"Connect"**

**7.12** Escolha **"General"**

**7.13** Crie uma senha:
- Clique em **"Generate Password"**
- **COPIE A SENHA** e cole em um lugar seguro
- **⚠️ ATENÇÃO:** Essa senha aparece UMA VEZ SÓ!

**7.14** Copie a **Connection String**. Vai ser algo assim:

```
mysql://usuario.root:SENHA_AQUI@gateway01.sa-east-1.prod.aws.tidbcloud.com:4000/test?sslmode=verify-identity
```

**7.15** Anote tudo:

```
📝 ANOTE AQUI:
Usuário TiDB: _______________________________
Senha TiDB: _______________________________
Connection String: _______________________________
```

**Pronto! Banco de dados criado! ✅**

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| Não consigo criar cluster | Verifique se confirmou o e-mail |
| Esqueci a senha | Clique em "Reset Password" no painel |
| Connection String não funciona | Verifique se copiou completa (começa com `mysql://`) |

---

## 📝 ETAPA 8: Baixar Código do FlowEdu

### Passo a passo:

**8.1** Volte para o terminal SSH (janela preta onde você estava)

**8.2** Vá para a pasta home:

```bash
cd /home
```

**8.3** Clone o repositório do GitHub:

```bash
git clone https://github.com/EberSantana/flowedu.git
```

**O que esse comando faz:** Baixa todo o código do FlowEdu do GitHub para a VPS

**8.4** Aguarde (1-2 minutos)

**8.5** Entre na pasta do projeto:

```bash
cd flowedu
```

**8.6** Liste os arquivos para confirmar:

```bash
ls -la
```

**8.7** Deve aparecer vários arquivos: `package.json`, `server`, `client`, etc.

**Se apareceram os arquivos, deu certo! ✅**

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| "repository not found" | Verifique se o nome está correto |
| "permission denied" | Use: `sudo git clone...` |
| Pasta vazia | Aguarde o download terminar completamente |

---

## 📝 ETAPA 9: Configurar Variáveis de Ambiente

### O que são variáveis de ambiente?

São "configurações secretas" do sistema: senha do banco, chaves de segurança, etc. É como guardar senhas em um cofre.

### Passo a passo:

**9.1** Você está dentro da pasta `/home/flowedu`

**9.2** Crie o arquivo `.env`:

```bash
nano .env
```

**O que esse comando faz:** Abre um editor de texto simples chamado Nano

**9.3** Vai abrir uma tela preta. Cole este conteúdo:

```env
# Banco de Dados
DATABASE_URL="COLE_AQUI_A_CONNECTION_STRING_DO_TIDB"

# Segurança
JWT_SECRET="cole_aqui_uma_senha_aleatoria_bem_longa_123456789"

# Servidor
NODE_ENV="production"
PORT=3000

# OAuth Manus (se estiver usando)
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"

# E-mail (Resend - opcional)
RESEND_API_KEY=""
EMAIL_FROM="noreply@seudominio.com"

# App
VITE_APP_TITLE="FlowEdu"
VITE_APP_LOGO=""
```

**9.4** **IMPORTANTE:** Substitua:
- `COLE_AQUI_A_CONNECTION_STRING_DO_TIDB` → Cole a connection string que você copiou na ETAPA 7
- `cole_aqui_uma_senha_aleatoria_bem_longa_123456789` → Invente uma senha longa e aleatória

**9.5** Para salvar:
- Pressione **Ctrl + O** (letra O, não zero)
- Pressione **Enter**
- Pressione **Ctrl + X** para sair

**Pronto! Variáveis configuradas! ✅**

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| Não consigo colar | Use Ctrl+Shift+V ou botão direito do mouse |
| Arquivo não salva | Verifique se tem permissão: `sudo nano .env` |
| Connection string inválida | Verifique se copiou completa do TiDB |

---

## 📝 ETAPA 10: Fazer Build e Iniciar Sistema

### Passo a passo:

**10.1** Instale as dependências do projeto:

```bash
npm install
```

**O que esse comando faz:** Baixa todas as bibliotecas que o FlowEdu precisa

**10.2** Aguarde (3-5 minutos). Vai aparecer muitas linhas.

**10.3** Faça o build (compilação):

```bash
npm run build
```

**O que esse comando faz:** Prepara o código para rodar em produção (otimiza e compacta)

**10.4** Aguarde (2-3 minutos)

**10.5** Aplique os índices do banco de dados:

```bash
npm run db:push
```

**O que esse comando faz:** Cria as tabelas no banco de dados

**10.6** Inicie o sistema com PM2:

```bash
pm2 start ecosystem.config.js
```

**10.7** Verifique se está rodando:

```bash
pm2 status
```

**10.8** Deve aparecer:

```
┌────┬────────────┬─────────┬─────────┬──────────┐
│ id │ name       │ status  │ restart │ uptime   │
├────┼────────────┼─────────┼─────────┼──────────┤
│ 0  │ flowedu    │ online  │ 0       │ 5s       │
└────┴────────────┴─────────┴─────────┴──────────┘
```

**Se status = "online", deu certo! ✅**

**10.9** Salve a configuração do PM2:

```bash
pm2 save
```

**10.10** Teste no navegador:
- Abra: `http://SEU_IP:3000`
- Deve aparecer a página inicial do FlowEdu!

**Pronto! Sistema rodando! 🎉**

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| "npm install" falha | Limpe cache: `npm cache clean --force` e tente novamente |
| Build falha | Verifique erros no terminal e corrija |
| PM2 status = "errored" | Veja logs: `pm2 logs flowedu` |
| Porta 3000 não abre | Libere firewall: `ufw allow 3000` |

---

## 📝 ETAPA 11: Configurar Domínio

### O que você precisa:

- Um domínio registrado (ex: `flowedu.com.br`)
- Acesso ao painel do registrador (Registro.br, Hostinger, GoDaddy, etc.)

### Passo a passo:

**11.1** Acesse o painel do seu registrador de domínio

**11.2** Encontre a seção **"DNS"** ou **"Gerenciar DNS"**

**11.3** Adicione um registro tipo **A**:
- **Nome/Host:** `@` (ou deixe em branco)
- **Tipo:** A
- **Valor/Aponta para:** `SEU_IP_DA_VPS`
- **TTL:** 3600 (ou deixe padrão)

**11.4** Adicione outro registro tipo **A** para www:
- **Nome/Host:** `www`
- **Tipo:** A
- **Valor/Aponta para:** `SEU_IP_DA_VPS`
- **TTL:** 3600

**11.5** Salve as alterações

**11.6** Aguarde a propagação (5 minutos a 48 horas, geralmente 1-2 horas)

**11.7** Volte para o terminal SSH

**11.8** Configure o Nginx para o domínio:

```bash
nano /etc/nginx/sites-available/flowedu
```

**11.9** Cole este conteúdo (substitua `seudominio.com.br`):

```nginx
server {
    listen 80;
    server_name seudominio.com.br www.seudominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**11.10** Salve: **Ctrl + O**, **Enter**, **Ctrl + X**

**11.11** Crie link simbólico:

```bash
ln -s /etc/nginx/sites-available/flowedu /etc/nginx/sites-enabled/
```

**11.12** Teste a configuração:

```bash
nginx -t
```

**11.13** Deve aparecer: `syntax is ok` e `test is successful`

**11.14** Reinicie o Nginx:

```bash
systemctl reload nginx
```

**11.15** Teste no navegador:
- Abra: `http://seudominio.com.br`
- Deve aparecer o FlowEdu!

**Pronto! Domínio configurado! ✅**

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| DNS não propaga | Aguarde mais tempo (até 48h) |
| "502 Bad Gateway" | Verifique se PM2 está rodando: `pm2 status` |
| "nginx: test failed" | Corrija erro indicado e teste novamente |

---

## 📝 ETAPA 12: Instalar SSL (HTTPS - Cadeado Verde)

### Por que fazer isso?

- ✅ Segurança (dados criptografados)
- ✅ Google ranqueia melhor sites HTTPS
- ✅ Navegadores marcam HTTP como "não seguro"
- ✅ **É GRÁTIS** (Let's Encrypt)

### Passo a passo:

**12.1** Instale o Certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

**12.2** Aguarde (1 minuto)

**12.3** Execute o Certbot:

```bash
certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

**⚠️ IMPORTANTE:** Substitua `seudominio.com.br` pelo seu domínio real

**12.4** Vai fazer algumas perguntas:

**Pergunta 1:** "Enter email address"
- Digite seu e-mail
- Pressione Enter

**Pergunta 2:** "Agree to terms of service"
- Digite `Y` (sim)
- Pressione Enter

**Pergunta 3:** "Share email with EFF"
- Digite `N` (não) ou `Y` (sim), tanto faz
- Pressione Enter

**12.5** Aguarde (30 segundos)

**12.6** Se deu certo, vai aparecer:

```
Congratulations! You have successfully enabled HTTPS!
```

**12.7** Configure renovação automática:

```bash
certbot renew --dry-run
```

**12.8** Se aparecer "Congratulations", está tudo certo!

**12.9** Teste no navegador:
- Abra: `https://seudominio.com.br` (com **S**)
- Deve aparecer o **cadeado verde** 🔒

**Pronto! SSL instalado! Sistema 100% seguro! 🎉**

### ⚠️ O que pode dar errado:

| Problema | Solução |
|----------|---------|
| "DNS problem" | DNS ainda não propagou. Aguarde e tente novamente |
| "Too many requests" | Aguarde 1 hora (limite de tentativas) |
| Certificado não renova | Configure cron: `crontab -e` e adicione: `0 3 * * * certbot renew` |

---

## 🎉 PARABÉNS! Sistema Instalado com Sucesso!

### ✅ Checklist Final

Marque tudo que você conseguiu:

- [ ] VPS contratada e acessível via SSH
- [ ] Node.js, PM2 e Nginx instalados
- [ ] TiDB Cloud configurado
- [ ] Código do FlowEdu baixado
- [ ] Variáveis de ambiente configuradas
- [ ] Sistema rodando com PM2
- [ ] Domínio apontando para VPS
- [ ] SSL (HTTPS) funcionando
- [ ] FlowEdu acessível em `https://seudominio.com.br`

---

## 🔧 Comandos Úteis para o Dia a Dia

### Ver status do sistema:
```bash
pm2 status
```

### Ver logs (erros):
```bash
pm2 logs flowedu
```

### Reiniciar sistema:
```bash
pm2 restart flowedu
```

### Parar sistema:
```bash
pm2 stop flowedu
```

### Atualizar código (depois de fazer mudanças):
```bash
cd /home/flowedu
git pull
npm install
npm run build
pm2 restart flowedu
```

### Ver uso de memória/CPU:
```bash
pm2 monit
```

### Verificar espaço em disco:
```bash
df -h
```

### Ver logs do Nginx:
```bash
tail -f /var/log/nginx/error.log
```

---

## 🆘 Solução de Problemas Comuns

### Problema: Site fora do ar

**Diagnóstico:**
```bash
pm2 status
```

**Se status = "stopped":**
```bash
pm2 start flowedu
```

**Se status = "errored":**
```bash
pm2 logs flowedu --lines 50
```
Leia o erro e corrija (geralmente problema de conexão com banco)

---

### Problema: Erro de conexão com banco de dados

**Solução:**
1. Verifique se a DATABASE_URL está correta:
```bash
cat /home/flowedu/.env | grep DATABASE_URL
```

2. Teste conexão com TiDB Cloud:
```bash
mysql -h gateway01.sa-east-1.prod.aws.tidbcloud.com -P 4000 -u SEU_USUARIO -p
```

3. Se não conectar, verifique:
   - Senha correta
   - IP da VPS liberado no TiDB Cloud (Settings → Network Access)

---

### Problema: Domínio não abre

**Diagnóstico:**
```bash
ping seudominio.com.br
```

**Se retornar IP errado:**
- DNS ainda não propagou (aguarde)
- Configuração DNS errada (verifique no registrador)

**Se retornar IP correto mas não abre:**
```bash
systemctl status nginx
```

Se não estiver rodando:
```bash
systemctl start nginx
```

---

### Problema: SSL expirou

**Solução:**
```bash
certbot renew
systemctl reload nginx
```

---

## 📞 Suporte

Se você seguiu TODOS os passos e ainda assim não funcionou:

1. **Revise cada etapa** - 90% dos problemas são por pular algum passo
2. **Veja os logs** - `pm2 logs flowedu` mostra o erro exato
3. **Pesquise o erro** - Copie a mensagem de erro e cole no Google
4. **Suporte Hostinger** - Chat 24/7 em português

---

## 🎓 Próximos Passos

Agora que o sistema está no ar:

1. **Configure backup automático** - Siga o guia `GUIA_LOGS_CENTRALIZADOS.md`
2. **Configure monitoramento** - Siga o guia `GUIA_MONITORAMENTO.md`
3. **Implemente verificação de e-mail** - Siga o guia `GUIA_VERIFICACAO_EMAIL.md`
4. **Teste todas as funcionalidades** - Use o `CHECKLIST_TESTES_PRE_DEPLOY.md`

---

## 📚 Referências

- [Documentação oficial Node.js](https://nodejs.org/docs/)
- [Documentação PM2](https://pm2.keymetrics.io/docs/)
- [Documentação Nginx](https://nginx.org/en/docs/)
- [Documentação TiDB Cloud](https://docs.pingcap.com/tidbcloud/)
- [Documentação Let's Encrypt](https://letsencrypt.org/docs/)

---

**Autor:** Manus AI  
**Versão:** 1.0  
**Data:** 22 de janeiro de 2026

**Boa sorte com seu FlowEdu! 🚀**
