# 🧠 Sistema de Análise de Aprendizado com IA

## Visão Geral

O **Sistema de Análise de Aprendizado com IA** é uma funcionalidade avançada que permite aos professores monitorar, analisar e compreender profundamente o comportamento e evolução de seus alunos através de inteligência artificial.

### Principais Funcionalidades

1. **📊 Monitoramento de Comportamento**
   - Registro automático de ações dos alunos
   - Análise de padrões de engajamento
   - Detecção de dificuldades e progressos

2. **🔍 Detecção de Padrões**
   - Identificação automática de padrões de aprendizado
   - Análise de tendências de desempenho
   - Reconhecimento de estilos de aprendizagem

3. **💡 Insights Inteligentes**
   - Geração automática de insights personalizados
   - Recomendações de ações pedagógicas
   - Previsão de necessidades de intervenção

4. **⚠️ Sistema de Alertas**
   - Alertas automáticos para situações críticas
   - Notificações de queda de desempenho
   - Avisos de necessidade de atenção especial

---

## Arquitetura do Sistema

### Estrutura do Banco de Dados

#### 1. **student_behaviors** - Registro de Comportamentos
Armazena todas as ações e comportamentos dos alunos.

**Campos principais:**
- `behaviorType`: Tipo de comportamento (exercise_completion, quiz_attempt, etc.)
- `score`: Pontuação obtida (quando aplicável)
- `metadata`: Dados adicionais em JSON
- `recordedAt`: Data e hora do registro

**Tipos de comportamento suportados:**
- `exercise_completion` - Conclusão de exercício
- `quiz_attempt` - Tentativa de quiz
- `topic_access` - Acesso a tópico
- `material_download` - Download de material
- `doubt_posted` - Dúvida postada
- `assignment_submission` - Entrega de tarefa
- `attendance` - Presença
- `late_submission` - Entrega atrasada
- `improvement_shown` - Melhora demonstrada
- `struggle_detected` - Dificuldade detectada
- `engagement_high` - Engajamento alto
- `engagement_low` - Engajamento baixo

#### 2. **learning_patterns** - Padrões de Aprendizado
Armazena padrões identificados pela IA.

**Campos principais:**
- `patternType`: Tipo do padrão identificado
- `patternDescription`: Descrição detalhada
- `confidence`: Nível de confiança (0-1)
- `evidence`: Evidências em JSON

#### 3. **ai_insights** - Insights Gerados
Armazena insights e recomendações da IA.

**Campos principais:**
- `insightType`: Tipo do insight (recommendation, warning, opportunity)
- `title`: Título do insight
- `description`: Descrição detalhada
- `actionable`: Se requer ação
- `actionSuggestion`: Sugestão de ação
- `priority`: Prioridade (low, medium, high, critical)
- `confidence`: Confiança da IA (0-1)

#### 4. **performance_metrics** - Métricas de Desempenho
Armazena métricas calculadas de desempenho.

**Campos principais:**
- `metricType`: Tipo da métrica
- `metricValue`: Valor numérico
- `trend`: Tendência (improving, declining, stable)
- `percentile`: Percentil em relação à turma

#### 5. **alerts** - Alertas e Notificações
Armazena alertas gerados automaticamente.

**Campos principais:**
- `alertType`: Tipo do alerta
- `severity`: Severidade (info, warning, urgent, critical)
- `title`: Título do alerta
- `message`: Mensagem detalhada
- `recommendedAction`: Ação recomendada
- `acknowledged`: Se foi reconhecido
- `resolved`: Se foi resolvido

---

## Rotas tRPC Disponíveis

### 📝 Registro de Comportamento

```typescript
trpc.analytics.recordBehavior.useMutation()
```

**Input:**
```typescript
{
  studentId: number;
  subjectId?: number;
  behaviorType: BehaviorType;
  score?: number;
  metadata?: string; // JSON
}
```

**Uso:**
Registra um comportamento do aluno no sistema.

---

### 🔍 Análise Completa do Aluno

```typescript
trpc.analytics.analyzeStudent.useMutation()
```

