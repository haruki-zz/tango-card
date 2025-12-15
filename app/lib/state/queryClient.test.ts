import { createQueryClient, getDefaultQueryOptions } from "./queryClient";

describe("query client config", () => {
  it("builds a client with safe defaults", () => {
    const client = createQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.queries?.retry).toBe(1);
    expect(defaults.queries?.staleTime).toBe(30_000);
    expect(defaults.queries?.gcTime).toBe(1000 * 60 * 5);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(false);
    expect(defaults.mutations?.retry).toBe(1);

    client.clear();
  });

  it("allows overrides without mutating defaults", () => {
    const client = createQueryClient({ queries: { retry: 0 } });
    expect(client.getDefaultOptions().queries?.retry).toBe(0);

    const defaults = getDefaultQueryOptions();
    expect(defaults.queries?.retry).toBe(1);

    client.clear();
  });
});
