# Dados de participação e apoio do FlowEdu no período analisado

**Data da extração:** 24 de setembro de 2026
**Período:** 05/01/2026 00:00 UTC até 16/03/2026 00:00 UTC, com limite superior exclusivo
**Fonte:** banco operacional do FlowEdu, consultado em modo somente leitura

## Resposta direta ao áudio

O áudio solicita o período, a existência de classificação por gênero, o número de alunos participantes, quantos responderam às atividades, quantos atrasaram e quais foram os auxílios oferecidos pelo sistema ao professor. Os resultados abaixo respondem ao que está efetivamente registrado no banco.

## Resumo executivo

No período analisado, o sistema registrou **34 tentativas de exercícios**, envolvendo **12 IDs de alunos**. Foram registradas **445 respostas de questões**, relacionadas a **10 IDs de alunos**. Também há **33 submissões de trabalhos**, mas elas estão concentradas em **1 aluno** e todas aparecem com status `graded`.

Quanto a atrasos, não foram encontrados atrasos nas submissões de trabalhos quando se compara `submittedAt` com o prazo `dueDate` da atividade. Foram encontradas **3 tentativas de exercícios potencialmente atrasadas**, envolvendo **1 aluno**, quando se compara a conclusão ou atualização com `availableTo`. Não há registros de comportamento `late_submission` no período. Essa distinção é importante: o sistema não tem uma regra institucional única de atraso, portanto o resultado depende da definição operacional usada.

O banco contém campos de gênero, mas todos os **271 alunos cadastrados** estão como `prefiro_nao_informar`; não há classificação observável como masculino, feminino ou não binário. Entre os participantes que possuem correspondência na tabela `students`, foram identificados **8 alunos**, todos com `prefiro_nao_informar`. Contudo, existem inconsistências referenciais: entre os 10 IDs de alunos associados às respostas de exercícios, apenas 5 possuem linha correspondente em `students`, enquanto 5 não possuem. Por isso, não é seguro publicar uma distribuição de gênero dos participantes como se fosse completa.

O apoio ao professor aparece em diferentes componentes do sistema: **7 materiais** criados, **21 exercícios** criados por 6 professores, **14 insights** gerados para 3 alunos, **69 dúvidas de alunos** recebidas por 1 professor, além de campos de feedback, dicas e análise por IA armazenados em respostas. A tabela de telemetria `ai_usage_logs` não tem chamadas registradas, portanto não é possível afirmar quantas chamadas de API ocorreram, qual modelo foi utilizado, qual foi a latência ou qual foi o custo.

## Indicadores principais

| Indicador | Resultado | Observação |
|---|---:|---|
| Período analisado | 05/01/2026–15/03/2026 | Datas em UTC; limite superior exclusivo em 16/03/2026 |
| Alunos cadastrados | 271 | População administrativa total |
| Contas de usuários | 30 | Não equivale necessariamente a 30 professores; é a contagem de usuários do sistema |
| Contas ativas e aprovadas | 28 | Denominador administrativo disponível |
| Disciplinas cadastradas | 51 | População administrativa |
| Alunos com tentativa de exercício | 12 IDs | 34 tentativas no total |
| Tentativas concluídas | 32 | 10 alunos |
| Tentativas em andamento | 2 | 2 alunos |
| Respostas de questões | 445 | 10 IDs de alunos associados aos attempts |
| Alunos com submissão de trabalho | 1 | 33 submissões; todas com status `graded` |
| Alunos com algum registro de comportamento | 1 | 36 eventos |
| Alunos com insight de IA | 3 | 14 insights |
| Alunos com registro de progresso de tópico concluído | 0 no período por `completedAt` | A tabela histórica possui registros em outras datas, mas não nesta janela nesse campo |

## Participação dos alunos

Não existe no banco uma tabela ou campo chamado “participante do experimento”. Por isso, a participação precisa ser apresentada por definição operacional:

| Definição de participação | Alunos/IDs | Eventos |
|---|---:|---:|
| Criaram ao menos uma tentativa de exercício | 12 | 34 tentativas |
| Tiveram respostas de questões registradas | 10 IDs | 445 respostas |
| Submeteram trabalho | 1 | 33 submissões |
| Tiveram evento comportamental | 1 | 36 eventos |
| Receberam insight registrado | 3 | 14 insights |
| Participantes com correspondência de gênero na tabela `students` | 8 | Todos `prefiro_nao_informar` |

