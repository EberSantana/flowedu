/**
 * Integração com Google Gemini AI
 * Compatível com a interface do invokeLLM do Manus
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Tipos compatíveis com a interface do Manus
type Role = "system" | "user" | "assistant" | "tool" | "function";

interface Message {
  role: Role;
  content: string;
}

interface LLMResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface InvokeLLMOptions {
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  model?: string;
  response_format?: any; // Suporte a JSON schema (compatibilidade com Manus)
}

/**
 * Converte mensagens do formato Manus para o formato Gemini
 */
function convertMessagesToGemini(messages: Message[]): Array<{ role: string; parts: Array<{ text: string }> }> {
  const geminiMessages: Array<{ role: string; parts: Array<{ text: string }> }> = [];
  
  // Gemini usa 'user' e 'model' como roles
  // System messages são convertidas para user messages com contexto
  let systemContext = "";
  
  for (const msg of messages) {
    if (msg.role === "system") {
      systemContext += msg.content + "\n\n";
    } else if (msg.role === "user") {
      const content = systemContext + msg.content;
      geminiMessages.push({
        role: "user",
        parts: [{ text: content }]
      });
      systemContext = ""; // Limpa após usar
    } else if (msg.role === "assistant") {
      geminiMessages.push({
        role: "model",
        parts: [{ text: msg.content }]
      });
    }
  }
  
  // Se sobrou system context sem user message, adiciona como user
  if (systemContext && geminiMessages.length === 0) {
    geminiMessages.push({
      role: "user",
      parts: [{ text: systemContext }]
    });
  }
  
  return geminiMessages;
}

/**
 * Função principal compatível com invokeLLM do Manus
 */
export async function invokeLLM(options: InvokeLLMOptions): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no .env");
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Modelo padrão: gemini-1.5-flash (rápido e barato)
  // Alternativa: gemini-1.5-pro (mais poderoso, mais caro)
  const modelName = options.model || "gemini-1.5-flash";
  
  // Configuração do modelo com suporte a JSON mode
  const modelConfig: any = { model: modelName };
  
  // Se response_format for especificado, ativar JSON mode
  if (options.response_format?.type === 'json_schema') {
    modelConfig.generationConfig = {
      responseMimeType: "application/json",
    };
  }
  
  const model = genAI.getGenerativeModel(modelConfig);
  
  const geminiMessages = convertMessagesToGemini(options.messages);
  
  // Se só tem uma mensagem, usa generateContent
  if (geminiMessages.length === 1) {
    const result = await model.generateContent(geminiMessages[0].parts[0].text);
    const response = await result.response;
    const text = response.text();
    
    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: text
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 0, // Gemini não retorna contagem de tokens facilmente
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }
  
  // Se tem histórico, usa chat
  const chat = model.startChat({
    history: geminiMessages.slice(0, -1), // Todas menos a última
    generationConfig: {
      temperature: options.temperature || 0.7,
      maxOutputTokens: options.max_tokens || 2048,
    },
  });
  
  const lastMessage = geminiMessages[geminiMessages.length - 1];
  const result = await chat.sendMessage(lastMessage.parts[0].text);
  const response = await result.response;
  const text = response.text();
  
  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: text
        },
        finish_reason: "stop"
      }
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    }
  };
}

/**
 * Função auxiliar para gerar imagens (Gemini não suporta nativamente)
 * Retorna erro informativo
 */
export async function generateImage(options: any): Promise<any> {
  throw new Error(
    "Geração de imagens não está disponível com Gemini. " +
    "Para usar geração de imagens, você precisa integrar com DALL-E (OpenAI) ou Imagen (Google Cloud)."
  );
}
