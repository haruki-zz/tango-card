import { render, screen } from '@testing-library/react';
import { ContributionHeatmap } from '../../../../src/renderer_process/components/contribution_heatmap';
import type { HeatmapCell } from '../../../../src/renderer_process/services/analytics_builder';

describe('ContributionHeatmap', () => {
  it('renders placeholder activity grid when no data is provided', () => {
    render(<ContributionHeatmap cells={[]} metric="total_activity" />);

    expect(screen.getByText('No recent activity—start a review session!')).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0);
  });

  it('exposes activity cells with accessible labels', () => {
    const cells: HeatmapCell[] = [
      { date: '2024-01-01', created_cards: 1, reviewed_cards: 1 },
      { date: '2024-01-05', created_cards: 2, reviewed_cards: 3 },
    ];

    render(<ContributionHeatmap cells={cells} metric="total_activity" />);

    expect(screen.getByLabelText('2024-01-01: 2 Study activity')).toBeInTheDocument();
    expect(screen.getByLabelText('2024-01-05: 5 Study activity')).toBeInTheDocument();
  });

  it('displays month labels to delineate periods', () => {
    const cells: HeatmapCell[] = [
      { date: '2024-01-29', created_cards: 0, reviewed_cards: 1 },
      { date: '2024-02-02', created_cards: 1, reviewed_cards: 0 },
    ];

    render(<ContributionHeatmap cells={cells} metric="total_activity" />);

    const labels = screen
      .getAllByTestId('month-label')
      .map((node) => node.textContent?.trim())
      .filter((value) => Boolean(value));

    expect(labels.length).toBeGreaterThan(0);
  });
});
