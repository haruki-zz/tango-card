import { describe, expect, it } from 'vitest';
import { createWord } from '../src/main/db/wordService';
import { initializeDatabase } from '../src/main/db/database';
import { schema } from '../src/main/db/schema';
import { eq } from 'drizzle-orm';

describe('wordService.createWord', () => {
  it('保存单词并写入每日新增统计', async () => {
    const database = initializeDatabase(':memory:');
    const saved = await createWord(database.db, {
      term: '寿司',
      pronunciation: 'すし',
      definition_cn: '以醋饭和鱼类为主的日式料理。',
      examples: [
        {
          sentence_jp: '週末に友だちと寿司を食べました。',
          sentence_cn: '周末和朋友一起吃了寿司。'
        }
      ],
      tags: []
    });

    const [row] = await database.db
      .select()
      .from(schema.words)
      .where(eq(schema.words.id, saved.id));
    const [activity] = await database.db.select().from(schema.dailyActivity);

    expect(row?.term).toBe('寿司');
    expect(row?.srsLevel).toBe(0);
    expect(row?.easeFactor).toBe(2.5);
    expect(activity?.wordsAddedCount).toBe(1);
    expect(activity?.reviewsDoneCount).toBe(0);
  });

  it('缺少必填字段时抛出错误', async () => {
    const database = initializeDatabase(':memory:');
    await expect(
      createWord(database.db, {
        term: '',
        pronunciation: '',
        definition_cn: '',
        examples: [],
        tags: []
      })
    ).rejects.toThrow('单词、读音、释义与至少一条例句不能为空。');
  });
});
