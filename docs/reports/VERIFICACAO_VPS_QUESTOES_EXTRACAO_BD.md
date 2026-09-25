# Verificação da base de produção na VPS

**Data da verificação:** 25/09/2026
**Ambiente:** `/var/www/flowedu` na VPS do FlowEdu
**Banco:** `flowedu` no TiDB configurado pela aplicação
**Método:** consultas agregadas, somente leitura; nenhum dado foi alterado

## Conclusão principal

A base de produção da VPS **não é igual à base anteriormente consultada no ambiente local/sandbox**. Por isso, os resultados não devem ser misturados.

No período usado na análise anterior, de **05/01/2026 a 15/03/2026**, a produção não possui registros de:

- tentativas de exercícios;
- respostas de exercícios;
- submissões de trabalhos;
- comportamentos;
- insights de IA.

A produção possui dados operacionais a partir de fevereiro/março de 2026 e dados de telemetria de IA até setembro de 2026.

## Estado operacional da VPS

- PM2: processo `flowedu` online.
- Servidor executado a partir de `/var/www/flowedu/dist/index.js`.
- Diretório de assets publicado contém **207 arquivos**.
- O banco de produção possui **152 tabelas**.
- A verificação não reiniciou o PM2, não executou migration e não alterou tabelas.

## Dados administrativos atuais na produção

| Indicador | Resultado |
|---|---:|
| Usuários cadastrados | 8 |
| Usuários ativos | 8 |
| Usuários aprovados | 7 |
| Alunos cadastrados | 366 |
| Disciplinas cadastradas | 16 |
| Professores na tabela `teachers` | A tabela não existe na produção consultada |
| Matrículas em `student_enrollments` | 1 |
| Matrículas em `subjectEnrollments` | 261 |
| Alunos distintos em `subjectEnrollments` | 258 |
| Disciplinas com registros em `subjectEnrollments` | 13 |

### Gênero cadastrado

Na tabela de alunos há distribuição demográfica registrada:

| Categoria | Alunos |
|---|---:|
| Masculino | 40 |
| Feminino | 62 |
| Não binário | 1 |
| Prefere não informar | 261 |
| Total | 364 registros com valor contabilizado |

O total cadastral informado pela consulta é 366; a diferença indica que há valores nulos ou categorias adicionais que devem ser tratados em uma extração completa. Não se deve usar o campo de avatar como substituto do gênero declarado.

## Trilhas e progresso

A produção possui as seguintes estruturas:

- `learning_modules`: **73 módulos/trilhas ou módulos de aprendizagem**;
- `learning_topics`: **180 tópicos**;
- `student_topic_progress`: **251 registros de progresso**;
- `topic_progress_history`: **0 registros**.

Distribuição do progresso atual:

| Status | Registros | Alunos distintos |
|---|---:|---:|
| `completed` | 203 | 54 |
| `in_progress` | 48 | 25 |

A produção permite calcular tópicos concluídos, em andamento e alunos por tópico/módulo. Entretanto, o schema não possui um evento explícito de “abertura do tópico” separado de `createdAt`/`updatedAt`; portanto, tempo de abertura até conclusão e abandono exigem uma definição operacional.

Também não há, nesta verificação, um campo inequívoco que identifique quais módulos foram gerados por IA. O total de 73 deve ser tratado como total de módulos registrados, não como total comprovado de trilhas geradas por IA.

## Avaliações e provas

A produção possui estruturas para avaliações:

- `assessments`;
- `assessment_questions`;
- `assessment_attempts`;
- `assessment_answers`.

Contagens atuais:

| Indicador | Resultado |
|---|---:|
| Avaliações em `assessments` | 0 |
| Questões em `assessment_questions` | 0 |
| Tentativas em `assessment_attempts` | 30 |
| Respostas em `assessment_answers` | 580 |
| Tentativas submetidas | 29 |
| Tentativas em andamento | 1 |
| Alunos distintos com tentativas submetidas | 28 |

A existência de 30 tentativas sem registros correspondentes em `assessments` e `assessment_questions` indica possível inconsistência referencial, histórico incompleto ou limpeza parcial de dados. Não é seguro calcular média, desvio padrão, faixas de notas ou taxa de aprovação por prova sem investigar essa relação.

O schema possui campos que permitem algumas métricas, como `score`, `percentage`, `passed`, `timeSpentSeconds`, `startedAt`, `submittedAt`, `attemptNumber` e `passingScore`. Não há, nesta verificação, evidência de um histórico de correção manual do gabarito.

## Exercícios de pensamento computacional

A produção possui `student_exercises`, `student_exercise_attempts` e `student_exercise_answers`, mas as consultas realizadas encontraram:

- 0 tentativas no período de 05/01 a 15/03/2026;
- 0 respostas no mesmo período;
- 0 registros históricos nas tabelas de tentativas e respostas na consulta all-time realizada.

A tabela de exercícios possui o campo `computationalThinkingEnabled` em `subjects`, mas não foi possível comprovar, com os dados atuais, uma população preenchida de exercícios de pensamento computacional ou uma série de submissões para calcular taxa de acerto.

## IA e dicas personalizadas

A produção possui a tabela `ai_usage_logs`, com campos de:

- provedor;
- modelo;
- funcionalidade;
- tokens de prompt e conclusão;
- sucesso/erro;
- mensagem de erro;
- usuário;
- data de criação.

