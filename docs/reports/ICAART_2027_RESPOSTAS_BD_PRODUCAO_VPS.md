# ICAART 2027 — Respostas verificadas na base de produção da VPS

**Data da extração:** 25/09/2026
**Banco:** `flowedu`, na VPS `/var/www/flowedu`
**Método:** consultas agregadas em modo somente leitura; nenhum registro foi alterado
**Janela de 70 dias usada para métricas recentes:** 17/07/2026 00:00 até 26/09/2026 00:00, limite superior exclusivo

## Aviso metodológico

Este documento usa exclusivamente a **base de produção da VPS**. Ela é diferente da base anteriormente consultada no sandbox. Não misturar os resultados.

A janela de 70 dias apresenta baixa atividade: há 16 chamadas de IA, 29 acessos registrados e 1 alteração de progresso em tópico. Muitas métricas históricas existem fora da janela, principalmente entre março e maio de 2026.

Outro ponto crítico: a tabela `ai_usage_logs` registra o uso da IA, mas não relaciona as chamadas a um professor ou aluno (`user_id` aparece nulo nos registros consultados). Assim, métricas por professor, por aluno e por disciplina não podem ser calculadas com segurança.

## Resumo executivo

- **37 chamadas de IA** registradas no total.
- **12 sucessos** e **25 falhas**, taxa histórica de falha de **67,57%**.
- Na janela de 70 dias: **16 chamadas**, **1 sucesso** e **15 falhas**, taxa de falha de **93,75%**.
- Modelo registrado: **Llama 3.3 70B Versatile**, provedor Groq.
- Tokens totais registrados: **30.050** no histórico disponível.
- Não há `prompt_id`, `ai_request_id`, `ai_model_version`, `ai_source`, `edited_content` ou `diff`.
- `audit_logs` e `review_history` estão vazias.
- Há **73 módulos**, **180 tópicos** e **251 registros de progresso**.
- Há **30 tentativas de avaliação** e **580 respostas**, mas `assessments` e `assessment_questions` estão vazias, o que impede vincular as tentativas às provas.
- Entre 29 tentativas submetidas, 22 foram aprovadas: **75,86%**.
- A média das notas submetidas foi **6,76/10**, com média percentual de **67,59%** e tempo médio de **468,31 segundos**.
- Há **427 registros comportamentais**, todos `exercise_completion`, envolvendo 146 alunos.

# Respostas por bloco

## Bloco 1 — Produtividade e economia de tempo docente

### 1. Tempo entre solicitação de IA e disponibilização do conteúdo

**Não disponível.** `ai_usage_logs` possui `createdAt`, mas não possui timestamps de solicitação e disponibilização/publicação relacionados ao mesmo conteúdo. Não é possível calcular latência de ponta a ponta.

### 2. Materiais gerados por IA por professor

**Não disponível por professor.** Existem 37 chamadas no log, mas `user_id` está nulo nos registros consultados. Também não há tabela de associação entre cada chamada e o material persistido.

### 3. Distribuição por disciplina e funcionalidade

**Parcial.** É possível distribuir as 37 chamadas por funcionalidade, mas não por disciplina. Histórico:

| Funcionalidade | Chamadas | Sucessos | Falhas |
|---|---:|---:|---:|
| `generate_exercise` | 25 | 3 | 22 |
| `student_analysis` | 5 | 5 | 0 |
| `generate_assessment` | 3 | 3 | 0 |
| `other` | 3 | 1 | 2 |
| `student_ai_hints` | 1 | 0 | 1 |

### 4. Trilhas geradas por IA e publicadas sem edição

**Não comprovável.** Há 73 `learning_modules`, mas não há campo inequívoco que identifique geração por IA, publicação, edição humana ou versão final.

### 5. Avaliações geradas por IA e tempo até aplicação

**Parcial.** O log registra 3 chamadas `generate_assessment`, todas bem-sucedidas, mas a tabela `assessments` está vazia. Não é possível relacionar geração, aplicação e data.

### 6. Planos de aula, infográficos e mapas mentais

**Não disponível.** Não foram encontradas chamadas ou identificadores confiáveis para essas funcionalidades no log de IA.

### 7. Frequência de IA por professor

**Não disponível.** O campo de usuário das chamadas consultadas está nulo. A frequência por funcionalidade pode ser apresentada, mas não por professor.

## Bloco 2 — Personalização e adaptação

### 8. Alunos que receberam dicas personalizadas

