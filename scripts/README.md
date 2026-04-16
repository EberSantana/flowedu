# Scripts de Manutenção e Deploy

Este diretório contém scripts utilitários para manutenção, validação e deploy do sistema FlowEdu.

---

## validate-sql-schema.mjs

Script de **validação automática** que cruza todas as queries SQL raw do código-fonte com o schema real do banco TiDB, detectando incompatibilidades de nomes de colunas antes do deploy.

**Quando usar:**
- Antes de cada deploy (integrado automaticamente ao `deploy.sh`)
- Após modificar queries SQL em `server/routers.ts` ou `server/db.ts`
- Após executar `pnpm db:push` para sincronizar o cache do schema

**Comandos disponíveis:**
```bash
# Auditar usando o cache local (rápido)
pnpm validate:sql

# Auditar em modo estrito (falha se encontrar problemas — usado no deploy)
pnpm validate:sql:strict

# Atualizar cache do schema TiDB e auditar
pnpm validate:sql:update

# Após pnpm db:push — migra E atualiza o cache automaticamente
pnpm db:push:sync
```

**O que verifica:**
- Nomes de colunas em `SELECT`, `WHERE`, `INSERT`, `ORDER BY`, `GROUP BY`, `SET`
- Suporte a aliases de tabela (ex: `st.fullName`, `sce.status`)
- Queries em `server/routers.ts`, `server/db.ts`, `server/_core/llm.ts`, `server/push-notifications.ts`

**Arquivos gerados:**
- `scripts/tidb-schema-cache.json` — cache do schema TiDB (148 tabelas)
- `scripts/sql-audit-report.md` — relatório detalhado da última auditoria

---

## deploy.sh

Script de **deploy automatizado** com validação SQL integrada.

**Como executar (na VPS):**
```bash
cd /var/www/flowedu
bash scripts/deploy.sh          # versão patch (2.5.0 → 2.5.1)
bash scripts/deploy.sh minor    # versão minor (2.5.0 → 2.6.0)
bash scripts/deploy.sh major    # versão major (2.5.0 → 3.0.0)
bash scripts/deploy.sh skip     # sem incremento de versão
```

**Passos executados:**
1. Incrementa versão no `package.json`
2. Git pull
3. Instala dependências
4. **Valida queries SQL** (bloqueia deploy se houver incompatibilidades)
5. Build do projeto
6. Atualiza Service Worker com nova versão
7. Commit e push
8. Reinicia PM2

**Pré-requisito para validação SQL:**
```bash
# Executar uma vez para criar o cache, e após cada pnpm db:push:
node scripts/validate-sql-schema.mjs --fetch-schema
# ou simplesmente:
pnpm db:push:sync
```

---

## clean-test-users.ts

Script para limpar usuários de teste do banco de dados.

**Quando usar:**
- Após executar testes automatizados que deixaram usuários de teste no banco
- Quando a página de Gerenciamento de Usuários mostrar muitos usuários com email @test.com
- Para manutenção periódica do banco de dados

**Como executar:**
```bash
cd /home/ubuntu/teacher_schedule_system
pnpm tsx scripts/clean-test-users.ts
```

**O que faz:**
- Lista todos os usuários com email contendo `@test.com`
- Remove permanentemente esses usuários do banco de dados
- Protege usuários reais (não remove emails que contenham seu domínio real)
- Exibe relatório detalhado de usuários removidos

---

## Outros scripts

| Script | Descrição |
|--------|-----------|
| `add-indexes.sql` | Índices de performance para o banco de dados |
| `auto-migrate.sh` | Migração automática do schema |
| `backup-database.sh` | Backup do banco de dados TiDB |
| `check-calendar.mjs` | Diagnóstico do calendário anual de acessos |
| `check-exercises.mjs` | Diagnóstico do módulo de exercícios |
| `normalize-answers.mjs` | Normalização de respostas de exercícios |
| `seed-badges.mjs` | Seed de badges/conquistas no banco |
