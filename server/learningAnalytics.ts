/**
 * Sistema de Análise de Aprendizado com IA
 * Funções para analisar comportamento, detectar padrões e gerar insights sobre alunos
 */

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";
import { getCachedAnalysis, setCachedAnalysis } from "./aiCache";

/**
 * Dados de comportamento do aluno para análise
 */
export interface StudentBehaviorData {
  studentId: number;
  studentName: string;
  subjectName?: string;
  recentBehaviors: Array<{
    type: string;
    date: string;
    score?: number;
    metadata?: string;
  }>;
  performanceMetrics?: {
    exerciseAccuracy?: number;
    quizPerformance?: number;
    attendanceRate?: number;
    submissionRate?: number;
    engagementScore?: number;
  };
  recentExercises?: Array<{
    title: string;
    score: number;
    completedAt: string;
    timeSpent?: number;
  }>;
}

/**
 * Resultado da análise de comportamento
 */
export interface BehaviorAnalysisResult {
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
  }>;
  recommendations: string[];
  alerts: Array<{
    type: string;
    severity: "info" | "warning" | "urgent" | "critical";
    message: string;
  }>;
  confidence: number;
}

/**
 * Analisa o comportamento de um aluno usando IA
 * @param data Dados do comportamento do aluno
 * @returns Análise detalhada com insights e recomendações
 */
export async function analyzeLearningBehavior(
  data: StudentBehaviorData,
  userId?: number // ID do usuário para cache (opcional)
): Promise<BehaviorAnalysisResult> {
  // Verifica cache se userId foi fornecido
  if (userId) {
    const cached = await getCachedAnalysis<BehaviorAnalysisResult>(
      userId,
      "learning_behavior",
      data
    );

    if (cached.found && cached.data) {
      console.log(`[Cache] Análise de comportamento encontrada no cache (hits: ${cached.hitCount})`);
      return cached.data;
    }
  }

  const prompt = `Você é um especialista em análise de aprendizado e pedagogia. Analise os dados de comportamento do aluno abaixo e forneça insights detalhados.

**Dados do Aluno:**
- Nome: ${data.studentName}
- Disciplina: ${data.subjectName || "Geral"}

**Comportamentos Recentes:**
${data.recentBehaviors.map(b => `- ${b.type} em ${b.date}${b.score ? ` (pontuação: ${b.score})` : ""}`).join("\n")}

**Métricas de Desempenho:**
${data.performanceMetrics ? Object.entries(data.performanceMetrics)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n") : "Não disponível"}

**Exercícios Recentes:**
${data.recentExercises ? data.recentExercises.map(e => 
  `- ${e.title}: ${e.score}% em ${e.completedAt}`
).join("\n") : "Não disponível"}

Forneça uma análise estruturada no formato JSON com os seguintes campos:
- overallAssessment: Avaliação geral do aluno (string)
- strengths: Lista de pontos fortes identificados (array de strings)
- weaknesses: Lista de pontos fracos ou áreas de melhoria (array de strings)
- patterns: Lista de padrões detectados, cada um com { type, description, confidence } onde confidence é um número entre 0 e 1
- recommendations: Lista de recomendações práticas para o professor (array de strings)
- alerts: Lista de alertas importantes, cada um com { type, severity, message } onde severity pode ser "info", "warning", "urgent" ou "critical"
- confidence: Nível de confiança geral da análise (número entre 0 e 1)

Seja específico, prático e focado em ações que o professor pode tomar.`;

  const messages: Message[] = [
    {
      role: "system",
      content: "Você é um especialista em análise de aprendizado e pedagogia. Sempre responda em JSON válido."
    },
    {
      role: "user",
      content: prompt
    }
  ];

  try {
    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "behavior_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallAssessment: {
                type: "string",
                description: "Avaliação geral do comportamento e desempenho do aluno"
              },
              strengths: {
                type: "array",
                items: { type: "string" },
                description: "Lista de pontos fortes identificados"
              },
              weaknesses: {
                type: "array",
                items: { type: "string" },
                description: "Lista de áreas que precisam de atenção"
              },
              patterns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    description: { type: "string" },
                    confidence: { type: "number" }
                  },
                  required: ["type", "description", "confidence"],
                  additionalProperties: false
                },
                description: "Padrões de aprendizado detectados"
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
                description: "Recomendações práticas para o professor"
              },
              alerts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    severity: { 
                      type: "string",
                      enum: ["info", "warning", "urgent", "critical"]
                    },
                    message: { type: "string" }
                  },
                  required: ["type", "severity", "message"],
                  additionalProperties: false
                },
                description: "Alertas importantes sobre o aluno"
              },
              confidence: {
                type: "number",
                description: "Nível de confiança da análise (0-1)"
              }
            },
            required: [
              "overallAssessment",
              "strengths",
              "weaknesses",
              "patterns",
              "recommendations",
              "alerts",
              "confidence"
            ],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Resposta inválida da IA");
    }

    const result: BehaviorAnalysisResult = JSON.parse(content);
    
    // Armazena no cache se userId foi fornecido
    if (userId) {
      await setCachedAnalysis(
        {
          userId,
          analysisType: "learning_behavior",
          data,
          expiresInDays: 7, // Cache expira em 7 dias (comportamento muda mais rápido)
        },
        result
      );
      console.log("[Cache] Análise de comportamento armazenada no cache");
    }
    
    return result;
  } catch (error) {
    console.error("Erro ao analisar comportamento:", error);
    throw new Error("Falha ao analisar comportamento do aluno");
  }
}

