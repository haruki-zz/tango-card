import { WordExample } from '../../../shared/apiTypes';

interface WordPreviewCardProps {
  title: string;
  term: string;
  pronunciation: string;
  definition: string;
  examples: WordExample[];
  status?: string;
  hint?: string;
}

export function WordPreviewCard({
  title,
  term,
  pronunciation,
  definition,
  examples,
  status,
  hint
}: WordPreviewCardProps) {
  const hasContent =
    term.trim() || pronunciation.trim() || definition.trim() || examples.some(hasExampleContent);

  if (!hasContent) {
    return (
      <div className="preview-card empty">
        <p className="muted">填写内容后将自动生成预览。</p>
      </div>
    );
  }

  return (
    <div className="preview-card">
      <header>
        <div>
          <p className="eyebrow">{title}</p>
          <h3>{term || '未填写单词'}</h3>
          <p className="pronunciation">{pronunciation || '读音待补充'}</p>
        </div>
        {status ? <span className="badge success">{status}</span> : null}
      </header>
      <p className="definition">{definition || '释义待补充'}</p>
      <div className="examples">
        {examples.filter(hasExampleContent).map((example, index) => (
          <div key={`${example.sentence_jp}-${index}`} className="example-item">
            <p className="example-jp">{example.sentence_jp}</p>
            <p className="example-cn">{example.sentence_cn}</p>
          </div>
        ))}
      </div>
      {hint ? <p className="muted hint">{hint}</p> : null}
    </div>
  );
}

function hasExampleContent(example: WordExample) {
  return example.sentence_cn.trim() || example.sentence_jp.trim();
}
