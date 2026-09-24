# Análise do Banco de Dados do FlowEdu para as Questões do Artigo ICAART 2027

**Autor:** Manus AI

**Data da extração:** 24 de setembro de 2026

**Janela estudada:** 5 de janeiro de 2026, 00:00 UTC, até 16 de março de 2026, 00:00 UTC, com limite superior exclusivo

## Conclusão executiva

A consulta foi feita em modo **somente leitura** e produziu apenas agregados sem nomes, e-mails, matrículas, conteúdos de respostas, prompts, endereços IP ou identificadores pessoais. O banco possui 30 professores cadastrados, dos quais 28 estavam ativos e aprovados, 271 alunos e 51 disciplinas. Na janela histórica de 70 dias solicitada, há evidência operacional de 14 registros em `ai_insights`, referentes a 3 alunos, 1 professor e 1 disciplina, além de campos nomeados como feedback ou dicas de IA em respostas de exercícios. Entretanto, a tabela de telemetria `ai_usage_logs` está vazia em todo o histórico disponível. Portanto, não há registro de chamadas, modelo, provedor, latência, custo, prompt, resposta, falha ou funcionalidade de IA. [1]

A base permite registrar **indícios descritivos de apoio por IA**, mas não sustenta a maior parte das perguntas comparativas ou causais do roteiro. Não existe um marcador confiável `aiGenerated` nas trilhas, avaliações, questões, materiais ou planos de aula. Também não há cadeia de auditoria entre geração, validação, edição humana e publicação. Em consequência, não é metodologicamente válido concluir que uma trilha, prova, material ou questão foi gerado por IA apenas porque foi criado no mesmo período. [1]

O resultado mais importante para o artigo é, portanto, de **viabilidade parcial**. Há dados suficientes para descrever o uso documentado em campos de suporte ao exercício e em insights. Não há dados suficientes para demonstrar economia de tempo, qualidade, produtividade, causalidade no desempenho, comparação IA versus não IA, custo, latência, aceitação humana, acessibilidade ou contexto territorial. Esses indicadores devem aparecer como “não mensuráveis no banco atual”, não como zero ou como resultado negativo.

> **Regra de interpretação:** “sem registro” não significa “não ocorreu”. No caso de `ai_usage_logs`, significa que o mecanismo de telemetria não possui linhas registradas. Essa ausência impede estimar uso, falhas e custos da API.

## Escopo e qualidade dos dados

A janela de 70 dias foi fixada entre 5 de janeiro e 15 de março de 2026, pois os últimos 70 dias corridos a partir da extração não continham eventos. Dentro da janela escolhida, o banco contém 18 módulos de trilha, 26 tópicos, 55 registros de progresso de tópico, 36 registros comportamentais e 3 logs de acesso. Não houve avaliações nem tentativas de avaliação nesse período. [1]

Há 445 linhas de respostas de exercícios. Destas, 261 possuem o campo `aiFeedback`, 167 possuem `studyTips` e 34 possuem `aiAnalysis`. Esses campos indicam potencial apoio por IA, mas não substituem telemetria de geração, pois não armazenam modelo, prompt, versão, origem ou confirmação de entrega ao aluno. Quando a análise usa vínculos válidos com tentativas de exercício, foram identificadas 86 linhas com dicas de estudo, associadas a 4 alunos; a diferença entre 167 campos preenchidos e 86 linhas vinculadas aponta para registros sem vínculo completo, o que limita inferências por aluno e tópico. [1]

Também foram identificados 14 `ai_insights`, todos classificados como `recommendation`, destinados a 3 alunos. Todos são marcados como acionáveis, e 12 foram descartados. O campo “descartado” não informa se houve revisão de conteúdo nem permite classificar aceitação pedagógica. A tabela de cache contém apenas uma entrada do tipo `test_analysis`, sem acessos de cache, e deve ser tratada como teste técnico, não como evidência pedagógica. [1]

