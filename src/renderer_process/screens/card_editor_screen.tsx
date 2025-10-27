import { useMemo, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { use_card_store } from '../hooks/use_card_store';
import { get_renderer_api } from '../utils/renderer_api';
import { MEMORY_LEVEL_DEFAULT, MemoryLevel } from '../../domain/review/memory_level';
import { MEMORY_LEVEL_OPTIONS } from '../../shared/constants/memory_levels';

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'success' | 'error';

export function CardEditorScreen() {
  const [svg_source, set_svg_source] = useState('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const [tag_input, set_tag_input] = useState('');
  const [memory_level, set_memory_level] = useState<MemoryLevel>(MEMORY_LEVEL_DEFAULT);
  const [save_status, set_save_status] = useState<SaveStatus>('idle');
  const [status_message, set_status_message] = useState('尚未保存');
  const [active_card_id, set_active_card_id] = useState<string | undefined>(undefined);
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

  const selected_memory_option = useMemo(
    () => MEMORY_LEVEL_OPTIONS.find((option) => option.level === memory_level),
    [memory_level],
  );

  const mark_dirty = () => {
    if (save_status !== 'dirty') {
      set_save_status('dirty');
      set_status_message('存在尚未保存的更改。');
    }
  };

  const handle_svg_change = (value: string) => {
    set_svg_source(value);
    if (!value.trim()) {
      set_active_card_id(undefined);
      set_save_status('idle');
      set_status_message('请先输入 SVG 源码。');
      return;
    }
    mark_dirty();
  };

  const handle_tag_change = (value: string) => {
    set_tag_input(value);
    mark_dirty();
  };

  const handle_memory_level_change = (value: MemoryLevel) => {
    set_memory_level(value);
    mark_dirty();
  };

  const handle_save = async () => {
    const sanitized_svg = svg_source.trim();
    if (!sanitized_svg) {
      set_save_status('error');
      set_status_message('SVG 源码不能为空。');
      return;
    }
    set_save_status('saving');
    set_status_message('保存中...');
    try {
      const saved_card = await api.ingest_card({
        card_id: active_card_id,
        svg_source: sanitized_svg,
        tags: tag_list,
        memory_level,
      });
      set_active_card_id(saved_card.id);
      set_save_status('success');
      set_status_message('保存成功。');
      await refresh_cards();
    } catch (error) {
      set_save_status('error');
      set_status_message(`保存失败：${(error as Error).message}`);
    }
  };

  const is_save_disabled = save_status === 'saving' || svg_source.trim().length === 0;

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
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>记忆等级</span>
          <select
            value={memory_level}
            onChange={(event) => handle_memory_level_change(event.target.value as MemoryLevel)}
            style={{ padding: '0.5rem' }}
          >
            {MEMORY_LEVEL_OPTIONS.map((option) => (
              <option key={option.level} value={option.level}>
                {option.label}
              </option>
            ))}
          </select>
          {selected_memory_option?.description ? (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{selected_memory_option.description}</span>
          ) : null}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={handle_save}
            disabled={is_save_disabled}
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '9999px',
              border: '1px solid #1d4ed8',
              backgroundColor: is_save_disabled ? '#1e293b' : '#1d4ed8',
              color: '#f8fafc',
              cursor: is_save_disabled ? 'not-allowed' : 'pointer',
            }}
          >
            保存卡片
          </button>
          <SaveStatusHint state={save_status} message={status_message} />
        </div>
      </div>
      <div style={{ border: '1px solid #1f2937', borderRadius: '0.75rem', padding: '1rem' }}>
        <h2>实时预览</h2>
        <SvgCanvas svg_source={svg_source} />
      </div>
    </section>
  );
}

interface SaveStatusHintProps {
  readonly state: SaveStatus;
  readonly message: string;
}

function SaveStatusHint({ state, message }: SaveStatusHintProps) {
  const color =
    state === 'success' ? '#16a34a' : state === 'error' ? '#ef4444' : state === 'saving' ? '#facc15' : '#94a3b8';
  return (
    <p style={{ color, fontSize: '0.875rem' }} aria-live="polite">
      {message}
    </p>
  );
}