**Input:**
```typescript
{
  studentId: number;
  subjectId?: number;
}
```

**Output:**
```typescript
{
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  recommendations: string[];
  confidence: number;
}
```

**Uso:**
Gera uma análise completa do aluno usando IA, incluindo insights, padrões e alertas.

---

### 💡 Buscar Insights do Aluno

```typescript
trpc.analytics.getStudentInsights.useQuery()
```

**Input:**
```typescript
{
  studentId: number;
  includeDismissed?: boolean;
}
```

**Uso:**
Retorna todos os insights gerados para um aluno específico.

---

### 📊 Buscar Padrões de Aprendizado

```typescript
trpc.analytics.getLearningPatterns.useQuery()
```

**Input:**
```typescript
{
  studentId: number;
}
```

**Uso:**
Retorna padrões de aprendizado identificados para o aluno.

---

### ⚠️ Buscar Alertas

```typescript
// Alertas pendentes do professor
trpc.analytics.getAlerts.useQuery()

// Alertas de um aluno específico
trpc.analytics.getStudentAlerts.useQuery({
  studentId: number;
  includeResolved?: boolean;
})
```

**Uso:**
Retorna alertas pendentes ou de um aluno específico.

---

### ✅ Gerenciar Alertas

```typescript
// Reconhecer alerta
trpc.analytics.acknowledgeAlert.useMutation({
  alertId: number;
})

// Resolver alerta
trpc.analytics.resolveAlert.useMutation({
  alertId: number;
  notes?: string;
})
```

**Uso:**
Marca alertas como reconhecidos ou resolvidos.

---

### 📈 Estatísticas e Métricas

```typescript
// Estatísticas de alertas
trpc.analytics.getAlertStatistics.useQuery()

// Métricas de desempenho
trpc.analytics.getPerformanceMetrics.useQuery({
  studentId: number;
  metricType?: string;
})

// Analytics da turma
trpc.analytics.getClassAnalytics.useQuery({
  subjectId?: number;
})
```

**Uso:**
Obtém estatísticas gerais, métricas de desempenho e visão geral da turma.

---

## Interface do Professor

### Acesso

Navegue para: **Menu Lateral → Análise de Aprendizado** (ícone de cérebro 🧠)

Ou acesse diretamente: `/learning-analytics`

### Funcionalidades da Interface

#### 1. **Dashboard Principal**

Exibe 4 cards de estatísticas:
- **Total de Alunos**: Quantidade total de alunos cadastrados
- **Alertas Críticos**: Número de alertas críticos pendentes
- **Precisam Atenção**: Alunos que necessitam intervenção
- **Insights Recentes**: Quantidade de insights gerados recentemente

#### 2. **Análise Individual**

- **Seletor de Aluno**: Dropdown para escolher o aluno
- **Botão "Analisar com IA"**: Gera análise completa usando inteligência artificial
- **Indicador de Carregamento**: Mostra progresso da análise

#### 3. **Sistema de Abas**

##### **Aba Insights**
- Lista todos os insights gerados para o aluno
- Mostra prioridade, tipo e nível de confiança
- Exibe ações sugeridas em destaque
- Permite dispensar insights não relevantes
- Código de cores por prioridade:
  - 🔴 Crítico/Alto: Vermelho/Laranja
  - 🔵 Médio: Azul
  - ⚪ Baixo: Cinza

##### **Aba Alertas**
- Lista alertas do aluno com status
- Mostra severidade (crítico, urgente, warning, info)
- Exibe ações recomendadas
- Botões para:
  - ✅ Reconhecer alerta
  - ✅ Resolver alerta
- Indicadores visuais de status:
  - Reconhecido
  - Resolvido

##### **Aba Padrões**
- Mostra padrões de aprendizado detectados
- Exibe tipo do padrão e descrição
- Mostra nível de confiança da detecção
- Data de identificação

---

## Fluxo de Uso Recomendado

### 1. **Monitoramento Contínuo**

O sistema registra automaticamente comportamentos dos alunos durante suas interações:

