import { describe, expect, it, vi } from 'vitest';

import { GeminiProvider } from '@main/ai/gemini';
import { MockAiProvider } from '@main/ai/mock';
import { OpenAiProvider } from '@main/ai/openai';

const buildLongText = (value: string, repeat: number) => value.repeat(repeat);

describe('OpenAiProvider', () => {
  it('parses JSON content and enforces char limits', async () => {
    const createMock = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({
        hiragana: '  てすと ',
        definition_ja: buildLongText('説明', 10),
        example_ja: '例文です',
      }),
    });
    const client = {
      responses: { create: createMock },
    } as unknown as import('openai').OpenAI;

    const provider = new OpenAiProvider({
      apiKey: 'test-key',
      client,
      timeoutMs: 200,
    });

    const result = await provider.generateWordContent({
      word: 'テスト',
      maxOutputChars: 8,
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    type OpenAiRequest = {
      model: string;
      text: { format: { type: string } };
    };
    type OpenAiOptions = { signal?: AbortSignal };
    const [[body, options]] = createMock.mock.calls as Array<
      [OpenAiRequest, OpenAiOptions | undefined]
    >;
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.text.format.type).toBe('json_schema');
    expect(options?.signal).toBeDefined();
    expect(result.hiragana).toBe('てすと');
    expect(result.definition_ja.endsWith('...')).toBe(true);
    expect(result.definition_ja.length).toBeLessThanOrEqual(11);
    expect(result.example_ja).toBe('例文です');
  });

  it('throws on timeout', async () => {
    vi.useFakeTimers();
    const createMock = vi.fn(
      (_body: unknown, options?: { signal?: AbortSignal }) =>
        new Promise((_, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );
    const client = {
      responses: { create: createMock },
    } as unknown as import('openai').OpenAI;
    const provider = new OpenAiProvider({
      apiKey: 'test-key',
      client,
      timeoutMs: 20,
    });

    const promise = provider.generateWordContent({ word: '遅い' });
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(25);

    await expect(promise).rejects.toThrow(/超时/);
    vi.useRealTimers();
  });
});

describe('GeminiProvider', () => {
  it('parses text field', async () => {
    const generateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        hiragana: 'ねこ',
        definition_ja: '小さくてかわいい動物。',
        example_ja: '猫は窓辺で昼寝している。',
      }),
    });
    const client = {
      models: { generateContent },
    } as unknown as import('@google/genai').GoogleGenAI;
    const provider = new GeminiProvider({
      apiKey: 'test-key',
      client,
      timeoutMs: 200,
    });

    const result = await provider.generateWordContent({ word: '猫' });

    expect(generateContent).toHaveBeenCalledTimes(1);
    type GeminiRequest = {
      model: string;
      config?: { responseMimeType?: string };
    };
    const [[request]] = generateContent.mock.calls as Array<[GeminiRequest]>;
    expect(request.model).toBe('gemini-2.5-flash-lite');
    expect(request.config?.responseMimeType).toBe('application/json');
    expect(result.hiragana).toBe('ねこ');
    expect(result.definition_ja).toContain('動物');
  });

  it('fails on invalid JSON', async () => {
    const generateContent = vi.fn().mockResolvedValue({
      text: 'not-a-json',
    });
    const client = {
      models: { generateContent },
    } as unknown as import('@google/genai').GoogleGenAI;
    const provider = new GeminiProvider({
      apiKey: 'test-key',
      client,
      timeoutMs: 200,
    });

    await expect(provider.generateWordContent({ word: '犬' })).rejects.toThrow(
      /JSON/,
    );
  });
});

describe('MockAiProvider', () => {
  it('returns deterministic payload', async () => {
    const provider = new MockAiProvider();
    const result = await provider.generateWordContent({
      word: 'ダミー',
      maxOutputChars: 4,
    });

    expect(result.hiragana).toBe('てすと');
    expect(result.definition_ja.endsWith('...')).toBe(true);
  });
});
