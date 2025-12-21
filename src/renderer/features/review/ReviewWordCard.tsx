import { useMemo, useState, type KeyboardEvent } from 'react';
import type { WordCard as WordCardType, WordExample } from '../../../shared/apiTypes';

type CardSide = 'front' | 'back';

interface ReviewWordCardProps {
  card: WordCardType;
  initialSide?: CardSide;
  onFlip?: (side: CardSide) => void;
}

export function ReviewWordCard({ card, initialSide = 'front', onFlip }: ReviewWordCardProps) {
  const [side, setSide] = useState<CardSide>(initialSide);
  const examples = useMemo(() => filterExamples(card.examples), [card.examples]);

  const toggleSide = () => {
    const nextSide: CardSide = side === 'front' ? 'back' : 'front';
    setSide(nextSide);
    onFlip?.(nextSide);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isSpaceKey(event)) {
      event.preventDefault();
      toggleSide();
    }
  };

  const isBack = side === 'back';

  return (
    <div
      className="word-card"
      role="button"
      tabIndex={0}
      aria-pressed={isBack}
      aria-label="点击或按空格翻转卡片"
      onClick={toggleSide}
      onKeyDown={handleKeyDown}
      data-side={side}
    >
      <div className={`card-rotator ${isBack ? 'is-back' : 'is-front'}`}>
        <div
          className="card-face card-front"
          aria-hidden={isBack}
          data-testid="card-front"
          role="group"
          aria-label="卡片正面"
        >
          <p className="eyebrow">正面</p>
          <h2 className="card-term">{card.term || '未填写单词'}</h2>
          <p className="card-pronunciation">{card.pronunciation || '假名读音待补充'}</p>
          <p className="card-hint">点击或按空格查看释义与例句</p>
        </div>

        <div
          className="card-face card-back"
          aria-hidden={!isBack}
          data-testid="card-back"
          role="group"
          aria-label="卡片背面"
        >
          <div className="card-header">
            <div>
              <p className="eyebrow">背面</p>
              <h2 className="card-term">{card.term || '未填写单词'}</h2>
              <p className="card-pronunciation">{card.pronunciation || '假名读音待补充'}</p>
            </div>
            <span className="badge info">释义</span>
          </div>
          <p className="card-definition">{card.definition_cn || '释义待补充'}</p>
          <div className="card-examples">
            {examples.length === 0 ? (
              <p className="muted small">暂无例句，复习时可关注词义与读音。</p>
            ) : (
              examples.map((example, index) => (
                <div key={`${example.sentence_jp}-${index}`} className="card-example">
                  <p className="example-jp">{example.sentence_jp}</p>
                  <p className="example-cn">{example.sentence_cn}</p>
                </div>
              ))
            )}
          </div>
          <p className="card-hint">按空格或点击返回正面</p>
        </div>
      </div>
    </div>
  );
}

function filterExamples(examples: WordExample[]) {
  return examples.filter(
    (example) => example.sentence_jp.trim() || example.sentence_cn.trim()
  );
}

function isSpaceKey(event: KeyboardEvent<HTMLDivElement>) {
  return (
    event.code === 'Space' ||
    event.key === ' ' ||
    event.key === 'Space' ||
    event.key === 'Spacebar'
  );
}
