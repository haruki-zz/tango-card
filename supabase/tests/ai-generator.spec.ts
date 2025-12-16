import { assertEquals, assertMatch } from "jsr:@std/assert@0.224.0";
import { ContentFilter } from "../functions/ai-generator/filters.ts";
import { createHandler } from "../functions/ai-generator/handler.ts";
import { ModelRouter } from "../functions/ai-generator/modelProviders.ts";
import { SlidingWindowRateLimiter } from "../functions/ai-generator/rateLimiter.ts";
import { GenerationResult, ModelProvider, SupportedModel } from "../functions/ai-generator/types.ts";

const successProvider: ModelProvider = async ({ surface, model }) => ({
  reading: "よみ",
  meaningZh: "含义",
  exampleJa: `例句 ${surface}`,
  model,
});

const slowProvider: ModelProvider = ({ signal, model }) =>
  new Promise((_, reject) => {
    signal.addEventListener("abort", () => reject(new Error("aborted")));
  }).then(
    () =>
      ({
        reading: "よみ",
        meaningZh: "含义",
        exampleJa: "例句",
        model,
      }) as GenerationResult,
  );

function makeHandler(provider: ModelProvider, options?: { limit?: number; filter?: ContentFilter; timeoutMs?: number }) {
  const providers: Record<SupportedModel, ModelProvider> = {
    "gpt-4o": provider,
    "gpt-3.5-turbo": provider,
    "gemini-2.5-flash-lite": provider,
  };

  return createHandler({
    limiter: new SlidingWindowRateLimiter(options?.limit ?? 5, 10_000),
    filter: options?.filter ?? new ContentFilter([]),
    router: new ModelRouter(providers),
    timeoutMs: options?.timeoutMs ?? 1000,
  });
}

function buildRequest(body: Record<string, unknown>, headers?: HeadersInit) {
  return new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: JSON.stringify(body),
  });
}

Deno.test("returns generated payload with cors headers", async () => {
  const handler = makeHandler(successProvider);
  const response = await handler(buildRequest({ surface: "学校" }));
  const payload = (await response.json()) as { data: GenerationResult };

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("access-control-allow-origin"), "*");
  assertEquals(payload.data.model, "gpt-4o");
  assertEquals(payload.data.exampleJa, "例句 学校");
});

Deno.test("rejects sensitive surface", async () => {
  const handler = makeHandler(successProvider, { filter: new ContentFilter(["敏感"]) });
  const response = await handler(buildRequest({ surface: "这是敏感词" }));
  const payload = (await response.json()) as { error: { code: string; message: string } };

  assertEquals(response.status, 400);
  assertEquals(payload.error.code, "SENSITIVE_CONTENT");
  assertMatch(payload.error.message, /敏感/);
});

Deno.test("enforces rate limit per client", async () => {
  const handler = makeHandler(successProvider, { limit: 1 });
  const headers = { "x-client-id": "tester" };

  const first = await handler(buildRequest({ surface: "学校" }, headers));
  assertEquals(first.status, 200);

  const second = await handler(buildRequest({ surface: "学校" }, headers));
  const payload = (await second.json()) as { error: { code: string } };
  assertEquals(second.status, 429);
  assertEquals(payload.error.code, "RATE_LIMITED");
});

Deno.test("aborts slow model and returns timeout error", async () => {
  const handler = makeHandler(slowProvider, { timeoutMs: 10 });
  const response = await handler(buildRequest({ surface: "学校" }));
  const payload = (await response.json()) as { error: { code: string } };

  assertEquals(response.status, 504);
  assertEquals(payload.error.code, "MODEL_TIMEOUT");
});
