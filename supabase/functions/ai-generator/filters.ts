// 轻量敏感词过滤，命中后拒绝生成
export class ContentFilter {
  private readonly keywords: string[];

  constructor(keywords: string[]) {
    this.keywords = keywords.map((word) => word.toLowerCase());
  }

  findHit(content: string): string | undefined {
    const lowered = content.toLowerCase();
    return this.keywords.find((word) => lowered.includes(word));
  }
}
