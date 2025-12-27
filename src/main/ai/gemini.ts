import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';

import {
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_TIMEOUT_MS,
  type AiProvider,
  type WordGenerationRequest,
} from './types';
import {
  buildWordPrompt,
  extractJsonObject,
  normalizeGeneratedContent,
  withTimeout,
} from './utils';

interface GeminiProviderOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  client?: GoogleGenAI;
}

const DEFAULT_MODEL = 'gemini-2.5-flash-lite';

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === 'AbortError';

const pickTextContent = (response: GenerateContentResponse) => {
  const direct = (response as { text?: unknown }).text;
  if (typeof direct === 'string' && direct.trim() !== '') {
    return direct;
  }
  const candidates = response.candidates;
  const first = Array.isArray(candidates) ? candidates[0] : undefined;
  const parts = first?.content?.parts;
  if (Array.isArray(parts)) {
    const combined = parts
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if (part && typeof part === 'object' && 'text' in part) {
          const text = (part as Record<string, unknown>).text;
          return typeof text === 'string' ? text : '';
        }
        return '';
      })
      .filter((value) => value.trim() !== '')
      .join('\n');
    if (combined.trim() === '') {
      throw new Error('Gemini 响应缺少文本片段');
    }
    return combined;
  }

  throw new Error('Gemini 响应缺少文本内容');
};

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxOutputTokens: number;
  private readonly client: GoogleGenAI;

  constructor(options: GeminiProviderOptions) {
    if (!options.apiKey) {
      throw new Error('Gemini 需要提供 apiKey');
    }

    this.client = options.client ?? new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model ?? DEFAULT_MODEL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxOutputTokens = options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  }

  async generateWordContent(input: WordGenerationRequest) {
    const word = input.word.trim();
    if (!word) {
      throw new Error('word 不能为空');
    }

    const controller = new AbortController();
    const prompt = buildWordPrompt(word, input.maxOutputChars);
    const responsePromise = this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      config: {
        abortSignal: controller.signal,
        responseMimeType: 'application/json',
        maxOutputTokens: this.maxOutputTokens,
        temperature: 0.2,
      },
    });

    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await withTimeout(
        responsePromise,
        this.timeoutMs,
        'Gemini 请求超时',
      );
      const text = pickTextContent(response);
      const parsed = extractJsonObject(text);
      return normalizeGeneratedContent(parsed, input);
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error('Gemini 请求超时');
      }
      if (error instanceof Error) {
        throw new Error(`Gemini 请求异常: ${error.message}`);
      }
      throw new Error('Gemini 请求异常');
    } finally {
      clearTimeout(timeout);
    }
  }
}
