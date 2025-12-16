import { GenerationResult, ModelCallParams, ModelProvider, SupportedModel } from "./types.ts";

export const DEFAULT_MODEL: SupportedModel = "gpt-4o";

export const MODEL_ALIASES: Record<string, SupportedModel> = {
  "gpt-4o": "gpt-4o",
  gpt4o: "gpt-4o",
  "gpt-3.5-turbo": "gpt-3.5-turbo",
  gpt35: "gpt-3.5-turbo",
  "gemini-2.5-flash-lite": "gemini-2.5-flash-lite",
  "gemini-flash-lite": "gemini-2.5-flash-lite",
};

export class ModelError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class ModelRouter {
  constructor(
    private readonly providers: Record<SupportedModel, ModelProvider>,
    private readonly fallbackModel: SupportedModel = DEFAULT_MODEL,
  ) {}

  resolve(model?: string): SupportedModel {
    if (!model) return this.fallbackModel;
    const normalized = MODEL_ALIASES[model.toLowerCase()] ?? MODEL_ALIASES[model];
    if (!normalized) {
      throw new ModelError("MODEL_NOT_ALLOWED", 400, `不支持的模型 ${model}`);
    }
    return normalized;
  }

  async generate(surface: string, model: string | undefined, signal: AbortSignal): Promise<GenerationResult> {
    const resolved = this.resolve(model);
    const provider = this.providers[resolved];
    if (!provider) {
      throw new ModelError("MODEL_UNAVAILABLE", 503, `模型 ${resolved} 未配置`);
    }
    return provider({ surface, model: resolved, signal });
  }
}

const SYSTEM_PROMPT =
  "你是日语学习助手，请仅返回 JSON，对象包含 reading（假名）、meaningZh（30字内中文释义）、exampleJa（自然日语例句）。禁止输出 JSON 之外的内容。";

function buildUserPrompt(surface: string): string {
  return `词面: ${surface}\n请输出 JSON：{"reading":"假名","meaningZh":"简洁中文释义","exampleJa":"日文例句"}`;
}

function extractJson(content: string, model: SupportedModel): GenerationResult {
  const cleaned = content.trim().replace(/^```json/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new ModelError("MODEL_PARSE_ERROR", 502, "AI 返回格式不包含 JSON");
  }

  const raw = cleaned.slice(start, end + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new ModelError("MODEL_PARSE_ERROR", 502, `AI JSON 解析失败: ${(error as Error).message}`);
  }

  const reading = String((parsed as Record<string, unknown>).reading ?? "").trim();
  const meaningZh = String((parsed as Record<string, unknown>).meaningZh ?? "").trim();
  const exampleJa = String((parsed as Record<string, unknown>).exampleJa ?? "").trim();

  if (!reading || !meaningZh || !exampleJa) {
    throw new ModelError("MODEL_PAYLOAD_INCOMPLETE", 502, "AI 返回内容缺少字段");
  }

  return { reading, meaningZh, exampleJa, model };
}

async function callOpenAI({ surface, model, signal }: ModelCallParams): Promise<GenerationResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new ModelError("MODEL_CONFIG_ERROR", 500, "缺少 OPENAI_API_KEY");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(surface) },
      ],
      temperature: 0.2,
      max_tokens: 256,
    }),
    signal,
  });

  if (!response.ok) {
    throw new ModelError("MODEL_UPSTREAM_ERROR", response.status, `OpenAI 请求失败: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new ModelError("MODEL_PAYLOAD_EMPTY", 502, "OpenAI 返回内容为空");
  }

  return extractJson(content, model);
}

async function callGemini({ surface, signal, model }: ModelCallParams): Promise<GenerationResult> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new ModelError("MODEL_CONFIG_ERROR", 500, "缺少 GEMINI_API_KEY");
  }

  // Gemini 2.5 Flash-Lite 暂用 2.0 flash lite 接口，便于后续平滑替换
  const geminiModelId = "gemini-2.0-flash-lite";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelId}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n${buildUserPrompt(surface)}` }] }],
        generationConfig: { temperature: 0.2 },
      }),
      signal,
    },
  );

  if (!response.ok) {
    throw new ModelError("MODEL_UPSTREAM_ERROR", response.status, `Gemini 请求失败: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new ModelError("MODEL_PAYLOAD_EMPTY", 502, "Gemini 返回内容为空");
  }

  return extractJson(content, model);
}

export function buildDefaultProviders(): Record<SupportedModel, ModelProvider> {
  return {
    "gpt-4o": callOpenAI,
    "gpt-3.5-turbo": callOpenAI,
    "gemini-2.5-flash-lite": callGemini,
  };
}
