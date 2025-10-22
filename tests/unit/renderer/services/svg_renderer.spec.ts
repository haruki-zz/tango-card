import { prepare_svg_markup } from '../../../../src/renderer_process/services/svg_renderer';

describe('prepare_svg_markup', () => {
  it('applies container width and height to svg markup', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>';
    const prepared = prepare_svg_markup(svg, { container_width: 320, container_height: 180 });
    expect(prepared).toContain('width="320"');
    expect(prepared).toContain('height="180"');
  });

  it('returns empty string for invalid svg', () => {
    const prepared = prepare_svg_markup('<svg>', { container_width: 100, container_height: 100 });
    expect(prepared).toBe('');
  });
});
