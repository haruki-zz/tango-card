import { GenerateWordDataResult, WordData, WordExample } from '../../shared/apiTypes';

type OpenAiModel = 'gpt-4o' | 'gpt-4.1-mini';
type SupportedModel = OpenAiModel | 'gemini-2.5-flash';

interface FetchResponseLike {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}

type FetchLike = (input: string, init?: Record<string, unknown>) => Promise<FetchResponseLike>;

interface AiClientOptions {
  apiKey?: string | null;
  model?: string;
  fetchImpl?: FetchLike;
}

const DEFAULT_MODEL: SupportedModel = 'gemini-2.5-flash';
const GEMINI_API_BASE =
  'https://generativelanguage.googleapis.com/v1beta/models';
const OPENAI_ENDPOINT: Record<OpenAiModel, string> = {
  'gpt-4o': 'https://api.openai.com/v1/chat/completions',
  'gpt-4.1-mini': 'https://api.openai.com/v1/chat/completions'
};

export class AiClient {
  private apiKey: string | null;
  private model: SupportedModel;
  private fetchImpl: FetchLike;

  constructor(options: AiClientOptions = {}) {
    this.apiKey = options.apiKey ?? null;
    this.model = normalizeModel(options.model);
    this.fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike);
  }

  updateConfig(patch: Partial<Pick<AiClientOptions, 'apiKey' | 'model'>>) {
    if (patch.apiKey !== undefined) {
      this.apiKey = patch.apiKey;
    }
    if (patch.model !== undefined) {
      this.model = normalizeModel(patch.model);
    }
  }

  async generateWordData(term: string): Promise<GenerateWordDataResult> {
    const cleanTerm = term.trim();
    if (!cleanTerm) {
      return {
        ok: false,
        error: {
          code: 'invalid_term',
          message: '请输入需要生成的日语单词。'
        }
      };
    }

    if (!this.apiKey) {
      return {
        ok: false,
        error: {
          code: 'missing_api_key',
          message: '未配置 API Key，无法调用 AI。请在设置中填写后重试。'
        }
      };
    }

    try {
      if (isOpenAiModel(this.model)) {
        return await callOpenAiModel({
          apiKey: this.apiKey,
          fetchImpl: this.fetchImpl,
          model: this.model,
          term: cleanTerm
        });
      }

      return await callGeminiModel({
        apiKey: this.apiKey,
        fetchImpl: this.fetchImpl,
        model: this.model,
        term: cleanTerm
      });
    } catch (error) {
      const detail = stringifyError(error);
      if (isNetworkError(error)) {
        return {
          ok: false,
          error: {
            code: 'network_unavailable',
            message: '无法连接到 AI 服务，请先手动填写后保存，联网后再点击“生成”补全。',
            detail
          }
        };
      }

      return {
        ok: false,
        error: {
          code: 'ai_request_failed',
          message: 'AI 调用失败，请稍后重试。',
          detail
        }
      };
    }
  }
}

async function callGeminiModel(params: {
  apiKey: string;
  fetchImpl: FetchLike;
  model: SupportedModel;
  term: string;
}): Promise<GenerateWordDataResult> {
  const { apiKey, fetchImpl, model, term } = params;
  const { url, headers } = buildGeminiRequest(model, apiKey);
  const response = await fetchImpl(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(buildGeminiPayload(term))
  });

  if (!response.ok) {
    const detail = await safeReadText(response);
    return {
      ok: false,
      error: {
        code: 'ai_http_error',
        message: 'AI 生成失败，请稍后重试或手动填写。',
        detail: `HTTP ${response.status}: ${detail}`
      }
    };
  }

  const payload = await response.json();
  const wordData = extractWordData(payload, term, 'gemini');

  if (!wordData) {
    return {
      ok: false,
      error: {
        code: 'ai_invalid_response',
        message: 'AI 返回内容异常，请手动填写或稍后再试。',
        detail: stringifyForLog(payload)
      }
    };
  }

  return { ok: true, data: wordData };
}

async function callOpenAiModel(params: {
  apiKey: string;
  fetchImpl: FetchLike;
  model: OpenAiModel;
  term: string;
}): Promise<GenerateWordDataResult> {
  const { apiKey, fetchImpl, model, term } = params;
  const { url, headers } = buildOpenAiRequestConfig(model, apiKey);
  const response = await fetchImpl(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(buildOpenAiPayload(term, model))
  });

  if (!response.ok) {
    const detail = await safeReadText(response);
    return {
      ok: false,
      error: {
        code: 'ai_http_error',
        message: 'AI 生成失败，请稍后重试或手动填写。',
        detail: `HTTP ${response.status}: ${detail}`
      }
    };
  }

  const payload = await response.json();
  const wordData = extractWordData(payload, term, 'openai');

  if (!wordData) {
    return {
      ok: false,
      error: {
        code: 'ai_invalid_response',
        message: 'AI 返回内容异常，请手动填写或稍后再试。',
        detail: stringifyForLog(payload)
      }
    };
  }

  return { ok: true, data: wordData };
}

