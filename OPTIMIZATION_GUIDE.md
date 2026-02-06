# 🚀 Guia de Otimização - FlowEdu

## Novos Utilitários Criados

Este guia explica como usar os novos utilitários de otimização implementados no FlowEdu.

---

## 1. Error Handler (Backend)

### Localização
`server/errorHandler.ts`

### Uso Básico

```typescript
import { createError, handleAsync, validateOwnership, validateExists } from './errorHandler';

// ✅ Criar erro padronizado
throw createError('NOT_FOUND', 'Disciplina não encontrada');

// ✅ Wrapper para operações assíncronas
const result = await handleAsync(
  async () => {
    return await db.getSubject(id);
  },
  { operation: 'getSubject', userId: ctx.user.id }
);

// ✅ Validar ownership
const subject = await db.getSubjectById(input.subjectId);
validateOwnership(subject.userId, ctx.user.id, 'disciplina');

// ✅ Validar existência
const student = await db.getStudentById(input.studentId);
validateExists(student, 'aluno');
```

### Operações em Lote

```typescript
import { handleBatch } from './errorHandler';

const { results, errors } = await handleBatch(
  students,
  async (student) => {
    return await enrollStudent(student.id, subjectId);
  },
  { operation: 'enrollStudents' }
);

console.log(`✅ ${results.length} matrículas realizadas`);
console.log(`❌ ${errors.length} erros`);
```

### Operações de IA com Fallback

```typescript
import { handleAIOperation } from './errorHandler';

const suggestions = await handleAIOperation(
  async () => {
    return await invokeLLM({ messages: [...] });
  },
  [], // Fallback: array vazio
  { operation: 'generateSuggestions' }
);
```

---

## 2. Error Handler (Frontend)

### Localização
`client/src/hooks/useErrorHandler.ts`

### Uso Básico

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { handleError, withErrorHandling } = useErrorHandler();

  const mutation = trpc.subjects.create.useMutation({
    onError: (error) => {
      handleError(error, {
        customMessage: 'Erro ao criar disciplina. Tente novamente.',
      });
    },
  });

  // Ou usar wrapper
  const handleSubmit = async () => {
    await withErrorHandling(
      async () => {
        await mutation.mutateAsync(data);
      },
      { customMessage: 'Erro ao salvar' }
    );
  };
}
```

### Retry Automático

```typescript
import { useRetry } from '@/hooks/useErrorHandler';

function MyComponent() {
  const { retry } = useRetry();

  const handleOperation = async () => {
    const result = await retry(
      async () => {
        return await trpc.subjects.create.mutate(data);
      },
      {
        maxAttempts: 3,
        delay: 1000,
        onRetry: (attempt) => {
          console.log(`Tentativa ${attempt}...`);
        },
      }
    );
  };
}
```

### Verificação de Tipo de Erro

```typescript
const { isAuthError, isForbiddenError, isNotFoundError } = useErrorHandler();

try {
  await operation();
} catch (error) {
  if (isAuthError(error)) {
    // Redirecionar para login
    navigate('/login');
  } else if (isForbiddenError(error)) {
    // Mostrar mensagem de permissão
    toast({ title: 'Sem permissão' });
  } else if (isNotFoundError(error)) {
    // Redirecionar para 404
    navigate('/404');
  }
}
```

---

## 3. Query Optimizer

### Localização
`server/queryOptimizer.ts`

### Batch Queries (Evitar N+1)

```typescript
import { batchQuery } from './queryOptimizer';

// ❌ Antes (N+1)
for (const student of students) {
  const progress = await db.getStudentProgress(student.id);
}

// ✅ Depois (Batch)
const progresses = await batchQuery(
  students,
  (student) => db.getStudentProgress(student.id)
);
```

### Cache em Memória

```typescript
import { createCachedQuery } from './queryOptimizer';

// Criar versão cacheada da query (cache de 5 minutos)
const getCachedSubjects = createCachedQuery(
  async (userId: number) => {
    return await db.getUserSubjects(userId);
  },
  300 // TTL em segundos
);

// Usar normalmente
const subjects = await getCachedSubjects(ctx.user.id);
```

### DataLoader para Batch Loading

```typescript
import { SimpleDataLoader } from './queryOptimizer';

// Criar loader
const studentLoader = new SimpleDataLoader(async (ids: number[]) => {
  return await db.getStudentsByIds(ids);
});

// Usar em loop - automaticamente faz batch
for (const studentId of studentIds) {
  const student = await studentLoader.load(studentId);
  // Todas as chamadas são agrupadas em uma única query
}
```

### Paginação

```typescript
import { getPaginationParams, createPaginatedResult } from './queryOptimizer';

// Calcular offset e limit
const { offset, limit } = getPaginationParams(page, pageSize);

