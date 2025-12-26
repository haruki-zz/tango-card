import { GeminiProvider } from './gemini';
import { MockAiProvider } from './mock';
import { OpenAiProvider } from './openai';
import type { AiProvider, ProviderConfig } from './types';

export type {
  AiProvider,
  GeneratedWordContent,
  ProviderConfig,
  ProviderName,
  WordGenerationRequest,
} from './types';

export { buildWordPrompt } from './utils';

export const createAiProvider = (config: ProviderConfig): AiProvider => {
  switch (config.provider) {
    case 'openai': {
      if (!config.apiKey) {
        throw new Error('OpenAI 需要有效的 apiKey');
      }
      return new OpenAiProvider({
        apiKey: config.apiKey,
        model: config.model,
        timeoutMs: config.timeoutMs,
        maxOutputTokens: config.maxOutputTokens,
      });
    }
    case 'gemini': {
      if (!config.apiKey) {
        throw new Error('Gemini 需要有效的 apiKey');
      }
      return new GeminiProvider({
        apiKey: config.apiKey,
        model: config.model,
        timeoutMs: config.timeoutMs,
        maxOutputTokens: config.maxOutputTokens,
      });
    }
    case 'mock':
    default:
      return new MockAiProvider();
  }
};

export const createProviderOrMock = (config: ProviderConfig): AiProvider => {
  if (config.provider === 'mock' || !config.apiKey) {
    return new MockAiProvider();
  }
  return createAiProvider(config);
};