| Indicador observável na janela | Resultado | Interpretação correta |
|---|---:|---|
| Professores ativos e aprovados | 28 | Denominador possível para uma futura taxa de adoção, não prova de uso de IA. |
| Alunos cadastrados | 271 | Base administrativa, não população efetivamente participante no experimento. |
| Disciplinas cadastradas | 51 | Base administrativa. |
| Registros `ai_insights` | 14 | Indício de recomendações registradas para 3 alunos. |
| Respostas com `aiFeedback` | 261 de 445 (58,7%) | Campo preenchido; a geração por IA não é auditável. |
| Respostas com `studyTips` | 167 de 445 (37,5%) | Campo preenchido; somente 86 estão vinculadas a tentativas válidas. |
| Respostas com `aiAnalysis` | 34 de 445 (7,6%) | Campo preenchido; sem modelo, prompt ou rastreio de execução. |
| Alunos com algum artefato de IA documentado | 9 | Alcance mínimo documentado, não confirmação de visualização ou benefício. |
| Chamadas em `ai_usage_logs` | 0 | Telemetria indisponível; não permite concluir ausência de chamadas. |
| Avaliações/tentativas respondidas na janela | 0/0 | Estatísticas de notas, correção e acerto não são calculáveis. |

## Respostas às questões do TXT

As respostas abaixo mantêm a numeração do roteiro fornecido. [2] “Não mensurável” significa que a tabela, o campo ou a relação necessária não existe no banco atual; não significa que a funcionalidade nunca foi usada.

### Bloco 1 — Produtividade e economia de tempo docente

| Questão | Resposta baseada no banco |
|---|---|
| 1. Tempo médio entre solicitação e disponibilização de conteúdo | **Não mensurável.** Não há duração de chamada, data de disponibilização ou vínculo de geração-publicação. `ai_usage_logs` não tem linhas. |
| 2. Materiais de IA por professor em 70 dias | **Não mensurável.** `topic_materials` não registra origem por IA. Há campos de IA em respostas de exercícios, não materiais didáticos publicados. |
| 3. Distribuição por disciplina e funcionalidade | **Parcial.** Há campos de suporte de exercício em 4 disciplinas e 1 professor, mas não há tipo de funcionalidade nem log de uso por disciplina. |
| 4. Trilhas geradas por IA e publicadas sem edição | **Não mensurável.** Existem 18 módulos e 26 tópicos, mas sem marcador de origem por IA, publicação ou edição humana. |
| 5. Avaliações geradas por IA e tempo até aplicação | **Não mensurável.** Não houve avaliação criada ou tentativa registrada na janela; a origem por IA também não existe no schema. |
| 6. Planos, infográficos e mapas mentais gerados e usados em sala | **Não mensurável.** Não há registro de geração, uso em sala ou publicação para esses tipos. |
| 7. Frequência de cada funcionalidade de IA por professor | **Não mensurável.** A tabela destinada a isso, `ai_usage_logs`, está vazia. |

### Bloco 2 — Personalização e adaptação

| Questão | Resposta baseada no banco |
|---|---|
| 8. Alunos que receberam dicas personalizadas | **4 alunos vinculados** a 86 respostas com `studyTips`; existem 167 campos `studyTips` preenchidos no total, mas 81 não têm vínculo completo com uma tentativa de exercício. Não há confirmação de entrega ou leitura. |
| 9. Distribuição de dicas por aluno e tópico | Entre os 4 alunos vinculados, a variação foi de **11 a 34** dicas por aluno, com média de **21,5**. Não é possível distribuir por tópico porque os exercícios com dicas vinculadas não possuem `topicId` preenchido. |
| 10. Alunos com análise individual de desempenho por IA | **3 alunos** possuem `ai_insights` no período, totalizando 14 recomendações. Há ainda 34 respostas com `aiAnalysis`, mas sem proveniência de execução. |
| 11. Diferença de progresso entre alunos com e sem dicas | **Não conclusiva.** Apenas 3 alunos possuem progresso rastreado: 2 com dicas e 1 sem dicas. A amostra é insuficiente e não controla nível inicial, disciplina, professor ou tempo de exposição. |
| 12. Conclusão em trilhas de IA versus não IA | **Não mensurável.** Tópicos e módulos não têm indicador de origem por IA. |
| 13. Tópicos adaptados após recomendação da IA | **Não mensurável.** Não há histórico de versões, recomendação vinculada a tópico ou evento de reorganização. |

### Bloco 3 — Avaliação e feedback

