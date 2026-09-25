# ICAART 2027 — Análise de lacunas para a submissão

**Data da análise:** 25/09/2026
**Base avaliada:** dados agregados da produção do FlowEdu na VPS
**Documento de referência:** `ICAART_2027_DADOS_COMPLETOS_ARTIGO.md`

## Parecer geral

### Classificação: precisa de revisão antes da submissão como estudo de eficácia

Os dados são suficientes para um artigo exploratório sobre **implantação, telemetria e limitações de um sistema educacional com funcionalidades de IA**. Eles não são suficientes, no estado atual, para sustentar afirmações de que a IA aumentou a produtividade docente, melhorou a aprendizagem, personalizou o ensino ou superou métodos sem IA.

A principal lacuna não é apenas a falta de algumas contagens. Falta a ligação entre **chamada de IA, conteúdo gerado, professor, disciplina, aluno, exposição, revisão humana e resultado educacional**. Sem essa cadeia, os dados descrevem o funcionamento registrado do sistema, mas não demonstram efeito pedagógico ou causalidade.

## O que já pode ser usado no artigo

A produção oferece evidências úteis para uma seção de caracterização do sistema e de operação:

- 152 tabelas no banco de produção;
- 366 alunos cadastrados;
- 16 disciplinas;
- 261 matrículas em `subjectEnrollments`, envolvendo 258 alunos e 13 disciplinas;
- 73 módulos de aprendizagem;
- 180 tópicos;
- 251 registros de progresso;
- 203 registros com status `completed`, envolvendo 54 alunos;
- 48 registros com status `in_progress`, envolvendo 25 alunos;
- 30 tentativas de avaliação e 580 respostas;
- 29 tentativas submetidas, com 22 aprovadas;
- nota média de 6,76/10 e tempo médio de 468,31 segundos nas tentativas submetidas;
- 427 registros comportamentais, todos `exercise_completion`, envolvendo 146 alunos;
- 37 chamadas de IA, com 12 sucessos e 25 falhas;
- 30.050 tokens registrados;
- 1.431 acessos entre 10/03/2026 e 20/09/2026;
- modelo registrado: Groq `llama-3.3-70b-versatile`.

Esses números devem ser apresentados como **telemetria e registros operacionais**, não como prova de benefício educacional.

## Lacunas críticas — resolver antes de afirmar eficácia

### 1. Amostra e desenho do estudo

Não existe um identificador formal do experimento. A base não informa:

- quais alunos pertencem à amostra;
- quais professores participaram;
- qual turma ou disciplina foi observada;
- data oficial de início e fim do experimento;
- critérios de inclusão e exclusão;
- grupo experimental;
- grupo de comparação ou controle;
- consentimento dos participantes;
- perdas, desistências ou registros excluídos.

**Impacto:** não é possível responder de forma metodologicamente defensável quantos participantes houve nem calcular efeito de tratamento.

**Complementação mínima:** criar uma tabela ou arquivo de coorte com `study_id`, `participant_id` pseudonimizado, papel, turma, disciplina, condição experimental, data de inclusão, data de saída, consentimento e motivo de exclusão.

### 2. Janela temporal inadequada para o argumento dos 70 dias

A janela recente usada foi de 17/07/2026 a 26/09/2026, com 16 chamadas de IA, 29 acessos e apenas uma alteração de progresso. A maior parte dos eventos históricos ocorreu entre março e maio.

**Impacto:** o período de 70 dias tem atividade muito pequena e não representa necessariamente o período do experimento. Comparar esse recorte com todo o histórico produziria uma comparação de períodos diferentes.

**Complementação mínima:** confirmar documentalmente o período oficial do experimento e refazer todos os indicadores usando exatamente a mesma janela para exposição, baseline, acompanhamento e desfecho.

### 3. Falta de ligação entre IA e resultados

`ai_usage_logs` contém funcionalidade, modelo, tokens e sucesso/falha, mas os registros consultados não têm vínculo útil com professor, aluno, disciplina ou conteúdo. O `user_id` aparece nulo.

**Impacto:** não é possível saber quem usou IA, quem recebeu a saída, em qual disciplina ela foi usada ou qual resultado veio depois.

