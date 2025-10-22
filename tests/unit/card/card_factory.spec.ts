import { create_card } from '../../../src/domain/card/card_factory';
import { is_card_entity } from '../../../src/domain/card/card_entity';
import { MemoryLevel } from '../../../src/domain/review/memory_level';

describe('create_card', () => {
  it('creates a card with defaults', () => {
    const result = create_card({ svg_source: '<svg></svg>' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.memory_level).toBe(MemoryLevel.SOMEWHAT_FAMILIAR);
      expect(result.data.svg_source).toContain('<svg');
      expect(is_card_entity(result.data)).toBe(true);
      expect(result.data.tags).toEqual([]);
      expect(typeof result.data.created_at).toBe('string');
    }
  });

  it('rejects empty svg markup', () => {
    const result = create_card({ svg_source: '   ' });
    expect(result.ok).toBe(false);
  });

  it('deduplicates and trims tags', () => {
    const result = create_card({
      svg_source: '<svg></svg>',
      tags: ['  N5 ', '动词', 'N5', ''],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.tags).toEqual(['N5', '动词']);
    }
  });
});
