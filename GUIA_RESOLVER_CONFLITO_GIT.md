# 🔧 Guia: Resolver Conflito no Git Pull (VPS)

## 📋 O Problema

Quando você tentou atualizar o sistema na VPS com `git pull origin main`, apareceu este erro:

```
error: Your local changes to the following files would be overwritten by merge:
        server/_core/index.ts
Please commit your changes or stash them before you merge.
Aborting
```

**O que isso significa?**  
Há mudanças no arquivo `server/_core/index.ts` na VPS que não foram salvas no GitHub. Se você fizer `git pull` agora, essas mudanças serão perdidas.

---

## ✅ Solução Recomendada (Opção 1: Guardar Mudanças Locais)

Use esta opção se você **não tem certeza** se as mudanças locais são importantes.

### **Passo 1: Guardar as mudanças locais temporariamente**

```bash
cd /home/app
git stash
```

> 💡 **O que faz:** "Esconde" as mudanças locais em um lugar seguro, permitindo que você faça o `git pull`.

---

### **Passo 2: Atualizar o código do GitHub**

```bash
git pull origin main
```

> ✅ **Resultado esperado:** O código será atualizado com sucesso.

---

### **Passo 3: Verificar se as mudanças guardadas são importantes**

```bash
git stash show -p
```

> 📄 **O que faz:** Mostra as mudanças que foram guardadas no Passo 1.

**Leia as mudanças e decida:**
- **Se forem importantes** (configurações customizadas): vá para o Passo 4
- **Se forem desnecessárias** (testes antigos): pule para o Passo 5

---

### **Passo 4: Recuperar as mudanças guardadas (se necessário)**

```bash
git stash pop
```

> ⚠️ **Atenção:** Se houver conflito, o Git vai avisar. Nesse caso, edite o arquivo manualmente e depois:
> ```bash
> git add server/_core/index.ts
> git commit -m "Mesclar mudanças locais"
> ```

---

### **Passo 5: Limpar as mudanças guardadas (se não forem necessárias)**

```bash
git stash drop
```

> 🗑️ **O que faz:** Apaga permanentemente as mudanças guardadas.

---

## 🚀 Solução Rápida (Opção 2: Descartar Mudanças Locais)

Use esta opção se você **tem certeza** de que as mudanças locais **não são importantes** e quer simplesmente atualizar com o código do GitHub.

### **Passo Único: Descartar mudanças e atualizar**

```bash
cd /home/app
git reset --hard origin/main
git pull origin main
```

> ⚠️ **CUIDADO:** Isso **apaga permanentemente** as mudanças locais em `server/_core/index.ts`.

---

## 🔄 Após Resolver o Conflito

Depois de atualizar o código com sucesso, **rebuild e reinicie o sistema**:

```bash
# 1. Instalar dependências (se houver novas)
pnpm install

# 2. Rebuild do projeto
pnpm build

# 3. Reiniciar o serviço
pm2 restart flowedu

# 4. Verificar se está rodando
pm2 status
pm2 logs flowedu --lines 50
```

---

## 📊 Verificar se Funcionou

Acesse o site e veja se:
- ✅ O site carrega normalmente
- ✅ Não há erros no console do navegador (F12)
- ✅ As novas funcionalidades estão visíveis

---

## ❓ Perguntas Frequentes

### **1. O que é "git stash"?**

É um comando que "guarda" suas mudanças locais temporariamente, como colocar em uma gaveta. Você pode recuperá-las depois com `git stash pop`.

### **2. Vou perder dados do banco de dados?**

**Não!** O `git pull` só atualiza o **código** (arquivos .ts, .tsx, .css). O banco de dados não é afetado.

### **3. E se eu quiser ver o que mudou entre a versão antiga e a nova?**

```bash
git log --oneline --graph --decorate --all
```

Ou veja no GitHub: https://github.com/EberSantana/flowedu/commits/main

### **4. Como evitar esse problema no futuro?**

**Nunca edite arquivos diretamente na VPS.** Sempre faça mudanças no Manus, salve o checkpoint, e depois faça `git pull` na VPS.

---

## 🆘 Se Algo Der Errado

### **Restaurar backup do código (se você fez backup antes)**

```bash
cd /home/app
git reflog
# Encontre o commit anterior (ex: HEAD@{1})
git reset --hard HEAD@{1}
```

### **Ver logs de erro**

```bash
pm2 logs flowedu --err --lines 100
```

### **Reiniciar tudo do zero**

```bash
cd /home/app
git fetch origin
git reset --hard origin/main
pnpm install
pnpm build
pm2 restart flowedu
```

---

## ✅ Resumo dos Comandos (Opção 1 - Segura)

```bash
# 1. Guardar mudanças locais
cd /home/app
git stash

# 2. Atualizar código
git pull origin main

# 3. Ver mudanças guardadas (opcional)
git stash show -p

# 4. Recuperar mudanças (se necessário)
git stash pop

# OU descartar mudanças (se não forem necessárias)
git stash drop

# 5. Rebuild e reiniciar
pnpm install
pnpm build
pm2 restart flowedu
pm2 logs flowedu --lines 50
```

---

## ✅ Resumo dos Comandos (Opção 2 - Rápida)

```bash
# 1. Descartar mudanças e atualizar
cd /home/app
git reset --hard origin/main
git pull origin main

# 2. Rebuild e reiniciar
pnpm install
pnpm build
pm2 restart flowedu
pm2 logs flowedu --lines 50
```

---

**🎉 Pronto!** Seu sistema está atualizado com as últimas mudanças do GitHub.
