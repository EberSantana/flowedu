# 🚀 Guia ULTRA-DETALHADO de Deploy do FlowEdu

## Para Iniciantes Absolutos em Informática

**Não se preocupe se você nunca fez isso antes - vou te guiar em cada clique!**

---

## 📚 GLOSSÁRIO - Entenda os Termos Técnicos

Antes de começar, vamos entender o que cada palavra significa:

| Termo | O que é | Analogia do dia a dia |
|-------|---------|----------------------|
| **VPS** | Um computador na internet que fica ligado 24h | Como alugar um apartamento na nuvem para seu site morar |
| **Servidor** | O mesmo que VPS - um computador que "serve" seu site | Um garçom que entrega as páginas para quem acessa |
| **SSH** | Forma de acessar seu servidor remotamente | Como fazer uma ligação de vídeo para o computador |
| **Terminal** | Tela preta onde você digita comandos | Como o WhatsApp, mas você conversa com o computador |
| **Domínio** | O endereço do seu site (ex: flowedu.com.br) | O endereço da sua casa na internet |
| **DNS** | Sistema que traduz domínios em números | Como uma lista telefônica da internet |
| **SSL/HTTPS** | Cadeado de segurança do site | Como um envelope lacrado para suas informações |
| **Nginx** | Programa que recebe visitantes do site | Um porteiro que direciona as pessoas |
| **PM2** | Programa que mantém seu site no ar | Um vigia que reinicia tudo se der problema |
| **Node.js** | Linguagem em que o FlowEdu foi feito | O "idioma" que o computador entende |
| **Banco de dados** | Onde ficam salvos os dados (alunos, notas, etc) | Um arquivo gigante organizado |
| **MySQL/TiDB** | Tipos de banco de dados | Marcas diferentes de arquivos |

---

## 🎯 ANTES DE COMEÇAR

### O que você vai precisar ter em mãos:

1. **💳 Cartão de crédito ou débito** - Para contratar o VPS (~R$30-50/mês)
2. **📧 E-mail válido** - Para criar as contas
3. **📝 Bloco de notas** - Para anotar senhas (MUITO IMPORTANTE!)
4. **⏰ 2-3 horas livres** - Sem interrupções
5. **☕ Paciência** - É normal dar erro, faz parte!

### Dicas importantes:

> 💡 **ANOTE TODAS AS SENHAS** em um papel ou no bloco de notas do celular. Você vai criar várias senhas diferentes!

> ⚠️ **NÃO TENHA MEDO DE ERRAR** - Se algo der errado, você pode apagar tudo e começar de novo. Nada é permanente!

> 🔄 **COPIE E COLE** os comandos - Não tente digitar, é fácil errar uma letra

---

## 📋 ETAPA 1: Contratar o VPS (Servidor)

### Vamos usar a Hostinger (mais fácil para brasileiros)

**Tempo estimado: 15 minutos**

---

### Passo 1.1: Acessar o site

1. Abra seu navegador (Chrome, Firefox, Edge...)
2. Digite na barra de endereço: `hostinger.com.br`
3. Pressione **Enter**

---

### Passo 1.2: Criar uma conta

1. Clique no botão **"Entrar"** no canto superior direito
2. Clique em **"Criar conta"**
3. Você pode criar usando:
   - **Google** (mais fácil - clique no botão do Google)
   - **E-mail** (preencha os campos)
4. Siga as instruções na tela

---

### Passo 1.3: Escolher o plano VPS

1. No menu superior, passe o mouse em **"VPS"**
2. Clique em **"Hospedagem VPS"**
3. Você verá vários planos. Escolha o **VPS 2**:
   - 2 GB de RAM
   - 2 vCPU
   - 50 GB de armazenamento
   - Preço: aproximadamente R$ 30-50/mês

4. Clique em **"Adicionar ao carrinho"**

---

### Passo 1.4: Finalizar a compra

1. Escolha o período (1 mês para testar, ou 12 meses para desconto)
2. Preencha seus dados de pagamento
3. Clique em **"Enviar pagamento seguro"**
4. Aguarde a confirmação por e-mail (geralmente instantâneo)

---

### Passo 1.5: Configurar o VPS

Após a compra, você será direcionado para configurar:

1. **Sistema operacional:** Selecione **Ubuntu 22.04**
   - É o mais usado e tem mais tutoriais na internet

2. **Localização do servidor:** Selecione **São Paulo**
   - Quanto mais perto, mais rápido para usuários brasileiros

