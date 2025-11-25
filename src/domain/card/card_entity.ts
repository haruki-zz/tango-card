export type Familiarity = 'normal' | 'not_familiar';

export interface CardEntity {
  readonly id: string;
  readonly word: string;
  readonly reading: string;
  readonly context: string;
  readonly scene: string;
  readonly example: string;
  readonly created_at: string;
  readonly review_count: number;
  readonly familiarity: Familiarity;
  readonly last_reviewed_at?: string;
}

export interface CardDraft {
  readonly word: string;
  readonly reading: string;
  readonly context: string;
  readonly scene: string;
  readonly example: string;
  readonly created_at?: string;
  readonly familiarity?: Familiarity;
}

export function is_card_entity(subject: unknown): subject is CardEntity {
  if (typeof subject !== 'object' || subject === null) {
    return false;
  }
  const candidate = subject as Partial<CardEntity>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.word === 'string' &&
    typeof candidate.reading === 'string' &&
    typeof candidate.context === 'string' &&
    typeof candidate.scene === 'string' &&
    typeof candidate.example === 'string' &&
    typeof candidate.created_at === 'string' &&
    typeof candidate.review_count === 'number' &&
    (candidate.familiarity === 'normal' || candidate.familiarity === 'not_familiar')
  );
}