**Complementação mínima:** registrar `request_id`, `user_id`, `teacher_id`, `student_id` quando aplicável, `subject_id`, `class_id`, `content_id`, `feature`, `created_at`, `completed_at`, `status` e `error_code`.

### 4. Ausência de classificação IA versus manual

Os 73 módulos, 180 tópicos, avaliações e materiais não possuem marcação confiável de origem IA ou manual. Também não há controle de versão.

**Impacto:** não é possível comparar trilhas IA com trilhas manuais, avaliações IA com avaliações tradicionais ou conteúdo reutilizado com conteúdo novo.

**Complementação mínima:** adicionar `generated_by_ai`, `generation_request_id`, `generation_model`, `human_reviewed_at`, `human_reviewer_id`, `published_at` e `version_number` aos conteúdos relevantes.

### 5. Inconsistência nas avaliações

Há 30 tentativas e 580 respostas, mas as tabelas `assessments` e `assessment_questions` estão vazias. Portanto, as tentativas não podem ser ligadas a uma prova, a uma questão ou à origem IA.

**Impacto:** a média 6,76/10 e a aprovação de 75,86% podem ser descritas como métricas das tentativas submetidas, mas não como desempenho em uma prova gerada por IA.

**Complementação mínima:** preservar as avaliações e questões relacionadas, corrigir as chaves estrangeiras ou documentar a origem dos registros órfãos, e validar a soma de questões, pontos e tentativas.

### 6. Supervisão humana não observável

`audit_logs` e `review_history` estão vazias. Não há registro de revisão, edição, aprovação, descarte, publicação ou correção de conteúdos gerados.

**Impacto:** não é possível medir supervisão técnica, proporção de conteúdo revisado ou segurança do processo de publicação.

**Complementação mínima:** registrar eventos `generated`, `validated`, `edited`, `reviewed`, `approved`, `rejected`, `published` e `consumed`, com ator e timestamp.

### 7. Rastreabilidade incompleta da IA

Não foram encontrados campos `ai_model_version`, `prompt_id`, `ai_request_id`, `ai_source`, `edited_content` ou `diff`. O banco registra modelo e tokens, mas não registra a cadeia prompt → resposta → validação → edição → publicação.

**Impacto:** o estudo não é reprodutível no nível da geração individual e não permite auditar resultados específicos.

**Complementação mínima:** armazenar versão do modelo, versão do prompt, parâmetros relevantes, identificador de requisição, hash da entrada, hash da saída, resultado da validação e versão publicada. Prompts e respostas devem ser tratados com proteção de dados.

## Lacunas importantes — fortalecem a análise

### 8. Métricas de tempo e custo

Não há `started_at`, `completed_at`, latência, custo por token, custo por chamada ou consumo computacional. Assim, não se pode afirmar economia de tempo docente nem custo médio por geração.

**Complementação:** instrumentar duração da chamada, duração da tarefa docente, custo estimado e timestamps de criação, validação e publicação.

### 9. Dicas personalizadas

Existe uma chamada `student_ai_hints`, mas ela falhou. Não há histórico de dicas entregues, aluno destinatário, tópico, visualização, aceitação ou resultado posterior.

**Impacto:** não é possível calcular alunos beneficiados, dicas por aluno, correlação com nota ou melhora em tópicos difíceis.

**Complementação:** registrar solicitação, resposta, status, aluno, exercício, tópico, visualização, feedback do aluno e desempenho posterior.

### 10. Progresso sem linha de base

A tabela `student_topic_progress` possui status, mas não registra de forma confiável a exposição inicial, a abertura do tópico, o tempo de estudo ou uma condição comparável sem IA. `topic_progress_history` está vazia.

**Impacto:** não se pode afirmar evolução após IA, abandono ou diferença de conclusão entre condições.

**Complementação:** registrar eventos de abertura, visualização, início, pausa, conclusão e abandono. Definir previamente as categorias “iniciante”, “parcial” e “concluinte”.

### 11. Registros comportamentais sem origem

Há 427 registros comportamentais, todos `exercise_completion`. A tabela não distingue evento automático, evento gerado por IA ou registro manual.