3. **Senha do root:** 
   - Crie uma senha FORTE (mínimo 12 caracteres)
   - Use letras maiúsculas, minúsculas, números e símbolos
   - Exemplo: `FlowEdu@2026!Seguro`
   - **⚠️ ANOTE ESSA SENHA! Você vai precisar dela!**

4. Clique em **"Continuar"** ou **"Criar"**

5. Aguarde 2-5 minutos enquanto o servidor é criado

---

### Passo 1.6: Anotar as informações do servidor

Após a criação, você verá uma tela com informações importantes. **ANOTE TUDO:**

```
┌─────────────────────────────────────────────┐
│  INFORMAÇÕES DO MEU SERVIDOR                │
│                                             │
│  Endereço IP: ___.___.___.___ (ex: 123.45.67.89)
│                                             │
│  Usuário: root                              │
│                                             │
│  Senha: ________________________            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📋 ETAPA 2: Acessar o Servidor (SSH)

### Vamos "entrar" no seu servidor pela internet

**Tempo estimado: 10 minutos**

---

### Se você usa WINDOWS:

#### Passo 2.1: Baixar o PuTTY

1. Abra o navegador
2. Digite: `putty.org`
3. Clique em **"Download PuTTY"**
4. Na página de downloads, clique em **"putty-64bit-X.XX-installer.msi"** (onde X.XX é a versão)
5. Quando terminar de baixar, clique no arquivo para instalar
6. Clique em **"Next"** → **"Next"** → **"Install"** → **"Finish"**

#### Passo 2.2: Abrir o PuTTY

1. Clique no menu **Iniciar** do Windows
2. Digite **"PuTTY"**
3. Clique no programa **PuTTY**

#### Passo 2.3: Conectar ao servidor

1. Na janela do PuTTY, você verá um campo **"Host Name (or IP address)"**
2. Digite o **IP do seu servidor** (aquele número que você anotou, ex: 123.45.67.89)
3. O campo **"Port"** deve estar com **22** (não mude)
4. Certifique-se que **"SSH"** está selecionado
5. Clique no botão **"Open"** (embaixo)

#### Passo 2.4: Aceitar a conexão

1. Vai aparecer uma janela de aviso (é normal na primeira vez)
2. Clique em **"Accept"** ou **"Sim"**

#### Passo 2.5: Fazer login

1. Vai aparecer uma tela preta pedindo **"login as:"**
2. Digite: `root`
3. Pressione **Enter**
4. Vai pedir **"Password:"**
5. Digite a senha que você criou (⚠️ **A SENHA NÃO APARECE ENQUANTO VOCÊ DIGITA - É NORMAL!**)
6. Pressione **Enter**

#### Passo 2.6: Verificar se funcionou

Se você ver algo assim, PARABÉNS! Você está dentro do servidor!

```
Welcome to Ubuntu 22.04 LTS

root@servidor:~#
```

O `root@servidor:~#` é o **prompt** - significa que o servidor está esperando você digitar comandos.

---

### Se você usa MAC:

#### Passo 2.1: Abrir o Terminal

1. Pressione **Command (⌘) + Espaço** para abrir o Spotlight
2. Digite **"Terminal"**
3. Pressione **Enter**

#### Passo 2.2: Conectar ao servidor

1. No Terminal, digite o comando abaixo (substitua pelo seu IP):
```bash
ssh root@123.45.67.89
```
2. Pressione **Enter**

#### Passo 2.3: Aceitar a conexão

1. Vai aparecer uma pergunta sobre "fingerprint"
2. Digite: `yes`
3. Pressione **Enter**

#### Passo 2.4: Digitar a senha

1. Digite sua senha (não aparece enquanto digita)
2. Pressione **Enter**

---

## 📋 ETAPA 3: Preparar o Servidor

### Agora vamos instalar os programas necessários

**Tempo estimado: 20 minutos**

> 💡 **DICA:** Para cada comando abaixo, copie o texto, cole no terminal e pressione Enter. Espere terminar antes de ir para o próximo.

> 💡 **COMO COLAR:**
> - No PuTTY (Windows): Clique com o **botão direito** do mouse
> - No Terminal (Mac): Pressione **Command + V**

---

### Passo 3.1: Atualizar o sistema

**Copie e cole este comando:**

```bash
apt update && apt upgrade -y
```

**O que esse comando faz:** Atualiza todos os programas do servidor para as versões mais recentes.