A melhor formulação para o artigo é: **“O sistema registrou 12 alunos com tentativa de exercício e 10 IDs de alunos associados a respostas de questões no período; a base não possui identificador formal da amostra experimental.”** Não se deve reduzir a participação a “10 alunos” sem mencionar que existem IDs sem correspondência na tabela cadastral.

## Respostas, trabalhos e atividades

Foram registradas **445 respostas de questões**. Esse número representa linhas de respostas, não necessariamente 445 alunos ou 445 trabalhos. Os 445 registros estão associados a **10 IDs de alunos** por meio de `student_exercise_attempts`.

Foram registradas **33 submissões de trabalhos** na tabela `assignment_submissions`, todas com status `graded`, mas pertencentes a apenas **1 aluno**. Como o banco não contém um identificador de experimento, não é possível afirmar que essas 33 submissões constituem o “trabalho” mencionado no áudio sem uma confirmação externa do desenho do experimento.

As tentativas de exercício foram distribuídas da seguinte maneira:

| Status da tentativa | Tentativas | Alunos |
|---|---:|---:|
| `completed` | 32 | 10 |
| `in_progress` | 2 | 2 |

## Atrasos

Foram usados três indicadores separados para evitar misturar conceitos diferentes:

| Regra operacional | Resultado |
|---|---:|
| Submissão posterior ao `dueDate` da atividade | 0 submissões e 0 alunos |
| Evento comportamental explicitamente marcado como `late_submission` | 0 eventos e 0 alunos |
| Tentativa de exercício concluída/atualizada depois de `availableTo` | 3 tentativas e 1 aluno |

Assim, a conclusão defensável é: **não houve atraso documentado nas submissões de trabalhos nem eventos explícitos de atraso; houve 3 tentativas potencialmente fora da janela de disponibilidade de exercícios, de acordo com a regra técnica usada.** Esse último indicador não deve ser chamado automaticamente de “atraso de entrega”, pois `availableTo` pode significar encerramento de disponibilidade e não prazo institucional.

## Gênero e características demográficas

A tabela `students` possui os campos `gender`, `genderCustom`, `pronoun` e `avatarGender`. Na fotografia atual do banco:

| Campo/valor | Alunos |
|---|---:|
| `gender = prefiro_nao_informar` | 271 |
| `gender = masculino` | 0 |
| `gender = feminino` | 0 |
| `gender = nao_binario` | 0 |
| `gender = personalizar` | 0 |
| `gender` nulo | 0 |
| `avatarGender = male` | 271 |
| `avatarGender = female` | 0 |

O campo `avatarGender` não deve ser usado como gênero da pessoa. Ele representa uma configuração de avatar e não substitui uma variável demográfica declarada.

Além disso, gênero é dado pessoal sensível. Qualquer publicação deve usar somente agregados, avaliar supressão de células pequenas, observar a LGPD e verificar a aprovação ética ou institucional aplicável. Neste banco, a variável não permite uma comparação entre homens e mulheres porque todos os registros estão com a opção de não informar.

## Como o sistema ajudou o professor

### Apoio à preparação e organização

No período, o banco registra:

| Apoio ou artefato | Resultado |
|---|---:|
| Materiais didáticos criados | 7 |
| Professores que criaram materiais | 1 |
| Exercícios criados | 21 |
| Professores que criaram exercícios | 6 |
| Atribuições de tópicos criadas | 0 |
| Registros de atividades docentes | 0 |
| Comentários publicados por professores | 0 |

Esses dados mostram produção e organização de materiais e exercícios, mas não informam o tempo economizado em relação ao processo manual.

### Apoio ao acompanhamento dos alunos

O sistema registrou **69 dúvidas de alunos**, envolvendo **1 professor** como responsável pelo recebimento. Também registrou 36 eventos comportamentais, todos relacionados a 1 aluno:

| Tipo de comportamento | Eventos | Alunos |
|---|---:|---:|
| `exercise_completion` | 12 | 1 |
| `engagement_high` | 12 | 1 |
| `struggle_detected` | 12 | 1 |

