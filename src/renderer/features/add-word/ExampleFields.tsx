import { WordExample } from '../../../shared/apiTypes';

interface ExampleFieldsProps {
  examples: WordExample[];
  disabled?: boolean;
  onChange: (index: number, field: keyof WordExample, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function ExampleFields({
  examples,
  disabled,
  onChange,
  onAdd,
  onRemove
}: ExampleFieldsProps) {
  return (
    <div className="example-block">
      {examples.map((example, index) => {
        const jpId = `example-jp-${index}`;
        const cnId = `example-cn-${index}`;

        return (
          <div className="example-row" key={`${jpId}-${cnId}`}>
            <div className="field">
              <label htmlFor={jpId}>例句（日语）</label>
              <textarea
                id={jpId}
                rows={2}
                value={example.sentence_jp}
                onChange={(event) => onChange(index, 'sentence_jp', event.target.value)}
                disabled={disabled}
                placeholder="週末に友だちと寿司を食べました。"
              />
            </div>
            <div className="field">
              <label htmlFor={cnId}>例句（中文）</label>
              <textarea
                id={cnId}
                rows={2}
                value={example.sentence_cn}
                onChange={(event) => onChange(index, 'sentence_cn', event.target.value)}
                disabled={disabled}
                placeholder="周末和朋友一起吃了寿司。"
              />
            </div>
            {examples.length > 1 ? (
              <button
                type="button"
                className="ghost-button"
                onClick={() => onRemove(index)}
                disabled={disabled}
                aria-label={`删除例句 ${index + 1}`}
              >
                删除
              </button>
            ) : (
              <div className="ghost-placeholder" />
            )}
          </div>
        );
      })}

      <button type="button" className="ghost-button" onClick={onAdd} disabled={disabled}>
        + 添加例句
      </button>
    </div>
  );
}
