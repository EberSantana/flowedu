# Regras do Projeto FlowEdu

Este arquivo define as regras obrigatórias que devem ser seguidas em **toda e qualquer atualização** do sistema FlowEdu.

---

## 1. Versionamento Obrigatório

**Regra:** Sempre que o sistema for atualizado (correção de bug, nova funcionalidade, melhoria de UX, ajuste de dados), a versão no `package.json` deve ser incrementada **antes** de fazer o deploy na VPS.

### Convenção de versão (Semantic Versioning):

| Tipo de mudança | Incremento | Exemplo |
|---|---|---|
| Nova funcionalidade significativa | MINOR (x.**Y**.0) | 5.0.0 → 5.1.0 |
| Correção de bug ou ajuste pequeno | PATCH (x.x.**Z**) | 5.1.0 → 5.1.1 |
| Refatoração grande ou breaking change | MAJOR (**X**.0.0) | 5.x.x → 6.0.0 |

### Passos obrigatórios a cada deploy:

1. Atualizar `"version"` em `package.json`
2. Copiar `package.json` atualizado para a VPS (`scp`)
3. Fazer build na VPS (`pnpm build`)
4. Reiniciar PM2 (`pm2 restart flowedu`)
5. Salvar checkpoint no Manus (`webdev_save_checkpoint`)

---

## 2. Links de Notificações

**Regra:** Todo link gerado em notificações (campo `link` nas procedures do backend) deve corresponder a uma rota existente registrada em `client/src/App.tsx`. Antes de usar um link em notificação, verificar se a rota existe.

---

## 3. Sincronização VPS

**Regra:** Toda alteração de código deve ser sincronizada com a VPS (`flowedu.app`) via `scp` + `pnpm build` + `pm2 restart`. Nunca deixar o ambiente local e a VPS desatualizados.

---

## 4. Banco de Dados de Produção

**Regra:** Correções de dados no banco de produção (TiDB Cloud) devem ser feitas via cliente `mysql` na VPS com `--ssl-mode=REQUIRED`. Nunca editar dados de produção pelo ambiente de desenvolvimento local.

---

*Última atualização: 22/03/2026 — v5.1.0*
