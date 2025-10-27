import { CardRepository } from '../../../../src/infrastructure/persistence/card_repository';
import { ReviewSessionRepository } from '../../../../src/infrastructure/persistence/review_session_repository';
import { AnalyticsTracker } from '../../../../src/infrastructure/telemetry/analytics_tracker';
import type { StorageDriver, ReviewSessionRecord } from '../../../../src/infrastructure/persistence/storage_driver';
import type { CardEntity } from '../../../../src/domain/card/card_entity';
import { MemoryLevel } from '../../../../src/domain/review/memory_level';
import type { ActivitySnapshot } from '../../../../src/domain/analytics/activity_snapshot';
import {
  apply_backup_payload,
  collect_backup_snapshot,
  infer_backup_format,
  parse_backup_buffer,
  serialize_backup_payload,
  type CardBackupPayload,
} from '../../../../src/infrastructure/persistence/card_backup_service';

describe('card_backup_service', () => {
  const cards: CardEntity[] = [
    {
      id: 'card-1',
      svg_source: '<svg/>',
      created_at: '2024-03-10T00:00:00.000Z',
      tags: ['tag'],
      memory_level: MemoryLevel.WELL_KNOWN,
      review_count: 1,
      last_reviewed_at: '2024-03-11T00:00:00.000Z',
    },
  ];
  const sessions: ReviewSessionRecord[] = [
    {
      card_id: 'card-1',
      reviewed_at: '2024-03-11T00:00:00.000Z',
      memory_level: MemoryLevel.WELL_KNOWN,
    },
  ];
  const snapshot: ActivitySnapshot = {
    streak_days: 1,
    total_cards: 1,
    total_reviews: 1,
    points: [{ date: '2024-03-11', created_cards: 0, reviewed_cards: 1 }],
  };

  function create_storage_driver(): StorageDriver {
    return {
      read_cards: jest.fn().mockResolvedValue(cards),
      write_cards: jest.fn().mockResolvedValue(undefined),
      read_review_sessions: jest.fn().mockResolvedValue(sessions),
      write_review_sessions: jest.fn().mockResolvedValue(undefined),
      read_activity_snapshot: jest.fn().mockResolvedValue(snapshot),
      write_activity_snapshot: jest.fn().mockResolvedValue(undefined),
    };
  }

  it('collects, serializes, and parses JSON backups', async () => {
    const driver = create_storage_driver();
    const payload = await collect_backup_snapshot({
      card_repository: new CardRepository(driver),
      review_session_repository: new ReviewSessionRepository(driver),
      analytics_tracker: new AnalyticsTracker(driver),
    });
    const buffer = await serialize_backup_payload(payload, 'json');
    const parsed = await parse_backup_buffer(buffer, 'json');

    expect(parsed.cards).toEqual(payload.cards);
    expect(parsed.review_sessions).toEqual(payload.review_sessions);
    expect(parsed.activity_snapshot.total_cards).toBe(payload.activity_snapshot.total_cards);
  });

  it('serializes and parses ZIP backups', async () => {
    const payload: CardBackupPayload = {
      version: 1,
      exported_at: '2024-03-10T00:00:00.000Z',
      cards,
      review_sessions: sessions,
      activity_snapshot: snapshot,
    };
    const buffer = await serialize_backup_payload(payload, 'zip');
    const parsed = await parse_backup_buffer(buffer, 'zip');

    expect(parsed.cards.length).toBe(1);
    expect(parsed.review_sessions.length).toBe(1);
  });

  it('infers backup format from extension and signature', async () => {
    const json_buffer = Buffer.from(JSON.stringify({ version: 1 }), 'utf-8');
    expect(infer_backup_format('data.json', json_buffer)).toBe('json');
    const zip_signature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    expect(infer_backup_format('unknown.bin', zip_signature)).toBe('zip');
  });

  it('applies backup payloads via repositories and tracker', async () => {
    const card_repository = {
      replace_cards: jest.fn().mockResolvedValue(undefined),
    } as unknown as CardRepository;
    const review_session_repository = {
      replace_sessions: jest.fn().mockResolvedValue(undefined),
    } as unknown as ReviewSessionRepository;
    const analytics_tracker = {
      replace_snapshot: jest.fn().mockResolvedValue(undefined),
    } as unknown as AnalyticsTracker;

    await apply_backup_payload(
      { card_repository, review_session_repository, analytics_tracker },
      {
        version: 1,
        exported_at: '2024-03-10T00:00:00.000Z',
        cards,
        review_sessions: sessions,
        activity_snapshot: snapshot,
      },
    );

    expect(card_repository.replace_cards).toHaveBeenCalledWith(cards);
    expect(review_session_repository.replace_sessions).toHaveBeenCalledWith(sessions);
    expect(analytics_tracker.replace_snapshot).toHaveBeenCalled();
  });
});
