import { buildWordEntry, WordEntry, WordEntryDraft } from "../types";
import { DatabaseConnection } from "./database";
import { mapWordRowToEntry, WordRow } from "./mappers";

const insertWordSql = `
INSERT INTO word_entries (
  id,
  surface,
  reading,
  meaning_zh,
  example_ja,
  familiarity,
  review_count,
  last_reviewed_at,
  created_at,
  updated_at,
  ai_model,
  ai_prompt_hash
) VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, ?), ?, ?, ?, ?);
`;

const updateWordSql = `
UPDATE word_entries SET
  surface = ?,
  reading = ?,
  meaning_zh = ?,
  example_ja = ?,
  familiarity = ?,
  review_count = ?,
  last_reviewed_at = ?,
  created_at = ?,
  updated_at = ?,
  ai_model = ?,
  ai_prompt_hash = ?
WHERE id = ?;
`;

export const insertWord = async (
  db: DatabaseConnection,
  draft: WordEntryDraft,
  timestamp = new Date().toISOString(),
): Promise<WordEntry> => {
  const entry = buildWordEntry(draft, timestamp);

  await db.runAsync(insertWordSql, [
    entry.id,
    entry.surface,
    entry.reading,
    entry.meaningZh,
    entry.exampleJa,
    entry.familiarity,
    entry.reviewCount,
    entry.lastReviewedAt,
    entry.createdAt,
    entry.createdAt,
    entry.updatedAt,
    entry.aiMeta?.model ?? null,
    entry.aiMeta?.promptHash ?? null,
  ]);

  return entry;
};

export const updateWord = async (
  db: DatabaseConnection,
  draft: WordEntryDraft,
  timestamp = new Date().toISOString(),
): Promise<WordEntry> => {
  const existing = await getWordById(db, draft.id);
  if (!existing) {
    throw new Error("尝试更新的单词不存在");
  }

  const entry = buildWordEntry(
    {
      ...existing,
      ...draft,
      createdAt: existing.createdAt,
      updatedAt: draft.updatedAt ?? timestamp,
      lastReviewedAt: draft.lastReviewedAt ?? existing.lastReviewedAt,
      reviewCount: draft.reviewCount ?? existing.reviewCount,
      familiarity: draft.familiarity ?? existing.familiarity,
      aiMeta: draft.aiMeta ?? existing.aiMeta,
    },
    existing.createdAt,
  );

  await db.runAsync(updateWordSql, [
    entry.surface,
    entry.reading,
    entry.meaningZh,
    entry.exampleJa,
    entry.familiarity,
    entry.reviewCount,
    entry.lastReviewedAt,
    entry.createdAt,
    entry.updatedAt,
    entry.aiMeta?.model ?? null,
    entry.aiMeta?.promptHash ?? null,
    entry.id,
  ]);

  return entry;
};

export const getWordById = async (
  db: DatabaseConnection,
  id?: string,
): Promise<WordEntry | null> => {
  if (!id) {
    return null;
  }

  const row = await db.getFirstAsync<WordRow>("SELECT * FROM word_entries WHERE id = ?;", id);
  return row ? mapWordRowToEntry(row) : null;
};

export const listWords = async (db: DatabaseConnection): Promise<WordEntry[]> => {
  const rows = await db.getAllAsync<WordRow>("SELECT * FROM word_entries ORDER BY created_at DESC;");
  return rows.map(mapWordRowToEntry);
};

export const deleteWordById = async (
  db: DatabaseConnection,
  id: string,
): Promise<boolean> => {
  const result = await db.runAsync("DELETE FROM word_entries WHERE id = ?;", id);
  return result.changes > 0;
};
