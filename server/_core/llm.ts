import { ENV } from "./env";

// Cache da configuração de IA (recarregada a cada 5 minutos)
let _aiSettingsCache: { provider: string; model: string; apiKey: string; apiUrl: string; updatedAt: number } | null = null;
const AI_SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Lê as configurações de IA do banco de dados (com cache de 5 min)
 * Retorna o provedor, modelo, chave e URL configurados pelo administrador
 */
async function getConfiguredProvider(): Promise<{ provider: string; model: string; apiKey: string; apiUrl: string } | null> {
  try {
    const now = Date.now();
    if (_aiSettingsCache && (now - _aiSettingsCache.updatedAt) < AI_SETTINGS_CACHE_TTL) {
      return _aiSettingsCache;
    }
    const { getDb } = await import('../db');
    const { sql } = await import('drizzle-orm');
    const dbConn = await getDb();
    if (!dbConn) return null;
    const result = await dbConn.execute(
      sql`SELECT provider, model, groqApiKey, geminiApiKey, openaiApiKey, anthropicApiKey FROM ai_settings WHERE isActive = 1 ORDER BY updatedAt DESC LIMIT 1`
    ) as any[];
    const rows = (result[0] as any[]) || [];
    if (rows.length === 0) return null;
    const row = rows[0];
    const provider: string = row.provider || 'groq';
    const model: string = row.model || 'llama-3.3-70b-versatile';
    let apiKey = '';
    let apiUrl = '';
    switch (provider) {
      case 'openai':
        apiKey = row.openaiApiKey || '';
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        break;
      case 'anthropic':
        apiKey = row.anthropicApiKey || '';
        apiUrl = 'https://api.anthropic.com/v1/messages';
        break;
      case 'gemini':
        apiKey = row.geminiApiKey || '';
        apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
        break;
      case 'manus':
        apiKey = ENV.forgeApiKey || '';
        apiUrl = ENV.forgeApiUrl ? `${ENV.forgeApiUrl.replace(/\/$/, '')}/v1/chat/completions` : 'https://forge.manus.im/v1/chat/completions';
        break;
      case 'cohere':
        apiKey = row.cohereApiKey || '';
        apiUrl = 'https://api.cohere.com/compatibility/v1/chat/completions';
        break;
      case 'groq':
      default:
        apiKey = row.groqApiKey || ENV.groqApiKey || '';
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        break;
    }
    if (!apiKey) return null;
    _aiSettingsCache = { provider, model, apiKey, apiUrl, updatedAt: now };
    return { provider, model, apiKey, apiUrl };
  } catch (e) {
    console.warn('[LLM] Failed to load AI settings from DB:', e);
    return null;
  }
}

/** Invalida o cache de configurações de IA (chamar após salvar novas configurações) */
export function invalidateAISettingsCache() {
  _aiSettingsCache = null;
}

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveApiUrl = () => {
  // Prioridade 1: Groq API (preferida quando configurada)
  if (ENV.groqApiKey) {
    return "https://api.groq.com/openai/v1/chat/completions";
  }
  // Prioridade 2: Forge API (Manus built-in) - fallback
  if (ENV.forgeApiKey) {
    return ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
      ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
      : "https://forge.manus.im/v1/chat/completions";
  }
  // Prioridade 3: Google Gemini API direta
  if (ENV.geminiApiKey) {
    return "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
  }
  throw new Error("No LLM API key configured (BUILT_IN_FORGE_API_KEY, GROQ_API_KEY or GEMINI_API_KEY)");
};

const resolveApiKey = () => {
  if (ENV.groqApiKey) return ENV.groqApiKey;
  if (ENV.forgeApiKey) return ENV.forgeApiKey;
  if (ENV.geminiApiKey) return ENV.geminiApiKey;
  throw new Error("No LLM API key configured (BUILT_IN_FORGE_API_KEY, GROQ_API_KEY or GEMINI_API_KEY)");
};

const resolveModel = () => {
  if (ENV.groqApiKey) return "llama-3.3-70b-versatile"; // Modelo Groq gratuito e poderoso
  if (ENV.forgeApiKey) return "gemini-2.5-flash";
  return "gemini-2.0-flash"; // Modelo estável para API direta do Google
};

const resolveProvider = () => {
  if (ENV.groqApiKey) return "Groq (Llama 3.3 70B)";
  if (ENV.forgeApiKey) return "Manus Forge";
  if (ENV.geminiApiKey) return "Google Gemini";
  return "Unknown";
};

