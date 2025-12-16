import type { SupabaseClient } from "@supabase/supabase-js";

import { AI_MODEL_KEYS } from "../constants";
import { supabaseClient } from "./supabaseClient";

const FUNCTION_NAME = "ai-generator";
const DEFAULT_TIMEOUT_MS = 10_000;
const SURFACE_MAX_LENGTH = 64;

export type AiModel = (typeof AI_MODEL_KEYS)[keyof typeof AI_MODEL_KEYS] | string;

export interface AiGenerationParams {
  surface: string;
  model?: AiModel;
  clientId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface AiGeneratedContent {
  reading: string;
  meaningZh: string;
  exampleJa: string;
  model: string;
}

export interface AiEditableDraft {
  reading: string;
  meaningZh: string;
  exampleJa: string;
}

export interface AiGenerationSuccess {
  status: "success";
  data: AiGeneratedContent;
}

export interface AiGenerationFallback {
  status: "fallback";
  reason: string;
  errorCode?: string;
  editableDraft: AiEditableDraft;
  canRetry: boolean;
}

export type AiGenerationResponse = AiGenerationSuccess | AiGenerationFallback;

type FunctionsClient = SupabaseClient["functions"];

type GeneratorPayload =
  | {
      data: AiGeneratedContent;
    }
  | {
      error: {
        code: string;
        message: string;
      };
    };

type InvokeResponse = {
  data: GeneratorPayload | null;
  error: {
    message: string;
    name?: string;
    status?: number;
  } | null;
};

const FRIENDLY_ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMITED: "请求过于频繁，请稍后重试或手动填写",
  MODEL_TIMEOUT: "AI 生成超时，已切换为手动填写，请稍后重试",
  SENSITIVE_CONTENT: "词面包含敏感词，请调整词面或改为手动填写",
  MODEL_PARSE_ERROR: "AI 返回内容异常，请手动填写",
  MODEL_PAYLOAD_EMPTY: "AI 返回内容为空，请手动填写",
  MODEL_PAYLOAD_INCOMPLETE: "AI 返回内容缺少字段，请手动填写",
  MODEL_CONFIG_ERROR: "生成服务配置缺失，暂时请手动填写",
  MODEL_UPSTREAM_ERROR: "上游模型调用失败，请手动填写或稍后重试",
  MODEL_NOT_ALLOWED: "不支持的模型配置，请切换模型或手动填写",
  MODEL_UNAVAILABLE: "模型暂不可用，请改用其他模型或手动填写",
};

const EMPTY_EDITABLE_DRAFT: AiEditableDraft = {
  reading: "",
  meaningZh: "",
  exampleJa: "",
};

const defaultAbortError = () => {
  const error = new Error("aborted");
  error.name = "AbortError";
  return error;
};

const mapErrorToReason = (code?: string, message?: string) => {
  if (code && FRIENDLY_ERROR_MESSAGES[code]) {
    return FRIENDLY_ERROR_MESSAGES[code];
  }

  if (message) {
    return `${message}，请手动填写或稍后重试`;
  }

  return "AI 生成失败，请手动填写或稍后重试";
};

const normalizeSurface = (raw: string): string => {
  const surface = raw.trim();
  if (!surface) {
    throw new Error("词面不能为空");
  }
  if (surface.length > SURFACE_MAX_LENGTH) {
    throw new Error("词面长度超出限制");
  }
  return surface;
};

const buildFallback = (reason: string, errorCode?: string): AiGenerationFallback => ({
  status: "fallback",
  reason,
  errorCode,
  editableDraft: { ...EMPTY_EDITABLE_DRAFT },
  canRetry: true,
});

const extractPayloadError = (payload: GeneratorPayload | null | undefined) =>
  payload && "error" in payload ? payload.error : undefined;

const extractContent = (payload: GeneratorPayload | null | undefined): AiGeneratedContent | null => {
  if (!payload || "error" in payload || !payload.data) {
    return null;
  }

  const { reading, meaningZh, exampleJa, model } = payload.data;

  if (
    typeof reading !== "string" ||
    typeof meaningZh !== "string" ||
    typeof exampleJa !== "string" ||
    typeof model !== "string"
  ) {
    return null;
  }

  if (!reading.trim() || !meaningZh.trim() || !exampleJa.trim() || !model.trim()) {
    return null;
  }

  return {
    reading: reading.trim(),
    meaningZh: meaningZh.trim(),
    exampleJa: exampleJa.trim(),
    model: model.trim(),
  };
};

const runWithTimeout = async <T>(
  runner: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<T> => {
  const controller = new AbortController();
  const onAbort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      throw defaultAbortError();
    }
    externalSignal.addEventListener("abort", onAbort);
  }

  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await runner(controller.signal);
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onAbort);
    }
  }
};

export const createAiGenerator = (functionsClient: FunctionsClient = supabaseClient.functions) => {
  const generate = async (params: AiGenerationParams): Promise<AiGenerationResponse> => {
    const surface = normalizeSurface(params.surface);
    const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const body = params.model ? { surface, model: params.model } : { surface };

    try {
      const { data: payload, error }: InvokeResponse = await runWithTimeout(
        (signal) =>
          functionsClient.invoke<GeneratorPayload>(FUNCTION_NAME, {
            body,
            headers: params.clientId ? { "x-client-id": params.clientId } : undefined,
            signal,
          }),
        timeoutMs,
        params.signal,
      );

      const payloadError = extractPayloadError(payload);
      if (payloadError) {
        return buildFallback(mapErrorToReason(payloadError.code, payloadError.message), payloadError.code);
      }

      if (error) {
        return buildFallback(mapErrorToReason(error.name, error.message), error.name);
      }

      const content = extractContent(payload);
      if (!content) {
        return buildFallback("AI 返回内容缺失，请手动填写", "EMPTY_RESPONSE");
      }

      return { status: "success", data: content };
    } catch (caught) {
      const error = caught as Error;
      if (error.name === "AbortError") {
        return buildFallback(mapErrorToReason("MODEL_TIMEOUT"), "MODEL_TIMEOUT");
      }

      return buildFallback(mapErrorToReason(undefined, error.message), "NETWORK_ERROR");
    }
  };

  return { generate };
};

export const aiGenerator = createAiGenerator();
export const AI_GENERATOR_FUNCTION_NAME = FUNCTION_NAME;
export const AI_GENERATOR_DEFAULT_TIMEOUT_MS = DEFAULT_TIMEOUT_MS;
export const AI_GENERATOR_MANUAL_DRAFT = { ...EMPTY_EDITABLE_DRAFT };
