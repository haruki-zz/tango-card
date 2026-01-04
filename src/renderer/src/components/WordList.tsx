import type { WordEntry } from '@shared/types';

type WordListProps = {
  words: WordEntry[];
  loading?: boolean;
};

const formatDay = (value: string) => value.slice(0, 10);

const WordList = ({ words, loading = false }: WordListProps) => {
  const ordered = [...words].sort(
    (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
  );

  return (
    <div className="surface-card" data-testid="word-list">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="pill">词库</span>
          <p className="text-sm font-semibold text-ink">最近新增</p>
        </div>
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
          {loading ? '加载中' : `${ordered.length} entries`}
        </span>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted">正在加载列表…</p>
      ) : ordered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">还没有词条，先添加一个吧。</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {ordered.map((word) => (
            <li
              key={word.id}
              className="rounded-xl border border-border bg-panel px-4 py-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold text-ink">{word.word}</p>
                  <p className="text-sm font-medium text-accent-700">
                    {word.hiragana}
                  </p>
                </div>
                <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.08em] text-ink">
                  {formatDay(word.created_at)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {word.definition_ja}
              </p>
              <p className="mt-1 text-sm text-ink">
                例句：<span className="italic">{word.example_ja}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WordList;
