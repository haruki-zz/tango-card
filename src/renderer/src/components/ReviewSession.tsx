import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAppStore } from '../store/useAppStore';

type QueueStatus = 'idle' | 'loading' | 'submitting' | 'finalizing';

type ScoreOption = {
  value: number;
  label: string;
};

const SCORE_OPTIONS: ScoreOption[] = [
  { value: 0, label: '完全不会' },
  { value: 1, label: '模糊印象' },
  { value: 2, label: '费力回忆' },
  { value: 3, label: '记住了' },
  { value: 4, label: '较熟练' },
  { value: 5, label: '完全熟练' },
];

const formatIsoDate = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return '日期未知';
  }
  const date = new Date(parsed);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
    date.getUTCDate(),
  ).padStart(2, '0')}`;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return '发生未知错误，请重试';
};

const ReviewSession = () => {
  const reviewQueue = useAppStore((state) => state.reviewQueue);
  const loadReviewQueue = useAppStore((state) => state.loadReviewQueue);
  const submitReview = useAppStore((state) => state.submitReview);
  const completeSession = useAppStore((state) => state.completeSession);
  const resetReviewSession = useAppStore((state) => state.resetReviewSession);

  const [status, setStatus] = useState<QueueStatus>('idle');
  const [flipped, setFlipped] = useState(false);
  const [initialTotal, setInitialTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const currentWord = reviewQueue[0];

  const stats = useMemo(() => {
    const remaining = reviewQueue.length;
    return {
      remaining,
      completed: Math.max(0, initialTotal - remaining),
    };
  }, [initialTotal, reviewQueue.length]);

  const resetLocalState = useCallback(() => {
    setFlipped(false);
    setMessage('');
    setError('');
    setHasReviewed(false);
    setSessionCompleted(false);
  }, []);

  const handleLoadQueue = useCallback(async () => {
    setStatus('loading');
    resetLocalState();
    resetReviewSession();
    try {
      const queue = await loadReviewQueue();
      setInitialTotal(queue.length);
      if (queue.length === 0) {
        setMessage('当前没有待复习的词条');
      }
    } catch (err) {
      setError(`加载队列失败：${getErrorMessage(err)}`);
    } finally {
      setStatus('idle');
    }
  }, [loadReviewQueue, resetLocalState, resetReviewSession]);

  useEffect(() => {
    void handleLoadQueue();
  }, [handleLoadQueue]);

  const finalizeSession = useCallback(async () => {
    setStatus('finalizing');
    try {
      await completeSession();
      setSessionCompleted(true);
      setMessage('本轮复习已完成，活跃度已累计 1 次 session。');
    } catch (err) {
      setError(`记录 session 失败：${getErrorMessage(err)}`);
    } finally {
      setStatus('idle');
    }
  }, [completeSession]);

  const handleScore = useCallback(
    async (score: number) => {
      if (!currentWord) {
        setError('当前没有待复习的卡片');
        return;
      }

      setStatus('submitting');
      setError('');
      setMessage('');
      try {
        await submitReview(currentWord.id, score);
        setHasReviewed(true);
        setFlipped(false);
        const remaining = useAppStore.getState().reviewQueue.length;
        if (remaining === 0) {
          await finalizeSession();
        } else {
          setMessage('已记录评分，继续下一张卡片。');
        }
      } catch (err) {
        setError(`提交评分失败：${getErrorMessage(err)}`);
      } finally {
        setStatus('idle');
      }
    },
    [currentWord, finalizeSession, submitReview],
  );

  const handleReset = useCallback(() => {
    resetReviewSession();
    setInitialTotal(0);
    resetLocalState();
    setMessage('已重置本轮复习，可重新加载队列。');
  }, [resetLocalState, resetReviewSession]);

  const isBusy = status !== 'idle';

  return (
    <section className="surface-card" aria-label="复习队列">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="pill w-fit">复习</span>
          <h2 className="text-xl font-semibold text-ink">SM-2 复习队列</h2>
          <p className="text-sm text-muted">
            自动拉取待复习词条，翻面查看释义后打分，完成全量后才计入 session。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn"
            onClick={handleReset}
            disabled={isBusy}
          >
            重置本轮
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleLoadQueue}
            disabled={isBusy}
          >
            {status === 'loading' ? '刷新中…' : '刷新队列'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="stat-row">
          <span className="stat-label">待复习</span>
          <span className="stat-value">{stats.remaining}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">已完成</span>
          <span className="stat-value">
            {stats.completed} / {initialTotal}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-panel px-5 py-4 shadow-inner">
        {currentWord ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  当前卡片
                </p>
                <p className="text-2xl font-semibold text-ink">{currentWord.word}</p>
                {!flipped ? (
                  <p className="text-xs text-muted">点击“查看释义”翻面后再评分。</p>
                ) : null}
              </div>
              <button
                type="button"
                className="btn"
                onClick={() => setFlipped((prev) => !prev)}
                disabled={isBusy}
              >
                {flipped ? '返回正面' : '查看释义'}
              </button>
            </div>

            {flipped ? (
              <div className="mt-4 space-y-2 rounded-xl border border-border bg-panel px-4 py-3 shadow-sm">
                <p className="text-sm font-semibold text-accent-700">{currentWord.hiragana}</p>
                <p className="text-sm leading-relaxed text-ink">{currentWord.definition_ja}</p>
                <p className="text-sm text-muted">
                  例句：<span className="italic">{currentWord.example_ja}</span>
                </p>
                <p className="text-xs text-muted">
                  下次复习：{formatIsoDate(currentWord.sm2.next_review_at)}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-accent-200 bg-panel px-4 py-3 text-sm text-muted">
                正面仅展示单词，翻面后查看读音、释义与例句。
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">当前没有待复习的词条，刷新后再试。</p>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">评分（0-5）</p>
          <p className="text-xs text-muted">仅在完成全部队列后计入 session</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SCORE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="btn flex-col items-start text-left"
              aria-label={`评分 ${option.value} ${option.label}`}
              onClick={() => handleScore(option.value)}
              disabled={!currentWord || isBusy}
            >
              <span className="block text-xs uppercase tracking-[0.08em] text-muted">
                {option.value}
              </span>
              <span className="block">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
        {hasReviewed && !sessionCompleted && reviewQueue.length === 0 ? (
          <button
            type="button"
            className="text-sm font-semibold text-accent-700 underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            onClick={finalizeSession}
            disabled={isBusy}
          >
            重试计入本轮 session
          </button>
        ) : null}
      </div>
    </section>
  );
};

export default ReviewSession;