**Não comprovável como entrega a alunos.** Há uma chamada `student_ai_hints`, com falha, no histórico. Não existe registro persistido de dica entregue e vinculada a aluno.

### 9. Dicas por aluno e tópico

**Não disponível.** Não há vínculo confiável entre `ai_usage_logs`, aluno e tópico.

### 10. Alunos com análise individual por IA

**Não disponível como contagem de alunos.** Há 5 chamadas `student_analysis`, todas bem-sucedidas, mas sem `user_id` e sem vínculo de `studentId` no log.

### 11. Diferença de progresso entre alunos com e sem dicas

**Não calculável.** Não há coorte de alunos que receberam dicas nem grupo comparável sem dicas.

### 12. Conclusão em trilhas IA versus não IA

**Não calculável.** Os 73 módulos não possuem marcação confiável de origem IA/manual.

### 13. Tópicos adaptados ou reorganizados após IA

**Não disponível.** Não há histórico de recomendação, edição, reorganização ou versionamento de tópicos.

## Bloco 3 — Avaliação e feedback

### 14. Distribuição de notas

**Parcial, com cautela.** Para as 29 tentativas com status `submitted`:

- Mínimo: **1/10**;
- Máximo: **10/10**;
- Média: **6,76/10**;
- Média percentual: **67,59%**;
- Desvio padrão e quartis: não calculados nesta extração;
- Tempo médio: **468,31 segundos**.

O vínculo com uma prova específica não é possível porque há 30 tentativas, mas 0 registros em `assessments`.

### 15. Taxa de acerto por questão

**Não disponível por prova.** Há 580 respostas em `assessment_answers`, mas não há avaliações/questões correspondentes persistidas para definir o universo por prova.

### 16. Questões IA revisadas, editadas ou descartadas

**Não disponível.** Não há histórico de revisão humana ou descarte associado a questões geradas.

### 17. Erros de gabarito ou inconsistências

**Não mensurável.** O schema contém `correctAnswer`, mas não há registro de bug, correção manual ou comparação entre versões.

### 18. Alunos afetados por bugs

**Não disponível.** Não há tabela de incidentes ou vínculo de bug com tentativa/aluno.

### 19. Tempo de correção IA versus tradicional

**Não disponível.** Não há timestamps de início/fim de correção nem grupo tradicional comparável.

### 20. Justificativas e gabaritos validados por professores

**Não disponível.** Há campos de explicação em questões, mas não há validação humana registrada. `review_history` está vazia.

## Bloco 4 — Acompanhamento e desempenho

### 21. Registros comportamentais IA versus manual

**Não distinguível.** Existem **427 registros**, todos `exercise_completion`, de 146 alunos. A tabela não identifica se cada registro foi gerado por IA ou manualmente.

### 22. Distribuição temporal dos comportamentos

**Disponível parcialmente.** Os 427 eventos ocorreram entre **18/03/2026 e 03/05/2026**. Todos são `exercise_completion`. Não houve eventos de outras categorias na consulta agregada.

### 23. Correlação entre comportamento e progresso

**Não calculada.** Embora existam 427 comportamentos e 251 progressos, não há desenho temporal/coorte suficiente para afirmar correlação. O histórico `topic_progress_history` está vazio.

### 24. Correlação entre progresso e avaliação IA

**Não calculável.** Não há marcação confiável das avaliações como IA nem vínculo completo entre avaliações e tópicos.

### 25. Progresso após análise de desempenho IA

**Não disponível.** Há 5 chamadas `student_analysis`, mas não há alunos vinculados no log nem evento que marque o antes/depois.

### 26. Faixas de progresso e desempenho

**Parcial.** Progresso registrado:

| Status | Registros | Alunos | Tópicos |
|---|---:|---:|---:|
| `completed` | 203 | 54 | 81 |
| `in_progress` | 48 | 25 | 26 |

Desempenho de avaliações submetidas: 29 tentativas, média 6,76/10, 22 aprovadas. Não é metodologicamente seguro cruzar as duas populações por aluno sem definir a coorte e corrigir as referências às provas.

## Bloco 5 — Cobertura e escala

### 27. Disciplinas e uso de IA

- Disciplinas cadastradas: **16**.
- Chamadas de IA: **37**.
- Disciplinas associadas às chamadas: **não disponível**.

Não é possível dizer quantas disciplinas utilizaram IA.

### 28. Alunos alcançados por conteúdo IA

**Não disponível.** Os logs não possuem `studentId`, e os conteúdos não estão marcados de forma confiável como gerados por IA.

