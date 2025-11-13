import { create_card, update_card } from '../../../src/domain/card/card_factory';
import { CardEntity, is_card_entity } from '../../../src/domain/card/card_entity';

describe('create_card', () => {
  it('creates a card with defaults', () => {
    const result = create_card({
      word: '学ぶ',
      reading: 'まなぶ',
      context: '朝カフェで新しい単語を学ぶ。',
      scene: 'スケジュールを調整しながらの勉強時間。',
      example: '毎朝30分学ぶ習慣を続けています。',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.word).toBe('学ぶ');
      expect(is_card_entity(result.data)).toBe(true);
      expect(typeof result.data.created_at).toBe('string');
    }
  });

  it('rejects empty fields', () => {
    const result = create_card({
      word: ' ',
      reading: 'まなぶ',
      context: 'context',
      scene: 'scene',
      example: 'example',
    });
    expect(result.ok).toBe(false);
  });

  it('updates existing cards while preserving identity', () => {
    const base_card: CardEntity = {
      id: 'card-1',
       word: '学ぶ',
      reading: 'まなぶ',
      context: '朝カフェで新しい単語を学ぶ。',
      scene: 'スケジュールを調整しながらの勉強時間。',
      example: '毎朝30分学ぶ習慣を続けています。',
      created_at: '2024-01-01T00:00:00.000Z',
      review_count: 0,
      last_reviewed_at: undefined,
    };

    const updated_result = update_card(base_card, {
      word: '挑戦',
      reading: 'ちょうせん',
      context: '新しい案件に取り組む。',
      scene: 'チームで夜遅くまで準備している。',
      example: '難しい課題でも挑戦し続ける。',
    });

    expect(updated_result.ok).toBe(true);
    if (updated_result.ok) {
      expect(updated_result.data.id).toBe(base_card.id);
      expect(updated_result.data.word).toBe('挑戦');
      expect(updated_result.data.created_at).toBe(base_card.created_at);
    }
  });
});
