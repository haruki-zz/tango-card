import { WordEntry } from '@shared/types';

export type ProviderName = 'openai' | 'gemini' | 'mock';

export type GeneratedWordContent = Pick<
  WordEntry,
  'hiragana' | 'definition_ja' | 'example_ja'
>;

export interface WordGenerationRequest {
  word: string;
  maxOutputChars?: number;
}

export interface AiProvider {
  readonly name: ProviderName;
  generateWordContent(input: WordGenerationRequest): Promise<GeneratedWordContent>;
}

export interface ProviderConfig {
  provider: ProviderName;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
}

export const DEFAULT_FIELD_CHAR_LIMIT = 240;
export const DEFAULT_TIMEOUT_MS = 15000;
export const DEFAULT_MAX_OUTPUT_TOKENS = 400;
