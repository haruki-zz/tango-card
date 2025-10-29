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
});
