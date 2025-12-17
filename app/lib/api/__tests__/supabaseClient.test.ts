const VALID_URL = "https://example.supabase.co";
const VALID_ANON_KEY = "anon-key";

type SupabaseClientModule = typeof import("../supabaseClient");

const loadClientModule = (): SupabaseClientModule =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("../supabaseClient");

describe("supabaseClient 环境校验", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("在环境变量完整时创建单例客户端", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = VALID_URL;
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = VALID_ANON_KEY;

    const {
      getSupabaseClient,
      loadSupabaseConfig,
      supabaseClient,
    } = loadClientModule();

    expect(loadSupabaseConfig()).toEqual({
      url: VALID_URL,
      anonKey: VALID_ANON_KEY,
    });
    expect(getSupabaseClient()).toBe(supabaseClient);
  });

  it("缺少 URL 时抛出提示", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = VALID_ANON_KEY;

    expect(loadClientModule).toThrow("EXPO_PUBLIC_SUPABASE_URL");
  });

  it("URL 非法时抛出提示", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = "not-a-url";
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = VALID_ANON_KEY;

    expect(loadClientModule).toThrow("EXPO_PUBLIC_SUPABASE_URL");
  });

  it("缺少匿名 Key 时抛出提示", () => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = VALID_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    expect(loadClientModule).toThrow("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  });
});
