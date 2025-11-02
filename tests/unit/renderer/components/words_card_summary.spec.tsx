import { render, screen } from '@testing-library/react';
import { WordsCardSummary } from '../../../../src/renderer_process/components/words_card_summary';

describe('WordsCardSummary', () => {
  it('shows totals and recent word when data is available', () => {
    render(
      <WordsCardSummary
        is_loading={false}
        total_cards={42}
        total_reviews={128}
        recent_word="arigato"
      />,
    );

    expect(screen.getByText('Words Card')).toBeInTheDocument();
    expect(screen.getByText('Total Cards')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/Reviews/i)).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText(/Latest/i)).toBeInTheDocument();
    expect(screen.getByText('arigato')).toBeInTheDocument();
  });

  it('renders loading message while data is being prepared', () => {
    render(
      <WordsCardSummary
        is_loading
        total_cards={0}
        total_reviews={0}
        recent_word={undefined}
      />,
    );

    expect(screen.getByText('Loading cards...')).toBeInTheDocument();
  });
});