/**
 * Dados para detecção de padrões de aprendizado
 */
export interface LearningPatternData {
  studentId: number;
  studentName: string;
  historicalData: {
    exercises: Array<{
      date: string;
      score: number;
      timeSpent?: number;
      difficulty?: string;
    }>;
    attendance: Array<{
      date: string;
      present: boolean;
      timeOfDay?: string;
    }>;
    submissions: Array<{
      date: string;
      onTime: boolean;
      quality?: number;
    }>;
  };
  timeframe: string; // ex: "últimos 30 dias"
}

/**
 * Resultado da detecção de padrões
 */
export interface LearningPatternResult {
  patterns: Array<{
    type: string;
    name: string;
    description: string;
    confidence: number;
    evidence: string[];
    impact: "positive" | "neutral" | "negative";
  }>;
  insights: string[];
  predictions: Array<{
    aspect: string;
    prediction: string;
    confidence: number;
  }>;
}

/**
 * Detecta padrões de aprendizado usando IA
 * @param data Dados históricos do aluno
 * @returns Padrões identificados e previsões
 */
export async function detectLearningPatterns(
  data: LearningPatternData
): Promise<LearningPatternResult> {
  const prompt = `Você é um especialista em ciência de dados educacionais. Analise os dados históricos do aluno e identifique padrões de aprendizado.

**Aluno:** ${data.studentName}
**Período:** ${data.timeframe}

**Histórico de Exercícios:**
${data.historicalData.exercises.map(e => 
  `- ${e.date}: ${e.score}%${e.timeSpent ? ` (${e.timeSpent} min)` : ""}${e.difficulty ? ` [${e.difficulty}]` : ""}`
).join("\n")}

**Histórico de Presença:**
${data.historicalData.attendance.map(a => 
  `- ${a.date}: ${a.present ? "Presente" : "Ausente"}${a.timeOfDay ? ` (${a.timeOfDay})` : ""}`
).join("\n")}

**Histórico de Submissões:**
${data.historicalData.submissions.map(s => 
  `- ${s.date}: ${s.onTime ? "No prazo" : "Atrasado"}${s.quality ? ` (qualidade: ${s.quality}/10)` : ""}`
).join("\n")}

Identifique padrões significativos e forneça o resultado em JSON com:
- patterns: Lista de padrões detectados, cada um com { type, name, description, confidence, evidence, impact }
- insights: Insights gerais sobre o comportamento do aluno
- predictions: Previsões sobre aspectos futuros, cada uma com { aspect, prediction, confidence }`;

  const messages: Message[] = [
    {
      role: "system",
      content: "Você é um especialista em ciência de dados educacionais. Sempre responda em JSON válido."
    },
    {
      role: "user",
      content: prompt
    }
  ];

  try {
    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "learning_patterns",
          strict: true,
          schema: {
            type: "object",
            properties: {
              patterns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    name: { type: "string" },
                    description: { type: "string" },
                    confidence: { type: "number" },
                    evidence: {
                      type: "array",
                      items: { type: "string" }
                    },
                    impact: {
                      type: "string",
                      enum: ["positive", "neutral", "negative"]
                    }
                  },
                  required: ["type", "name", "description", "confidence", "evidence", "impact"],
                  additionalProperties: false
                }
              },
              insights: {
                type: "array",
                items: { type: "string" }
              },
              predictions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    aspect: { type: "string" },
                    prediction: { type: "string" },
                    confidence: { type: "number" }
                  },
                  required: ["aspect", "prediction", "confidence"],
                  additionalProperties: false
                }
              }
            },
            required: ["patterns", "insights", "predictions"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Resposta inválida da IA");
    }

    const result: LearningPatternResult = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Erro ao detectar padrões:", error);
    throw new Error("Falha ao detectar padrões de aprendizado");
  }
}