**Quanto tempo demora:** 2-5 minutos

**O que você vai ver:** Muitas linhas de texto passando. É normal! Espere até aparecer novamente o `root@servidor:~#`

---

### Passo 3.2: Instalar programas básicos

**Copie e cole este comando:**

```bash
apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx
```

**O que esse comando faz:** Instala vários programas que vamos precisar:
- `curl` e `wget` = Para baixar arquivos da internet
- `git` = Para baixar o código do FlowEdu
- `nginx` = O "porteiro" do site
- `certbot` = Para ter o cadeado de segurança (HTTPS)

**Quanto tempo demora:** 2-3 minutos

---

### Passo 3.3: Criar um usuário para a aplicação

Por segurança, não devemos rodar a aplicação como "root" (administrador). Vamos criar um usuário específico.

**Copie e cole este comando:**

```bash
adduser flowedu
```

**O que vai acontecer:**
1. Vai pedir para você criar uma **senha** para esse usuário
   - Digite uma senha (não aparece enquanto digita)
   - Pressione Enter
   - Digite a senha novamente para confirmar
   - Pressione Enter

2. Vai pedir informações (Full Name, Room Number, etc.)
   - **Pode deixar tudo em branco!** Apenas pressione Enter em cada pergunta

3. No final, vai perguntar "Is the information correct?"
   - Digite: `Y`
   - Pressione Enter

**⚠️ ANOTE ESSA SENHA TAMBÉM!**

---

### Passo 3.4: Dar permissões ao usuário

**Copie e cole este comando:**

```bash
usermod -aG sudo flowedu
```

**O que esse comando faz:** Permite que o usuário "flowedu" execute comandos de administrador quando necessário.

---

## 📋 ETAPA 4: Instalar o Node.js

### O FlowEdu é feito em Node.js, então precisamos instalá-lo

**Tempo estimado: 5 minutos**

---

### Passo 4.1: Instalar o NVM

O NVM é um programa que facilita instalar o Node.js.

**Copie e cole este comando:**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

**Quanto tempo demora:** Alguns segundos

---

### Passo 4.2: Ativar o NVM

**Copie e cole este comando:**

```bash
source ~/.bashrc
```

---

### Passo 4.3: Instalar o Node.js

**Copie e cole este comando:**

```bash
nvm install 22
```

**Quanto tempo demora:** 1-2 minutos

---

### Passo 4.4: Verificar se instalou

**Copie e cole este comando:**

```bash
node --version
```

**O que você deve ver:** Algo como `v22.13.0` (o número pode ser um pouco diferente)

Se aparecer um número de versão, **funcionou!** ✅

---

### Passo 4.5: Instalar o PNPM

O PNPM é um gerenciador de pacotes (programas) do Node.js.

**Copie e cole este comando:**

```bash
npm install -g pnpm
```

---

### Passo 4.6: Instalar o PM2

O PM2 mantém sua aplicação rodando 24 horas.

**Copie e cole este comando:**

```bash
npm install -g pm2
```

---

### Passo 4.7: Configurar PM2 para iniciar automaticamente

**Copie e cole este comando:**

```bash
pm2 startup
```

**O que vai acontecer:** O PM2 vai mostrar um comando para você executar. **Copie esse comando que apareceu e cole novamente no terminal.**

---

## 📋 ETAPA 5: Configurar o Banco de Dados (TiDB Cloud)

### Vamos criar um banco de dados gratuito na nuvem

**Tempo estimado: 15 minutos**

---

### Passo 5.1: Criar conta no TiDB Cloud

1. Abra uma **nova aba** no navegador (não feche o terminal!)
2. Acesse: `tidbcloud.com`
3. Clique em **"Start Free"** ou **"Sign Up"**
4. Crie uma conta usando:
   - **Google** (mais fácil)
   - **GitHub**
   - **E-mail**

---

### Passo 5.2: Criar um cluster (banco de dados)

1. Após fazer login, clique em **"Create Cluster"**
2. Selecione **"Serverless"** (é o gratuito!)
3. Configure:
   - **Cluster Name:** `flowedu-db`
   - **Region:** Escolha **São Paulo** se disponível, ou o mais próximo
4. Clique em **"Create"**
5. Aguarde 1-2 minutos enquanto o cluster é criado

---

### Passo 5.3: Configurar senha do banco