```typescript
// Exemplo: Registrar conclusão de exercício
await trpc.analytics.recordBehavior.mutate({
  studentId: 123,
  subjectId: 45,
  behaviorType: 'exercise_completion',
  score: 85,
  metadata: JSON.stringify({
    exerciseId: 10,
    timeSpent: 300,
    attempts: 2
  })
});
```

### 2. **Análise Periódica**

Recomenda-se analisar alunos periodicamente (semanal ou quinzenal):

1. Acesse a página de Análise de Aprendizado
2. Selecione um aluno no dropdown
3. Clique em "Analisar com IA"
4. Aguarde a geração da análise (5-15 segundos)
5. Revise os insights, alertas e padrões gerados

### 3. **Ação sobre Insights**

Quando um insight é gerado:

1. Leia a descrição e avaliação geral
2. Verifique o nível de confiança
3. Analise as ações sugeridas
4. Implemente as recomendações pedagógicas
5. Marque o insight como dispensado se não for relevante

### 4. **Gestão de Alertas**

Quando um alerta é criado:

1. Revise a severidade e mensagem
2. Reconheça o alerta para indicar que está ciente
3. Tome a ação recomendada
4. Resolva o alerta com notas sobre o que foi feito

---

## Exemplos de Uso

### Exemplo 1: Detectar Aluno com Dificuldade

```typescript
// 1. Sistema registra baixas pontuações
await recordBehavior({
  studentId: 123,
  behaviorType: 'struggle_detected',
  score: 45
});

// 2. Professor solicita análise
const analysis = await analyzeStudent({
  studentId: 123
});

// 3. IA identifica padrão e gera alerta
// Output:
{
  overallAssessment: "Aluno apresenta dificuldades consistentes em álgebra",
  weaknesses: ["Operações com frações", "Equações de 1º grau"],
  alerts: [{
    type: "needs_attention",
    severity: "urgent",
    message: "Intervenção necessária para evitar reprovação"
  }],
  recommendations: [
    "Agendar aula de reforço focada em álgebra básica",
    "Fornecer exercícios extras com feedback imediato"
  ]
}
```

### Exemplo 2: Identificar Aluno de Alto Desempenho

```typescript
// 1. Sistema registra alto engajamento
await recordBehavior({
  studentId: 456,
  behaviorType: 'engagement_high',
  score: 95
});

// 2. Análise identifica padrão positivo
const analysis = await analyzeStudent({
  studentId: 456
});

// 3. IA gera insights de oportunidade
{
  overallAssessment: "Aluno demonstra excelente desempenho e engajamento",
  strengths: ["Raciocínio lógico", "Resolução de problemas"],
  patterns: [{
    type: "high_achiever",
    description: "Consistentemente acima da média da turma",
    confidence: 0.92
  }],
  recommendations: [
    "Oferecer desafios mais avançados",
    "Considerar papel de monitor para ajudar colegas"
  ]
}
```

---

## Integração com IA (LLM)

O sistema utiliza **LLM (Large Language Model)** para gerar análises inteligentes.

### Função Principal: `analyzeLearningBehavior`

Localização: `server/learningAnalytics.ts`

**Entrada:**
```typescript
{
  studentId: number;
  studentName: string;
  subjectName?: string;
  recentBehaviors: Array<{
    type: string;
    date: string;
    score?: number;
    metadata?: string;
  }>;
  recentExercises: Array<{
    title: string;
    score: number;
    completedAt: string;
    timeSpent?: number;
  }>;
}
```

**Saída:**
```typescript
{
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  recommendations: string[];
  confidence: number;
}
```

### JSON Schema Estruturado

O sistema usa **JSON Schema** para garantir respostas estruturadas e consistentes da IA:

```typescript
{
  type: "json_schema",
  json_schema: {
    name: "learning_behavior_analysis",
    strict: true,
    schema: {
      type: "object",
      properties: {
        overallAssessment: { type: "string" },
        strengths: { type: "array", items: { type: "string" } },
        weaknesses: { type: "array", items: { type: "string" } },
        // ... outros campos
      },
      required: ["overallAssessment", "strengths", "weaknesses", ...]
    }
  }
}
```

