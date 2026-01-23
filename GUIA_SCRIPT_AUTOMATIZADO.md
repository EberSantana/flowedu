# 🤖 Guia do Script de Instalação Automatizado
## Instale o FlowEdu em 10 Minutos com Um Único Comando

> **Autor:** Manus AI  
> **Última atualização:** 22 de janeiro de 2026  
> **Tempo estimado:** 10-15 minutos  
> **Nível:** Iniciante

---

## 📋 O que este script faz?

O script `install-vps.sh` automatiza **TODA** a instalação do FlowEdu na VPS. Em vez de seguir 12 etapas manualmente, você executa um comando e responde 3 perguntas simples.

**O script instala automaticamente:**

- ✅ Node.js 20.x (motor do sistema)
- ✅ PM2 (gerenciador de processos)
- ✅ Nginx (servidor web)
- ✅ Código do FlowEdu (do GitHub)
- ✅ Certificado SSL (HTTPS - cadeado verde)
- ✅ Configurações de produção

---

## ✅ ANTES DE COMEÇAR

### O que você precisa ter:

1. **VPS contratada** (Hostinger, DigitalOcean, etc.)
2. **Acesso SSH** à VPS (terminal conectado)
3. **Domínio registrado** e DNS configurado apontando para o IP da VPS
4. **Conta no TiDB Cloud** criada com a CONNECTION STRING em mãos
5. **10-15 minutos livres**

### ⚠️ IMPORTANTE sobre DNS

O script vai configurar SSL automaticamente, mas para isso funcionar, seu domínio **PRECISA** estar apontando para o IP da VPS **ANTES** de executar o script.

**Como verificar se o DNS está correto:**

```bash
ping seudominio.com.br
```

Se retornar o IP da sua VPS, está correto! Se não, aguarde a propagação do DNS (pode demorar até 48 horas).

---

## 🚀 INSTALAÇÃO RÁPIDA (3 Passos)

### PASSO 1: Conectar na VPS via SSH

**No Windows (PowerShell):**
```bash
ssh root@SEU_IP_AQUI
```

**No Mac/Linux (Terminal):**
```bash
ssh root@SEU_IP_AQUI
```

Digite a senha quando solicitado (não aparece nada na tela, é normal).

---

### PASSO 2: Baixar e executar o script

Cole este comando no terminal e pressione Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/EberSantana/flowedu/main/install-vps.sh | sudo bash
```

**O que esse comando faz:**
- `curl -fsSL` → Baixa o script do GitHub
- `| sudo bash` → Executa o script com permissões de administrador

---

### PASSO 3: Responder as perguntas

O script vai fazer 3 perguntas:

#### Pergunta 1: Domínio
```
Digite seu dominio (ex: flowedu.com.br): _
```

**O que digitar:** Seu domínio completo, sem `http://` ou `https://`

**Exemplos corretos:**
- `flowedu.com.br`
- `meusite.com`
- `escola.edu.br`

