import OpenAI from 'openai';

import {
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_TIMEOUT_MS,
  type AiProvider,
} from './types';
import {
  buildWordPrompt,
  extractJsonObject,
  normalizeGeneratedContent,
} from './utils';
import type { WordGenerationRequest } from './types';

interface OpenAiProviderOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  client?: OpenAI;
}

const DEFAULT_MODEL = 'gpt-4o-mini';

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === 'AbortError';

const buildJsonSchema = () => ({
  type: 'object',
  additionalProperties: false,
  required: ['hiragana', 'definition_ja', 'example_ja'],
  properties: {
    hiragana: { type: 'string', description: '平假名读音' },
    definition_ja: { type: 'string', description: '简洁日文释义' },
    example_ja: { type: 'string', description: '自然的日文例句' },
  },
});

export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxOutputTokens: number;
  private readonly client: OpenAI;

  constructor(options: OpenAiProviderOptions) {
    this.model = options.model ?? DEFAULT_MODEL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxOutputTokens = options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
    this.client =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey,
        baseURL: options.baseUrl,
        timeout: this.timeoutMs,
      });
  }

  async generateWordContent(input: WordGenerationRequest) {
    const word = input.word.trim();
    if (!word) {
      throw new Error('word 不能为空');
    }

    const controller = new AbortController();
    const prompt = buildWordPrompt(word, input.maxOutputChars);

    const responsePromise = this.client.responses.create(
      {
        model: this.model,
        input: prompt,
        temperature: 0.2,
        max_output_tokens: this.maxOutputTokens,
        text: {
          format: {
            type: 'json_schema',
            name: 'word_generation',
            schema: buildJsonSchema(),
            strict: true,
            description: '生成日语词条 JSON 输出',
          },
        },
      },
      { signal: controller.signal },
    );

    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await responsePromise;
      const text = (response as { output_text?: unknown }).output_text;
      if (typeof text !== 'string' || text.trim() === '') {
        throw new Error('OpenAI 响应缺少 output_text');
      }

      const parsed = extractJsonObject(text);
      return normalizeGeneratedContent(parsed, input);
    } catch (error) {
      if (isAbortError(error)) {
        throw new Error('OpenAI 请求超时');
      }
      if (error instanceof Error) {
        throw new Error(`OpenAI 请求异常: ${error.message}`);
      }
      throw new Error('OpenAI 请求异常');
    } finally {
      clearTimeout(timer);
    }
  }
}
