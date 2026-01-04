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
  const [activeIndex, setActiveIndex] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const currentWord = reviewQueue[activeIndex];

  const stats = useMemo(() => {
    const remaining = reviewQueue.length;
    return {
      remaining,
      completed: Math.max(0, initialTotal - remaining),
    };
  }, [initialTotal, reviewQueue.length]);

  const progressPercent = useMemo(() => {
    if (!initialTotal) {
      return 0;
    }
    const ratio = stats.completed / initialTotal;
    return Math.min(100, Math.round(ratio * 100));
  }, [initialTotal, stats.completed]);

  const wordSizeClass = useMemo(() => {
    if (!currentWord) {
      return '';
    }
    const length = currentWord.word.length;
    if (length > 12) {
      return 'text-2xl sm:text-3xl';
    }
    if (length > 8) {
      return 'text-[1.75rem] sm:text-[2.25rem]';
    }
    return 'text-3xl sm:text-4xl';
  }, [currentWord]);

  const isBusy = status !== 'idle';

  const resetLocalState = useCallback(() => {
    setFlipped(false);
    setActiveIndex(0);
    setInitialTotal(0);
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

  useEffect(() => {
    if (reviewQueue.length === 0) {
      setActiveIndex(0);
      return;
    }
    setActiveIndex((prev) => Math.min(prev, reviewQueue.length - 1));
  }, [reviewQueue.length]);

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

  const handleFlip = useCallback(() => {
    if (!currentWord || isBusy) {
      return;
    }
    setMessage('');
    setError('');
    setFlipped((prev) => !prev);
  }, [currentWord, isBusy]);

  const handlePrevCard = useCallback(() => {
    if (isBusy || reviewQueue.length === 0) {
      return;
    }
    setMessage('');
    setError('');
    setFlipped(false);
    setActiveIndex((index) => Math.max(0, index - 1));
  }, [isBusy, reviewQueue.length]);

  const handleNextCard = useCallback(() => {
    if (isBusy || reviewQueue.length === 0) {
      return;
    }
    setMessage('');
    setError('');
    setFlipped(false);
    setActiveIndex((index) => Math.min(reviewQueue.length - 1, index + 1));
  }, [isBusy, reviewQueue.length]);

  const handleScore = useCallback(
    async (score: number) => {
      if (!currentWord) {
        setError('当前没有待复习的卡片');
        return;
      }
      if (isBusy) {
        return;
      }

      setStatus('submitting');
      setError('');
      setMessage('');
      try {
        await submitReview(currentWord.id, score);
        setHasReviewed(true);
        setFlipped(false);
        setActiveIndex((index) => {
          const remainingQueue = useAppStore.getState().reviewQueue.length;
          if (remainingQueue === 0) {
            return 0;
          }
          return Math.min(index, remainingQueue - 1);
        });
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
    [currentWord, finalizeSession, isBusy, submitReview],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isBusy || !currentWord) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        handleFlip();
        return;
      }
      if (/^[0-5]$/.test(event.key)) {
        event.preventDefault();
        void handleScore(Number(event.key));
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNextCard();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevCard();
      }
    },
    [currentWord, handleFlip, handleNextCard, handlePrevCard, handleScore, isBusy],
  );

  const handleReset = useCallback(() => {
    resetReviewSession();
    resetLocalState();
    setMessage('已重置本轮复习，可重新加载队列。');
  }, [resetLocalState, resetReviewSession]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
        <div className="stat-row">
          <span className="stat-label">当前卡片</span>
          <span className="stat-value">
            {reviewQueue.length > 0 ? activeIndex + 1 : 0} / {reviewQueue.length || 0}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-panel px-5 py-5 shadow-inner">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">进度</p>
            <div className="flex flex-col gap-1">
              <div
                className="progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPercent}
              >
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-ink">{progressPercent}%</span>
                <span className="text-xs text-muted">
                  {stats.completed} / {initialTotal || 0} 已计入
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="kbd-hint">空格 / Enter 翻面</span>
            <span className="kbd-hint">数字 0-5 评分</span>
            <span className="kbd-hint">← / → 切换卡片</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-muted">
            {currentWord ? (
              <span className="font-semibold text-ink">
                卡片 {activeIndex + 1} / {reviewQueue.length}
              </span>
            ) : (
              <span className="font-semibold text-ink">暂无卡片</span>
            )}
            <span className="mx-2 hidden text-muted lg:inline">•</span>
            <span>剩余 {stats.remaining}，完成后自动计入 session</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handlePrevCard}
              disabled={isBusy || activeIndex === 0 || reviewQueue.length === 0}
            >
              ← 上一张
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleNextCard}
              disabled={
                isBusy || reviewQueue.length === 0 || activeIndex >= reviewQueue.length - 1
              }
            >
              下一张 →
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleFlip}
              disabled={isBusy || !currentWord}
            >
              {flipped ? '返回正面' : '查看释义'}
            </button>
          </div>
        </div>

        {currentWord ? (
          <div className="mt-3 review-card">
            <div className={`review-card-inner ${flipped ? 'is-flipped' : ''}`}>
              <div className="review-card-face review-card-front">
                <p className={`word-display ${wordSizeClass}`}>{currentWord.word}</p>
                <p className="text-sm text-muted">按空格或按钮翻面查看释义与例句</p>
              </div>
              <div className="review-card-face review-card-back">
                <div className="space-y-2">
                  <p className={`word-display ${wordSizeClass}`}>{currentWord.word}</p>
                  <p className="text-base font-semibold text-accent-700">{currentWord.hiragana}</p>
                  <p className="text-sm leading-relaxed text-ink">{currentWord.definition_ja}</p>
                  <p className="text-sm text-muted">
                    例句：<span className="italic">{currentWord.example_ja}</span>
                  </p>
                  <p className="text-xs text-muted">
                    下次复习：{formatIsoDate(currentWord.sm2.next_review_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-accent-200 bg-panel px-4 py-3 text-sm text-muted">
            当前没有待复习的词条，刷新后再试。
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">评分（0-5）</p>
            <p className="text-xs text-muted">翻面后使用数字键或按钮，完成全部后计入 session</p>
          </div>
          <span className="text-xs text-muted">剩余 {stats.remaining} 张</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SCORE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className="score-button"
              aria-label={`评分 ${option.value} ${option.label}`}
              onClick={() => handleScore(option.value)}
              disabled={!currentWord || isBusy}
            >
              <span className="score-value">{option.value}</span>
              <span className="score-label">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {message ? (
          <p className="message success" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="message error" role="alert">
            {error}
          </p>
        ) : null}
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
