import type { HeatmapCell } from '../services/analytics_builder';

interface ContributionHeatmapProps {
  readonly cells: HeatmapCell[];
}

function resolve_cell_color(score: number): string {
  if (score === 0) {
    return '#1e293b';
  }
  if (score < 2) {
    return '#3b82f6';
  }
  if (score < 4) {
    return '#2563eb';
  }
  return '#1d4ed8';
}

export function ContributionHeatmap({ cells }: ContributionHeatmapProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 14px)', gap: '4px' }}>
      {cells.map((cell) => (
        <div
          key={cell.date}
          title={`${cell.date}: ${cell.score}`}
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '2px',
            backgroundColor: resolve_cell_color(cell.score),
          }}
        />
      ))}
    </div>
  );
}
