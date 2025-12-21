import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AnswerReviewResult, ReviewRating, WordCard } from '../../../shared/apiTypes';
import { ReviewWordCard } from './ReviewWordCard';

type SessionStats = Record<ReviewRating, number>;

const INITIAL_STATS: SessionStats = { again: 0, hard: 0, good: 0, easy: 0 };

export function ReviewSession() {
  const [queue, setQueue] = useState<WordCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>(INITIAL_STATS);
  const [history, setHistory] = useState<AnswerReviewResult[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cardStart, setCardStart] = useState<number | null>(null);

  const currentCard = queue[currentIndex] ?? null;
  const hasFinished = queue.length > 0 && history.length >= queue.length;

  const progressLabel = useMemo(() => {
    if (queue.length === 0) return '0/0';
    const current = Math.min(history.length + 1, queue.length);
    return `${current}/${queue.length}`;
  }, [history.length, queue.length]);

  const loadQueue = useCallback(async () => {
    if (!window.api?.db?.getTodayQueue) {
      setError('复习队列通道不可用，请检查主进程 IPC 设置。');
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage(null);
    setHistory([]);
    setStats(INITIAL_STATS);
    try {
      const cards = await window.api.db.getTodayQueue();
      setQueue(cards);
      setCurrentIndex(0);
      setCardStart(cards.length > 0 ? Math.floor(Date.now() / 1000) : null);
    } catch (err) {
      setError(extractMessage(err, '加载复习队列失败，请稍后再试。'));
      setQueue([]);
      setCardStart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (currentCard) {
      setCardStart(Math.floor(Date.now() / 1000));
    }
  }, [currentCard?.id]);

  const handleAnswer = useCallback(
    async (rating: ReviewRating, options?: { skipped?: boolean }) => {
      if (!currentCard || !window.api?.db?.answerReview || submitting) return;

      setSubmitting(true);
      setError(null);
      const reviewedAt = Math.floor(Date.now() / 1000);
      const durationSeconds =
        cardStart && reviewedAt >= cardStart ? reviewedAt - cardStart : undefined;

      try {
        const result = await window.api.db.answerReview({
          wordId: currentCard.id,
          result: rating,
          reviewedAt,
          durationSeconds
        });

        setStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
        setHistory((prev) => [...prev, result]);
        setStatusMessage(buildStatusMessage(result, options?.skipped));

        const nextIndex = currentIndex + 1;
        if (nextIndex < queue.length) {
          setCurrentIndex(nextIndex);
        }
      } catch (err) {
        setError(extractMessage(err, '记录复习结果失败，请稍后重试。'));
      } finally {
        setSubmitting(false);
      }
    },
    [cardStart, currentCard, currentIndex, queue.length, submitting]
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!currentCard || submitting) return;
      const key = event.key.toLowerCase();
      if (['a', 'h', 'g', 'e'].includes(key)) {
        event.preventDefault();
      }
      switch (key) {
        case 'a':
          handleAnswer('again');
          break;
        case 'h':
          handleAnswer('hard');
          break;
        case 'g':
          handleAnswer('good');
          break;
        case 'e':
          handleAnswer('easy');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentCard, handleAnswer, submitting]);

  const handleSkip = () => handleAnswer('easy', { skipped: true });

  const activeCard =
    hasFinished || queue.length === 0 ? null : currentCard;

  return (
    <section className="panel review-panel" aria-live="polite">
      <div className="review-header">
        <div>
          <p className="eyebrow">复习队列</p>
          <h3>30 张以内，优先到期卡片</h3>
          <p className="muted">
            空格翻转，A/H/G/E 直接给分；熟记的词可以不翻面，跳过会自动记为 Easy。
          </p>
        </div>
        <div className="status-stack">
          <span className="badge">{`进度 ${progressLabel}`}</span>
          <span className="badge info">{`Again ${stats.again} · Hard ${stats.hard} · Good ${stats.good} · Easy ${stats.easy}`}</span>
        </div>
      </div>

      {loading ? <p className="muted">加载复习队列中...</p> : null}
      {error ? <p className="badge error">{error}</p> : null}
      {!loading && queue.length === 0 && !error ? (
        <div className="empty-state">
          <p className="muted">今日暂无到期卡片，或尚未新增词条。</p>
          <div className="actions">
            <button type="button" className="primary" onClick={loadQueue}>
              重新加载队列
            </button>
          </div>
        </div>
      ) : null}

      {activeCard ? (
        <div className="review-body">
          <ReviewWordCard key={activeCard.id} card={activeCard} />
          <div className="review-controls">
            <div className="rating-buttons">
              <button
                type="button"
                className="pill danger"
                onClick={() => handleAnswer('again')}
                disabled={submitting}
              >
                Again (A)
              </button>
              <button
                type="button"
                className="pill warning"
                onClick={() => handleAnswer('hard')}
                disabled={submitting}
              >
                Hard (H)
              </button>
              <button
                type="button"
                className="pill neutral"
                onClick={() => handleAnswer('good')}
                disabled={submitting}
              >
                Good (G)
              </button>
              <button
                type="button"
                className="pill success"
                onClick={() => handleAnswer('easy')}
                disabled={submitting}
              >
                Easy (E)
              </button>
            </div>
            <div className="review-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={handleSkip}
                disabled={submitting}
              >
                熟记，直接下一张（记为 Easy）
              </button>
              <button type="button" className="ghost-button" onClick={loadQueue} disabled={submitting}>
                刷新队列
              </button>
            </div>
            {statusMessage ? <p className="muted small">{statusMessage}</p> : null}
          </div>
        </div>
      ) : null}

      {hasFinished ? (
        <div className="review-summary">
          <h4>本次复习完成</h4>
          <p className="muted">感谢复习！可以刷新队列获取最新到期卡片，或继续新增单词。</p>
          <div className="summary-stats">
            {(['again', 'hard', 'good', 'easy'] as ReviewRating[]).map((rating) => (
              <div key={rating} className="summary-chip">
                <span className="eyebrow">{rating.toUpperCase()}</span>
                <strong>{stats[rating]}</strong>
              </div>
            ))}
          </div>
          <div className="actions">
            <button type="button" className="primary" onClick={loadQueue}>
              再次加载队列
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function buildStatusMessage(result: AnswerReviewResult, skipped?: boolean) {
  const label =
    result.result === 'again'
      ? 'Again'
      : result.result === 'hard'
        ? 'Hard'
        : result.result === 'good'
          ? 'Good'
          : 'Easy';
  const prefix = skipped ? '已跳过，记为 Easy。' : `已标记为 ${label}。`;
  const intervalText = formatInterval(result.interval);
  return `${prefix} 下次复习在 ${intervalText} 后（${new Date(
    result.nextDue * 1000
  ).toLocaleString()}）。`;
}

function formatInterval(intervalSeconds: number) {
  const days = Math.floor(intervalSeconds / 86_400);
  const hours = Math.floor((intervalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((intervalSeconds % 3_600) / 60);

  if (days > 0) return `${days} 天${hours > 0 ? ` ${hours} 小时` : ''}`;
  if (hours > 0) return `${hours} 小时${minutes > 0 ? ` ${minutes} 分` : ''}`;
  if (minutes > 0) return `${minutes} 分钟`;
  return `${intervalSeconds} 秒`;
}

function extractMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
