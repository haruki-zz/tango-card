import { Buffer } from 'node:buffer';
import type { CardEntity } from '../../domain/card/card_entity';
import type { ActivitySnapshot } from '../../domain/analytics/activity_snapshot';
import type { ReviewSessionRecord } from './storage_driver';
import { MemoryLevel } from '../../domain/review/memory_level';
import JSZip from 'jszip';
import { CardRepository } from './card_repository';
import { ReviewSessionRepository } from './review_session_repository';
import { AnalyticsTracker } from '../telemetry/analytics_tracker';

export type BackupFormat = 'json' | 'zip';

export interface CardBackupPayload {
  readonly version: 1;
  readonly exported_at: string;
  readonly cards: CardEntity[];
  readonly review_sessions: ReviewSessionRecord[];
  readonly activity_snapshot: ActivitySnapshot;
}

const BACKUP_VERSION = 1;
const BACKUP_FILENAME = 'backup.json';
const SUPPORTED_LEVELS = new Set<MemoryLevel>(Object.values(MemoryLevel));

export async function collect_backup_snapshot(dependencies: {
  readonly card_repository: CardRepository;
  readonly review_session_repository: ReviewSessionRepository;
  readonly analytics_tracker: AnalyticsTracker;
}): Promise<CardBackupPayload> {
  const [cards, review_sessions, activity_snapshot] = await Promise.all([
    dependencies.card_repository.list_cards(),
    dependencies.review_session_repository.list_sessions(),
    dependencies.analytics_tracker.load_snapshot(),
  ]);

  return {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    cards,
    review_sessions,
    activity_snapshot,
  };
}

export async function apply_backup_payload(
  dependencies: {
    readonly card_repository: CardRepository;
    readonly review_session_repository: ReviewSessionRepository;
    readonly analytics_tracker: AnalyticsTracker;
  },
  payload: CardBackupPayload,
): Promise<void> {
  validate_payload(payload);

  await dependencies.card_repository.replace_cards(payload.cards);
  await dependencies.review_session_repository.replace_sessions(payload.review_sessions);
  await dependencies.analytics_tracker.replace_snapshot(payload.activity_snapshot);
}