Foram encontrados **37 registros de uso de IA** no total:

| Provedor | Modelo | Funcionalidade | Total | Sucessos | Falhas |
|---|---|---|---:|---:|---:|
| Groq | `llama-3.3-70b-versatile` | `generate_exercise` | 25 | 3 | 22 |
| Groq | `llama-3.3-70b-versatile` | `student_analysis` | 5 | 5 | 0 |
| Groq | `llama-3.3-70b-versatile` | `generate_assessment` | 3 | 3 | 0 |
| Groq | `llama-3.3-70b-versatile` | `other` | 3 | 1 | 2 |
| Groq | `llama-3.3-70b-versatile` | `student_ai_hints` | 1 | 0 | 1 |

Período da telemetria: **17/04/2026 a 11/09/2026**.

A tabela de telemetria permite responder melhor às perguntas de rastreabilidade do que a base local anteriormente consultada. Ainda assim, a tabela não mostra, nos campos verificados, um `prompt_id`, `ai_request_id`, versão do prompt ou cadeia completa de revisão/publicação/consumo.

## Registros comportamentais

A produção possui **427 registros comportamentais**, todos na categoria:

| Categoria | Registros | Alunos distintos |
|---|---:|---:|
| `exercise_completion` | 427 | 146 |

Período: **18/03/2026 a 03/05/2026**.

Não foram encontrados, na agregação realizada, registros de categorias explícitas de atraso, ausência, dificuldade conceitual ou entrega fora do prazo. Isso não prova que nunca ocorreram; significa que não aparecem como categorias preenchidas nessa tabela de produção.

## Acessos e engajamento

A tabela `access_logs` possui **1.431 acessos**, entre **10/03/2026 e 20/09/2026**. Ela contém timestamp, usuário/aluno, navegador, sistema operacional, página visitada e duração de sessão.

Portanto, a produção permite calcular:

- curva diária de acesso;
- acessos por dia da semana e hora;
- usuários ativos por semana;
- último acesso por usuário ou aluno;
- possíveis períodos de inatividade.

Não existe, nesta verificação, uma tabela específica de “churn”. Churn deverá ser definido por regra, por exemplo: aluno que acessou na primeira semana e não teve novo acesso por determinado número de dias.

## Auditoria e supervisão humana

A produção possui as tabelas `audit_logs` e `review_history`, mas ambas retornaram **0 registros** na consulta all-time realizada.

Isso significa que não há evidência operacional suficiente para medir:

- conteúdos de IA revisados por professor;
- conteúdos publicados sem revisão;
- tempo entre geração e revisão;
- edições feitas pelo professor;
- reconstrução completa de prompt → geração → revisão → publicação → consumo.

Também não foi encontrada a tabela `teachers` na produção consultada, embora existam campos `teacherId`, `professorId` e `userId` em outras tabelas. Essa divergência de modelagem deve ser resolvida antes de calcular métricas por professor.

## Classificação das 104 perguntas

### Disponível ou parcialmente disponível

- usuários, alunos e disciplinas;
- matrículas em `subjectEnrollments`;
- módulos e tópicos;
- progresso concluído/em andamento;
- avaliações e tentativas, com inconsistência referencial a investigar;
- telemetria de IA;
- registros comportamentais;
- acessos diários;
- gênero declarado, com dados nulos/categorias a revisar;
- campos de nota, aprovação e tempo de resolução em tentativas de avaliação.

### Não comprovado na produção atual

- total de professores por tabela própria;
- trilhas explicitamente marcadas como geradas por IA;
- abertura individual de tópico;
- abandono com definição metodológica;
- exercícios de pensamento computacional efetivamente respondidos;
- dicas de IA com histórico de solicitação por aluno;
- correlação entre dica e nota final;
- revisão humana e histórico de edição;
- prompts, request IDs e versão do modelo/prompt;
- erros HTTP 5xx e sessões interrompidas por timeout;
- tempo real economizado pelo professor;
- grupo experimental, controle, consentimento e coorte do estudo.

## Recomendação metodológica

Para o artigo, deve ser usada a expressão **“dados observados na base de produção da VPS”**, separando-os dos dados extraídos do ambiente local. O período de 05/01 a 15/03/2026 não deve ser apresentado como período observado em produção, pois as tabelas de atividade retornaram zero nessa janela.

Antes de fechar os resultados, é necessário:

1. confirmar qual banco representa o experimento oficial;
2. investigar as 30 tentativas de avaliação sem avaliações correspondentes;
3. padronizar professor/usuário e resolver a ausência da tabela `teachers`;
4. definir formalmente trilha, abertura, conclusão, abandono e churn;
5. usar a telemetria `ai_usage_logs` como fonte oficial de chamadas de IA;
6. implementar eventos de revisão humana e auditoria de conteúdo;
7. corrigir ou documentar registros de alunos com campos demográficos nulos.

## Observação de segurança

Durante a inspeção técnica, foi constatado que variáveis de ambiente sensíveis estão carregadas no processo PM2. Como a saída de comandos de inventário de processos pode expor essas variáveis, recomenda-se rotacionar as credenciais do banco, JWT, APIs de IA e demais chaves que tenham aparecido em logs ou saídas administrativas.
