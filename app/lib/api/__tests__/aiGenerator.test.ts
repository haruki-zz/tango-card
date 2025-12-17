import type { SupabaseClient } from "@supabase/supabase-js";

const mockInvoke = jest.fn();

jest.mock("../supabaseClient", () => ({
  supabaseClient: { functions: { invoke: mockInvoke } },
}));

type AiGeneratorModule = typeof import("../aiGenerator");
const {
  AI_GENERATOR_MANUAL_DRAFT,
  createAiGenerator,
}: AiGeneratorModule = require("../aiGenerator");

const buildGenerator = () =>
  createAiGenerator({ invoke: mockInvoke } as unknown as SupabaseClient["functions"]);

describe("aiGenerator 调用与回退", () => {
  beforeEach(() => {
    jest.useRealTimers();
    mockInvoke.mockReset();
  });

  it("返回生成结果并裁剪输入输出", async () => {
    mockInvoke.mockResolvedValue({
      data: {
        data: {
          reading: " よみ ",
          meaningZh: "含义 ",
          exampleJa: "例句",
          model: "gpt-4o",
        },
      },
      error: null,
    });

    const generator = buildGenerator();
    const result = await generator.generate({
      surface: " 学校 ",
      model: "gpt-3.5-turbo",
      clientId: "tester",
    });

    expect(mockInvoke).toHaveBeenCalledWith(
      "ai-generator",
      expect.objectContaining({
        body: { surface: "学校", model: "gpt-3.5-turbo" },
        headers: { "x-client-id": "tester" },
      }),
    );
    expect(result).toEqual({
      status: "success",
      data: {
        reading: "よみ",
        meaningZh: "含义",
        exampleJa: "例句",
        model: "gpt-4o",
      },
    });
  });

  it("超时后回退到手动编辑", async () => {
    jest.useFakeTimers();
    mockInvoke.mockImplementation((_name, options: { signal?: AbortSignal }) => {
      const { signal } = options;
      return new Promise((_, reject) => {
        signal?.addEventListener("abort", () => {
          const error = new Error("aborted");
          error.name = "AbortError";
          reject(error);
        });
      });
    });

    const generator = buildGenerator();
    const promise = generator.generate({ surface: "学校", timeoutMs: 5 });

    jest.advanceTimersByTime(10);
    const result = await promise;

    expect(result.status).toBe("fallback");
    expect(result.reason).toContain("超时");
    expect(result.editableDraft).toEqual(AI_GENERATOR_MANUAL_DRAFT);
  });

  it("边缘错误时返回回退提示", async () => {
    mockInvoke.mockResolvedValue({
      data: { error: { code: "RATE_LIMITED", message: "请求过于频繁" } },
      error: null,
    });

    const generator = buildGenerator();
    const result = await generator.generate({ surface: "学校" });

    expect(result.status).toBe("fallback");
    expect(result.reason).toContain("请求过于频繁");
    expect(result.editableDraft).toEqual(AI_GENERATOR_MANUAL_DRAFT);
    expect(result.canRetry).toBe(true);
  });
});
