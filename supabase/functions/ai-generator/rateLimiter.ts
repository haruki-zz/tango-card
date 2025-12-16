// 简单双窗口限流，按 key 在时间窗内计数
export class SlidingWindowRateLimiter {
  private hits: Map<string, number[]> = new Map();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  isAllowed(key: string): boolean {
    const now = this.now();
    const windowStart = now - this.windowMs;
    const entries = this.hits.get(key) ?? [];
    const recent = entries.filter((ts) => ts > windowStart);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }

    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}
