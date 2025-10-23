import { render, screen } from '@testing-library/react';
import { MemoryLevelBadge } from '../../../../src/renderer_process/components/memory_level_badge';
import { MemoryLevel } from '../../../../src/domain/review/memory_level';
import { MEMORY_LEVEL_OPTIONS } from '../../../../src/shared/constants/memory_levels';

describe('MemoryLevelBadge', () => {
  it('renders the configured label for the provided memory level', () => {
    const target_option = MEMORY_LEVEL_OPTIONS.find(
      (option) => option.level === MemoryLevel.SOMEWHAT_FAMILIAR,
    );
    expect(target_option).toBeDefined();

    render(<MemoryLevelBadge level={MemoryLevel.SOMEWHAT_FAMILIAR} />);

    if (target_option) {
      expect(screen.getByText(target_option.label)).toBeInTheDocument();
    }
  });
});