**Exemplos errados:**
- ~~`https://flowedu.com.br`~~ (não coloque https://)
- ~~`www.flowedu.com.br`~~ (não coloque www)

---

#### Pergunta 2: E-mail
```
Digite seu e-mail (para certificado SSL): _
```

**O que digitar:** Seu e-mail real (Let's Encrypt vai enviar avisos de renovação)

**Exemplo:** `seuemail@gmail.com`

---

#### Pergunta 3: DATABASE_URL
```
Cole a CONNECTION STRING do TiDB Cloud
DATABASE_URL: _
```

**O que digitar:** Cole a connection string completa que você copiou do TiDB Cloud

**Exemplo:**
```
mysql://usuario.root:senha123@gateway01.sa-east-1.prod.aws.tidbcloud.com:4000/test?sslmode=verify-identity
```

**⚠️ DICA:** Copie do TiDB Cloud e cole com **Ctrl+Shift+V** (Windows/Linux) ou **Cmd+V** (Mac)

---

#### Confirmação Final
```
Dominio: flowedu.com.br
E-mail: seuemail@gmail.com
DATABASE_URL: mysql://usuario.root:senha123@gateway01...
JWT_SECRET: (gerado automaticamente)

Tudo correto? (s/n): _
```

**O que digitar:** 
- `s` se tudo estiver correto
- `n` para cancelar e começar de novo

Pressione **Enter**

---

## ⏳ AGUARDE A INSTALAÇÃO

Após confirmar, o script vai executar 8 etapas automaticamente:

```
ETAPA 1/8: Atualizando Sistema          ⏱️ 1-2 min
ETAPA 2/8: Instalando Node.js           ⏱️ 1 min
ETAPA 3/8: Instalando PM2               ⏱️ 30 seg
ETAPA 4/8: Instalando Nginx             ⏱️ 30 seg
ETAPA 5/8: Baixando FlowEdu             ⏱️ 1 min
ETAPA 6/8: Configurando Variáveis       ⏱️ 5 seg
ETAPA 7/8: Instalando Dependências      ⏱️ 3-5 min
ETAPA 8/8: Configurando Nginx e SSL     ⏱️ 1-2 min
```

**Total:** ~10-15 minutos

Você vai ver mensagens verdes (✓) quando cada etapa for concluída com sucesso.

**⚠️ NÃO FECHE O TERMINAL** durante a instalação!

---

## 🎉 INSTALAÇÃO CONCLUÍDA

Se tudo der certo, você vai ver esta mensagem:

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              ✓ INSTALACAO CONCLUIDA COM SUCESSO!         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

✓ FlowEdu instalado e rodando

🌐 Acesse seu sistema em:
   https://seudominio.com.br

📊 Comandos uteis:
   pm2 status          - Ver status do sistema
   pm2 logs flowedu    - Ver logs
   pm2 restart flowedu - Reiniciar sistema
   pm2 stop flowedu    - Parar sistema
```

---

## 🌐 TESTANDO O SISTEMA

### Teste 1: Abrir no navegador

1. Abra seu navegador (Chrome, Firefox, etc.)
2. Digite: `https://seudominio.com.br`
3. Deve aparecer a página inicial do FlowEdu
4. Verifique se o **cadeado verde** 🔒 aparece (HTTPS funcionando)

### Teste 2: Verificar status no terminal

```bash
pm2 status
```

Deve aparecer:
```
┌────┬────────────┬─────────┬─────────┬──────────┐
│ id │ name       │ status  │ restart │ uptime   │
├────┼────────────┼─────────┼─────────┼──────────┤
│ 0  │ flowedu    │ online  │ 0       │ 2m       │
└────┴────────────┴─────────┴─────────┴──────────┘
```

Se `status = online`, está tudo funcionando! ✅

---

## 🆘 SOLUÇÃO DE PROBLEMAS

### Problema 1: "DNS problem" durante instalação do SSL

**Causa:** DNS ainda não propagou ou está configurado errado

**Solução:**
1. Verifique se o domínio aponta para o IP correto:
```bash
ping seudominio.com.br
```

2. Se o IP estiver errado, corrija no registrador do domínio e aguarde propagação (até 48h)

3. Depois que o DNS estiver correto, execute manualmente:
```bash
certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

---

### Problema 2: Sistema não inicia (status = errored)

**Causa:** Erro de conexão com banco de dados ou configuração errada

**Solução:**
1. Veja os logs para identificar o erro:
```bash
pm2 logs flowedu --lines 50
```

2. Se for erro de DATABASE_URL:
```bash
nano /home/flowedu/.env
```
Corrija a DATABASE_URL, salve (Ctrl+O, Enter, Ctrl+X) e reinicie:
```bash
pm2 restart flowedu
```

---

### Problema 3: "Permission denied" ao executar script

**Causa:** Não está executando como root

**Solução:**
```bash
sudo bash install-vps.sh
```

Ou faça login como root:
```bash
sudo su
bash install-vps.sh
```

---

### Problema 4: Script trava na ETAPA 7 (instalando dependências)

**Causa:** VPS com pouca memória RAM (menos de 2GB)

**Solução:**
1. Pressione **Ctrl+C** para cancelar
2. Aumente a memória swap temporariamente:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```
3. Execute o script novamente

---

### Problema 5: Página não carrega (502 Bad Gateway)

**Causa:** Sistema não está rodando

**Solução:**
```bash
cd /home/flowedu
pm2 start ecosystem.config.js
pm2 save
```

---

## 🔧 COMANDOS ÚTEIS

### Ver status do sistema
```bash
pm2 status
```

### Ver logs em tempo real
```bash
pm2 logs flowedu
```

### Reiniciar sistema
```bash
pm2 restart flowedu
```

### Parar sistema
```bash
pm2 stop flowedu
```

### Iniciar sistema
```bash
pm2 start flowedu
```

### Ver uso de CPU/Memória
```bash
pm2 monit
```

### Atualizar código (depois de fazer mudanças no GitHub)
```bash
cd /home/flowedu
git pull
npm install
npm run build
pm2 restart flowedu
```

---

## 📁 ESTRUTURA DE ARQUIVOS

Após a instalação, os arquivos ficam organizados assim:

```
/home/flowedu/                    ← Código do FlowEdu
├── .env                          ← Variáveis de ambiente (senhas)
├── package.json                  ← Dependências do projeto
├── ecosystem.config.js           ← Configuração do PM2
├── server/                       ← Código do backend
├── client/                       ← Código do frontend
└── dist/                         ← Build de produção

/etc/nginx/sites-available/flowedu  ← Configuração do Nginx
/etc/letsencrypt/                   ← Certificados SSL
```

---

## 🔐 SEGURANÇA

### Senhas geradas automaticamente

O script gera automaticamente:
- **JWT_SECRET** (senha para tokens de autenticação)

Essas senhas ficam salvas em `/home/flowedu/.env`

### Backup do arquivo .env

**⚠️ IMPORTANTE:** Faça backup do arquivo `.env` em um lugar seguro!

```bash
cat /home/flowedu/.env
```

Copie todo o conteúdo e salve em um arquivo no seu computador.

---

## 📊 MONITORAMENTO

### Ver logs do Nginx
```bash
tail -f /var/log/nginx/access.log   # Acessos
tail -f /var/log/nginx/error.log    # Erros
```

### Ver logs do sistema
```bash
journalctl -u nginx -f              # Nginx
pm2 logs flowedu                    # FlowEdu
```

### Verificar espaço em disco
```bash
df -h
```

### Verificar uso de memória
```bash
free -h
```

---

## 🔄 DESINSTALAR

Se quiser remover tudo e começar de novo:

```bash
# Parar sistema
pm2 delete flowedu
pm2 save

# Remover código
rm -rf /home/flowedu

# Remover configuração do Nginx
rm /etc/nginx/sites-enabled/flowedu
rm /etc/nginx/sites-available/flowedu
systemctl reload nginx

# Remover certificado SSL
certbot delete --cert-name seudominio.com.br
```

---

## 🆚 COMPARAÇÃO: Script vs Manual

| Aspecto | Script Automatizado | Instalação Manual |
|---------|-------------------|------------------|
| **Tempo** | 10-15 minutos | 2-3 horas |
| **Complexidade** | Muito fácil | Média |
| **Chance de erro** | Baixa | Alta |
| **Comandos** | 1 comando | 50+ comandos |
| **Perguntas** | 3 perguntas | Várias configurações |
| **Ideal para** | Iniciantes | Quem quer controle total |

---

## 📞 SUPORTE

Se o script falhar:

1. **Veja os logs** - O script mostra mensagens de erro detalhadas
2. **Verifique pré-requisitos** - DNS configurado, TiDB Cloud funcionando
3. **Execute manualmente** - Use o `GUIA_VPS_PARA_LEIGOS.md` como alternativa
4. **Suporte Hostinger** - Chat 24/7 em português

---

## 🎓 PRÓXIMOS PASSOS

Após a instalação:

1. **Execute o checklist de testes** - `CHECKLIST_TESTES_PRE_DEPLOY.md`
2. **Configure backup automático** - `GUIA_LOGS_CENTRALIZADOS.md`
3. **Configure monitoramento** - `GUIA_MONITORAMENTO.md`
4. **Implemente verificação de e-mail** - `GUIA_VERIFICACAO_EMAIL.md`

---

## 📚 REFERÊNCIAS

- [Repositório do FlowEdu no GitHub](https://github.com/EberSantana/flowedu)
- [Documentação PM2](https://pm2.keymetrics.io/docs/)
- [Documentação Nginx](https://nginx.org/en/docs/)
- [Documentação Let's Encrypt](https://letsencrypt.org/docs/)

---

**Autor:** Manus AI  
**Versão:** 1.0  
**Data:** 22 de janeiro de 2026

**Boa instalação! 🚀**