---

## Boas Práticas

### 1. **Frequência de Análise**

- **Alunos com dificuldades**: Análise semanal
- **Alunos regulares**: Análise quinzenal
- **Alunos avançados**: Análise mensal

### 2. **Interpretação de Insights**

- Sempre verifique o **nível de confiança** (confidence)
- Insights com confiança > 0.8 são mais confiáveis
- Use insights como **suporte à decisão**, não como verdade absoluta
- Combine insights da IA com sua experiência pedagógica

### 3. **Gestão de Alertas**

- Priorize alertas **críticos** e **urgentes**
- Reconheça alertas assim que tomar ciência
- Resolva alertas com notas detalhadas sobre ações tomadas
- Revise alertas resolvidos para avaliar eficácia

### 4. **Privacidade e Ética**

- Dados de comportamento são **confidenciais**
- Use insights apenas para **fins pedagógicos**
- Não compartilhe análises sem consentimento
- Seja transparente com alunos sobre o monitoramento

---

## Troubleshooting

### Problema: Análise não gera insights

**Possíveis causas:**
- Poucos dados de comportamento registrados
- Aluno recém-cadastrado sem histórico

**Solução:**
- Aguarde acumular mais dados (mínimo 5-10 interações)
- Registre comportamentos manualmente se necessário

### Problema: Insights parecem imprecisos

**Possíveis causas:**
- Dados de comportamento incompletos
- Metadados ausentes ou incorretos

**Solução:**
- Verifique se todos os comportamentos estão sendo registrados
- Inclua metadata relevante nos registros
- Aumente a frequência de análises

### Problema: Muitos alertas falsos positivos

**Possíveis causas:**
- Sensibilidade do sistema muito alta
- Dados temporários afetando análise

**Solução:**
- Ajuste os thresholds de severidade
- Considere tendências ao invés de pontos isolados
- Dispense alertas não relevantes

---

## Roadmap Futuro

### Funcionalidades Planejadas

1. **📊 Dashboards Avançados**
   - Gráficos de evolução temporal
   - Comparação entre alunos
   - Heatmaps de desempenho

2. **🎯 Previsão de Desempenho**
   - Predição de notas futuras
   - Identificação precoce de riscos
   - Recomendações proativas

3. **📱 Notificações em Tempo Real**
   - Alertas push para mobile
   - Integração com email
   - Notificações no sistema

4. **🤝 Análise Colaborativa**
   - Comparação entre turmas
   - Benchmarking de metodologias
   - Compartilhamento de insights

5. **📈 Relatórios Automáticos**
   - Geração de PDFs
   - Relatórios periódicos agendados
   - Exportação de dados

---

## Suporte e Documentação

### Arquivos Relacionados

- **Backend:**
  - `server/learningAnalytics.ts` - Funções de IA
  - `server/db.ts` - Funções de banco de dados
  - `server/routers.ts` - Rotas tRPC
  - `drizzle/schema.ts` - Schema do banco

- **Frontend:**
  - `client/src/pages/LearningAnalytics.tsx` - Interface principal
  - `client/src/App.tsx` - Roteamento
  - `client/src/components/Sidebar.tsx` - Menu lateral

- **Testes:**
  - `server/learningAnalytics.test.ts` - Testes automatizados

### Contato

Para dúvidas, sugestões ou problemas, entre em contato com a equipe de desenvolvimento.

---

## Conclusão

O Sistema de Análise de Aprendizado com IA é uma ferramenta poderosa para professores que desejam:

- ✅ **Compreender melhor** seus alunos
- ✅ **Identificar problemas** precocemente
- ✅ **Tomar decisões** baseadas em dados
- ✅ **Personalizar** o ensino
- ✅ **Melhorar resultados** de aprendizagem

Use-o como um **assistente inteligente** que complementa sua experiência pedagógica, não como um substituto do seu julgamento profissional.

**Bom uso e excelentes análises! 🧠📊✨**
