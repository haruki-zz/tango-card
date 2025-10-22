import { FormEvent, useCallback, useMemo, useState } from 'react';
import { SvgCanvas } from '../components/svg_canvas';
import { use_card_store } from '../hooks/use_card_store';
import type { RendererApi } from '../../preload/context_bridge';

function get_renderer_api(): RendererApi {
  if (typeof window === 'undefined' || !window.tango_api) {
    throw new Error('Renderer API is unavailable in this environment.');
  }
  return window.tango_api;
}

export function CardEditorScreen() {
  const [svg_source, set_svg_source] = useState('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const [tag_input, set_tag_input] = useState('');
  const [status_message, set_status_message] = useState<string | null>(null);
  const { refresh_cards } = use_card_store();

  const tag_list = useMemo(
    () => tag_input.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tag_input],
  );

  const handle_submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      set_status_message('保存中...');
      try {
        await get_renderer_api().ingest_card({
          svg_source,
          tags: tag_list,
        });
        await refresh_cards();
        set_status_message('保存成功！');
      } catch (error) {
        set_status_message(`保存失败: ${(error as Error).message}`);
      }
    },
    [svg_source, tag_list, refresh_cards],
  );

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <form onSubmit={handle_submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>SVG 源码</span>
          <textarea
            name="svg"
            rows={16}
            value={svg_source}
            onChange={(event) => set_svg_source(event.target.value)}
            style={{ fontFamily: 'monospace', padding: '0.75rem' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span>标签（用逗号分隔）</span>
          <input
            value={tag_input}
            onChange={(event) => set_tag_input(event.target.value)}
            placeholder="语法, N5, 动词"
          />
        </label>
        <button type="submit">保存单词卡</button>
        {status_message ? <p>{status_message}</p> : null}
      </form>
      <div style={{ border: '1px solid #1f2937', borderRadius: '0.75rem', padding: '1rem' }}>
        <h2>实时预览</h2>
        <SvgCanvas svg_source={svg_source} />
      </div>
    </section>
  );
}
