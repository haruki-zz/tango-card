import { type FormEvent, useMemo, useState } from 'react';

import { useAppStore } from '../store/useAppStore';

type FormStatus = 'idle' | 'generating' | 'saving';

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return '发生未知错误，请重试';
};

const AddWordForm = () => {
  const activity = useAppStore((state) => state.activity);
  const generateWordContent = useAppStore((state) => state.generateWordContent);
  const addWord = useAppStore((state) => state.addWord);
  const loadWords = useAppStore((state) => state.loadWords);
  const refreshActivity = useAppStore((state) => state.refreshActivity);

  const [wordInput, setWordInput] = useState('');
  const [hiragana, setHiragana] = useState('');
  const [definition, setDefinition] = useState('');
  const [example, setExample] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const todaySummary = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const summary = activity[todayKey] ?? { added: 0, sessions: 0 };
    return {
      label: todayKey,
      ...summary,
    };
  }, [activity]);

  const isGenerating = status === 'generating';
  const isSaving = status === 'saving';
  const isBusy = isGenerating || isSaving;

  const handleGenerate = async () => {
    const trimmedWord = wordInput.trim();
    if (!trimmedWord) {
      setError('请输入需要生成的单词');
      setMessage('');
      return;
    }

    setStatus('generating');
    setError('');
    setMessage('');
    try {
      const generated = await generateWordContent({
        word: trimmedWord,
        maxOutputChars: 280,
      });
      setHiragana(generated.hiragana);
      setDefinition(generated.definition_ja);
      setExample(generated.example_ja);
    } catch (err) {
      setError(`生成失败：${getErrorMessage(err)}`);
    } finally {
      setStatus('idle');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedWord = wordInput.trim();
    const trimmedHiragana = hiragana.trim();
    const trimmedDefinition = definition.trim();
    const trimmedExample = example.trim();

    if (
      !trimmedWord ||
      !trimmedHiragana ||
      !trimmedDefinition ||
      !trimmedExample
    ) {
      setError('请补全单词、读音、释义与例句后再保存');
      setMessage('');
      return;
    }

    setStatus('saving');
    setError('');
    setMessage('');

    try {
      await addWord({
        id: crypto.randomUUID(),
        word: trimmedWord,
        hiragana: trimmedHiragana,
        definition_ja: trimmedDefinition,
        example_ja: trimmedExample,
        created_at: new Date().toISOString(),
      });
      await loadWords();
      await refreshActivity();
      setMessage('已保存到词库');
      setWordInput('');
      setHiragana('');
      setDefinition('');
      setExample('');
    } catch (err) {
      setError(`保存失败：${getErrorMessage(err)}`);
    } finally {
      setStatus('idle');
    }
  };

  return (
    <form
      className="surface-card"
      onSubmit={handleSubmit}
      aria-label="新增单词"
    >
      <div className="flex flex-col gap-4 border-b border-dashed border-accent-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <span className="pill w-fit">新增</span>
          <h2 className="text-xl font-semibold text-ink">生成并保存单词</h2>
          <p className="text-sm text-muted">
            输入日语单词，AI 生成读音、释义与例句后可手动修订再保存。
          </p>
        </div>
        <div className="w-full rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-sm text-ink shadow-inner lg:w-auto lg:text-right">
          <div className="font-semibold">今日 {todaySummary.label}</div>
          <div className="mt-1 flex items-center justify-between gap-2 text-muted lg:justify-end">
            <span>新增 {todaySummary.added}</span>
            <span className="text-muted">·</span>
            <span>复习 {todaySummary.sessions}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">单词</span>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <input
                id="word"
                aria-label="单词"
                className="field-input"
                placeholder="単語を入力…"
                value={wordInput}
                onChange={(event) => setWordInput(event.target.value)}
                disabled={isBusy}
              />
              <button
                type="button"
                className="btn btn-ghost border-dashed border-accent-200"
                onClick={handleGenerate}
                disabled={isBusy}
              >
                {isGenerating ? '生成中…' : '生成'}
              </button>
            </div>
            <p className="text-xs text-muted">
              生成后可手动修订，留空会提示补全。
            </p>
          </div>
        </label>

        <div className="rounded-2xl border border-dashed border-accent-100 bg-white/80 p-4 shadow-inner">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="pill">生成結果</span>
              <span className="rounded-full border border-accent-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Noto Serif JP
              </span>
            </div>
            <span className="text-xs font-medium text-muted">
              {isBusy ? '処理中…' : '編集可'}
            </span>
          </div>

          <div className="mt-3 space-y-3 font-serif text-[15px] leading-relaxed text-ink">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                かな
              </span>
              <input
                aria-label="读音"
                className="field-input bg-white/90 font-serif"
                placeholder="生成后可在此调整"
                value={hiragana}
                onChange={(event) => setHiragana(event.target.value)}
                disabled={isBusy}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                意味
              </span>
              <textarea
                aria-label="释义"
                className="field-textarea h-24 bg-white/90 font-serif"
                placeholder="简要说明含义与语境"
                value={definition}
                onChange={(event) => setDefinition(event.target.value)}
                disabled={isBusy}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                例文
              </span>
              <textarea
                aria-label="例句"
                className="field-textarea h-24 bg-white/90 font-serif"
                placeholder="生成后可自由修改"
                value={example}
                onChange={(event) => setExample(event.target.value)}
                disabled={isBusy}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3" aria-live="polite">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="btn btn-primary border-dashed border-accent-600"
            disabled={isBusy}
          >
            {isSaving ? '保存中…' : '保存到词库'}
          </button>
          <span className="text-sm text-muted">
            状态：{isBusy ? '処理中' : '待機中'}
          </span>
        </div>
        {message ? (
          <div
            className="rounded-xl border border-accent-200 bg-accent-50 px-3 py-2 text-sm font-medium text-ink"
            role="status"
          >
            {message}
          </div>
        ) : null}
        {error ? (
          <div
            className="rounded-xl border border-accent-300 bg-accent-100 px-3 py-2 text-sm font-medium text-accent-700"
            role="alert"
          >
            {error}
          </div>
        ) : null}
      </div>
    </form>
  );
};

export default AddWordForm;
