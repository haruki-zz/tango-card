import { create_card } from '../../../src/domain/card/card_factory';
import { MemoryLevel } from '../../../src/domain/review/memory_level';

describe('create_card', () => {
  it('creates a card with defaults', () => {
    const result = create_card({ svg_source: '<svg></svg>' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.memory_level).toBe(MemoryLevel.SOMEWHAT_FAMILIAR);
      expect(result.data.svg_source).toContain('<svg');
    }
  });

  it('rejects empty svg markup', () => {
    const result = create_card({ svg_source: '   ' });
    expect(result.ok).toBe(false);
  });
});