Esses eventos indicam que o sistema pode apoiar o acompanhamento de conclusão, engajamento e dificuldade. Porém, o banco não permite verificar se o professor visualizou cada alerta, quanto tempo levou para agir ou se houve mudança pedagógica depois do registro.

### Apoio por IA registrado nos exercícios

Entre as respostas de exercícios, foram encontrados campos preenchidos que indicam suporte automatizado ou assistido:

| Campo | Respostas |
|---|---:|
| `aiFeedback` | 261 |
| `studyTips` | 167 |
| `aiAnalysis` | 34 |
| Feedback textual do professor (`teacherFeedback`) | 0 |
| Respostas revisadas por professor (`reviewedAt`) | 0 |

Esses números demonstram que existem artefatos persistidos nos campos de IA, mas não provam, isoladamente, que uma chamada de API ocorreu. A tabela `ai_usage_logs` registrou **0 chamadas** na janela e não há rastreabilidade completa entre solicitação, modelo, resposta, validação e publicação.

### Insights direcionados aos alunos

Foram gerados **14 insights**, alcançando **3 alunos** e **1 usuário/professor gerador**. Esses insights estão registrados como recomendações. O banco não informa se o professor revisou cada recomendação antes de ela ser usada, nem se o aluno a abriu ou aplicou.

## O que pode ser afirmado no artigo

Uma redação segura seria:

> “Entre 5 de janeiro e 15 de março de 2026, o FlowEdu registrou 34 tentativas de exercícios de 12 alunos, 445 respostas associadas a 10 IDs de alunos e 33 submissões de trabalhos concentradas em um aluno. Foram identificadas 3 tentativas potencialmente posteriores ao encerramento de disponibilidade dos exercícios, mas nenhuma submissão posterior ao prazo de trabalho e nenhum evento explícito de `late_submission`. Como formas de apoio ao professor, o sistema registrou 7 materiais, 21 exercícios, 69 dúvidas de alunos e 14 insights de recomendação. A base não possui identificador formal do experimento, exposição confirmada à IA, grupo de controle ou telemetria de chamadas de IA; portanto, esses dados descrevem registros operacionais e não demonstram causalidade, economia de tempo ou melhoria de aprendizagem.”

## O que não deve ser afirmado

Não é possível afirmar, com os dados atuais, quantos alunos “participaram do experimento” em sentido metodológico, porque não há tabela de amostra, termo de consentimento, grupo experimental, grupo de controle ou identificador de coorte. Também não é possível afirmar a distribuição por gênero, pois todos os alunos estão marcados como “prefiro não informar” e parte dos IDs das respostas não possui correspondência cadastral.

Não é possível afirmar quantos alunos atrasaram trabalhos como conclusão geral do experimento. O banco permite apenas dizer que não houve submissões posteriores ao `dueDate` nas linhas analisadas, que não houve evento explícito `late_submission` e que 3 tentativas de exercícios ficaram depois de `availableTo`.

Finalmente, os campos de IA não permitem afirmar quantas chamadas foram realizadas, qual foi o provedor ou modelo utilizado, o custo, o tempo de resposta, a taxa de erro ou o grau de supervisão docente. Essas informações exigem telemetria preenchida e eventos de revisão humana.

## Limitações e recomendações

A principal correção necessária é criar um identificador de experimento ou estudo, com coorte, período, consentimento, turma, disciplina e condição experimental. Cada aluno deveria ter uma linha de inclusão no estudo, sem depender de inferência a partir de tentativas ou respostas.

Também é necessário corrigir a integridade referencial entre `student_exercise_attempts` e `students`: dos 10 IDs encontrados nas respostas, somente 5 têm correspondência na tabela `students`. A causa deve ser investigada antes de publicar números por aluno, gênero ou desempenho.

Para medir apoio ao professor, o sistema deve registrar eventos de visualização, revisão, aceitação, edição e publicação, além de início e fim das tarefas. Para medir IA, cada chamada precisa armazenar um identificador de execução, funcionalidade, provedor, modelo, timestamps, status, latência, tokens e erro sanitizado. Para medir atrasos, deve haver uma regra institucional explícita que diferencie prazo de trabalho, janela de disponibilidade e atividade abandonada.

## Arquivo técnico de evidências

Os agregados e as consultas reprodutíveis estão em:

- `analysis/experiment_participation_profile.json`
- `scripts/experiment-participation-profile.mjs`