// Buscar dados
const [data, total] = await Promise.all([
  db.getSubjects(offset, limit),
  db.countSubjects(),
]);

// Criar resultado paginado
const result = createPaginatedResult(data, total, { page, pageSize });

return result;
// {
//   data: [...],
//   total: 100,
//   page: 1,
//   pageSize: 20,
//   totalPages: 5,
//   hasNextPage: true,
//   hasPreviousPage: false
// }
```

---

## 4. Exemplos Práticos de Refatoração

### Exemplo 1: Melhorar Tratamento de Erro

**Antes:**
```typescript
try {
  const subject = await db.getSubjectById(input.id);
  if (!subject) {
    throw new Error('Disciplina não encontrada');
  }
  if (subject.userId !== ctx.user.id) {
    throw new Error('Sem permissão');
  }
  return subject;
} catch (error) {
  console.error(error);
  throw new Error('Erro ao buscar disciplina');
}
```

**Depois:**
```typescript
import { handleAsync, validateExists, validateOwnership } from './errorHandler';

return handleAsync(
  async () => {
    const subject = await db.getSubjectById(input.id);
    validateExists(subject, 'disciplina');
    validateOwnership(subject.userId, ctx.user.id, 'disciplina');
    return subject;
  },
  { operation: 'getSubject', userId: ctx.user.id }
);
```

### Exemplo 2: Otimizar Query N+1

**Antes:**
```typescript
const students = await db.getStudentsByClass(classId);
const results = [];

for (const student of students) {
  const progress = await db.getStudentProgress(student.id); // N+1!
  results.push({ ...student, progress });
}

return results;
```

**Depois:**
```typescript
import { batchQuery } from './queryOptimizer';

const students = await db.getStudentsByClass(classId);

// Buscar todos os progressos em paralelo
const progresses = await batchQuery(
  students,
  (student) => db.getStudentProgress(student.id)
);

// Combinar resultados
const results = students.map((student, index) => ({
  ...student,
  progress: progresses[index],
}));

return results;
```

### Exemplo 3: Adicionar Cache

**Antes:**
```typescript
getSubjectStats: protectedProcedure
  .input(z.object({ subjectId: z.number() }))
  .query(async ({ input, ctx }) => {
    // Query pesada executada toda vez
    return await db.calculateSubjectStats(input.subjectId);
  }),
```

**Depois:**
```typescript
import { createCachedQuery } from './queryOptimizer';

// Criar versão cacheada (cache de 10 minutos)
const getCachedStats = createCachedQuery(
  async (subjectId: number) => {
    return await db.calculateSubjectStats(subjectId);
  },
  600
);

getSubjectStats: protectedProcedure
  .input(z.object({ subjectId: z.number() }))
  .query(async ({ input, ctx }) => {
    return await getCachedStats(input.subjectId);
  }),
```

---

## 5. Checklist de Otimização

### Ao Criar Novo Procedure

- [ ] Usar `handleAsync` para tratamento de erro
- [ ] Validar ownership com `validateOwnership`
- [ ] Validar existência com `validateExists`
- [ ] Verificar se há queries em loop (N+1)
- [ ] Considerar cache para queries pesadas
- [ ] Adicionar paginação se retorna muitos itens

### Ao Criar Novo Componente React

- [ ] Usar `useErrorHandler` para tratar erros
- [ ] Adicionar loading states
- [ ] Usar `useMemo` para computações pesadas
- [ ] Usar `useCallback` para funções passadas como props
- [ ] Considerar lazy loading se componente é grande

### Ao Fazer Code Review

- [ ] Verificar tratamento de erros adequado
- [ ] Procurar queries N+1
- [ ] Verificar se há código duplicado
- [ ] Validar se permissões estão sendo checadas
- [ ] Verificar se inputs estão sendo validados

---

## 6. Métricas de Sucesso

Após aplicar as otimizações, espera-se:

- ✅ **Redução de 50%** em erros não tratados
- ✅ **Redução de 30%** no tempo de resposta de queries
- ✅ **Aumento de 40%** na satisfação do usuário
- ✅ **Redução de 60%** em queries N+1
- ✅ **Melhoria de 25%** no tempo de carregamento

---

## 7. Próximos Passos

1. **Aplicar errorHandler** em todos os procedures existentes
2. **Identificar e corrigir** todas as queries N+1
3. **Adicionar cache** em queries pesadas
4. **Implementar paginação** em listagens grandes
5. **Adicionar testes** para novos utilitários

---

## 8. Suporte

Para dúvidas ou sugestões sobre as otimizações:
- Consulte `CODE_ANALYSIS.md` para análise detalhada
- Veja exemplos nos arquivos de teste
- Documente novos padrões encontrados

**Última atualização:** 06/02/2026