**Impacto:** não se pode comparar comportamento produzido por IA e comportamento registrado manualmente.

**Complementação:** adicionar `source`, `generated_by_ai`, `event_id`, `trigger`, `confidence` e vínculo com o conteúdo ou evento que originou o registro.

### 12. Contexto amazônico não representado

O roteiro pergunta por internet, localização, interior/capital, modalidade presencial/remota e dispositivo. Esses dados não estão vinculados ao uso de IA.

**Impacto:** as afirmações sobre o contexto Amazônia/IFAM/Coari não podem ser demonstradas pelo banco atual.

**Complementação:** coletar localidade em categorias agregadas, modalidade da disciplina, tipo de conexão declarado e dispositivo, sempre com consentimento, minimização e pseudonimização.

### 13. Percepção de professores e alunos

Não há questionário ou escala de percepção sobre economia de tempo, utilidade pedagógica, confiança na IA, carga de revisão ou benefício das dicas.

**Impacto:** os blocos sobre vantagens percebidas e autorrelatadas não podem ser respondidos.

**Complementação:** aplicar instrumento curto pré/pós, com perguntas fechadas e abertas. Registrar respondente pseudonimizado, data, papel, funcionalidade avaliada e escala usada.

### 14. Qualidade estatística

O banco é pequeno para várias comparações, especialmente na janela de 70 dias. Também faltam desvio padrão, mediana, quartis, intervalos de confiança, tamanho de efeito e testes estatísticos.

**Impacto:** médias isoladas podem ser instáveis e não permitem concluir diferença entre grupos.

**Complementação:** calcular mediana, quartis, desvio padrão, intervalo de confiança e tamanho de efeito. Para comparações, declarar o teste utilizado, o denominador, o tratamento de dados ausentes e o ajuste para múltiplas comparações. Com amostras pequenas, priorizar estatística descritiva e intervalos de incerteza.

## Lacunas de qualidade e consistência do banco

### 15. Registros órfãos

As tentativas de avaliação não encontram correspondência em `assessments` e `assessment_questions`. Essa é uma inconsistência de integridade referencial que precisa ser explicada antes da submissão.

### 16. Divergência de modelagem de professores

Não há tabela `teachers` na produção consultada, embora existam campos `teacherId`, `professorId` e `userId` em outras tabelas. A contagem de professores não pode ser definida apenas por uma dessas colunas sem documentar a regra.

### 17. Ausência de eventos não equivale a ausência da atividade

Zero registros em revisão, auditoria, dicas ou validação significa que não há evidência no banco. Não significa necessariamente que nenhuma revisão, dica ou validação ocorreu fora do sistema.

### 18. Dados cadastrais e dados de exposição estão desconectados

Há 366 alunos com dados demográficos, mas os logs de IA não identificam alunos. Portanto, não é possível cruzar gênero, pronome ou progresso com uso individual de IA.

### 19. Validade da janela e timezone

Os timestamps devem ter timezone documentado. O artigo deve declarar se os horários estão em UTC ou horário local de Coari/Manaus. As comparações devem usar limites completos e iguais.

### 20. Contagem de conteúdo IA por volume textual

Os volumes de texto calculados para descrições e conteúdos são apenas aproximações. Como não há marcador `generated_by_ai`, não podem ser chamados de volume efetivamente gerado por IA.

## Lacunas de governança, ética e privacidade

Antes da submissão, o artigo deve documentar:

- responsável pelo tratamento dos dados;
- base legal ou autorização institucional;
- consentimento ou dispensa de consentimento;
- aprovação ética, quando aplicável;
- estratégia de anonimização/pseudonimização;
- controle de acesso aos dados;
- retenção e descarte;
- tratamento de dados sensíveis, especialmente gênero, pronome e localização;
- exclusão de nomes, e-mails, matrículas e IPs dos anexos;
- reprodutibilidade sem disponibilizar dados pessoais.

O arquivo agregado atual não contém nomes, e-mails, matrículas ou IPs. Essa prática deve ser mantida.

## O que deve ser retirado ou reformulado no artigo atual

Não usar, sem evidência adicional, as seguintes formulações:

