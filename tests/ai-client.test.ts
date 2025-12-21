import { describe, expect, it, vi } from 'vitest';
import { AiClient } from '../src/main/ai/aiClient';

const successPayload = {
  choices: [
    {
      message: {
        content: JSON.stringify({
          pronunciation: 'さくら',
          definition_cn: '春天盛开的樱花，象征日本的季节与短暂之美。',
          examples: [
            {
              sentence_jp: '公園で桜が満開になりました。',
              sentence_cn: '公园里的樱花已经盛开了。'
            }
          ]
        })
      }
    }
  ]
};

describe('AiClient', () => {
  it('parses successful responses into word data', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => successPayload,
      text: async () => JSON.stringify(successPayload)
    }));

    const client = new AiClient({
      apiKey: 'test-key',
      model: 'gemini-flash-2.5-lite',
      fetchImpl
    });

    const result = await client.generateWordData('桜');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.term).toBe('桜');
      expect(result.data.pronunciation).toBe('さくら');
      expect(result.data.examples[0].sentence_cn).toContain('樱花');
    }
  });

  it('asks for an API key before making requests', async () => {
    const client = new AiClient();
    const result = await client.generateWordData('花火');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('missing_api_key');
      expect(result.error.message).toContain('API Key');
    }
  });

  it('surfaces HTTP failures with detail', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 429,
      json: async () => ({}),
      text: async () => 'rate limit'
    }));

    const client = new AiClient({
      apiKey: 'another-key',
      model: 'gpt-4.1-mini',
      fetchImpl
    });

    const result = await client.generateWordData('稲妻');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('ai_http_error');
      expect(result.error.detail).toContain('429');
    }
  });
});