### 29. Uso de IA por professor e disciplina

**Não disponível.** `user_id` nulo e ausência de `subjectId` no log.

### 30. Ensino técnico versus superior

**Não disponível.** Não há classificação acadêmica confiável vinculada às chamadas de IA.

### 31. Alunos impactados por alguma IA

**Não disponível.** A telemetria registra chamadas, não exposição ou consumo por aluno.

### 32. Taxa de adoção pelos professores

**Não disponível.** Não há tabela `teachers` na produção e o log não identifica usuários/professores nas chamadas.

## Bloco 6 — Qualidade e validação

### 33. Saídas que passaram por validação de esquema

**Não disponível.** O banco não registra resultado de validação de schema por geração.

### 34. Saídas rejeitadas por deduplicação

**Não disponível.** Não há log de deduplicação.

### 35. Saídas corrigidas por normalização

**Não disponível.** Não há evento ou contador de normalização.

### 36. Conteúdo que precisou de intervenção humana

**Não disponível.** Não há revisão, edição ou publicação vinculada a conteúdo IA. `review_history` e `audit_logs` estão vazias.

### 37. Versões até a publicação final

**Não disponível.** Não há versionamento de conteúdo gerado.

### 38. Tempo geração → validação → publicação

**Não disponível.** Faltam os timestamps e os IDs de correlação.

## Bloco 7 — Governança e rastreabilidade

### 39. Registros com modelo, versão, prompt e parâmetros

**Parcial.** Os 37 registros possuem provedor e modelo. Não há campos encontrados para `ai_model_version`, `prompt_id`, `ai_request_id` ou `ai_source`. Tokens de prompt/conclusão estão disponíveis.

### 40. Reconstrução prompt → resposta → validação → publicação

**Não é possível.** O log de IA não possui prompt/resposta completos nem ID de correlação com conteúdo, validação ou publicação.

### 41. Conteúdos com trilha de auditoria completa

**Não disponível; evidência observada: 0.** `audit_logs` e `review_history` estão vazias.

### 42. Conteúdos publicados sem revisão humana

**Não mensurável.** Não há evento confiável de publicação e revisão. Não se deve converter ausência de log em prova de que nenhum conteúdo foi revisado.

### 43. Distribuição de modelos

**Disponível:** todas as 37 chamadas registradas usaram Groq com `llama-3.3-70b-versatile`. Não foram encontrados outros modelos no log consultado.

## Bloco 8 — Percepção e autorrelato

### 44. Professores que relataram economia de tempo

**Não disponível.** Não há pesquisa, formulário ou campo de autorrelato identificado.

### 45. Uso de IA versus utilidade pedagógica percebida

**Não calculável.** Falta variável de percepção.

### 46. Professores que revisaram conteúdo IA

**Não disponível.** Não há `revisedBy`, histórico de revisão preenchido ou equivalente confiável.

### 47. Reuso em turmas/semestres posteriores

**Não disponível.** Não há versionamento, origem IA e relação de reuso entre turmas/semestres.

### 48. Alunos que relataram benefício com dicas

**Não disponível.** Não há dicas persistidas com resposta de benefício percebido; a única chamada `student_ai_hints` registrada falhou.

## Bloco 9 — IA versus não IA

### 49. Progresso IA versus manual

**Não calculável.** Falta classificação de origem dos módulos.

### 50. Desempenho em prova IA versus tradicional

**Não calculável.** As provas não estão persistidas em `assessments` e não há marcador confiável de origem IA.

### 51. Tempo de preparação IA versus não IA

**Não disponível.** Não há registros de início/fim da preparação docente nem grupo não IA.

### 52. Engajamento IA versus não IA

**Não calculável.** Falta classificação de disciplinas e conteúdos por uso de IA.

### 53. Conclusão com dicas versus sem dicas

**Não calculável.** Falta histórico de dicas entregues, tópicos expostos e grupos comparáveis.

## Bloco 10 — Contexto Amazônia/IFAM/Coari

### 54. IA por internet/localização

**Não disponível.** Não foram identificados campos confiáveis de localização geográfica ou qualidade de internet relacionados ao uso de IA.

### 55. IA por dispositivo

**Parcial para acesso, não para IA.** `access_logs` possui navegador e sistema operacional, mas não há vínculo das chamadas de IA a dispositivo. Na janela de 70 dias houve 29 acessos de 10 usuários, sem classificação mobile/desktop calculada nesta extração.

### 56. Presencial versus remoto

