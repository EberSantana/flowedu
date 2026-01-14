# Gerenciamento de Cache do Vite

## Visão Geral

O Vite utiliza um sistema de cache para acelerar o desenvolvimento. O cache é armazenado em `node_modules/.vite` e contém dependências pré-bundled e metadados de otimização.

## Problemas Comuns de Cache

### 1. Erro "Invalid hook call" no React

**Sintomas:**
- Erro "Cannot read properties of null (reading 'useState')"
- Erro "Invalid hook call. Hooks can only be called inside of the body of a function component"

**Causa:**
O cache do Vite pode ficar corrompido ou desatualizado, causando múltiplas instâncias do React.

**Solução:**
```bash
pnpm clean:cache && pnpm dev
# ou
pnpm dev:fresh
```

### 2. Mudanças não refletidas após atualização de dependências

**Sintomas:**
- Código novo não aparece após `pnpm add` ou `pnpm update`
- Erros de importação após atualizar pacotes

**Solução:**
```bash
pnpm clean:cache && pnpm dev
```

### 3. HMR (Hot Module Replacement) não funcionando

**Sintomas:**
- Mudanças no código não são refletidas automaticamente
- Necessidade de refresh manual da página

**Solução:**
1. Verifique se o arquivo está sendo salvo corretamente
2. Reinicie o servidor: `pnpm clean:restart`
3. Verifique o console do navegador para erros de WebSocket

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `pnpm clean` | Remove cache do Vite e pasta dist |
| `pnpm clean:cache` | Remove apenas o cache do Vite |
| `pnpm clean:all` | Remove todo o cache (Vite, dist, .cache) |
| `pnpm clean:restart` | Limpa cache e reinicia o servidor |
| `pnpm dev:fresh` | Inicia desenvolvimento com cache limpo |

## Configurações de Otimização

O arquivo `vite.config.ts` inclui várias configurações para evitar problemas de cache:

### 1. Dedupe (Deduplicação)

```typescript
resolve: {
  dedupe: [
    'react', 
    'react-dom', 
    'react/jsx-runtime', 
    'react/jsx-dev-runtime',
    '@tanstack/react-query',
    '@trpc/react-query',
  ],
}
```

Garante que apenas uma cópia de cada pacote seja usada, evitando conflitos.

### 2. OptimizeDeps (Pré-bundling)

```typescript
optimizeDeps: {
  include: [
    'react', 
    'react-dom', 
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    '@trpc/client', 
    '@trpc/react-query',
    '@tanstack/react-query',
  ],
}
```

Pré-bundla dependências críticas para evitar problemas de importação.

### 3. ManualChunks (Separação de Chunks)

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        trpc: ['@trpc/client', '@trpc/react-query'],
        query: ['@tanstack/react-query'],
      },
    },
  },
}
```

Separa dependências em chunks distintos para melhor caching no navegador.

### 4. Warmup (Pré-carregamento)

```typescript
server: {
  warmup: {
    clientFiles: [
      './src/main.tsx',
      './src/App.tsx',
      './src/lib/trpc.ts',
    ],
  },
}
```

Pré-carrega arquivos frequentemente usados para acelerar o desenvolvimento.

## Boas Práticas

1. **Após atualizar dependências:** Sempre execute `pnpm clean:cache`
2. **Ao encontrar erros estranhos:** Primeiro tente `pnpm dev:fresh`
3. **Antes de fazer deploy:** Execute `pnpm clean` para garantir build limpo
4. **Ao mudar versões do React:** Execute `pnpm clean:all` e reinstale dependências

## Diagnóstico

Para verificar o tamanho do cache:
```bash
du -sh node_modules/.vite
```

Para verificar versões do React instaladas:
```bash
pnpm list react react-dom
```

Para verificar se há múltiplas cópias do React:
```bash
find node_modules -name "react" -type d | grep -v "@types"
```