const assertApiKey = () => {
  if (!ENV.groqApiKey && !ENV.forgeApiKey && !ENV.geminiApiKey) {
    throw new Error("No LLM API key configured. Set GROQ_API_KEY, BUILT_IN_FORGE_API_KEY or GEMINI_API_KEY.");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    // Groq não suporta json_schema com strict mode - converter para json_object
    // (Cohere também não suporta, mas a verificação do provedor ativo é feita em invokeLLM)
    if (explicitFormat.type === "json_schema" && ENV.groqApiKey) {
      console.log(`[LLM] Groq detected: converting json_schema to json_object`);
      return { type: "json_object" };
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// Função para registrar uso da IA no banco de dados (fire-and-forget)
async function logAIUsage(params: {
  provider: string;
  model: string;
  feature: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  success: boolean;
  errorMessage?: string;
}) {
  try {
    const { getDb } = await import('../db');
    const { sql } = await import('drizzle-orm');
    const dbConn = await getDb();
    if (!dbConn) return;
    await dbConn.execute(
      sql`INSERT INTO ai_usage_logs (provider, model, feature, prompt_tokens, completion_tokens, total_tokens, success, error_message) VALUES (${params.provider}, ${params.model}, ${params.feature}, ${params.promptTokens}, ${params.completionTokens}, ${params.totalTokens}, ${params.success ? 1 : 0}, ${params.errorMessage || null})`
    );
  } catch (e) {
    // Falha no log não deve impedir o fluxo principal
    console.warn('[LLM] Failed to log AI usage:', e);
  }
}

// Contexto de feature atual para logging (thread-local simulado via AsyncLocalStorage seria ideal, mas usamos variável global simples)
let _currentFeature = 'other';
export function setLLMFeature(feature: string) { _currentFeature = feature; }

export async function invokeLLM(params: InvokeParams & { feature?: string }): Promise<InvokeResult> {
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  // Tentar usar o provedor configurado no banco de dados
  const configuredProvider = await getConfiguredProvider();
  
  let apiUrl: string;
  let apiKey: string;
  let activeProvider: string;
  let activeModel: string;

  if (configuredProvider) {
    // Usar provedor configurado pelo administrador
    apiUrl = configuredProvider.apiUrl;
    apiKey = configuredProvider.apiKey;
    activeProvider = configuredProvider.provider;
    activeModel = configuredProvider.model;
    console.log(`[LLM] Using configured provider: ${activeProvider} (${activeModel})`);
  } else {
    // Fallback para o provedor padrão do ambiente
    assertApiKey();
    apiUrl = resolveApiUrl();
    apiKey = resolveApiKey();
    activeProvider = ENV.groqApiKey ? 'groq' : ENV.forgeApiKey ? 'manus' : 'gemini';
    activeModel = resolveModel();
    console.log(`[LLM] Using default provider: ${activeProvider}`);
  }

  const payload: Record<string, unknown> = {
    model: activeModel,
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }

  // Definir max_tokens baseado no provedor
  if (activeProvider === 'groq') {
    payload.max_tokens = 8192; // Groq free tier limit
  } else if (activeProvider === 'anthropic') {
    payload.max_tokens = 8192;
  } else if (activeProvider === 'openai') {
    payload.max_tokens = 16384;
  } else if (activeProvider === 'cohere') {
    payload.max_tokens = 4096; // Cohere compatibility endpoint
  } else {
    payload.max_tokens = 32768;
  }

  // Thinking só funciona com Forge API (Manus built-in)
  if (activeProvider === 'manus' && ENV.forgeApiKey) {
    payload.thinking = { "budget_tokens": 128 };
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }

  const feature = (params as any).feature || _currentFeature || 'other';
  const provider = activeProvider;
  const model = activeModel;
  
  console.log(`[LLM] Invoking ${provider}/${model} for feature: ${feature}`);
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Log de erro
    logAIUsage({ provider, model, feature, promptTokens: 0, completionTokens: 0, totalTokens: 0, success: false, errorMessage: `HTTP ${response.status}: ${errorText.slice(0, 200)}` });
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const result = (await response.json()) as InvokeResult;
  
  // Log de sucesso com tokens
  if (result.usage) {
    logAIUsage({
      provider,
      model: result.model || model,
      feature,
      promptTokens: result.usage.prompt_tokens || 0,
      completionTokens: result.usage.completion_tokens || 0,
      totalTokens: result.usage.total_tokens || 0,
      success: true,
    });
  }
  
  return result;
}
