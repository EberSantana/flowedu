# 🚀 Guia de Configuração de Cache no Nginx - FlowEdu

## 📋 O que é Cache de Assets?

Cache de assets é uma técnica que faz o navegador do usuário **guardar** arquivos estáticos (imagens, CSS, JavaScript, fontes) no computador dele. Assim, quando ele voltar ao site, esses arquivos não precisam ser baixados novamente, tornando o site **muito mais rápido** e **economizando banda da VPS**.

---

## 🎯 Benefícios

| Benefício | Descrição |
|-----------|-----------|
| ⚡ **Velocidade** | Site carrega 3-5x mais rápido para usuários que já visitaram |
| 💰 **Economia** | Reduz 80-90% do uso de banda da VPS |
| 🎨 **Experiência** | Navegação mais fluida e responsiva |
| 🖥️ **Servidor** | Menos carga no Node.js (mais recursos disponíveis) |
| 📊 **SEO** | Google prioriza sites rápidos no ranking |

---

## 📦 O que será Cacheado?

| Tipo de Arquivo | Tempo de Cache | Motivo |
|-----------------|----------------|--------|
| **Imagens** (jpg, png, webp, svg) | 1 ano | Raramente mudam |
| **CSS/JavaScript** | 1 mês | Podem ser atualizados |
| **Fontes** (woff, woff2, ttf) | 1 ano | Nunca mudam |
| **Vídeos/Áudio** (mp4, mp3) | 1 ano | Arquivos grandes e estáveis |
| **Documentos** (pdf, docx) | 1 mês | Podem ser atualizados |
| **Rotas dinâmicas** (/, /dashboard) | Sem cache | Dados sempre atualizados |

---

## 🛠️ Passo a Passo - Aplicar na VPS

### **Passo 1: Conectar na VPS via SSH**

```bash
ssh root@SEU_IP_DA_VPS
```

---

### **Passo 2: Fazer Backup da Configuração Atual**

```bash
sudo cp /etc/nginx/sites-available/flowedu /etc/nginx/sites-available/flowedu.backup
```

> ✅ **Segurança:** Se algo der errado, você pode restaurar com:
> ```bash
> sudo cp /etc/nginx/sites-available/flowedu.backup /etc/nginx/sites-available/flowedu
> ```

---

### **Passo 3: Editar o Arquivo de Configuração**

```bash
sudo nano /etc/nginx/sites-available/flowedu
```

**Substitua TODO o conteúdo** pelo arquivo `nginx-cache.conf` que está no repositório do GitHub.

> 💡 **Dica:** Você pode copiar o conteúdo de `nginx-cache.conf` e colar no terminal.

---

### **Passo 4: Ajustar Domínio e Certificados SSL**

Dentro do arquivo, **verifique** se estas linhas estão corretas:

```nginx
server_name flowedu.app www.flowedu.app;

ssl_certificate /etc/letsencrypt/live/flowedu.app/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/flowedu.app/privkey.pem;
```

> ⚠️ **Importante:** Se seu domínio for diferente, substitua `flowedu.app` pelo seu domínio.

---

### **Passo 5: Testar a Configuração**

```bash
sudo nginx -t
```

**Resultado esperado:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

> ❌ **Se der erro:** Revise o arquivo e certifique-se de que copiou corretamente.

---

### **Passo 6: Recarregar o Nginx**

```bash
sudo systemctl reload nginx
```

**Verificar se está rodando:**
```bash
sudo systemctl status nginx
```

---

### **Passo 7: Testar o Cache no Navegador**

1. Abra o site: `https://flowedu.app`
2. Abra as **Ferramentas do Desenvolvedor** (F12)
3. Vá na aba **Network** (Rede)
4. Recarregue a página (Ctrl+R)
5. Clique em qualquer imagem ou arquivo CSS
6. Procure por estes headers:

```
Cache-Control: public, immutable
X-Cache-Status: HIT-IMAGE
Expires: [data futura]
```

> ✅ **Funcionou!** Se você ver esses headers, o cache está ativo.

---

## 📊 Como Verificar a Economia de Banda?

### **Antes de Aplicar o Cache:**
```bash
# Ver uso de banda atual
sudo iftop -i eth0
```

