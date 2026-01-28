import type {
  AiProvider,
  GeneratedWordContent,
  WordGenerationRequest,
} from './types';
import { normalizeGeneratedContent } from './utils';

const DEFAULT_RESPONSE: GeneratedWordContent = {
  hiragana: 'てすと',
  definition_ja: '試験',
  example_ja: '図書館で静かにテストを受けた。',
};

export class MockAiProvider implements AiProvider {
  readonly name = 'mock';
  private readonly response: GeneratedWordContent;

  constructor(response: GeneratedWordContent = DEFAULT_RESPONSE) {
    this.response = response;
  }

  generateWordContent(
    input: WordGenerationRequest,
  ): Promise<GeneratedWordContent> {
    return Promise.resolve(normalizeGeneratedContent(this.response, input));
  }
}
