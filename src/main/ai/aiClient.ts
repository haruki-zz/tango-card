import { GenerateWordDataResult, WordData, WordExample } from '../../shared/apiTypes';

type SupportedModel = 'gemini-flash-2.5-lite' | 'gpt-4o' | 'gpt-4.1-mini';

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

const DEFAULT_MODEL: SupportedModel = 'gemini-flash-2.5-lite';

const MODEL_ENDPOINT: Record<SupportedModel, string> = {
  'gemini-flash-2.5-lite':
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
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

    const { url, headers } = buildRequestConfig(this.model, this.apiKey);
    const body = JSON.stringify(buildChatPayload(cleanTerm, this.model));

    try {
      const response = await this.fetchImpl(url, {
        method: 'POST',
        headers,
        body
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
      const wordData = extractWordData(payload, cleanTerm);

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
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'ai_request_failed',
          message: 'AI 调用失败，请检查网络或稍后重试。',
          detail: stringifyError(error)
        }
      };
    }
  }
}

function buildRequestConfig(model: SupportedModel, apiKey: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };

  if (model === 'gemini-flash-2.5-lite') {
    headers['x-goog-api-key'] = apiKey;
  }

  return {
    url: MODEL_ENDPOINT[model],
    headers
  };
}

function buildChatPayload(term: string, model: SupportedModel) {
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

function extractWordData(payload: unknown, term: string): WordData | null {
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
  if (model === 'gpt-4o' || model === 'gpt-4.1-mini' || model === 'gemini-flash-2.5-lite') {
    return model;
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
