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
    <form className="surface-card" onSubmit={handleSubmit} aria-label="新增单词">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="pill w-fit">新增</span>
          <h2 className="text-xl font-semibold text-ink">生成并保存单词</h2>
          <p className="text-sm text-muted">
            输入日语单词，AI 生成读音、释义与例句后可手动修订再保存。
          </p>
        </div>
        <div className="rounded-xl bg-accent-50 px-4 py-3 text-right text-sm text-accent-800">
          <div className="font-semibold">今日 {todaySummary.label}</div>
          <div className="mt-1 flex items-center justify-end gap-2">
            <span>新增 {todaySummary.added}</span>
            <span className="text-muted">·</span>
            <span>复习 {todaySummary.sessions}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">单词</span>
          <div className="flex items-center gap-3">
            <input
              id="word"
              aria-label="单词"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none ring-accent-200 ring-offset-1 transition focus:ring-2 disabled:opacity-60"
              placeholder="例如：勉強"
              value={wordInput}
              onChange={(event) => setWordInput(event.target.value)}
              disabled={isBusy}
            />
            <button
              type="button"
              className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleGenerate}
              disabled={isBusy}
            >
              {isGenerating ? '生成中…' : '生成'}
            </button>
          </div>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">平假名读音</span>
          <input
            aria-label="读音"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none ring-accent-200 ring-offset-1 transition focus:ring-2 disabled:opacity-60"
            placeholder="生成后可在此调整"
            value={hiragana}
            onChange={(event) => setHiragana(event.target.value)}
            disabled={isBusy}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">日文释义</span>
          <textarea
            aria-label="释义"
            className="h-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none ring-accent-200 ring-offset-1 transition focus:ring-2 disabled:opacity-60"
            placeholder="简要说明含义与语境"
            value={definition}
            onChange={(event) => setDefinition(event.target.value)}
            disabled={isBusy}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">日文例句</span>
          <textarea
            aria-label="例句"
            className="h-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none ring-accent-200 ring-offset-1 transition focus:ring-2 disabled:opacity-60"
            placeholder="生成后可自由修改"
            value={example}
            onChange={(event) => setExample(event.target.value)}
            disabled={isBusy}
          />
        </label>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          className="rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isBusy}
        >
          {isSaving ? '保存中…' : '保存到词库'}
        </button>
        {message ? (
          <span className="text-sm font-medium text-emerald-700">{message}</span>
        ) : null}
        {error ? (
          <span className="text-sm font-medium text-red-600">{error}</span>
        ) : null}
      </div>
    </form>
  );
};

export default AddWordForm;
