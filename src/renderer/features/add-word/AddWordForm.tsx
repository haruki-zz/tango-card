import { useEffect, useMemo, useState } from 'react';
import type { CreateWordInput, WordCard, WordExample } from '../../../shared/apiTypes';
import { ExampleFields } from './ExampleFields';
import { WordPreviewCard } from './WordPreviewCard';

const EMPTY_EXAMPLE: WordExample = { sentence_jp: '', sentence_cn: '' };
const OFFLINE_HINT =
  '当前离线，AI 无法生成。请手动填写后保存，联网后再点击“生成”补全。';

export default function AddWordForm() {
  const [term, setTerm] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [definition, setDefinition] = useState('');
  const [examples, setExamples] = useState<WordExample[]>([{ ...EMPTY_EXAMPLE }]);
  const [isOffline, setIsOffline] = useState(!isNavigatorOnline());
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lastSaved, setLastSaved] = useState<WordCard | null>(null);

  const trimmedTerm = term.trim();
  const trimmedPronunciation = pronunciation.trim();
  const trimmedDefinition = definition.trim();

  const trimmedExamples = useMemo(() => trimExamples(examples), [examples]);
  const canSave =
    Boolean(trimmedTerm && trimmedPronunciation && trimmedDefinition) &&
    trimmedExamples.length > 0 &&
    !locked;

  const previewExamples = locked && lastSaved ? lastSaved.examples : examples;
  const previewTerm = locked && lastSaved ? lastSaved.term : term;
  const previewPronunciation =
    locked && lastSaved ? lastSaved.pronunciation : pronunciation;
  const previewDefinition =
    locked && lastSaved ? lastSaved.definition_cn : definition;

  const busy = isGenerating || isSaving;

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleGenerate = async () => {
    if (!window.api?.ai?.generateWordData) {
      setAiError('AI 通道不可用，请检查预加载配置。');
      return;
    }
    if (!trimmedTerm || locked) {
      setAiError(!trimmedTerm ? '请输入需要生成的日语单词。' : '已保存的卡片不可再编辑。');
      return;
    }

    if (isOffline) {
      setAiError(OFFLINE_HINT);
      setAiMessage(null);
      setSaveMessage(null);
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    setAiMessage(null);
    setSaveMessage(null);
    try {
      const result = await window.api.ai.generateWordData(trimmedTerm);
      if (!result.ok) {
        const message =
          result.error.code === 'network_unavailable' ? OFFLINE_HINT : result.error.message;
        setAiError(message);
        return;
      }

      setPronunciation(result.data.pronunciation);
      setDefinition(result.data.definition_cn);
      setExamples(result.data.examples);
      setAiMessage('已生成结果，可按需微调后保存。');
    } catch (error) {
      setAiError(extractMessage(error, 'AI 生成失败，请稍后再试。'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExampleChange = (index: number, field: keyof WordExample, value: string) => {
    setExamples((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddExample = () => {
    setExamples((prev) => [...prev, { ...EMPTY_EXAMPLE }]);
  };

  const handleRemoveExample = (index: number) => {
    setExamples((prev) => {
      if (prev.length === 1) return prev;
      const copy = prev.filter((_, idx) => idx !== index);
      return copy.length > 0 ? copy : [{ ...EMPTY_EXAMPLE }];
    });
  };

  const handleSave = async () => {
    if (!window.api?.db?.createWord) {
      setSaveError('保存通道不可用，请检查主进程 IPC 设置。');
      return;
    }

    if (!canSave) {
      setSaveError('请补全必填字段后再保存。');
      return;
    }

    const payload: CreateWordInput = {
      term: trimmedTerm,
      pronunciation: trimmedPronunciation,
      definition_cn: trimmedDefinition,
      examples: trimmedExamples,
      tags: []
    };

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const saved = await window.api.db.createWord(payload);
      setLastSaved(saved);
      setLocked(true);
      setSaveMessage('已保存到本地词库，默认不再修改。如需新条目请点击“新增下一条”。');
    } catch (error) {
      setSaveError(extractMessage(error, '保存失败，请稍后重试。'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTerm('');
    setPronunciation('');
    setDefinition('');
    setExamples([{ ...EMPTY_EXAMPLE }]);
    setLocked(false);
    setAiError(null);
    setSaveError(null);
    setAiMessage(null);
    setSaveMessage(null);
  };

  return (
    <div className="add-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">新增单词</p>
          <h1>输入 → 生成 → 微调 → 保存</h1>
          <p className="muted">
            AI 生成读音与例句，失败时可手动填写；保存后默认锁定，避免误改。
          </p>
        </div>
        <div className="status-stack">
          <span className="badge">步骤 6 / 核心功能</span>
          {isOffline ? <span className="badge error">离线模式</span> : null}
          {locked ? <span className="badge success">已保存</span> : null}
          {busy ? <span className="badge info">处理中</span> : null}
        </div>
      </header>

      <div className="grid">
        <section className="panel">
          <div className="field">
            <label htmlFor="term">日语单词</label>
            <div className="input-row">
              <input
                id="term"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="例如：寿司、桜、明日"
                disabled={locked || busy}
                autoComplete="off"
              />
              <button
                type="button"
                className="primary"
                onClick={handleGenerate}
                disabled={!trimmedTerm || locked || busy}
              >
                {isGenerating ? '生成中...' : '生成'}
              </button>
            </div>
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="pronunciation">假名读音</label>
              <input
                id="pronunciation"
                value={pronunciation}
                onChange={(event) => setPronunciation(event.target.value)}
                placeholder="すし / さくら"
                disabled={locked || busy}
              />
            </div>
            <div className="field">
              <label htmlFor="definition">释义（140 字内）</label>
              <textarea
                id="definition"
                rows={3}
                value={definition}
                onChange={(event) => setDefinition(event.target.value)}
                placeholder="以醋饭和鱼类为主的日式料理，常见于家庭与餐馆。"
                disabled={locked || busy}
              />
            </div>
          </div>

          <div className="field">
            <div className="field-header">
              <label>例句</label>
              <span className="muted small">至少填写一组，内容可微调</span>
            </div>
            <ExampleFields
              examples={examples}
              disabled={locked || busy}
              onAdd={handleAddExample}
              onRemove={handleRemoveExample}
              onChange={handleExampleChange}
            />
          </div>

          <div className="actions">
            <button
              type="button"
              className="primary wide"
              onClick={handleSave}
              disabled={!canSave || isSaving}
            >
              {locked ? '已保存' : isSaving ? '保存中...' : '保存到词库'}
            </button>
            <button type="button" className="ghost-button" onClick={handleReset} disabled={busy}>
              新增下一条
            </button>
          </div>

          <div className="status-row" role="status">
            {aiError ? <span className="badge error">{aiError}</span> : null}
            {aiMessage ? <span className="badge info">{aiMessage}</span> : null}
            {saveError ? <span className="badge error">{saveError}</span> : null}
            {saveMessage ? <span className="badge success">{saveMessage}</span> : null}
            {isOffline && !aiError && !aiMessage && !saveError && !saveMessage ? (
              <span className="badge info">{OFFLINE_HINT}</span>
            ) : null}
            {!aiError && !aiMessage && !saveError && !saveMessage && !isOffline ? (
              <span className="muted small">提示与错误将显示在此。</span>
            ) : null}
          </div>
        </section>

        <aside className="panel preview">
          <WordPreviewCard
            title={locked ? '最新保存' : '实时预览'}
            term={previewTerm}
            pronunciation={previewPronunciation}
            definition={previewDefinition}
            examples={previewExamples}
            status={locked ? '已锁定' : undefined}
            hint="保存后默认不再提供修改入口。"
          />
          <div className="notes">
            <p className="eyebrow">流程提示</p>
            <ul>
              <li>生成失败时，可直接手动填写后保存。</li>
              <li>保存成功后点击“新增下一条”开始新的词条。</li>
              <li>读音需使用假名，不使用罗马音。</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function trimExamples(examples: WordExample[]) {
  return examples
    .map((item) => ({
      sentence_jp: item.sentence_jp.trim(),
      sentence_cn: item.sentence_cn.trim()
    }))
    .filter((item) => item.sentence_jp && item.sentence_cn);
}

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

function isNavigatorOnline() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}
