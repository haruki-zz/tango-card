import { ContentFilter } from "./filters.ts";
import { buildDefaultProviders, DEFAULT_MODEL, ModelError, ModelRouter } from "./modelProviders.ts";
import { SlidingWindowRateLimiter } from "./rateLimiter.ts";
import { ErrorPayload, GenerateRequestBody, GenerationResult } from "./types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-id, content-type",
};

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export interface HandlerDeps {
  limiter: SlidingWindowRateLimiter;
  filter: ContentFilter;
  router: ModelRouter;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_SURFACE_MAX_LENGTH = 64;

function withCors(response: Response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

function getClientKey(request: Request): string {
  return (
    request.headers.get("x-client-id") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("cf-connecting-ip") ??
    "anonymous"
  );
}

function parseBody(body: GenerateRequestBody) {
  if (!body || typeof body !== "object") {
    throw new HttpError(400, "INVALID_REQUEST", "请求体必须是 JSON 对象");
  }

  const surface = typeof body.surface === "string" ? body.surface.trim() : "";
  if (!surface) {
    throw new HttpError(400, "INVALID_SURFACE", "surface 不能为空");
  }
  if (surface.length > DEFAULT_SURFACE_MAX_LENGTH) {
    throw new HttpError(400, "INVALID_SURFACE", "surface 长度超出限制");
  }

  const model = typeof body.model === "string" ? body.model : undefined;
  return { surface, model };
}

function handleError(error: unknown): Response {
  if (error instanceof HttpError) {
    return withCors(
      new Response(JSON.stringify({ error: { code: error.code, message: error.message } satisfies ErrorPayload["error"] }), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  if (error instanceof ModelError) {
    return withCors(
      new Response(JSON.stringify({ error: { code: error.code, message: error.message } satisfies ErrorPayload["error"] }), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  return withCors(
    new Response(
      JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "服务暂时不可用，请稍后重试" } satisfies ErrorPayload["error"] }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    ),
  );
}

function ok(result: GenerationResult) {
  return withCors(
    new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

async function readJson(request: Request): Promise<GenerateRequestBody> {
  try {
    return (await request.json()) as GenerateRequestBody;
  } catch (_error) {
    throw new HttpError(400, "INVALID_JSON", "请求体必须是合法 JSON");
  }
}

async function guardTimeout<T>(runner: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await runner(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new HttpError(504, "MODEL_TIMEOUT", "AI 生成超时");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function createHandler(deps: HandlerDeps) {
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return async (request: Request): Promise<Response> => {
    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }));
    }

    if (request.method !== "POST") {
      return handleError(new HttpError(405, "METHOD_NOT_ALLOWED", "仅支持 POST"));
    }

    try {
      const clientKey = getClientKey(request);
      if (!deps.limiter.isAllowed(clientKey)) {
        throw new HttpError(429, "RATE_LIMITED", "请求过于频繁，请稍后再试");
      }

      const body = await readJson(request);
      const { surface, model } = parseBody(body);

      const hit = deps.filter.findHit(surface);
      if (hit) {
        throw new HttpError(400, "SENSITIVE_CONTENT", `词面包含敏感词: ${hit}`);
      }

      const result = await guardTimeout((signal) => deps.router.generate(surface, model, signal), timeoutMs);

      return ok(result);
    } catch (error) {
      return handleError(error);
    }
  };
}

export function buildDefaultHandlerDeps(): HandlerDeps {
  const limiter = new SlidingWindowRateLimiter(10, 60_000);
  const filter = new ContentFilter(["色情", "暴力", "仇恨", "恐怖", "违法", "违禁", "涉政", "porn", "terror"]);
  const router = new ModelRouter(buildDefaultProviders(), DEFAULT_MODEL);

  return { limiter, filter, router, timeoutMs: DEFAULT_TIMEOUT_MS };
}
