# 🗄️ Guia Completo: Configurar TiDB Cloud para o FlowEdu

**Para Iniciantes - Passo a Passo com Imagens**

**Autor:** Manus AI  
**Data:** 19 de Janeiro de 2026  
**Tempo estimado:** 15-20 minutos  
**Custo:** Gratuito (plano Serverless)

---

## 📋 Índice

1. [O que é TiDB Cloud?](#1-o-que-é-tidb-cloud)
2. [Por que usar TiDB Cloud?](#2-por-que-usar-tidb-cloud)
3. [Criar conta no TiDB Cloud](#3-criar-conta-no-tidb-cloud)
4. [Criar seu primeiro cluster](#4-criar-seu-primeiro-cluster)
5. [Configurar acesso ao banco de dados](#5-configurar-acesso-ao-banco-de-dados)
6. [Obter a connection string](#6-obter-a-connection-string)
7. [Testar a conexão](#7-testar-a-conexão)
8. [Configurar no FlowEdu](#8-configurar-no-flowedu)
9. [Gerenciar o banco de dados](#9-gerenciar-o-banco-de-dados)
10. [Fazer backup dos dados](#10-fazer-backup-dos-dados)
11. [Monitorar uso e limites](#11-monitorar-uso-e-limites)
12. [Solução de problemas](#12-solução-de-problemas)

---

## 1. O que é TiDB Cloud?

TiDB Cloud é um **banco de dados MySQL na nuvem** totalmente gerenciado. Isso significa que:

- ✅ Você não precisa instalar nada no seu computador ou servidor
- ✅ Não precisa se preocupar com backups (são automáticos)
- ✅ Não precisa configurar segurança (já vem configurado)
- ✅ Funciona 24 horas por dia, 7 dias por semana
- ✅ É compatível com MySQL (o banco que o FlowEdu usa)

**Em termos simples:** É como ter um MySQL profissional sem precisar ser um especialista em bancos de dados.

---

## 2. Por que usar TiDB Cloud?

### Vantagens do TiDB Cloud

| Aspecto | TiDB Cloud | MySQL no VPS |
|---------|------------|--------------|
| **Custo inicial** | Gratuito até 5GB | Precisa pagar o VPS |
| **Configuração** | 5 minutos | 30+ minutos |
| **Backups** | Automáticos | Você precisa configurar |
| **Segurança** | Já configurada | Você precisa configurar |
| **Escalabilidade** | Automática | Manual (difícil) |
| **Manutenção** | Zero | Você precisa atualizar |

### Plano Gratuito (Serverless)

O plano gratuito do TiDB Cloud oferece:

- **Armazenamento:** 5 GB (suficiente para ~1000 alunos)
- **Processamento:** 50 milhões de RUs/mês (Request Units)
- **Backups:** Automáticos (últimos 7 dias)
- **Disponibilidade:** 99.9% uptime
- **Suporte:** Comunidade

**Quando você precisa pagar?**
- Se passar de 5GB de dados
- Se passar de 50 milhões de RUs/mês (muito difícil para uma escola pequena)

---

## 3. Criar conta no TiDB Cloud

### Passo 3.1: Acessar o site

Abra seu navegador e acesse: **[https://tidbcloud.com](https://tidbcloud.com)**

### Passo 3.2: Clicar em "Sign Up"

No canto superior direito da página, clique no botão **"Sign Up"** (Cadastrar-se).

### Passo 3.3: Escolher método de cadastro

Você tem três opções para criar sua conta:

**Opção A: Cadastro com Google (Recomendado)**
1. Clique em **"Sign up with Google"**
2. Escolha sua conta Google
3. Autorize o acesso

**Opção B: Cadastro com GitHub**
1. Clique em **"Sign up with GitHub"**
2. Faça login no GitHub
3. Autorize o acesso

**Opção C: Cadastro com E-mail**
1. Clique em **"Sign up with Email"**
2. Preencha:
   - **Email:** seu e-mail
   - **Password:** crie uma senha forte (mínimo 8 caracteres)
3. Clique em **"Sign Up"**
4. Verifique seu e-mail e clique no link de confirmação

### Passo 3.4: Completar perfil

Após fazer login pela primeira vez, você será solicitado a preencher algumas informações:

1. **Company Name:** Nome da sua escola ou "Uso Pessoal"
2. **Country/Region:** Brasil
3. **Use Case:** Selecione "Web Application"
4. **How did you hear about us?:** Pode deixar em branco

Clique em **"Continue"** ou **"Skip"** para pular.

---

## 4. Criar seu primeiro cluster

Agora vamos criar o banco de dados (chamado de "cluster" no TiDB Cloud).

### Passo 4.1: Acessar o painel

Após fazer login, você verá o **Dashboard** (painel de controle).

### Passo 4.2: Clicar em "Create Cluster"

No centro da tela ou no menu lateral, clique no botão verde **"Create Cluster"**.

### Passo 4.3: Escolher o plano Serverless

Você verá duas opções:

1. **Serverless** (Gratuito) - Escolha esta!
2. **Dedicated** (Pago) - Não escolha

Clique em **"Create"** no card do **Serverless**.

### Passo 4.4: Configurar o cluster

Agora você precisa configurar alguns detalhes:

**Nome do Cluster:**
- Digite: `flowedu-production`
- (Você pode escolher qualquer nome, mas este é descritivo)

**Cloud Provider (Provedor de Nuvem):**
- Escolha: **AWS** (Amazon Web Services)
- (É o mais confiável e tem data center no Brasil)

**Region (Região):**
- Escolha: **São Paulo (sa-east-1)** se disponível
- Se não estiver disponível, escolha: **N. Virginia (us-east-1)**
- (Quanto mais perto do Brasil, mais rápido)

**Cluster Tier:**
- Mantenha: **Serverless**
- (Já vem selecionado)

### Passo 4.5: Criar o cluster

1. Revise as configurações
2. Clique no botão verde **"Create"** no final da página
3. Aguarde 1-2 minutos enquanto o cluster é criado

**O que você verá:**
- Uma barra de progresso
- Status: "Creating..."
- Quando terminar, status mudará para "Active" (Ativo)

---

## 5. Configurar acesso ao banco de dados

Agora que o cluster está criado, precisamos configurar quem pode acessá-lo.

### Passo 5.1: Acessar configurações do cluster

1. No dashboard, clique no nome do cluster que você criou (`flowedu-production`)
2. Você verá a página de detalhes do cluster

### Passo 5.2: Criar senha do banco de dados

Na página do cluster, procure por **"Connect"** (Conectar) e clique.

Você verá uma janela com opções de conexão. Procure por:

**Step 1: Create a password**

1. Clique em **"Generate Password"** (Gerar Senha)
2. Uma senha aleatória será criada automaticamente
3. **IMPORTANTE:** Clique em **"Copy"** (Copiar) e salve esta senha em um lugar seguro!
4. Você **NÃO** conseguirá ver esta senha novamente!

**Exemplo de senha gerada:**
```
A1b2C3d4E5f6G7h8I9j0
```

### Passo 5.3: Configurar acesso por IP (Traffic Filter)

Por padrão, o TiDB Cloud bloqueia todas as conexões por segurança. Você precisa liberar o acesso.

**Opção A: Liberar qualquer IP (Mais fácil, menos seguro)**

1. Procure por **"IP Access List"** ou **"Traffic Filter"**
2. Clique em **"Add IP Address"**
3. Digite: `0.0.0.0/0`
4. Descrição: "Acesso de qualquer lugar"
5. Clique em **"Add"**

> ⚠️ **Atenção:** Esta opção permite acesso de qualquer lugar. É aceitável para começar, mas considere restringir depois.

**Opção B: Liberar apenas seu VPS (Mais seguro)**

1. Descubra o IP do seu VPS (ex: 123.45.67.89)
2. Clique em **"Add IP Address"**
3. Digite o IP do seu VPS: `123.45.67.89/32`
4. Descrição: "VPS FlowEdu"
5. Clique em **"Add"**

Se você também quer acessar do seu computador:
1. Descubra seu IP em: [https://meuip.com.br](https://meuip.com.br)
2. Adicione mais um IP: `seu-ip-aqui/32`
3. Descrição: "Meu computador"

---

## 6. Obter a connection string

A **connection string** é o "endereço" do seu banco de dados. É o que você vai colocar no FlowEdu para ele se conectar.

### Passo 6.1: Copiar a connection string

Na mesma janela de **"Connect"**, procure por:

**Step 2: Connect with a SQL client**

Você verá várias opções de conexão. Escolha **"General"** ou **"MySQL CLI"**.

A connection string terá este formato:

```
mysql://[username].[hash]:[password]@gateway01.sa-east-1.prod.aws.tidbcloud.com:4000/test?ssl_mode=VERIFY_IDENTITY
```

### Passo 6.2: Entender a connection string

Vamos quebrar em partes para você entender:

```
mysql://                                    ← Protocolo (tipo de banco)
[username].[hash]                           ← Seu usuário
:[password]                                 ← Sua senha (substitua por aquela que você copiou)
@gateway01.sa-east-1.prod.aws.tidbcloud.com ← Servidor
:4000                                       ← Porta
/test                                       ← Nome do banco de dados (vamos mudar para "flowedu")
?ssl_mode=VERIFY_IDENTITY                   ← Conexão segura
```

### Passo 6.3: Personalizar a connection string

Você precisa fazer duas mudanças:

**1. Substituir [password] pela senha real:**

Troque `[password]` pela senha que você copiou no Passo 5.2.

**Antes:**
```
mysql://4vPxKxxx.root:[password]@gateway01...
```

**Depois:**
```
mysql://4vPxKxxx.root:A1b2C3d4E5f6G7h8I9j0@gateway01...
```

**2. Mudar o nome do banco de "test" para "flowedu":**

**Antes:**
```
.../test?ssl_mode=VERIFY_IDENTITY
```

**Depois:**
```
.../flowedu?ssl_mode=VERIFY_IDENTITY
```

### Passo 6.4: Connection string final

Sua connection string final deve ficar assim:

```
mysql://4vPxKxxx.root:A1b2C3d4E5f6G7h8I9j0@gateway01.sa-east-1.prod.aws.tidbcloud.com:4000/flowedu?ssl_mode=VERIFY_IDENTITY
```

**Copie esta string completa e salve em um arquivo de texto!**

---

## 7. Testar a conexão

Antes de usar no FlowEdu, vamos testar se a conexão funciona.

### Opção A: Testar no próprio TiDB Cloud (Mais fácil)

1. No painel do TiDB Cloud, clique em **"Chat2Query"** no menu lateral
2. Ou clique em **"SQL Editor"**
3. Digite um comando simples:
```sql
SELECT 1;
```
4. Clique em **"Run"** (Executar)
5. Se mostrar o resultado `1`, está funcionando!

### Opção B: Testar no seu computador (Requer MySQL Client)

Se você tem o MySQL instalado no seu computador:

```bash
mysql -h gateway01.sa-east-1.prod.aws.tidbcloud.com \
      -P 4000 \
      -u 4vPxKxxx.root \
      -p \
      --ssl-mode=VERIFY_IDENTITY
```

Quando pedir a senha, cole a senha que você copiou.

Se conectar com sucesso, você verá:
```
mysql>
```

Digite `exit` para sair.

---

## 8. Configurar no FlowEdu

Agora vamos usar a connection string no FlowEdu.

### Passo 8.1: Acessar o arquivo de configuração

**No seu VPS (via SSH):**

```bash
nano ~/apps/flowedu/.env
```

**Ou no seu computador (antes do deploy):**

Abra o arquivo `.env` na pasta do projeto.

### Passo 8.2: Adicionar a connection string

Procure pela linha que começa com `DATABASE_URL=` e substitua pelo valor completo:

```bash
DATABASE_URL="mysql://4vPxKxxx.root:A1b2C3d4E5f6G7h8I9j0@gateway01.sa-east-1.prod.aws.tidbcloud.com:4000/flowedu?ssl_mode=VERIFY_IDENTITY"
```

**IMPORTANTE:** Mantenha as aspas duplas (`"`) no início e no fim!

### Passo 8.3: Salvar o arquivo

- Se estiver no nano (VPS): Ctrl+X, depois Y, depois Enter
- Se estiver em um editor local: Ctrl+S ou Cmd+S

### Passo 8.4: Criar as tabelas no banco

Agora vamos criar todas as tabelas que o FlowEdu precisa:

```bash
cd ~/apps/flowedu
pnpm db:push
```

**O que esse comando faz:**
- Lê o schema do banco de dados (estrutura das tabelas)
- Cria todas as tabelas no TiDB Cloud
- Configura relacionamentos entre tabelas

**Resultado esperado:**
```
✓ Pushing schema changes to database...
✓ Done!
```

Se aparecer algum erro, verifique se a connection string está correta.

---

## 9. Gerenciar o banco de dados

### Visualizar dados no TiDB Cloud

**Passo 1:** No painel do TiDB Cloud, clique em **"Chat2Query"** ou **"SQL Editor"**

**Passo 2:** Você pode executar comandos SQL para ver os dados:

```sql
-- Ver todas as tabelas
SHOW TABLES;

-- Ver usuários cadastrados
SELECT * FROM users;

-- Ver disciplinas
SELECT * FROM subjects;

-- Contar quantos alunos existem
SELECT COUNT(*) FROM users WHERE role = 'user';
```

### Usar ferramenta externa (Opcional)

Você pode usar programas como:

- **MySQL Workbench** (gratuito, Windows/Mac/Linux)
- **DBeaver** (gratuito, Windows/Mac/Linux)
- **TablePlus** (pago, Mac)

**Como conectar:**
1. Abra o programa
2. Crie nova conexão MySQL
3. Preencha:
   - **Host:** gateway01.sa-east-1.prod.aws.tidbcloud.com
   - **Port:** 4000
   - **User:** 4vPxKxxx.root (seu usuário)
   - **Password:** sua senha
   - **Database:** flowedu
   - **SSL:** Enabled/Required

---

## 10. Fazer backup dos dados

### Backups automáticos (Já inclusos)

O TiDB Cloud faz backups automáticos:
- **Frequência:** Diariamente
- **Retenção:** 7 dias (plano gratuito)
- **Localização:** Mesma região do cluster

Para restaurar um backup:
1. Vá em **"Backup & Restore"** no painel
2. Escolha o backup desejado
3. Clique em **"Restore"**

### Backup manual (Recomendado antes de grandes mudanças)

**Passo 1:** No painel, vá em **"Backup & Restore"**

**Passo 2:** Clique em **"Manual Backup"**

**Passo 3:** Digite um nome descritivo:
- Exemplo: `antes-atualizacao-2026-01-19`

**Passo 4:** Clique em **"Create Backup"**

### Exportar dados para seu computador

Se quiser ter uma cópia local:

```bash
# No seu VPS ou computador (com MySQL Client instalado)
mysqldump -h gateway01.sa-east-1.prod.aws.tidbcloud.com \
          -P 4000 \
          -u 4vPxKxxx.root \
          -p \
          --ssl-mode=VERIFY_IDENTITY \
          flowedu > backup-flowedu-$(date +%Y%m%d).sql
```

Isso criará um arquivo `backup-flowedu-20260119.sql` com todos os dados.

---

## 11. Monitorar uso e limites

### Ver uso atual

**Passo 1:** No painel do TiDB Cloud, clique no nome do seu cluster

**Passo 2:** Vá na aba **"Monitoring"** (Monitoramento)

Você verá gráficos mostrando:
- **Storage Used:** Espaço usado (limite: 5GB no plano gratuito)
- **Request Units:** Requisições usadas (limite: 50M/mês)
- **Connections:** Conexões ativas

### Alertas de limite

O TiDB Cloud enviará e-mails quando:
- Você atingir 80% do limite de armazenamento
- Você atingir 80% do limite de RUs
- Houver problemas de conexão

### O que fazer se atingir o limite

**Se atingir 5GB de armazenamento:**
1. Limpe dados antigos desnecessários
2. Ou faça upgrade para plano pago (~$10/mês para 10GB)

**Se atingir 50M RUs/mês:**
1. Otimize suas queries (adicione índices)
2. Implemente cache no frontend
3. Ou faça upgrade para plano pago

---

## 12. Solução de problemas

### Problema: "Access denied for user"

**Causa:** Senha incorreta ou usuário errado.

**Solução:**
1. Verifique se copiou a senha corretamente
2. Verifique se o usuário está correto (deve ter `.root` no final)
3. Se perdeu a senha, você pode resetá-la:
   - Vá em **"Connect"** → **"Reset Password"**

---

### Problema: "Can't connect to MySQL server"

**Causa:** IP não está na lista de permissões.

**Solução:**
1. Vá em **"Security"** → **"IP Access List"**
2. Adicione o IP do seu servidor/computador
3. Ou adicione `0.0.0.0/0` para permitir qualquer IP (menos seguro)

---

### Problema: "Unknown database 'flowedu'"

**Causa:** O banco de dados "flowedu" não foi criado.

**Solução:**
1. Conecte ao TiDB Cloud
2. Execute:
```sql
CREATE DATABASE flowedu;
```
3. Ou ajuste a connection string para usar o banco "test" temporariamente

---

### Problema: "SSL connection error"

**Causa:** Conexão SSL não está configurada corretamente.

**Solução:**
1. Certifique-se de que a connection string tem `?ssl_mode=VERIFY_IDENTITY` no final
2. Se ainda não funcionar, tente: `?ssl_mode=REQUIRED`
3. Como último recurso (não recomendado): `?ssl_mode=DISABLED`

---

### Problema: Aplicação lenta

**Causa:** Queries ineficientes ou falta de índices.

**Solução:**
1. Execute o script de índices:
```bash
mysql -h gateway... -P 4000 -u usuario -p flowedu < scripts/add-indexes.sql
```
2. Monitore queries lentas no painel do TiDB Cloud
3. Adicione cache no frontend (já implementado no FlowEdu)

---

## 📝 Checklist de configuração

Antes de considerar a configuração concluída:

- [ ] Conta TiDB Cloud criada
- [ ] Cluster Serverless criado
- [ ] Senha do banco de dados copiada e salva
- [ ] IP do VPS adicionado à lista de permissões
- [ ] Connection string copiada e personalizada
- [ ] Connection string testada (conectou com sucesso)
- [ ] DATABASE_URL configurada no arquivo .env
- [ ] Comando `pnpm db:push` executado com sucesso
- [ ] Tabelas criadas no banco de dados
- [ ] Aplicação FlowEdu conectando corretamente
- [ ] Backup manual criado (opcional mas recomendado)

---

## 🎯 Resumo: Connection String

Para referência rápida, sua connection string deve seguir este formato:

```
mysql://[usuario].[hash]:[senha]@[servidor]:4000/flowedu?ssl_mode=VERIFY_IDENTITY
```

**Exemplo real:**
```
mysql://4vPxKxxx.root:A1b2C3d4E5f6@gateway01.sa-east-1.prod.aws.tidbcloud.com:4000/flowedu?ssl_mode=VERIFY_IDENTITY
```

**Onde usar:**
- Arquivo `.env` do FlowEdu na variável `DATABASE_URL`

---

## 📚 Recursos adicionais

- **Documentação oficial:** [https://docs.pingcap.com/tidbcloud](https://docs.pingcap.com/tidbcloud)
- **Suporte da comunidade:** [https://ask.pingcap.com](https://ask.pingcap.com)
- **Status do serviço:** [https://status.tidbcloud.com](https://status.tidbcloud.com)

---

**Parabéns! 🎉**

Você configurou com sucesso um banco de dados profissional na nuvem para o FlowEdu. Agora seu sistema tem:

- ✅ Banco de dados seguro e confiável
- ✅ Backups automáticos
- ✅ Escalabilidade automática
- ✅ Zero manutenção necessária

---

*Guia criado por Manus AI em 19/01/2026*