function buildGeminiRequest(model: SupportedModel, apiKey: string) {
  return {
    url: `${GEMINI_API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

function buildOpenAiRequestConfig(model: OpenAiModel, apiKey: string) {
  return {
    url: OPENAI_ENDPOINT[model],
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    }
  };
}

function buildGeminiPayload(term: string) {
  const systemPrompt =
    '你是一名简洁的日语导师，只输出 JSON 对象。字段：pronunciation（假名读音）、definition_cn（140 字内释义）、examples（数组，每项包含 sentence_jp 与 sentence_cn）。';
  const userPrompt = `Word: ${term}\n请返回上述 JSON 对象，不要输出其他解释文本。`;

  return {
    systemInstruction: {
      role: 'system',
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 400
    }
  };
}

function buildOpenAiPayload(term: string, model: OpenAiModel) {
  return {
    model,
    messages: [
      {
        role: 'system',
        content:
          '你是一名简洁的日语导师，只输出 JSON 对象。字段：pronunciation（假名读音）、definition_cn（140 字内释义）、examples（数组，每项包含 sentence_jp 与 sentence_cn）。'
      },
      {
        role: 'user',
        content: `Word: ${term}\n请返回上述 JSON 对象，不要输出其他解释文本。`
      }
    ],
    temperature: 0.7,
    max_tokens: 400,
    response_format: { type: 'json_object' as const }
  };
}

function extractWordData(
  payload: unknown,
  term: string,
  source: 'gemini' | 'openai'
): WordData | null {
  const content =
    source === 'gemini'
      ? extractGeminiContent(payload)
      : extractOpenAiContent(payload);

  if (!content) return null;
  return parseWordData(content, term);
}

function extractGeminiContent(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = Array.isArray((payload as Record<string, unknown>).candidates)
    ? (payload as { candidates: unknown[] }).candidates
    : null;
  const firstCandidate = candidates && candidates.length > 0 ? candidates[0] : null;
  if (!firstCandidate || typeof firstCandidate !== 'object') return null;
  const content = (firstCandidate as Record<string, unknown>).content;
  if (!content || typeof content !== 'object') return null;
  const parts = Array.isArray((content as Record<string, unknown>).parts)
    ? (content as { parts: unknown[] }).parts
    : null;
  if (!parts || parts.length === 0) return null;

  const textPart = parts.find((part) => {
    return (
      part &&
      typeof part === 'object' &&
      typeof (part as Record<string, unknown>).text === 'string'
    );
  }) as { text: string } | undefined;

  return textPart?.text ?? null;
}

function extractOpenAiContent(payload: unknown) {
  if (!payload || typeof payload !== 'object') return null;
  const rawChoice = Array.isArray((payload as Record<string, unknown>).choices)
    ? (payload as { choices: unknown[] }).choices[0]
    : null;

  const message = rawChoice && typeof rawChoice === 'object'
    ? (rawChoice as Record<string, unknown>).message
    : null;
  const content = message && typeof message === 'object'
    ? (message as Record<string, unknown>).content
    : null;

  if (typeof content !== 'string') return null;
  return content;
}

function parseWordData(content: string, term: string): WordData | null {
  try {
    const parsed = JSON.parse(content) as Partial<WordData>;
    if (
      !parsed.pronunciation ||
      !parsed.definition_cn ||
      !Array.isArray(parsed.examples) ||
      parsed.examples.length === 0
    ) {
      return null;
    }

    const examples = parsed.examples
      .filter(isWordExample)
      .map((item) => ({
        sentence_jp: item.sentence_jp.trim(),
        sentence_cn: item.sentence_cn.trim()
      }));

    if (examples.length === 0) return null;

    return {
      term,
      pronunciation: parsed.pronunciation.trim(),
      definition_cn: parsed.definition_cn.trim(),
      examples
    };
  } catch {
    return null;
  }
}

function stringifyError(error: unknown) {
  if (error instanceof Error) return error.message;
  return typeof error === 'string' ? error : JSON.stringify(error);
}

function isNetworkError(error: unknown) {
  const message = normalizeErrorMessage(error);
  if (!message) return false;

  return (
    message.includes('fetch failed') ||
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('net::') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('enetunreach') ||
    message.includes('econnreset')
  );
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error && typeof error.message === 'string') {
    return error.message.toLowerCase();
  }
  if (typeof error === 'string') {
    return error.toLowerCase();
  }
  return '';
}

function stringifyForLog(payload: unknown) {
  try {
    return JSON.stringify(payload);
  } catch {
    return '[unserializable payload]';
  }
}

async function safeReadText(response: FetchResponseLike) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function normalizeModel(model?: string): SupportedModel {
  if (!model) return DEFAULT_MODEL;
  if (model === 'gpt-4o' || model === 'gpt-4.1-mini') {
    return model;
  }
  if (model === 'gemini-2.5-flash' || model === 'gemini-flash-2.5-lite') {
    return 'gemini-2.5-flash';
  }
  return DEFAULT_MODEL;
}

function isWordExample(value: unknown): value is WordExample {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<WordExample>;
  return (
    typeof candidate.sentence_jp === 'string' && typeof candidate.sentence_cn === 'string'
  );
}

function isOpenAiModel(model: SupportedModel): model is OpenAiModel {
  return model === 'gpt-4o' || model === 'gpt-4.1-mini';
}