1. Após criar, clique no nome do cluster (`flowedu-db`)
2. Clique em **"Connect"** (botão azul)
3. Vai pedir para criar uma **senha do banco de dados**
   - Crie uma senha forte
   - **⚠️ ANOTE ESSA SENHA!**
4. Clique em **"Create Password"** ou **"Save"**

---

### Passo 5.4: Liberar acesso do seu servidor

1. Ainda na tela de Connect, procure por **"IP Access List"** ou **"Allowed IPs"**
2. Clique em **"Add IP"** ou **"Edit"**
3. Adicione o **IP do seu VPS** (aquele número que você anotou, ex: 123.45.67.89)
4. Clique em **"Save"** ou **"Add"**

---

### Passo 5.5: Copiar a Connection String

1. Na tela de Connect, procure por **"Connection String"** ou **"General"**
2. Você verá algo parecido com isso:

```
mysql://seu_usuario:sua_senha@gateway01-sa-east-1.prod.aws.tidbcloud.com:4000/test?ssl=true
```

3. **COPIE essa string inteira** e guarde em um lugar seguro
4. Vamos precisar modificá-la um pouco:
   - Troque `test` por `flowedu` (nome do banco)
   - A string final deve ficar assim:

```
mysql://seu_usuario:sua_senha@gateway01-sa-east-1.prod.aws.tidbcloud.com:4000/flowedu?ssl=true
```

**⚠️ GUARDE ESSA STRING! Você vai precisar dela no próximo passo.**

---

## 📋 ETAPA 6: Baixar e Configurar o FlowEdu

### Agora vamos colocar o código no servidor

**Tempo estimado: 20 minutos**

---

### Passo 6.1: Trocar para o usuário flowedu

Volte para o terminal (PuTTY ou Terminal do Mac).

**Copie e cole este comando:**

```bash
su - flowedu
```

**O que esse comando faz:** Troca do usuário "root" para o usuário "flowedu" que criamos.

O prompt vai mudar de `root@servidor:~#` para `flowedu@servidor:~$`

---

### Passo 6.2: Criar pasta para a aplicação

**Copie e cole estes comandos (um de cada vez):**

```bash
mkdir -p ~/apps
```

```bash
cd ~/apps
```

---

### Passo 6.3: Baixar o código do FlowEdu

Agora você precisa enviar os arquivos do FlowEdu para o servidor. Existem duas formas:

#### Opção A: Se você tem os arquivos no GitHub

**Copie e cole este comando (substitua pelo seu repositório):**

```bash
git clone https://github.com/seu-usuario/flowedu.git
```

```bash
cd flowedu
```

#### Opção B: Enviar arquivos manualmente (usando FileZilla)

1. Baixe o **FileZilla** em: `filezilla-project.org`
2. Instale e abra o programa
3. No topo, preencha:
   - **Host:** `sftp://` + IP do seu servidor (ex: `sftp://123.45.67.89`)
   - **Username:** `flowedu`
   - **Password:** A senha do usuário flowedu
   - **Port:** `22`
4. Clique em **"Quickconnect"**
5. No lado direito (servidor), navegue até `/home/flowedu/apps/`
6. No lado esquerdo (seu computador), encontre a pasta do FlowEdu
7. Arraste a pasta para o lado direito
8. Aguarde o upload terminar

---

### Passo 6.4: Instalar as dependências

**Copie e cole este comando:**

```bash
cd ~/apps/flowedu
pnpm install
```

**Quanto tempo demora:** 3-5 minutos

---

### Passo 6.5: Criar o arquivo de configuração (.env)

**Copie e cole este comando:**

```bash
nano .env
```

**O que vai acontecer:** Vai abrir um editor de texto simples dentro do terminal.

Agora você precisa colar o conteúdo abaixo, **substituindo os valores pelos seus:**

```env
# Banco de dados (cole sua connection string do TiDB)
DATABASE_URL="mysql://seu_usuario:sua_senha@gateway01-sa-east-1.prod.aws.tidbcloud.com:4000/flowedu?ssl=true"

# Segurança (crie uma string aleatória longa)
JWT_SECRET="crie_uma_senha_muito_longa_e_aleatoria_aqui_12345"

# Configurações da aplicação
NODE_ENV="production"
PORT="3000"

# Seu domínio (substitua pelo seu)
VITE_APP_URL="https://seudominio.com.br"

# E-mail (opcional - para recuperação de senha)
RESEND_API_KEY="sua_chave_do_resend"
EMAIL_FROM="noreply@seudominio.com.br"
```