### **Depois de Aplicar o Cache:**
- Aguarde 24-48 horas de uso
- Compare o uso de banda no painel da VPS
- **Economia esperada:** 70-90% de redução

---

## 🔄 Como Limpar o Cache Quando Atualizar o Site?

Quando você fizer uma atualização importante (novo CSS, novas imagens), os usuários podem não ver as mudanças imediatamente por causa do cache.

### **Solução 1: Versionamento de Assets (Recomendado)**

O Vite já faz isso automaticamente! Quando você faz `pnpm build`, ele gera arquivos com hash:

```
main.abc123.js  → main.def456.js  (novo hash após build)
style.xyz789.css → style.uvw012.css
```

O navegador vê que é um arquivo diferente e baixa automaticamente.

### **Solução 2: Forçar Atualização no Navegador do Usuário**

Se precisar que TODOS os usuários atualizem imediatamente:

```bash
# Na VPS, adicione um header de versão
sudo nano /etc/nginx/sites-available/flowedu
```

Adicione dentro do bloco `location /`:
```nginx
add_header X-App-Version "2.0.0";
```

Depois:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ❓ Perguntas Frequentes

### **1. O cache vai impedir que eu veja minhas atualizações?**

**Não!** Quando você faz `pnpm build`, o Vite gera novos arquivos com hash diferente. O navegador detecta automaticamente e baixa a nova versão.

### **2. E se eu quiser desabilitar o cache temporariamente?**

```bash
# Restaurar configuração antiga
sudo cp /etc/nginx/sites-available/flowedu.backup /etc/nginx/sites-available/flowedu
sudo systemctl reload nginx
```

### **3. O cache funciona para usuários logados?**

**Sim!** O cache é apenas para arquivos estáticos (imagens, CSS, JS). Os dados dinâmicos (disciplinas, alunos, notas) continuam sendo buscados do servidor em tempo real.

### **4. Preciso reconfigurar após atualizar o sistema?**

**Não!** A configuração do Nginx persiste mesmo após reiniciar a VPS ou atualizar o sistema.

### **5. Como saber se o cache está funcionando?**

Abra o site, vá em **F12 → Network**, recarregue a página e procure por:
- **Status 304** (Not Modified) - arquivo veio do cache
- **Size: (from disk cache)** - arquivo foi carregado do cache local
- **X-Cache-Status: HIT-IMAGE** - header customizado confirmando cache

---

## 🎯 Resumo dos Comandos

```bash
# 1. Conectar na VPS
ssh root@SEU_IP

# 2. Backup
sudo cp /etc/nginx/sites-available/flowedu /etc/nginx/sites-available/flowedu.backup

# 3. Editar
sudo nano /etc/nginx/sites-available/flowedu
# (Cole o conteúdo de nginx-cache.conf)

# 4. Testar
sudo nginx -t

# 5. Aplicar
sudo systemctl reload nginx

# 6. Verificar
sudo systemctl status nginx
```

---

## 📈 Métricas de Sucesso

Após aplicar o cache, você deve observar:

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Tempo de carregamento | 3-5s | 0.5-1s | **80% mais rápido** |
| Uso de banda mensal | 50GB | 5-10GB | **80-90% redução** |
| Requisições ao servidor | 1000/dia | 100-200/dia | **80-90% redução** |
| Pontuação Google PageSpeed | 60-70 | 90-95 | **+30 pontos** |

---

## 🆘 Suporte

Se encontrar problemas:

1. **Restaurar backup:**
   ```bash
   sudo cp /etc/nginx/sites-available/flowedu.backup /etc/nginx/sites-available/flowedu
   sudo systemctl reload nginx
   ```

2. **Ver logs de erro:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Verificar sintaxe:**
   ```bash
   sudo nginx -t
   ```

---

## ✅ Checklist Final

- [ ] Backup da configuração antiga criado
- [ ] Arquivo nginx-cache.conf copiado
- [ ] Domínio e certificados SSL ajustados
- [ ] Teste de sintaxe passou (`nginx -t`)
- [ ] Nginx recarregado com sucesso
- [ ] Cache funcionando no navegador (F12 → Network)
- [ ] Site carregando normalmente
- [ ] Velocidade melhorou visivelmente

---

**🎉 Parabéns!** Seu FlowEdu agora está otimizado e muito mais rápido!