- “A IA economizou X horas do professor”;
- “A IA melhorou o desempenho dos alunos”;
- “A IA aumentou a conclusão das trilhas”;
- “A IA personalizou o ensino para X alunos”;
- “X professores adotaram IA”;
- “As provas geradas por IA tiveram taxa de aprovação de 75,86%”;
- “O conteúdo gerado por IA foi validado pelos professores”;
- “O sistema é superior ao método tradicional”.

Formulações seguras são:

> “Foram observadas chamadas de IA registradas no sistema, com telemetria de sucesso, falha, modelo e tokens.”

> “Os registros de avaliação apresentaram média de 6,76/10 entre 29 tentativas submetidas, mas não puderam ser associados a avaliações identificadas como geradas por IA.”

> “Os dados permitem caracterizar a operação do sistema, mas não permitem estimar efeito causal ou ganho de produtividade.”

## Plano mínimo para tornar a submissão defensável

### Prioridade P0 — bloqueadores

1. Confirmar o período oficial e a coorte do estudo.
2. Corrigir ou explicar as 30 tentativas sem avaliações correspondentes.
3. Separar claramente produção, sandbox e dados de teste.
4. Remover afirmações causais e de eficácia não suportadas.
5. Documentar privacidade, consentimento e aprovação institucional.
6. Adicionar ao artigo uma seção explícita de limitações.

### Prioridade P1 — necessária para resultados comparativos

1. Criar o vínculo entre IA, professor, aluno, disciplina, turma e conteúdo.
2. Marcar origem IA/manual e versão de cada conteúdo.
3. Registrar revisão, edição, publicação e consumo.
4. Definir baseline, grupo de comparação e desfechos.
5. Recalcular notas com mediana, quartis, desvio padrão e intervalo de confiança.
6. Registrar dicas, destinatários, tópicos e eventos posteriores.

### Prioridade P2 — fortalece a contribuição

1. Medir latência e custo.
2. Aplicar questionário de percepção.
3. Registrar dispositivo, modalidade e contexto de conectividade.
4. Produzir dados de reuso e sustentabilidade.
5. Criar um dicionário de dados e um pacote de consultas versionado.
6. Fazer análise de sensibilidade para registros ausentes e inconsistentes.

## Estrutura recomendada para o artigo

Com os dados atuais, a estrutura mais defensável é:

1. **Introdução:** problema de integração de IA em sistemas educacionais.
2. **Sistema FlowEdu:** arquitetura e funcionalidades disponíveis.
3. **Método:** estudo observacional exploratório, fonte de dados, janela, agregação e privacidade.
4. **Resultados operacionais:** uso de IA, falhas, tokens, avaliações, progresso, comportamento e acessos.
5. **Análise de qualidade e governança:** ausência de rastreabilidade, revisão e versionamento.
6. **Limitações:** amostra, ausência de controle, inconsistências e baixa atividade recente.
7. **Trabalhos futuros:** instrumentação, coorte, supervisão humana e avaliação comparativa.
8. **Conclusão:** contribuição como diagnóstico de implantação e requisitos para avaliação de eficácia.

## Decisão final

**Não submeter como estudo confirmatório de benefícios da IA com os dados atuais.**

**É possível submeter após reformulação como estudo exploratório de implantação, telemetria e governança**, desde que o artigo:

- use apenas a base de produção claramente identificada;
- informe os denominadores e a janela temporal;
- apresente a alta taxa de falha da IA;
- não trate chamadas como conteúdos entregues;
- não trate avaliações órfãs como provas IA;
- declare a ausência de revisão humana observável;
- inclua as limitações e os requisitos de instrumentação futura.

## Referências internas

[1]: /home/ubuntu/teacher_schedule_system/docs/reports/ICAART_2027_DADOS_COMPLETOS_ARTIGO.md "Dados completos para o artigo ICAART 2027"
[2]: /home/ubuntu/teacher_schedule_system/analysis/icaart_2027_vps_aggregate_metrics.json "Agregados anonimizados da produção"
[3]: /home/ubuntu/teacher_schedule_system/scripts/icaart-vps-readonly-extract.cjs "Script de extração somente leitura"
