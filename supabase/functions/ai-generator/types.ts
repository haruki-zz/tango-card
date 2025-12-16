export type SupportedModel = "gpt-4o" | "gpt-3.5-turbo" | "gemini-2.5-flash-lite";

export interface GenerateRequestBody {
  surface?: unknown;
  model?: unknown;
}

export interface GenerationResult {
  reading: string;
  meaningZh: string;
  exampleJa: string;
  model: SupportedModel;
}

export interface ModelCallParams {
  surface: string;
  model: SupportedModel;
  signal: AbortSignal;
}

export type ModelProvider = (params: ModelCallParams) => Promise<GenerationResult>;

export interface ErrorPayload {
  error: {
    code: string;
    message: string;
  };
}
