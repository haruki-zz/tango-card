import type { StorageDriver } from '../persistence/storage_driver';
import type { ActivitySnapshot } from '../../domain/analytics/activity_snapshot';
import { EMPTY_ACTIVITY_SNAPSHOT } from '../../domain/analytics/activity_snapshot';
import { get_start_of_day } from '../../shared/utils/date_utils';

export class AnalyticsTracker {
  private readonly storage_driver: StorageDriver;

  constructor(storage_driver: StorageDriver) {
    this.storage_driver = storage_driver;
  }

  async record_card_created(timestamp = new Date()): Promise<void> {
    await this.update_snapshot((snapshot) => {
      const points = this.bump_point_value(snapshot.points, timestamp, 'created_cards');
      return {
        ...snapshot,
        total_cards: snapshot.total_cards + 1,
        points,
      };
    });
  }

  async record_card_reviewed(timestamp = new Date()): Promise<void> {
    await this.update_snapshot((snapshot) => {
      const points = this.bump_point_value(snapshot.points, timestamp, 'reviewed_cards');
      return {
        ...snapshot,
        total_reviews: snapshot.total_reviews + 1,
        points,
      };
    });
  }

  async load_snapshot(): Promise<ActivitySnapshot> {
    return this.storage_driver.read_activity_snapshot();
  }

  async replace_snapshot(snapshot: ActivitySnapshot): Promise<void> {
    const normalized: ActivitySnapshot = {
      ...snapshot,
      streak_days: this.calculate_streak(snapshot.points),
    };
    await this.storage_driver.write_activity_snapshot(normalized);
  }

  private async update_snapshot(
    mutator: (snapshot: ActivitySnapshot) => ActivitySnapshot,
  ): Promise<void> {
    const snapshot = await this.storage_driver.read_activity_snapshot();
    const base_snapshot = snapshot ?? EMPTY_ACTIVITY_SNAPSHOT;
    const mutated = mutator(base_snapshot);
    const streak_days = this.calculate_streak(mutated.points);
    const next_snapshot: ActivitySnapshot = {
      ...mutated,
      streak_days,
    };
    await this.storage_driver.write_activity_snapshot(next_snapshot);
  }

  private bump_point_value(
    points: ActivitySnapshot['points'],
    timestamp: Date,
    field: 'created_cards' | 'reviewed_cards',
  ): ActivitySnapshot['points'] {
    const day_key = get_start_of_day(timestamp).toISOString();
    const existing = points.find((point) => point.date === day_key);
    if (existing) {
      return points.map((point) =>
        point.date === day_key
          ? {
              ...point,
              [field]: point[field] + 1,
            }
          : point,
      );
    }

    return [
      ...points,
      {
        date: day_key,
        created_cards: field === 'created_cards' ? 1 : 0,
        reviewed_cards: field === 'reviewed_cards' ? 1 : 0,
      },
    ];
  }

  private calculate_streak(points: ActivitySnapshot['points']): number {
    const today_key = get_start_of_day().toISOString();
    const sorted_points = [...points].sort(
      (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
    let streak = 0;
    let cursor_key = today_key;

    for (const point of sorted_points) {
      if (point.date !== cursor_key) {
        const previous_day = new Date(cursor_key);
        previous_day.setUTCDate(previous_day.getUTCDate() - 1);
        cursor_key = get_start_of_day(previous_day).toISOString();
        if (point.date !== cursor_key) {
          break;
        }
      }
      if (point.created_cards > 0 || point.reviewed_cards > 0) {
        streak += 1;
        const previous_day = new Date(cursor_key);
        previous_day.setUTCDate(previous_day.getUTCDate() - 1);
        cursor_key = get_start_of_day(previous_day).toISOString();
      } else {
        break;
      }
    }

    return streak;
  }
}