**Não disponível.** Não há classificação de modalidade associada às chamadas de IA.

### 57. Interior versus capital

**Não disponível.** Não há localização geográfica dos alunos vinculada ao uso de IA.

### 58. Uso fora do horário de aula

**Não disponível como uso de IA.** Há horários de acesso, mas os logs de IA não possuem usuário/dispositivo e não há agenda confiável para definir horário de aula.

## Bloco 11 — Inclusão e acessibilidade

### 59. Alunos com dificuldades que receberam IA

**Não disponível.** Não há vínculo entre dificuldade, aluno e saída de IA. Há registros comportamentais apenas de `exercise_completion`.

### 60. Dicas e melhora em tópicos difíceis

**Não calculável.** Não há dicas bem-sucedidas vinculadas a tópicos e progresso posterior.

### 61. Baixo desempenho inicial que melhorou com IA

**Não calculável.** Falta coorte, linha de base e exposição comprovada à IA.

### 62. IA por nível de progresso inicial

**Não calculável.** Falta registro da exposição individual e da linha de base.

## Bloco 12 — Sustentabilidade e escalabilidade

### 63. Custo computacional médio por geração

**Não disponível.** Há tokens, mas não preço, custo por token, duração ou consumo computacional.

### 64. Tempo médio de resposta por funcionalidade

**Não disponível.** `ai_usage_logs` não possui duração/latência de início e fim.

### 65. Chamadas nos 70 dias

**16 chamadas** na janela de 17/07 a 25/09/2026:

- `generate_exercise`: 15 chamadas, 1 sucesso e 14 falhas;
- `student_ai_hints`: 1 chamada, 0 sucessos e 1 falha.

### 66. Taxa de falha

- Histórico total: **25 falhas de 37 chamadas = 67,57%**.
- Janela de 70 dias: **15 falhas de 16 chamadas = 93,75%**.

### 67. Volume de dados IA armazenado

**Parcial.** Não há marcador perfeito de “conteúdo IA”. Como aproximação de campos relacionados, foram medidos:

- `ai_insights.content` + `ai_insights.description`: 821 bytes em 4 registros;
- descrições de módulos: 6.729 bytes em 73 registros;
- descrições de tópicos: 17.986 bytes em 180 registros.

Esses valores não devem ser chamados de volume exclusivamente gerado por IA, pois os registros não possuem origem IA comprovada.

### 68. Conteúdos reutilizáveis

**Não disponível.** Não há classificação de reuso, licença, versão, origem IA ou vínculo entre conteúdos e novas turmas/instituições.

# Síntese para o artigo

A base de produção permite afirmar que o FlowEdu possui telemetria de IA e que, no histórico disponível, foram registradas 37 chamadas, principalmente para geração de exercícios, análise de alunos e geração de avaliações. Entretanto, a alta taxa de falha — 67,57% no histórico e 93,75% na janela recente — deve ser reportada como limitação operacional. A base também registra 73 módulos, 180 tópicos, progresso concluído/em andamento, 30 tentativas de avaliação e 427 eventos de conclusão de exercícios.

Não é possível sustentar, com os dados atuais, afirmações causais de produtividade docente, personalização individual, superioridade da IA sobre métodos tradicionais, revisão humana, reutilização, economia de tempo ou impacto por aluno. Faltam IDs de correlação, origem IA/manual do conteúdo, usuários nas chamadas, coortes, grupo de controle, logs de revisão e cadeia de auditoria.

# Correções recomendadas antes da submissão

1. Adicionar `requestId`, `userId`, `studentId`, `subjectId`, `contentId`, `modelVersion`, `promptVersion`, `startedAt`, `completedAt` e `status` à telemetria.
2. Registrar prompt e resposta de forma segura, com redaction de dados pessoais.
3. Criar eventos de validação, edição, revisão, publicação e consumo.
4. Marcar cada conteúdo como `generatedByAi`, `generationRequestId` e `humanReviewedAt`.
5. Corrigir a inconsistência entre as 30 tentativas e as tabelas vazias de avaliações/provas.
6. Criar coorte formal do experimento, consentimento, grupos e período de exposição.
7. Associar chamadas de IA a professor, aluno, disciplina e funcionalidade.
8. Registrar latência, custo e tokens por chamada.

## Evidências versionadas

- `analysis/icaart_2027_vps_aggregate_metrics.json`
- `scripts/icaart-vps-readonly-extract.cjs`
- `docs/reports/VERIFICACAO_VPS_QUESTOES_EXTRACAO_BD.md`
