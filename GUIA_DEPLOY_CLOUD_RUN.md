# 🚀 Guia COMPLETO de Deploy do FlowEdu no Google Cloud Run

> **Para iniciantes em informática** - Passo a passo detalhado com explicações simples

---

## 📖 Índice

1. [O que é Google Cloud Run?](#o-que-é-google-cloud-run)
2. [Glossário de Termos](#glossário-de-termos)
3. [Pré-requisitos](#pré-requisitos)
4. [ETAPA 1: Criar Conta no Google Cloud](#etapa-1-criar-conta-no-google-cloud)
5. [ETAPA 2: Configurar Banco de Dados TiDB Cloud](#etapa-2-configurar-banco-de-dados-tidb-cloud)
6. [ETAPA 3: Instalar Ferramentas Necessárias](#etapa-3-instalar-ferramentas-necessárias)
7. [ETAPA 4: Baixar o Código do FlowEdu](#etapa-4-baixar-o-código-do-flowedu)
8. [ETAPA 5: Criar Dockerfile](#etapa-5-criar-dockerfile)
9. [ETAPA 6: Configurar Variáveis de Ambiente](#etapa-6-configurar-variáveis-de-ambiente)
10. [ETAPA 7: Fazer Build e Deploy](#etapa-7-fazer-build-e-deploy)
11. [ETAPA 8: Configurar Domínio Customizado](#etapa-8-configurar-domínio-customizado)
12. [ETAPA 9: Testar o Sistema](#etapa-9-testar-o-sistema)
13. [Solução de Problemas](#solução-de-problemas)
14. [Comandos Úteis](#comandos-úteis)

---

## 🤔 O que é Google Cloud Run?

**Google Cloud Run** é um serviço da Google que permite você colocar seu site/sistema no ar sem precisar gerenciar servidores. É como alugar um espaço na internet que se ajusta automaticamente conforme o número de acessos.

**Vantagens:**
- ✅ **Escalabilidade automática**: Se 1000 pessoas acessarem ao mesmo tempo, o sistema aguenta
- ✅ **SSL/HTTPS automático**: Certificado de segurança já vem configurado
- ✅ **Paga apenas pelo uso**: Se ninguém acessar, você não paga
- ✅ **Fácil de atualizar**: Um comando e seu sistema está atualizado

**Desvantagens:**
- ❌ **Cold Start**: Após inatividade, primeira requisição demora 2-5 segundos
- ❌ **Custo variável**: Pode ficar caro se tiver muito acesso
- ❌ **Requer Docker**: Precisa criar um "container" do sistema

---

## 📚 Glossário de Termos

| Termo | O que significa | Analogia do dia a dia |
|-------|-----------------|----------------------|
| **Cloud Run** | Serviço de hospedagem da Google | Como alugar um espaço em um shopping |
| **Docker** | Ferramenta para "empacotar" seu sistema | Como colocar sua casa em um container de mudança |
| **Dockerfile** | Receita de como empacotar o sistema | Como uma receita de bolo: lista de ingredientes e passos |
| **Container** | Sistema empacotado pronto para rodar | O container de mudança fechado e pronto para transportar |
| **gcloud CLI** | Programa para controlar o Google Cloud | Como um controle remoto para a Google Cloud |
| **Environment Variables** | Configurações secretas do sistema | Como senhas e chaves que você guarda em um cofre |
| **Build** | Processo de preparar o sistema | Como preparar uma mala antes de viajar |
| **Deploy** | Colocar o sistema no ar | Como abrir as portas da sua loja |
| **Cold Start** | Demora na primeira requisição | Como esperar o carro aquecer antes de sair |

---

## ✅ Pré-requisitos

Antes de começar, você vai precisar:

- [ ] **Cartão de crédito internacional** (para criar conta no Google Cloud - oferece $300 grátis)
- [ ] **Computador** com Windows, Mac ou Linux
- [ ] **Conexão com a internet** estável
- [ ] **E-mail** do Google (Gmail)
- [ ] **2-3 horas** de tempo disponível

**Custo estimado mensal:** $5-30 (variável conforme uso)

---

## ETAPA 1: Criar Conta no Google Cloud

### Passo 1.1: Acessar o Google Cloud

1. Abra seu navegador (Chrome, Firefox, Edge)
2. Acesse: **https://console.cloud.google.com**
3. Clique em **"Começar gratuitamente"** ou **"Try for free"**

### Passo 1.2: Fazer Login

1. Use seu e-mail do Google (Gmail)
2. Se não tiver, crie uma conta Gmail primeiro

### Passo 1.3: Ativar Período de Teste Gratuito

1. Preencha seus dados:
   - Nome completo
   - Endereço
   - Telefone
2. Adicione um cartão de crédito internacional
   - **Importante**: Você ganha $300 de crédito grátis
   - Não será cobrado automaticamente após o período de teste
3. Aceite os termos e clique em **"Iniciar meu período de teste gratuito"**

### Passo 1.4: Criar um Projeto

1. No canto superior esquerdo, clique em **"Selecionar projeto"**
2. Clique em **"Novo projeto"**
3. Digite o nome: **flowedu**
4. Clique em **"Criar"**
5. Aguarde 10-30 segundos até o projeto ser criado

---

## ETAPA 2: Configurar Banco de Dados TiDB Cloud

**Por que TiDB Cloud?** É gratuito (5GB), compatível com MySQL e fácil de configurar.

### Passo 2.1: Criar Conta no TiDB Cloud

1. Acesse: **https://tidbcloud.com**
2. Clique em **"Sign Up"** (Criar conta)
3. Escolha **"Sign up with Google"** (usar sua conta Google)
4. Autorize o acesso

### Passo 2.2: Criar Cluster Serverless

1. Após login, clique em **"Create Cluster"**
2. Escolha **"Serverless"** (plano gratuito)
3. Configurações:
   - **Cloud Provider**: AWS
   - **Region**: **us-east-1** (mais próximo do Brasil)
   - **Cluster Name**: flowedu-db
4. Clique em **"Create"**
5. Aguarde 1-2 minutos até o cluster ficar "Active"

### Passo 2.3: Configurar Senha e Acesso

1. Clique no cluster criado
2. Vá em **"Connect"** → **"Standard Connection"**
3. Clique em **"Generate Password"**
4. **IMPORTANTE**: Copie e salve a senha em um bloco de notas
5. Em **"Add Your Current IP Address"**, clique em **"Add"**
6. Clique em **"Allow Access from Anywhere"** (para facilitar)

### Passo 2.4: Obter Connection String

1. Ainda na tela de conexão, copie a **Connection String**
2. Vai parecer com isso:
```
mysql://usuario.root:SENHA@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?sslmode=verify-full
```

3. **Salve essa string** - você vai precisar dela depois!

---

## ETAPA 3: Instalar Ferramentas Necessárias

### Passo 3.1: Instalar Google Cloud CLI

**No Windows:**

1. Baixe o instalador: https://cloud.google.com/sdk/docs/install#windows
2. Execute o arquivo `.exe` baixado
3. Siga o assistente de instalação (Next → Next → Install)
4. Marque **"Run gcloud init"** no final
5. Clique em **"Finish"**

**No Mac:**

1. Abra o Terminal (Cmd + Espaço → digite "Terminal")
2. Cole este comando e pressione Enter:
```bash
curl https://sdk.cloud.google.com | bash
```
3. Feche e abra o Terminal novamente
4. Execute:
```bash
gcloud init
```

**No Linux:**

1. Abra o Terminal
2. Execute:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

### Passo 3.2: Fazer Login no gcloud

1. Após executar `gcloud init`, uma janela do navegador vai abrir
2. Faça login com sua conta Google
3. Autorize o acesso
4. Volte ao Terminal e selecione o projeto **flowedu**

### Passo 3.3: Instalar Docker Desktop

**No Windows/Mac:**

1. Acesse: https://www.docker.com/products/docker-desktop
2. Clique em **"Download for Windows"** ou **"Download for Mac"**
3. Execute o instalador baixado
4. Siga o assistente de instalação
5. Reinicie o computador se solicitado
6. Abra o Docker Desktop e aguarde iniciar

**No Linux (Ubuntu):**

```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

Faça logout e login novamente para aplicar as permissões.

---

## ETAPA 4: Baixar o Código do FlowEdu

### Passo 4.1: Baixar do Manus

1. Acesse o painel do Manus onde seu projeto está
2. Clique em **"Code"** (ícone de código no canto superior direito)
3. Clique em **"Download All Files"**
4. Salve o arquivo ZIP em uma pasta que você lembre (ex: `C:\Projetos` ou `~/Projetos`)

### Passo 4.2: Descompactar

**No Windows:**
1. Clique com botão direito no arquivo ZIP
2. Escolha **"Extrair tudo..."**
3. Clique em **"Extrair"**

**No Mac/Linux:**
1. Clique duas vezes no arquivo ZIP
2. Ou use o comando:
```bash
unzip flowedu.zip -d ~/Projetos/flowedu
```

### Passo 4.3: Abrir a Pasta no Terminal

**No Windows:**
1. Abra a pasta extraída
2. Na barra de endereços, digite `cmd` e pressione Enter
3. O Terminal vai abrir já na pasta certa

**No Mac:**
1. Abra o Terminal
2. Digite:
```bash
cd ~/Projetos/flowedu
```

**No Linux:**
```bash
cd ~/Projetos/flowedu
```

---

## ETAPA 5: Criar Dockerfile

O **Dockerfile** é a "receita" que diz ao Docker como empacotar seu sistema.

### Passo 5.1: Criar o Arquivo

**No Windows:**
1. Abra o Bloco de Notas
2. Copie o código abaixo
3. Salve como `Dockerfile` (sem extensão) na pasta do projeto

**No Mac/Linux:**
```bash
nano Dockerfile
```

### Passo 5.2: Conteúdo do Dockerfile

Cole este conteúdo:

```dockerfile
# Usar Node.js 22 como base
FROM node:22-slim

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json pnpm-lock.yaml ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependências
RUN pnpm install --frozen-lockfile

# Copiar todo o código
COPY . .

# Fazer build do frontend
RUN pnpm run build

# Expor porta 3000
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["pnpm", "start"]
```

Salve o arquivo (Ctrl+S no Windows, Cmd+S no Mac).

---

## ETAPA 6: Configurar Variáveis de Ambiente

As variáveis de ambiente são as "senhas" e configurações do sistema.

### Passo 6.1: Criar Arquivo .env.production

Crie um arquivo chamado `.env.production` na pasta do projeto com este conteúdo:

```env
# Banco de Dados (cole sua connection string do TiDB aqui)
DATABASE_URL=mysql://usuario.root:SENHA@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?sslmode=verify-full

# JWT Secret (gere uma senha aleatória forte)
JWT_SECRET=sua_senha_super_secreta_aqui_123456789

# OAuth (use as mesmas do Manus ou configure novas)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=seu_app_id_aqui

# Informações do Proprietário
OWNER_NAME=Seu Nome
OWNER_OPEN_ID=seu_email@gmail.com

# API Keys do Manus (se necessário)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=sua_api_key_aqui

# Email (Resend)
RESEND_API_KEY=sua_resend_api_key
EMAIL_FROM=noreply@seudominio.com

# Frontend
VITE_APP_TITLE=FlowEdu
VITE_APP_LOGO=/logo.png
```

**IMPORTANTE:** Substitua os valores de exemplo pelos seus valores reais!

---

## ETAPA 7: Fazer Build e Deploy

Agora vamos "empacotar" o sistema e colocar no ar!

### Passo 7.1: Fazer Login no Google Cloud

No Terminal, execute:

```bash
gcloud auth login
gcloud config set project flowedu
```

### Passo 7.2: Habilitar APIs Necessárias

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

Aguarde 1-2 minutos.

### Passo 7.3: Fazer Build da Imagem Docker

```bash
gcloud builds submit --tag gcr.io/flowedu/flowedu-app
```

**O que vai acontecer:**
- Seu código será enviado para o Google Cloud
- O Docker vai "empacotar" tudo
- Vai demorar 5-10 minutos na primeira vez

**Você vai ver muitas linhas de texto passando** - isso é normal! Aguarde até aparecer "SUCCESS".

### Passo 7.4: Fazer Deploy no Cloud Run

```bash
gcloud run deploy flowedu \
  --image gcr.io/flowedu/flowedu-app \
  --platform managed \
  --region us-east1 \
  --allow-unauthenticated \
  --set-env-vars="$(cat .env.production | tr '\n' ',')"
```

**Perguntas que podem aparecer:**
- `Allow unauthenticated invocations?` → Digite **y** e Enter
- `Region?` → Escolha **us-east1**

**Aguarde 2-3 minutos.**

### Passo 7.5: Obter a URL do Sistema

Após o deploy, você verá uma mensagem como:

```
Service [flowedu] revision [flowedu-00001-abc] has been deployed and is serving 100 percent of traffic.
Service URL: https://flowedu-abc123-ue.a.run.app
```

**Copie essa URL** - é o endereço do seu sistema!

---

## ETAPA 8: Configurar Domínio Customizado

Se você tem um domínio (ex: `flowedu.com.br`), pode configurar aqui.

### Passo 8.1: Mapear Domínio no Cloud Run

```bash
gcloud run domain-mappings create \
  --service flowedu \
  --domain seudominio.com.br \
  --region us-east1
```

### Passo 8.2: Configurar DNS

O comando acima vai mostrar registros DNS que você precisa adicionar. Exemplo:

```
A     @     216.239.32.21
AAAA  @     2001:4860:4802:32::15
```

1. Acesse o painel do seu provedor de domínio (Registro.br, Hostinger, etc)
2. Vá em **"Gerenciar DNS"** ou **"DNS Management"**
3. Adicione os registros mostrados pelo comando
4. Aguarde 10-60 minutos para propagar

---

## ETAPA 9: Testar o Sistema

### Passo 9.1: Acessar o Sistema

1. Abra seu navegador
2. Cole a URL do Cloud Run (ex: `https://flowedu-abc123-ue.a.run.app`)
3. Aguarde 5-10 segundos (cold start na primeira vez)

### Passo 9.2: Fazer Login

1. Clique em **"Portal do Professor"**
2. Use seu e-mail para fazer login
3. Teste criar uma disciplina, turma, etc.

### Passo 9.3: Checklist de Testes

Use o arquivo `CHECKLIST_TESTES_PRE_DEPLOY.md` para validar todas as funcionalidades.

---

## 🔧 Solução de Problemas

### Problema 1: "gcloud: command not found"

**Causa:** gcloud CLI não foi instalado corretamente.

**Solução:**
1. Reinstale o gcloud CLI (ETAPA 3.1)
2. Feche e abra o Terminal novamente
3. Execute: `gcloud --version` para confirmar

### Problema 2: "Permission denied" ao executar Docker

**Causa:** Usuário não tem permissão para usar Docker.

**Solução (Linux):**
```bash
sudo usermod -aG docker $USER
```
Faça logout e login novamente.

**Solução (Windows/Mac):**
- Abra o Docker Desktop
- Aguarde iniciar completamente

### Problema 3: Build falha com "Out of memory"

**Causa:** Máquina de build não tem memória suficiente.

**Solução:**
Use uma máquina maior:
```bash
gcloud builds submit --tag gcr.io/flowedu/flowedu-app --machine-type=n1-highcpu-8
```

### Problema 4: Deploy falha com "Revision failed"

**Causa:** Variáveis de ambiente incorretas ou faltando.

**Solução:**
1. Verifique o arquivo `.env.production`
2. Certifique-se de que a `DATABASE_URL` está correta
3. Tente fazer deploy novamente

### Problema 5: Site abre mas dá erro 500

**Causa:** Banco de dados não está acessível.

**Solução:**
1. Verifique se o TiDB Cloud está "Active"
2. Teste a conexão:
```bash
gcloud run services describe flowedu --region us-east1 --format="value(status.url)"
```
3. Verifique os logs:
```bash
gcloud run logs read flowedu --region us-east1 --limit=50
```

### Problema 6: Cold Start muito lento

**Causa:** Cloud Run desliga o container após inatividade.

**Solução:**
Configure mínimo de instâncias (custa mais):
```bash
gcloud run services update flowedu \
  --region us-east1 \
  --min-instances=1
```

---

## 📋 Comandos Úteis

### Ver logs do sistema
```bash
gcloud run logs read flowedu --region us-east1 --limit=100
```

### Atualizar o sistema (após fazer mudanças)
```bash
# 1. Fazer build novamente
gcloud builds submit --tag gcr.io/flowedu/flowedu-app

# 2. Fazer deploy da nova versão
gcloud run deploy flowedu \
  --image gcr.io/flowedu/flowedu-app \
  --platform managed \
  --region us-east1
```

### Ver informações do serviço
```bash
gcloud run services describe flowedu --region us-east1
```

### Ver custo estimado
```bash
gcloud billing accounts list
gcloud billing projects describe flowedu
```

### Deletar o serviço (parar de pagar)
```bash
gcloud run services delete flowedu --region us-east1
```

---

## 🎯 Checklist Final

Antes de considerar o deploy concluído:

- [ ] Sistema abre no navegador sem erros
- [ ] Login funciona (professor e aluno)
- [ ] Consegue criar disciplinas e turmas
- [ ] Consegue agendar aulas
- [ ] Upload de materiais funciona
- [ ] Exercícios funcionam corretamente
- [ ] Domínio customizado configurado (se aplicável)
- [ ] SSL/HTTPS está ativo (cadeado verde no navegador)
- [ ] Backup do banco de dados configurado

---

## 📞 Precisa de Ajuda?

Se encontrar problemas:

1. **Verifique os logs** com o comando acima
2. **Consulte a documentação oficial**: https://cloud.google.com/run/docs
3. **Revise as etapas** deste guia
4. **Teste a conexão com o banco** usando um cliente MySQL

---

**Parabéns! 🎉** Seu sistema FlowEdu está no ar no Google Cloud Run!

Agora você pode acessar de qualquer lugar do mundo com internet.
