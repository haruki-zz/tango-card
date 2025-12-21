import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ReviewWordCard } from '../src/renderer/features/review/ReviewWordCard';
import type { WordCard } from '../src/shared/apiTypes';

const SAMPLE_CARD: WordCard = {
  id: 42,
  term: '桜',
  pronunciation: 'さくら',
  definition_cn: '春天盛开的樱花。',
  examples: [
    {
      sentence_jp: '春になると桜が咲きます。',
      sentence_cn: '一到春天樱花就会盛开。'
    },
    {
      sentence_jp: '公園で桜の下でお弁当を食べました。',
      sentence_cn: '在公园的樱花树下吃了便当。'
    }
  ],
  tags: [],
  created_at: 1_700_000_000,
  updated_at: 1_700_000_000,
  srs_level: 0,
  srs_repetitions: 0,
  srs_interval: 0,
  ease_factor: 2.5,
  last_reviewed_at: null,
  due_at: null
};

afterEach(() => {
  cleanup();
});

describe('ReviewWordCard', () => {
  it('点击翻转后展示释义与例句', async () => {
    const user = userEvent.setup();
    render(<ReviewWordCard card={SAMPLE_CARD} />);

    const card = screen.getByRole('button', { name: /翻转卡片/ });
    const front = screen.getByTestId('card-front');
    const back = screen.getByTestId('card-back');

    expect(card).toHaveAttribute('aria-pressed', 'false');
    expect(front).toHaveAttribute('aria-hidden', 'false');
    expect(back).toHaveAttribute('aria-hidden', 'true');

    await user.click(card);

    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(front).toHaveAttribute('aria-hidden', 'true');
    expect(back).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText(SAMPLE_CARD.definition_cn)).toBeInTheDocument();
    expect(screen.getByText(SAMPLE_CARD.examples[0].sentence_jp)).toBeInTheDocument();
  });

  it('空格键可在正反面切换', async () => {
    const user = userEvent.setup();
    render(<ReviewWordCard card={SAMPLE_CARD} />);

    const card = screen.getByRole('button', { name: /翻转卡片/ });
    card.focus();

    await user.keyboard('{Space}');
    expect(card).toHaveAttribute('aria-pressed', 'true');

    await user.keyboard('{Space}');
    expect(card).toHaveAttribute('aria-pressed', 'false');
  });
});