| Questão | Resposta baseada no banco |
|---|---|
| 14. Distribuição completa das notas da prova de IA | **Não mensurável.** Não há tentativas nem respostas de avaliações na janela, e avaliações não têm marcador de origem por IA. |
| 15. Taxa de acerto por questão em prova de IA | **Não mensurável.** Não há respostas de avaliação na janela. |
| 16. Questões revisadas, editadas ou descartadas antes da aplicação | **Não mensurável.** Não existe log de revisão de questões. |
| 17. Questões com erro de gabarito ou inconsistência | **Não mensurável.** Não existe classificação de erro de gabarito, incidente ou correção de questão. |
| 18. Alunos afetados por bugs de integração em avaliações de IA | **Não mensurável.** Não há tabela de incidentes vinculada a avaliações ou IA. |
| 19. Tempo médio de correção: IA versus tradicional | **Não mensurável.** Não há tempo de correção nem classificação IA/tradicional. |
| 20. Justificativas e gabaritos gerados e validados | **Não mensurável.** Não há proveniência de IA nem estado de validação docente para esses itens. |

### Bloco 4 — Acompanhamento e análise de desempenho

| Questão | Resposta baseada no banco |
|---|---|
| 21. Registros comportamentais com IA versus manual | **Não mensurável como comparação.** Há 36 registros comportamentais, distribuídos igualmente entre `exercise_completion`, `struggle_detected` e `engagement_high`, todos referentes a 1 aluno. Não há campo de origem manual/IA. |
| 22. Distribuição temporal de registros comportamentais | Foram **36 registros em seis dias**: 9 em 05/01, 3 em 08/01, 9 em 11/01, 6 em 14/01, 3 em 16/01 e 6 em 19/01 de 2026. [1] |
| 23. Correlação entre comportamento e progresso | **Não estimada.** O conjunto comportamental cobre 1 aluno e não permite análise correlacional confiável. |
| 24. Correlação entre progresso e desempenho em avaliação de IA | **Não mensurável.** Não há tentativas de avaliação nem marcador de avaliação por IA. |
| 25. Progresso após análise de desempenho por IA | **2 alunos** concluíram ao menos um tópico depois de um `ai_insight`. É uma associação temporal, não demonstra que o insight causou o progresso. |
| 26. Faixas de progresso e desempenho | O banco mostra 54 registros de tópico concluído e 1 em andamento, associados a 2 alunos. Não há resultados de avaliação para formar faixas de desempenho. |

### Bloco 5 — Cobertura e escala

| Questão | Resposta baseada no banco |
|---|---|
| 27. Disciplinas cadastradas e disciplinas que usaram IA | Há **51 disciplinas cadastradas**. Campos de suporte a exercícios potencialmente associados a IA aparecem em **4 disciplinas**; `ai_insights` aparecem em 1 disciplina. Não há log de funcionalidade para consolidar uso real de IA por disciplina. |
| 28. Alunos alcançados por conteúdo de IA | **9 alunos** têm algum artefato de IA documentado. Esse é um alcance mínimo de registros, sem prova de recebimento, leitura ou impacto. |
| 29. Uso de IA por professor e disciplina | Há 1 professor associado aos `ai_insights` e 1 professor associado aos campos de exercício; os campos de exercício alcançam 4 disciplinas. A frequência por funcionalidade não pode ser calculada. |
| 30. Diferença entre ensino técnico e superior | **Não mensurável.** Não há classificação do nível de ensino vinculada a disciplina, turma ou aluno. |
| 31. Alunos únicos impactados por ao menos uma funcionalidade | **9 alunos com artefato documentado**, com a ressalva de que “impactado” exige um evento de entrega ou visualização que não está registrado. |
| 32. Taxa de adoção por professores cadastrados | **Não mensurável como taxa de adoção.** Um professor aparece nos artefatos, o que corresponderia a 3,6% dos 28 ativos e aprovados, mas a ausência de telemetria impede afirmar adoção ou não adoção dos demais. |

### Bloco 6 — Qualidade e validação do conteúdo

| Questão | Resposta baseada no banco |
|---|---|
| 33. Saídas que passaram por validação de esquema | **Não mensurável.** Não há evento ou resultado de validação armazenado. |
| 34. Saídas rejeitadas por deduplicação | **Não mensurável.** Não há log de deduplicação. |
| 35. Saídas corrigidas por normalização no servidor | **Não mensurável.** Não há log de normalização. |
| 36. Conteúdo que precisou de intervenção humana | **Não mensurável.** Não existe marcador de revisão, edição ou aprovação humana. |
| 37. Versões até a publicação final | **Não mensurável.** Não há versionamento de conteúdo pedagógico. |
| 38. Tempo entre geração, validação e publicação | **Não mensurável.** Faltam timestamps e chaves de relação para as três etapas. |

