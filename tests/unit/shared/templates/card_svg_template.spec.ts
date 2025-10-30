import { render_card_svg } from '@shared/templates/card_svg_template';

describe('render_card_svg', () => {
  it('wraps long context and example text within fixed area', () => {
    const svg = render_card_svg({
      word: '勉強',
      reading: 'べんきょう',
      context: '考试前的整个周末都安排在图书馆学习，准备即将到来的重要模拟考试。',
      example: '明日は一日中図書館で勉強します。友達と一緒に過去問を解きながら、分からないところを教え合う予定です。',
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('<tspan');
    expect((svg.match(/<tspan/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('wraps continuous CJK example text without spaces', () => {
    const long_example = '語'.repeat(80);
    const svg = render_card_svg({
      word: '語彙',
      reading: 'ごい',
      context: '長文の練習をしています。',
      example: long_example,
    });

    const section_bodies = Array.from(svg.matchAll(/<text class="section-body"[^>]*>(.*?)<\/text>/g));
    expect(section_bodies.length).toBeGreaterThanOrEqual(2);

    const example_body = section_bodies[1][1];
    const example_tspans = Array.from(example_body.matchAll(/<tspan[^>]*>(.*?)<\/tspan>/g));

    expect(example_tspans.length).toBeGreaterThan(1);
    const concatenated_example = example_tspans.map((match) => match[1]).join('');
    expect(concatenated_example).toBe(long_example);
    example_tspans.forEach((match) => {
      expect(match[1].length).toBeLessThan(long_example.length);
    });
  });
});
