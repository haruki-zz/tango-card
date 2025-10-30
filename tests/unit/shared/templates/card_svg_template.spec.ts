import { render_card_svg } from '@shared/templates/card_svg_template';

describe('render_card_svg', () => {
  it('wraps long context and example text within fixed area', () => {
    const svg = render_card_svg({
      word: '勉強',
      reading: 'べんきょう',
      context: '考试前的整个周末都安排在图书馆学习，准备即将到来的重要模拟考试。',
      scene: '为了保持专注，我提前整理好参考书籍和笔记。',
      example: '明日は一日中図書館で勉強します。友達と一緒に過去問を解きながら、分からないところを教え合う予定です。',
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('<tspan');
    expect((svg.match(/<tspan/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(svg).toContain('>Context<');
    expect(svg).toContain('>Scene<');
    expect(svg).toContain('>Example<');
  });

  it('wraps continuous CJK example text without spaces', () => {
    const long_example = '語'.repeat(80);
    const svg = render_card_svg({
      word: '語彙',
      reading: 'ごい',
      context: '長文の練習をしています。',
      scene: '授業の前に準備を整えています。',
      example: long_example,
    });

    const section_bodies = Array.from(svg.matchAll(/<text class="section-body"[^>]*>(.*?)<\/text>/g));
    expect(section_bodies.length).toBeGreaterThanOrEqual(3);

    const example_body = section_bodies[2][1];
    const example_tspans = Array.from(example_body.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g));

    expect(example_tspans.length).toBeGreaterThan(1);
    const concatenated_example = example_tspans.map((match) => match[1]).join('');
    expect(concatenated_example).toBe(long_example);
    example_tspans.forEach((match) => {
      expect(match[1].length).toBeLessThan(long_example.length);
    });
  });

  it('omits memory level label and applies Yu Mincho font', () => {
    const svg = render_card_svg({
      word: '記憶',
      reading: 'きおく',
      context: '復習計画を整えています。',
      scene: '勉強時間をスケジュールに組み込みました。',
      example: '毎日少しずつ繰り返して覚えます。',
      memory_level: 'WELL_KNOWN',
    });

    expect(svg).not.toContain('memory-label');
    expect(svg).toContain('font-family: "游明朝", "Yu Mincho", "YuMincho", serif;');

    const title_matches = Array.from(svg.matchAll(/<text class="section-title"[^>]*style="font-size:(\d+)px"[^>]*>([^<]+)<\/text>/g));
    const body_matches = Array.from(svg.matchAll(/<text class="section-body"[^>]*style="font-size:(\d+)px"[^>]*>/g));

    expect(title_matches.length).toBeGreaterThanOrEqual(3);
    expect(body_matches.length).toBeGreaterThanOrEqual(3);

    title_matches.forEach((match, index) => {
      const title_size = Number(match[1]);
      const body_size = Number(body_matches[index][1]);
      expect(title_size).toBeGreaterThan(body_size);
    });
  });
});