**Como salvar o arquivo:**
1. Pressione **Ctrl + X** (para sair)
2. Digite **Y** (para confirmar que quer salvar)
3. Pressione **Enter** (para confirmar o nome do arquivo)

---

### Passo 6.6: Compilar a aplicação

**Copie e cole este comando:**

```bash
pnpm build
```

**Quanto tempo demora:** 2-3 minutos

**O que você vai ver:** Muitas linhas de texto. No final, deve aparecer algo como "Build completed" ou "Done".

---

### Passo 6.7: Criar as tabelas do banco de dados

**Copie e cole este comando:**

```bash
pnpm db:push
```

**O que esse comando faz:** Cria todas as tabelas necessárias no banco de dados.

---

### Passo 6.8: Iniciar a aplicação com PM2

**Copie e cole este comando:**

```bash
pm2 start npm --name "flowedu" -- start
```

---

### Passo 6.9: Verificar se está funcionando

**Copie e cole este comando:**

```bash
pm2 status
```

**O que você deve ver:**

```
┌─────┬──────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name     │ namespace   │ version │ mode    │ status   │
├─────┼──────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ flowedu  │ default     │ N/A     │ fork    │ online   │
└─────┴──────────┴─────────────┴─────────┴─────────┴──────────┘
```

Se o status for **"online"**, está funcionando! ✅

---

### Passo 6.10: Salvar configuração do PM2

**Copie e cole este comando:**

```bash
pm2 save
```

**O que esse comando faz:** Garante que a aplicação reinicie automaticamente se o servidor reiniciar.

---

## 📋 ETAPA 7: Configurar o Nginx

### O Nginx é o "porteiro" que vai receber os visitantes

**Tempo estimado: 10 minutos**

---

### Passo 7.1: Voltar para o usuário root

**Copie e cole este comando:**

```bash
exit
```

O prompt deve voltar para `root@servidor:~#`

---

### Passo 7.2: Criar arquivo de configuração do Nginx

**Copie e cole este comando:**

```bash
nano /etc/nginx/sites-available/flowedu
```

---

### Passo 7.3: Colar a configuração

**Cole o conteúdo abaixo, substituindo `seudominio.com.br` pelo seu domínio real:**

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
}
```

**Como salvar:**
1. Pressione **Ctrl + X**
2. Digite **Y**
3. Pressione **Enter**

---

### Passo 7.4: Ativar a configuração

**Copie e cole este comando:**

```bash
ln -s /etc/nginx/sites-available/flowedu /etc/nginx/sites-enabled/
```

---

### Passo 7.5: Remover configuração padrão

**Copie e cole este comando:**

```bash
rm -f /etc/nginx/sites-enabled/default
```

---

### Passo 7.6: Testar se a configuração está correta

**Copie e cole este comando:**

```bash
nginx -t
```

**O que você deve ver:**

```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Se aparecer **"syntax is ok"** e **"test is successful"**, está tudo certo! ✅

---

### Passo 7.7: Reiniciar o Nginx

**Copie e cole este comando:**

```bash
systemctl restart nginx
```

---

## 📋 ETAPA 8: Configurar Domínio e SSL (HTTPS)

### Vamos apontar seu domínio para o servidor e adicionar o cadeado de segurança

**Tempo estimado: 15-30 minutos (depende da propagação do DNS)**

---

### Passo 8.1: Configurar o DNS do seu domínio

1. Acesse o painel do seu provedor de domínio:
   - **Registro.br:** registro.br
   - **Hostinger:** hpanel.hostinger.com
   - **GoDaddy:** godaddy.com
   - **Cloudflare:** cloudflare.com

2. Procure por **"DNS"**, **"Zona DNS"** ou **"Gerenciar DNS"**

3. Adicione ou edite os seguintes registros:

| Tipo | Nome/Host | Valor/Aponta para | TTL |
|------|-----------|-------------------|-----|
| A | @ | IP do seu VPS (ex: 123.45.67.89) | 3600 |
| A | www | IP do seu VPS (ex: 123.45.67.89) | 3600 |

4. Salve as alterações

---

### Passo 8.2: Aguardar a propagação do DNS

O DNS pode levar de **5 minutos a 48 horas** para propagar. Normalmente é rápido (menos de 1 hora).

**Para verificar se já propagou:**

Volte ao terminal e digite:

```bash
ping seudominio.com.br
```

Se mostrar o IP do seu VPS, está funcionando! Pressione **Ctrl + C** para parar.

---

