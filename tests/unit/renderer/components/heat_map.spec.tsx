import { render, screen } from '@testing-library/react';
import { HeatMap } from '../../../../src/renderer_process/components/heat_map';

const base_point = (date: string, created: number, reviewed: number) => ({
  date,
  created_count: created,
  reviewed_count: reviewed,
});

describe('HeatMap component', () => {
  it('renders fallback message when no activity data', () => {
    render(<HeatMap data={[]} columns={3} rows={2} />);
    expect(
      screen.getByText(/No activity yet\. Create or review cards to see your streak\./i),
    ).toBeInTheDocument();
  });

  it('renders cells with expected colors and titles', () => {
    const data = [
      base_point('2024-01-01', 0, 0),
      base_point('2024-01-02', 1, 0),
      base_point('2024-01-03', 0, 2),
      base_point('2024-01-04', 2, 2),
      base_point('2024-01-05', 0, 3),
      base_point('2024-01-06', 4, 1),
    ];
    render(<HeatMap data={data} columns={3} rows={2} />);
    const cells = screen.getAllByTestId('heat-map-cell');
    expect(cells).toHaveLength(6);

    const last_cell = cells[cells.length - 1];
    expect(last_cell).toHaveAttribute('title', expect.stringContaining('2024-01-06'));
    expect(last_cell).toHaveStyle({ backgroundColor: '#2f9e47' });
  });

  it('keeps the grid visible when activity counts are zero', () => {
    const inactive_days = [
      base_point('2024-02-01', 0, 0),
      base_point('2024-02-02', 0, 0),
      base_point('2024-02-03', 0, 0),
    ];
    render(<HeatMap data={inactive_days} columns={3} rows={1} />);
    expect(screen.getByText(/No activity yet\./i)).toBeInTheDocument();

    const cells = screen.getAllByTestId('heat-map-cell');
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveStyle({ backgroundColor: '#ffffff' });
  });
});
