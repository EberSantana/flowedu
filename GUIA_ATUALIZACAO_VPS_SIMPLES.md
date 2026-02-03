# 🚀 Guia Simples: Atualizar FlowEdu na VPS

## ✅ O que Foi Corrigido

1. **Página em branco** - Agora o site vai carregar corretamente
2. **Erros de segurança** - CSP (Content Security Policy) ajustado
3. **Fontes não carregavam** - Permitido fontes base64
4. **Analytics bloqueado** - Adicionado analytics.manus.im

---

## 📋 Passo a Passo (5 minutos)

### **1. Conectar na VPS**

Abra o terminal (ou PuTTY no Windows) e conecte:

```bash
ssh root@76.13.67.5
```

Digite a senha quando pedir.

---

### **2. Ir para a Pasta do Projeto**

```bash
cd /home/app
```

---

### **3. Baixar Atualizações do GitHub**

```bash
git pull origin main
```

**Se aparecer erro de "local changes":**

```bash
git reset --hard HEAD
git pull origin main
```

---

### **4. Fazer o Build (Vai Demorar 2-3 Minutos)**

```bash
pnpm build
```

**Aguarde até aparecer:** `✓ built in XX.XXs`

---

### **5. Reiniciar a Aplicação**

```bash
pm2 restart flowedu
```

---

### **6. Verificar se Funcionou**

```bash
pm2 logs flowedu --lines 10
```

**Deve aparecer:**
```
Server running on http://localhost:3000/
```

**Sem erros de:**
- ❌ `ValidationError: trust proxy`
- ❌ `URIError: path traversal`

---

### **7. Testar no Navegador**

1. Abra: **https://flowedu.app**
2. Pressione **Ctrl+Shift+R** (ou **Cmd+Shift+R** no Mac) para limpar cache
3. A página deve carregar completamente!

---

## 🆘 Se Algo Der Errado

### **Problema: Build falhou**

```bash
# Limpar tudo e tentar novamente
rm -rf dist/
pnpm install
pnpm build
```

### **Problema: PM2 não reiniciou**

```bash
# Parar e iniciar novamente
pm2 stop flowedu
pm2 start dist/index.js --name flowedu
```

### **Problema: Página ainda em branco**

```bash
# Verificar se dist/public/ foi criado
ls -lh dist/public/

# Se não existir, fazer build novamente
pnpm build
```

---

## ✅ Checklist Final

- [ ] `git pull` executado com sucesso
- [ ] `pnpm build` completou sem erros
- [ ] `pm2 restart flowedu` executado
- [ ] Logs não mostram erros
- [ ] Site abre em https://flowedu.app
- [ ] Página carrega completamente (não está em branco)

---

## 📞 Precisa de Ajuda?

Se algo não funcionar:

1. **Tire print dos erros** que aparecem
2. **Copie os logs:** `pm2 logs flowedu --lines 50 --nostream`
3. **Me envie** para eu te ajudar!

---

**Boa sorte! 🎉**
