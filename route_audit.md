# Auditoria de Rotas - FlowEdu

## Rotas Quebradas Identificadas

### 1. `/profile-selection` ❌
**Localização:** `FeatureGuard.tsx`
**Status:** Rota não definida no App.tsx
**Ação:** Remover referências ou criar a rota (perfil único foi implementado, então remover)

### 2. `/interactive-projects` ❌
**Localização:** `ProfileOnboarding.tsx`
**Status:** Rota não definida no App.tsx
**Ação:** Remover referência ou implementar a funcionalidade

### 3. `/student-tasks` ❌
**Localização:** `StudentAlerts.tsx`
**Status:** Rota não definida no App.tsx
**Ação:** Criar rota ou redirecionar para outra página existente

### 4. `/student-leaderboard` ❌
**Localização:** `StudentRankingWidget.tsx`
**Status:** Rota não definida no App.tsx
**Ação:** Criar rota ou redirecionar para `/student-stats`

### 5. `/trails` ❌ **[JÁ CORRIGIDO]**
**Localização:** `Dashboard.tsx` (Ações Rápidas)
**Status:** Rota não definida no App.tsx
**Ação:** ✅ Já corrigido para `/learning-paths`

### 6. `/methodologies` ⚠️
**Localização:** Possível referência no código
**Status:** Rota não definida, mas `/active-methodologies` existe
**Ação:** Verificar se há referências e corrigir para `/active-methodologies`

## Rotas Definidas mas Não Usadas

Estas rotas existem no App.tsx mas podem não ter links diretos:
- `/user-debug` - Rota de debug (OK estar sem link direto)
- `/clear-session` - Rota utilitária (OK estar sem link direto)
- `/esqueci-senha` - Acessível via link na página de login
- `/redefinir-senha` - Acessível via email
- `/cadastro-professor` - Acessível via link na página de login
- `/register` - Acessível via link na página de login

## Resumo

**Total de rotas quebradas:** 5 (1 já corrigida)
**Rotas a corrigir:** 4
**Prioridade:** Alta - podem causar erro 404 para usuários

## Recomendações

1. **Remover** referências a `/profile-selection` (perfil único implementado)
2. **Decidir** se `/interactive-projects` será implementado ou removido
3. **Criar** rota `/student-tasks` ou redirecionar para página existente
4. **Criar** rota `/student-leaderboard` ou redirecionar para `/student-stats`
5. **Verificar** todas as referências a `/methodologies` e corrigir para `/active-methodologies`
