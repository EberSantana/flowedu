import { invokeLLM } from "./_core/llm";

export interface GeneratedModule {
  title: string;
  description: string;
  suggestedHours: number;
  topics: string[];
  orderIndex: number;
}

export interface ModuleGenerationResult {
  modules: GeneratedModule[];
  totalHours: number;
  suggestions: string;
}

export async function generateModulesFromEmenta(
  ementa: string,
  workload: number,
  subjectName: string
): Promise<ModuleGenerationResult> {
  
  if (!ementa || ementa.trim().length < 50) {
    throw new Error("Ementa muito curta. Forneça uma ementa detalhada com pelo menos 50 caracteres.");
  }

  if (workload < 10 || workload > 500) {
    throw new Error("Carga horária deve estar entre 10 e 500 horas.");
  }

  const prompt = `Você é um especialista em design instrucional e criação de trilhas de aprendizagem.

**Disciplina:** ${subjectName}
**Carga Horária Total:** ${workload} horas

**Ementa da Disciplina:**
${ementa}

**Sua tarefa:**
Analise a ementa acima e crie uma estrutura de módulos (unidades) para esta disciplina. Cada módulo deve:

1. Ter um título claro e objetivo
2. Ter uma descrição detalhada do que será estudado
3. Incluir uma lista de tópicos específicos que serão abordados
4. Ter uma sugestão de carga horária (em horas)

**Regras importantes:**
- A soma das horas de todos os módulos deve ser EXATAMENTE ${workload} horas
- Crie entre 4 e 8 módulos (ideal: 5-6 módulos)
- Distribua a carga horária proporcionalmente à complexidade de cada módulo
- Os módulos devem seguir uma sequência lógica de aprendizagem (do básico ao avançado)
- Cada módulo deve ter entre 3 e 6 tópicos específicos
- Use linguagem clara e profissional

Retorne APENAS o JSON, sem texto adicional.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Você é um especialista em design instrucional. Sempre retorne respostas em formato JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "module_generation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              modules: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    suggestedHours: { type: "number" },
                    topics: {
                      type: "array",
                      items: { type: "string" }
                    },
                    orderIndex: { type: "number" }
                  },
                  required: ["title", "description", "suggestedHours", "topics", "orderIndex"],
                  additionalProperties: false
                }
              },
              totalHours: { type: "number" },
              suggestions: { type: "string" }
            },
            required: ["modules", "totalHours", "suggestions"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("IA não retornou conteúdo");
    }

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const result: ModuleGenerationResult = JSON.parse(contentStr);

    if (!result.modules || result.modules.length === 0) {
      throw new Error("Nenhum módulo foi gerado");
    }

    if (result.modules.length < 3 || result.modules.length > 10) {
      throw new Error(`Número de módulos inválido: ${result.modules.length}`);
    }

    const totalHours = result.modules.reduce((sum, m) => sum + m.suggestedHours, 0);
    if (Math.abs(totalHours - workload) > 2) {
      throw new Error(`Soma das horas (${totalHours}h) não corresponde à carga horária (${workload}h)`);
    }

    return result;

  } catch (error) {
    console.error("[generateModulesFromEmenta] Erro:", error);
    throw new Error(`Falha ao gerar módulos: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
  }
}