### Passo 8.3: Gerar o certificado SSL (HTTPS)

**⚠️ IMPORTANTE:** Só execute este passo DEPOIS que o DNS estiver propagado!

**Copie e cole este comando (substitua pelo seu domínio):**

```bash
certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

**O que vai acontecer:**
1. Vai pedir seu **e-mail** (para avisos de renovação) - digite e pressione Enter
2. Vai pedir para aceitar os termos - digite **A** e pressione Enter
3. Vai perguntar se quer compartilhar e-mail - digite **N** e pressione Enter
4. Vai configurar automaticamente o HTTPS

**Resultado esperado:** Mensagem de sucesso dizendo que o certificado foi instalado!

---

### Passo 8.4: Testar renovação automática

**Copie e cole este comando:**

```bash
certbot renew --dry-run
```

Se não aparecer erros, a renovação automática está funcionando! ✅

---

## 📋 ETAPA 9: Testar Tudo!

### Vamos verificar se tudo está funcionando

---

### Passo 9.1: Acessar o site

1. Abra seu navegador
2. Digite: `https://seudominio.com.br`
3. Pressione Enter

**O que você deve ver:** A página inicial do FlowEdu com os portais de Aluno e Professor!

---

### Passo 9.2: Verificar o cadeado de segurança

1. Olhe na barra de endereço do navegador
2. Deve aparecer um **cadeado** 🔒 antes do endereço
3. Se aparecer, o SSL está funcionando! ✅

---

### Passo 9.3: Testar funcionalidades básicas

- [ ] Página inicial carrega
- [ ] Consegue acessar o Portal do Professor
- [ ] Consegue fazer cadastro/login
- [ ] Consegue criar uma disciplina
- [ ] Consegue criar uma turma

---

## 🎉 PARABÉNS!

Se você chegou até aqui e tudo está funcionando, você acabou de fazer o **deploy de uma aplicação web completa**!

Isso é uma conquista ENORME, especialmente se é sua primeira vez. Muitos desenvolvedores profissionais levaram anos para aprender isso!

---

## 🆘 PROBLEMAS COMUNS E SOLUÇÕES

### Problema: "Não consigo acessar o site"

**Verifique:**
1. O PM2 está rodando? `pm2 status` (deve mostrar "online")
2. O Nginx está rodando? `systemctl status nginx`
3. O DNS está propagado? `ping seudominio.com.br`

**Solução rápida:**
```bash
pm2 restart flowedu
systemctl restart nginx
```

---

### Problema: "Erro 502 Bad Gateway"

**Causa:** A aplicação Node.js não está rodando.

**Solução:**
```bash
su - flowedu
cd ~/apps/flowedu
pm2 logs flowedu
```

Veja os logs para identificar o erro.

---

### Problema: "Erro de conexão com banco de dados"

**Verifique:**
1. A DATABASE_URL no arquivo `.env` está correta?
2. O IP do VPS está liberado no TiDB Cloud?

---

### Problema: "Certificado SSL não funciona"

**Causa:** O DNS ainda não propagou.

**Solução:** Aguarde mais tempo e tente novamente:
```bash
certbot --nginx -d seudominio.com.br
```

---

## 📝 COMANDOS ÚTEIS PARA O DIA A DIA

| O que você quer fazer | Comando |
|----------------------|---------|
| Ver se a aplicação está rodando | `pm2 status` |
| Ver os logs da aplicação | `pm2 logs flowedu` |
| Reiniciar a aplicação | `pm2 restart flowedu` |
| Parar a aplicação | `pm2 stop flowedu` |
| Iniciar a aplicação | `pm2 start flowedu` |
| Reiniciar o Nginx | `systemctl restart nginx` |
| Ver logs do Nginx | `tail -f /var/log/nginx/flowedu-error.log` |

---

## 🔄 COMO ATUALIZAR O FLOWEDU

Quando houver uma nova versão:

```bash
# 1. Entrar como usuário flowedu
su - flowedu
cd ~/apps/flowedu

# 2. Baixar atualizações (se usando Git)
git pull

# 3. Instalar novas dependências
pnpm install

# 4. Compilar
pnpm build

# 5. Atualizar banco de dados (se necessário)
pnpm db:push

# 6. Reiniciar
pm2 restart flowedu
```

---

**Guia criado por Manus AI em 19/01/2026**

*Lembre-se: Se algo der errado, respire fundo e tente novamente. Todo mundo erra no começo!* 💪