### Bloco 7 — Governança, rastreabilidade e reprodutibilidade

| Questão | Resposta baseada no banco |
|---|---|
| 39. Gerações com modelo, versão, prompt e parâmetros | **Não mensurável.** `ai_usage_logs` possui campos previstos para provedor/modelo/tokens, mas não possui linhas; não guarda prompt, versão ou parâmetros. |
| 40. Reconstrução de prompt → resposta → validação → edição → publicação | **Não é possível.** A cadeia completa não é persistida. |
| 41. Conteúdos com trilha de auditoria completa | **Não mensurável; na prática, nenhum conteúdo pode ser comprovado como completo** com o schema atual. |
| 42. Conteúdos publicados sem revisão humana | **Não mensurável.** Não há estado de publicação ligado a revisão humana. |
| 43. Distribuição de modelos Llama 3 e outros | **Não mensurável.** Não há registros em `ai_usage_logs`. |

### Bloco 8 — Vantagens percebidas e autorrelatadas

| Questão | Resposta baseada no banco |
|---|---|
| 44. Professores que relataram economia de tempo e média | **Não mensurável.** Não há questionário ou campo de autorrelato. |
| 45. Associação entre frequência de IA e utilidade pedagógica percebida | **Não mensurável.** Faltam telemetria de frequência e medida de percepção. |
| 46. Professores que revisaram conteúdo antes de disponibilizar | **Não mensurável.** Não há evento de revisão humana. |
| 47. Taxa de reuso em turmas ou semestres posteriores | **Não mensurável.** Não há relação de cópia, reuso ou versão entre conteúdos. |
| 48. Alunos que relataram benefício com dicas | **Não mensurável.** Não há autorrelato nem confirmação de leitura de dicas. |

### Bloco 9 — Comparações entre IA e não IA

| Questão | Resposta baseada no banco |
|---|---|
| 49. Diferença de progresso entre trilhas IA e manuais | **Não mensurável.** Não existe marcador de origem da trilha. |
| 50. Diferença de desempenho entre prova IA e tradicional | **Não mensurável.** Não há tentativas de avaliação e tampouco origem da prova. |
| 51. Diferença de tempo de preparação entre professores | **Não mensurável.** Não há registro de tempo de preparação com origem por IA. |
| 52. Diferença de engajamento entre disciplinas com e sem IA | **Não mensurável.** Não há classificação confiável de disciplina “com IA”. |
| 53. Diferença de conclusão entre tópicos com e sem dicas | **Exploratória, sem conclusão.** Há apenas 3 alunos com progresso rastreado e 4 com dicas vinculadas. O tamanho amostral e os vínculos incompletos impedem teste estatístico ou inferência causal. |

### Bloco 10 — Contexto Amazônia, IFAM e Coari

| Questão | Resposta baseada no banco |
|---|---|
| 54. Uso por aluno, internet e localização | **Não mensurável.** Não existem dados de acesso à internet ou localização geográfica. |
| 55. Uso por dispositivo: mobile versus desktop | **Não mensurável para IA.** Há apenas 3 logs de acesso, todos de professor, sem sistema operacional/navegador preenchidos e sem ligação com funcionalidade de IA. |
| 56. Uso em disciplinas presenciais versus remotas | **Não mensurável.** A modalidade da disciplina não é persistida. |
| 57. Adoção interior versus capital | **Não mensurável.** Não há dado territorial do aluno. |
| 58. Uso fora do horário de aula | **Não mensurável.** Não há definição de horário de aula vinculada ao evento de IA. |

### Bloco 11 — Inclusão e acessibilidade

| Questão | Resposta baseada no banco |
|---|---|
| 59. Alunos com dificuldades relatadas que receberam IA | **Não mensurável.** Não há registro estruturado de deficiência, necessidade de acessibilidade ou dificuldade relatada ligado ao uso de IA. |
| 60. Dicas e melhoria em tópicos mais difíceis | **Não mensurável.** As dicas vinculadas não possuem `topicId`, e não há linha de base comparável de dificuldade. |
| 61. Alunos com baixo desempenho inicial que melhoraram | **Não mensurável.** Não há medida inicial validada, grupo comparável ou exposição auditada à IA. |
| 62. Uso de IA por nível inicial de progresso | **Não mensurável.** O schema não registra linha de base de progresso antes da exposição. |

### Bloco 12 — Sustentabilidade e escalabilidade