export async function serialize_backup_payload(
  payload: CardBackupPayload,
  format: BackupFormat,
): Promise<Buffer> {
  const serialized = JSON.stringify(payload, null, 2);
  if (format === 'json') {
    return Buffer.from(serialized, 'utf-8');
  }

  const zip = new JSZip();
  zip.file(BACKUP_FILENAME, serialized);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function parse_backup_buffer(
  buffer: Buffer,
  format: BackupFormat,
): Promise<CardBackupPayload> {
  if (format === 'json') {
    return parse_backup_json(buffer.toString('utf-8'));
  }
  const archive = await JSZip.loadAsync(buffer);
  const entry = archive.file(BACKUP_FILENAME);
  if (!entry) {
    throw new Error('Backup archive is missing backup.json.');
  }
  const content = await entry.async('string');
  return parse_backup_json(content);
}

export function infer_backup_format(file_name: string | undefined, buffer: Buffer): BackupFormat {
  if (file_name && file_name.toLowerCase().endsWith('.zip')) {
    return 'zip';
  }
  if (file_name && file_name.toLowerCase().endsWith('.json')) {
    return 'json';
  }
  if (buffer.length >= 4) {
    const signature = buffer.subarray(0, 4);
    // ZIP local file header signature: 0x50 0x4b 0x03 0x04
    if (signature[0] === 0x50 && signature[1] === 0x4b && signature[2] === 0x03 && signature[3] === 0x04) {
      return 'zip';
    }
  }
  return 'json';
}

function parse_backup_json(source: string): CardBackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error('Backup file is not valid JSON.');
  }

  if (!is_record(parsed)) {
    throw new Error('Backup file is missing required top-level structure.');
  }

  if (parsed.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${String(parsed.version)}`);
  }

  const payload: CardBackupPayload = {
    version: BACKUP_VERSION,
    exported_at: typeof parsed.exported_at === 'string' ? parsed.exported_at : new Date().toISOString(),
    cards: normalize_cards(parsed.cards),
    review_sessions: normalize_review_sessions(parsed.review_sessions),
    activity_snapshot: normalize_snapshot(parsed.activity_snapshot),
  };

  return payload;
}

function validate_payload(payload: CardBackupPayload): void {
  payload.cards.forEach((card) => validate_card_entity(card));
  payload.review_sessions.forEach((session) => validate_session_record(session));
}

interface RawBackupCard {
  readonly id: string;
  readonly svg_source: string;
  readonly created_at: string;
  readonly memory_level: string;
  readonly review_count: number;
  readonly last_reviewed_at?: string | null;
}

function normalize_cards(subject: unknown): CardEntity[] {
  if (!Array.isArray(subject)) {
    return [];
  }
  const normalized: CardEntity[] = [];
  subject.forEach((candidate) => {
    if (!is_raw_card(candidate)) {
      return;
    }
    const memory_level = cast_memory_level(candidate.memory_level);
    if (!memory_level) {
      return;
    }
    normalized.push({
      id: candidate.id,
      svg_source: candidate.svg_source,
      created_at: candidate.created_at,
      memory_level,
      review_count: candidate.review_count,
      last_reviewed_at:
        typeof candidate.last_reviewed_at === 'string' ? candidate.last_reviewed_at : undefined,
    });
  });
  return normalized;
}

function normalize_review_sessions(subject: unknown): ReviewSessionRecord[] {
  if (!Array.isArray(subject)) {
    return [];
  }
  return subject
    .map((candidate) => (is_review_session(candidate) ? candidate : null))
    .filter((value): value is ReviewSessionRecord => value !== null);
}

function normalize_snapshot(subject: unknown): ActivitySnapshot {
  if (!is_record(subject)) {
    return {
      streak_days: 0,
      total_cards: 0,
      total_reviews: 0,
      points: [],
    };
  }
  const points = Array.isArray(subject.points)
    ? subject.points
        .map((point) => (is_activity_point(point) ? point : null))
        .filter((value): value is ActivitySnapshot['points'][number] => value !== null)
    : [];
  return {
    streak_days: typeof subject.streak_days === 'number' ? subject.streak_days : 0,
    total_cards: typeof subject.total_cards === 'number' ? subject.total_cards : 0,
    total_reviews: typeof subject.total_reviews === 'number' ? subject.total_reviews : 0,
    points,
  };
}

function validate_card_entity(card: CardEntity): void {
  if (!SUPPORTED_LEVELS.has(card.memory_level)) {
    throw new Error(`Unknown memory level: ${card.memory_level}`);
  }
}

function validate_session_record(record: ReviewSessionRecord): void {
  if (!SUPPORTED_LEVELS.has(record.memory_level)) {
    throw new Error(`Unknown memory level: ${record.memory_level}`);
  }
}

function is_raw_card(candidate: unknown): candidate is RawBackupCard {
  if (!is_record(candidate)) {
    return false;
  }
  if (typeof candidate.id !== 'string' || typeof candidate.svg_source !== 'string') {
    return false;
  }
  if (typeof candidate.created_at !== 'string') {
    return false;
  }
  if (typeof candidate.memory_level !== 'string') {
    return false;
  }
  if (typeof candidate.review_count !== 'number') {
    return false;
  }
  if (
    candidate.last_reviewed_at !== undefined &&
    candidate.last_reviewed_at !== null &&
    typeof candidate.last_reviewed_at !== 'string'
  ) {
    return false;
  }
  return true;
}

function cast_memory_level(value: string): MemoryLevel | null {
  const level = value as MemoryLevel;
  return SUPPORTED_LEVELS.has(level) ? level : null;
}

function is_review_session(candidate: unknown): candidate is ReviewSessionRecord {
  if (!is_record(candidate)) {
    return false;
  }
  if (typeof candidate.card_id !== 'string' || typeof candidate.reviewed_at !== 'string') {
    return false;
  }
  if (typeof candidate.memory_level !== 'string') {
    return false;
  }
  return true;
}

function is_activity_point(candidate: unknown): candidate is ActivitySnapshot['points'][number] {
  if (!is_record(candidate)) {
    return false;
  }
  return (
    typeof candidate.date === 'string' &&
    typeof candidate.created_cards === 'number' &&
    typeof candidate.reviewed_cards === 'number'
  );
}

function is_record(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === 'object' && candidate !== null;
}
