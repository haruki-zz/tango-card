import { useEffect, useMemo, useRef, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { use_card_store } from '../hooks/use_card_store';
import { get_renderer_api } from '../utils/renderer_api';

type AutoSaveState = 'idle' | 'saving' | 'saved' | 'error';

export function CardEditorScreen() {
  const [svg_source, set_svg_source] = useState('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const [tag_input, set_tag_input] = useState('');
  const [auto_save_state, set_auto_save_state] = useState<AutoSaveState>('idle');
  const [status_message, set_status_message] = useState('尚未保存');
  const [active_card_id, set_active_card_id] = useState<string | undefined>(undefined);
  const last_saved_signature = useRef<string>('');
  const save_timer = useRef<number | null>(null);
  const api = useMemo(() => get_renderer_api(), []);
  const { refresh_cards } = use_card_store();

  const tag_list = useMemo(
    () =>
      tag_input
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tag_input],
  );

  const signature = useMemo(() => {
    const sorted_tags = [...tag_list].sort();
    return `${svg_source}::${sorted_tags.join('|')}`;
  }, [svg_source, tag_list]);

  const handle_svg_change = (value: string) => {
    set_svg_source(value);
    if (!value.trim()) {
      last_saved_signature.current = '';
      set_auto_save_state('idle');
      set_status_message('请先输入 SVG 源码');
      set_active_card_id(undefined);
      return;
    }
    set_auto_save_state('saving');
    set_status_message('自动保存中...');
  };

  const handle_tag_change = (value: string) => {
    set_tag_input(value);
    set_auto_save_state('saving');
    set_status_message('自动保存中...');
  };

  useEffect(() => {
    if (!svg_source.trim()) {
      return;
    }

    if (signature === last_saved_signature.current) {
      return;
    }

    window.clearTimeout(save_timer.current ?? undefined);

    save_timer.current = window.setTimeout(async () => {
      try {
        const saved_card = await api.ingest_card({
          card_id: active_card_id,
          svg_source,
          tags: tag_list,
        });
        last_saved_signature.current = signature;
        set_active_card_id(saved_card.id);
        set_auto_save_state('saved');
        set_status_message('已自动保存');
        await refresh_cards();
      } catch (error) {
        set_auto_save_state('error');
        set_status_message(`自动保存失败：${(error as Error).message}`);
      }
    }, 800);

    return () => {
      window.clearTimeout(save_timer.current ?? undefined);
    };
  }, [active_card_id, api, refresh_cards, signature, svg_source, tag_list]);

  useEffect(() => () => {
    window.clearTimeout(save_timer.current ?? undefined);
  }, []);

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>SVG 源码</span>
          <textarea
            name="svg"
            rows={16}
            value={svg_source}
            onChange={(event) => handle_svg_change(event.target.value)}
            style={{ fontFamily: 'monospace', padding: '0.75rem' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>标签（用逗号分隔）</span>
          <input
            value={tag_input}
            onChange={(event) => handle_tag_change(event.target.value)}
            placeholder="语法, N5, 动词"
          />
        </label>
        <AutoSaveHint state={auto_save_state} message={status_message} />
      </div>
      <div style={{ border: '1px solid #1f2937', borderRadius: '0.75rem', padding: '1rem' }}>
        <h2>实时预览</h2>
        <SvgCanvas svg_source={svg_source} />
      </div>
    </section>
  );
}

interface AutoSaveHintProps {
  readonly state: AutoSaveState;
  readonly message: string;
}

function AutoSaveHint({ state, message }: AutoSaveHintProps) {
  const color =
    state === 'saved' ? '#16a34a' : state === 'error' ? '#ef4444' : state === 'saving' ? '#facc15' : '#94a3b8';
  return (
    <p style={{ color, fontSize: '0.875rem' }}>
      {message}
    </p>
  );
}