| Questão | Resposta baseada no banco |
|---|---|
| 63. Custo computacional médio por geração | **Não mensurável.** Não há preço, custo ou tokens registrados em chamadas de IA. |
| 64. Tempo médio de resposta da API por funcionalidade | **Não mensurável.** Não há latência de requisição. |
| 65. Chamadas à API ao longo dos 70 dias | Há **0 linhas em `ai_usage_logs`**. Isso mostra ausência de telemetria registrada, e não prova que nenhuma chamada ocorreu. |
| 66. Taxa de falha nas chamadas à API | **Não mensurável.** Sem chamadas registradas, não existe denominador de sucesso/falha. |
| 67. Volume de dados de IA armazenados | O mínimo diretamente observável é de **125.081 bytes (122,1 KiB)** em campos de exercício e de insight com nome associado a IA, mais uma entrada de cache de teste. Não é o volume total gerado, pois falta origem e log central. |
| 68. Conteúdos reutilizáveis em outras turmas ou instituições | **Não mensurável.** Não há flag de reutilização, licenciamento, cópia ou compartilhamento institucional. |

## Indicadores que podem ser usados no artigo agora

O artigo pode relatar, de forma estritamente descritiva, que houve 14 recomendações registradas para 3 alunos e que os campos de suporte ao exercício contêm 261 respostas com `aiFeedback`, 167 com `studyTips` e 34 com `aiAnalysis`. Também pode informar que 9 alunos possuem pelo menos um artefato documentado associado a IA, em quatro disciplinas no caso dos exercícios. Esses números devem ser apresentados como **evidência de registro de artefatos no sistema**, não como prova de efetividade, satisfação, qualidade ou causalidade. [1]

A informação temporal mais defensável é que 2 alunos concluíram algum tópico após receber um insight de IA. Essa ordem temporal não estabelece impacto do insight, porque não há grupo de comparação, linha de base, confirmação de visualização, nem controle por intervenção docente ou conteúdo. [1]

Não é apropriado afirmar no artigo que a IA reduziu tempo de preparo, melhorou notas, aumentou engajamento, teve baixa taxa de falha ou produziu conteúdo validado. As tabelas necessárias para essas afirmações não foram preenchidas ou não existem no schema analisado.

## Lacunas que precisam ser instrumentadas antes de um estudo confirmatório

Para responder integralmente ao roteiro em uma próxima coleta, cada geração deve receber um identificador imutável de execução e registrar, em tabela própria, funcionalidade, professor, disciplina, turma, aluno quando aplicável, provedor, modelo, versão, parâmetros não sensíveis, contagem de tokens, custo estimado, início, término, latência, status, erro sanitizado e identificador da resposta. Prompts e respostas completas devem seguir uma política de minimização, retenção, consentimento e controle de acesso compatível com a LGPD.

Cada artefato pedagógico deve ter origem explícita (`manual`, `assistido_por_ia`, `gerado_por_ia`), identificação da geração de origem, estado de validação, autor e data da revisão humana, publicação e histórico de versões. Avaliações e questões precisam registrar origem, edição, descarte, correção de gabarito e incidentes. Dessa forma será possível calcular tempo de geração, intervenção humana, qualidade de questão e cadeias de auditoria sem inferência por proximidade temporal.

O estudo também exige uma tabela de exposição do aluno, que registre entrega, visualização, abertura e uso de cada dica, insight ou material. Para comparações de resultado, é necessário armazenar linha de base, modalidade, nível de ensino, período, disciplina, turma, dados de acessibilidade obtidos com base legal apropriada e instrumentos de percepção voluntários. O desenho analítico deve definir previamente os grupos, métricas, critérios de exclusão e método estatístico.

## Materiais ainda não recebidos

O ambiente desta análise continha o TXT com as perguntas e o banco de dados. Os arquivos **DOCX** e **XLS/XLSX** mencionados no pedido não estavam disponíveis no diretório de anexos; portanto, não foram lidos nem confrontados com o banco. Quando forem enviados, eles devem ser tratados como fontes adicionais e comparados com os agregados deste relatório antes de qualquer redação final para submissão.

## Referências

[1]: ../../analysis/icaart_2027_aggregate_metrics.json "Perfil agregado e anonimizado do banco FlowEdu para a janela histórica de 70 dias"
[2]: ../research/questoes-artigo-icaart2027.txt "Roteiro de questões para o artigo ICAART 2027"
