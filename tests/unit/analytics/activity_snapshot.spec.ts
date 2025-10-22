import { EMPTY_ACTIVITY_SNAPSHOT } from '../../../src/domain/analytics/activity_snapshot';

describe('EMPTY_ACTIVITY_SNAPSHOT', () => {
  it('provides zeroed metrics', () => {
    expect(EMPTY_ACTIVITY_SNAPSHOT.total_cards).toBe(0);
    expect(EMPTY_ACTIVITY_SNAPSHOT.total_reviews).toBe(0);
    expect(Array.isArray(EMPTY_ACTIVITY_SNAPSHOT.points)).toBe(true);
  });
});
