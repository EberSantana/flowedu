/**
 * Sistema de Validação Inteligente de Respostas Abertas
 * 
 * Este módulo usa IA para analisar respostas dissertativas dos alunos,
 * comparando-as semanticamente com o gabarito e gerando:
 * - Nota automática (0-100%)
 * - Nível de confiança da análise (0-100%)
 * - Feedback detalhado para o aluno
 * - Sugestão de revisão manual quando necessário
 */

import { invokeLLM } from "./_core/llm";

export interface OpenAnswerAnalysis {
  score: number; // 0-100
  confidence: number; // 0-100 (confiança da IA na avaliação)
  feedback: string; // Feedback detalhado para o aluno
  strengths: string[]; // Pontos fortes da resposta
  weaknesses: string[]; // Pontos fracos da resposta
  needsReview: boolean; // true se confiança < 70%
  reasoning: string; // Justificativa da nota atribuída
}

export interface AnalyzeOpenAnswerParams {
  question: string; // Enunciado da questão
  studentAnswer: string; // Resposta do aluno
  correctAnswer: string; // Gabarito/resposta esperada
  context?: string; // Contexto adicional (opcional)
}

/**
 * Analisa uma resposta aberta usando IA
 */
export async function analyzeOpenAnswer(
  params: AnalyzeOpenAnswerParams
): Promise<OpenAnswerAnalysis> {
  const { question, studentAnswer, correctAnswer, context } = params;

  // Validação de entrada
  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return {
      score: 0,
      confidence: 100,
      feedback: "Resposta não fornecida ou vazia.",
      strengths: [],
      weaknesses: ["Nenhuma resposta foi fornecida"],
      needsReview: false,
      reasoning: "Resposta vazia não pode ser avaliada.",
    };
  }

  // Prompt estruturado para análise pedagógica
  const systemPrompt = `Você é um assistente pedagógico especializado em avaliação de respostas dissertativas.

Sua tarefa é analisar a resposta de um aluno comparando-a com o gabarito fornecido, considerando:

1. **Correção conceitual**: A resposta está conceitualmente correta?
2. **Completude**: Todos os pontos importantes foram abordados?
3. **Clareza**: A resposta está bem escrita e organizada?
4. **Profundidade**: O aluno demonstrou compreensão profunda do tema?

IMPORTANTE:
- Seja justo e pedagógico na avaliação
- Considere diferentes formas de expressar a mesma ideia
- Não penalize por pequenas diferenças de redação se o conceito estiver correto
- Valorize respostas que demonstrem raciocínio próprio
- Indique quando a resposta precisa de revisão manual (confiança < 70%)`;

  const userPrompt = `**QUESTÃO:**
${question}

${context ? `**CONTEXTO:**\n${context}\n\n` : ""}**GABARITO/RESPOSTA ESPERADA:**
${correctAnswer}

**RESPOSTA DO ALUNO:**
${studentAnswer}

Analise a resposta do aluno e retorne um JSON com a seguinte estrutura:
{
  "score": <número de 0 a 100>,
  "confidence": <número de 0 a 100 indicando sua confiança na avaliação>,
  "feedback": "<feedback detalhado e construtivo para o aluno>",
  "strengths": ["<ponto forte 1>", "<ponto forte 2>", ...],
  "weaknesses": ["<ponto fraco 1>", "<ponto fraco 2>", ...],
  "needsReview": <true se confidence < 70, false caso contrário>,
  "reasoning": "<justificativa clara da nota atribuída>"
}`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "open_answer_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: {
                type: "number",
                description: "Nota de 0 a 100",
              },
              confidence: {
                type: "number",
                description: "Confiança da IA na avaliação (0-100)",
              },
              feedback: {
                type: "string",
                description: "Feedback detalhado para o aluno",
              },
              strengths: {
                type: "array",
                items: { type: "string" },
                description: "Pontos fortes da resposta",
              },
              weaknesses: {
                type: "array",
                items: { type: "string" },
                description: "Pontos fracos da resposta",
              },
              needsReview: {
                type: "boolean",
                description: "Se precisa de revisão manual",
              },
              reasoning: {
                type: "string",
                description: "Justificativa da nota",
              },
            },
            required: [
              "score",
              "confidence",
              "feedback",
              "strengths",
              "weaknesses",
              "needsReview",
              "reasoning",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices[0].message.content;
    const analysis: OpenAnswerAnalysis = JSON.parse(
      typeof content === "string" ? content : JSON.stringify(content)
    );

    // Validação e normalização dos valores
    analysis.score = Math.max(0, Math.min(100, analysis.score));
    analysis.confidence = Math.max(0, Math.min(100, analysis.confidence));
    analysis.needsReview = analysis.confidence < 70;

    return analysis;
  } catch (error) {
    console.error("Erro ao analisar resposta aberta:", error);

    // Fallback em caso de erro: sugerir revisão manual
    return {
      score: 50,
      confidence: 0,
      feedback:
        "Não foi possível analisar automaticamente esta resposta. Um professor irá revisar manualmente.",
      strengths: [],
      weaknesses: [],
      needsReview: true,
      reasoning:
        "Erro na análise automática - revisão manual necessária.",
    };
  }
}

/**
 * Analisa múltiplas respostas abertas em lote
 */
export async function analyzeMultipleOpenAnswers(
  answers: AnalyzeOpenAnswerParams[]
): Promise<OpenAnswerAnalysis[]> {
  const results: OpenAnswerAnalysis[] = [];

  for (const answer of answers) {
    const analysis = await analyzeOpenAnswer(answer);
    results.push(analysis);
  }

  return results;
}
