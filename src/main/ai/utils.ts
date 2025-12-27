import {
  DEFAULT_FIELD_CHAR_LIMIT,
  GeneratedWordContent,
  WordGenerationRequest,
} from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const normalizeLimit = (limit?: number) => {
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_FIELD_CHAR_LIMIT;
  }
  return Math.floor(limit);
};

const truncate = (value: string, maxChars: number) => {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, maxChars)}...`;
};

const pickString = (raw: unknown, field: string, maxChars: number) => {
  if (typeof raw !== 'string') {
    throw new Error(`字段 ${field} 缺失或不是字符串`);
  }
  const trimmed = raw.trim();
  if (trimmed === '') {
    throw new Error(`字段 ${field} 不能为空`);
  }
  return truncate(trimmed, maxChars);
};

export const buildWordPrompt = (
  word: string,
  maxChars: number = DEFAULT_FIELD_CHAR_LIMIT,
) => {
  const limit = normalizeLimit(maxChars);
  return [
    '你是日语词典助手，请仅返回 JSON 对象，形如 {"hiragana":"","definition_ja":"","example_ja":""}。',
    `目标单词：「${word}」。`,
    `- hiragana 输出平假名读音；`,
    `- definition_ja 提供简洁日文释义（不超过 ${limit} 字符）；`,
    `- example_ja 给出一条自然的日文例句（不超过 ${limit} 字符）；`,
    '- 不要罗马音或英文翻译，不要额外解释。',
  ].join('\n');
};

export const extractJsonObject = (text: string) => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('模型输出缺少 JSON 对象');
  }
  const jsonText = text.slice(start, end + 1);
  return JSON.parse(jsonText) as unknown;
};

export const normalizeGeneratedContent = (
  raw: unknown,
  request: WordGenerationRequest,
): GeneratedWordContent => {
  if (!isRecord(raw)) {
    throw new Error('模型输出不是对象');
  }
  const limit = normalizeLimit(request.maxOutputChars);
  return {
    hiragana: pickString(raw.hiragana, 'hiragana', limit),
    definition_ja: pickString(raw.definition_ja, 'definition_ja', limit),
    example_ja: pickString(raw.example_ja, 'example_ja', limit),
  };
};

export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
};