/**
 * Dados para geração de insights personalizados
 */
export interface PersonalizedInsightData {
  studentId: number;
  studentName: string;
  currentPerformance: {
    overall: number;
    bySubject?: Record<string, number>;
  };
  recentTrends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  comparisonWithClass?: {
    percentile: number;
    averageScore: number;
    studentScore: number;
  };
  teacherGoals?: string[];
}

/**
 * Resultado de insights personalizados
 */
export interface PersonalizedInsightResult {
  insights: Array<{
    type: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
    actionable: boolean;
    actionSuggestion?: string;
    confidence: number;
  }>;
  summary: string;
  focusAreas: string[];
}

/**
 * Gera insights personalizados para um aluno
 * @param data Dados de desempenho e contexto do aluno
 * @returns Insights e recomendações personalizadas
 */
export async function generatePersonalizedInsights(
  data: PersonalizedInsightData
): Promise<PersonalizedInsightResult> {
  const prompt = `Você é um consultor pedagógico especializado. Gere insights personalizados para o aluno com base nos dados fornecidos.

**Aluno:** ${data.studentName}

**Desempenho Atual:**
- Geral: ${data.currentPerformance.overall}%
${data.currentPerformance.bySubject ? Object.entries(data.currentPerformance.bySubject)
  .map(([subject, score]) => `- ${subject}: ${score}%`)
  .join("\n") : ""}

**Tendências Recentes:**
- Melhorando: ${data.recentTrends.improving.join(", ") || "Nenhuma"}
- Em declínio: ${data.recentTrends.declining.join(", ") || "Nenhuma"}
- Estável: ${data.recentTrends.stable.join(", ") || "Nenhuma"}

${data.comparisonWithClass ? `**Comparação com a Turma:**
- Percentil: ${data.comparisonWithClass.percentile}
- Média da turma: ${data.comparisonWithClass.averageScore}%
- Pontuação do aluno: ${data.comparisonWithClass.studentScore}%` : ""}

${data.teacherGoals ? `**Objetivos do Professor:**
${data.teacherGoals.map(g => `- ${g}`).join("\n")}` : ""}

Gere insights acionáveis em JSON com:
- insights: Lista de insights, cada um com { type, title, description, priority, actionable, actionSuggestion, confidence }
- summary: Resumo geral da situação do aluno
- focusAreas: Áreas que devem receber atenção prioritária`;

  const messages: Message[] = [
    {
      role: "system",
      content: "Você é um consultor pedagógico especializado. Sempre responda em JSON válido."
    },
    {
      role: "user",
      content: prompt
    }
  ];

  try {
    const response = await invokeLLM({
      messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "personalized_insights",
          strict: true,
          schema: {
            type: "object",
            properties: {
              insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high", "critical"]
                    },
                    actionable: { type: "boolean" },
                    actionSuggestion: { type: "string" },
                    confidence: { type: "number" }
                  },
                  required: ["type", "title", "description", "priority", "actionable", "confidence"],
                  additionalProperties: false
                }
              },
              summary: { type: "string" },
              focusAreas: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["insights", "summary", "focusAreas"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Resposta inválida da IA");
    }

    const result: PersonalizedInsightResult = JSON.parse(content);
    return result;
  } catch (error) {
    console.error("Erro ao gerar insights:", error);
    throw new Error("Falha ao gerar insights personalizados");
  }
}
