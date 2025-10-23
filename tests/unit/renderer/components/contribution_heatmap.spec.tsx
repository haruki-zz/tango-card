import { render, screen } from '@testing-library/react';
import { ContributionHeatmap } from '../../../../src/renderer_process/components/contribution_heatmap';
import type { HeatmapCell } from '../../../../src/renderer_process/services/analytics_builder';

describe('ContributionHeatmap', () => {
  it('renders placeholder activity grid when no data is provided', () => {
    render(<ContributionHeatmap cells={[]} />);

    expect(screen.getByText('最近暂无学习记录，开始一轮复习吧！')).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(0);
  });

  it('exposes activity cells with accessible labels', () => {
    const cells: HeatmapCell[] = [
      { date: '2024-01-01', score: 2 },
      { date: '2024-01-05', score: 5 },
    ];

    render(<ContributionHeatmap cells={cells} />);

    expect(screen.getByLabelText('2024-01-01：2 次学习活动')).toBeInTheDocument();
    expect(screen.getByLabelText('2024-01-05：5 次学习活动')).toBeInTheDocument();
  });

  it('displays month labels to delineate periods', () => {
    const cells: HeatmapCell[] = [
      { date: '2024-01-29', score: 1 },
      { date: '2024-02-02', score: 1 },
    ];

    render(<ContributionHeatmap cells={cells} />);

    const labels = screen
      .getAllByTestId('month-label')
      .map((node) => node.textContent?.trim())
      .filter((value) => Boolean(value));

    expect(labels.length).toBeGreaterThan(0);
  });
});
