import { useMemo } from 'react';
import { prepare_svg_markup } from '../services/svg_renderer';
import { use_element_size } from '../hooks/use_element_size';

interface SvgCanvasProps {
  readonly svg_source: string;
}

type PreviewStatus = 'initializing' | 'empty' | 'error' | 'ready';

export function SvgCanvas({ svg_source }: SvgCanvasProps) {
  const { attach_ref, size } = use_element_size();

  const trimmed_source = svg_source.trim();

  const preview_state = useMemo((): { status: PreviewStatus; markup: string } => {
    if (trimmed_source.length === 0) {
      return { status: 'empty', markup: '' };
    }
    if (size.width === 0 || size.height === 0) {
      return { status: 'initializing', markup: '' };
    }
    const markup = prepare_svg_markup(trimmed_source, {
      container_width: size.width,
      container_height: size.height,
    });
    if (!markup) {
      return { status: 'error', markup: '' };
    }
    return { status: 'ready', markup };
  }, [trimmed_source, size.height, size.width]);

  return (
    <div ref={attach_ref} className="svg-canvas" style={{ width: '100%', height: '100%' }}>
      {preview_state.status === 'ready' ? (
        <div aria-label="svg-preview" dangerouslySetInnerHTML={{ __html: preview_state.markup }} />
      ) : null}
      {preview_state.status === 'empty' ? (
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>粘贴 SVG 源码后即可在此查看预览。</p>
      ) : null}
      {preview_state.status === 'error' ? (
        <p style={{ color: '#f87171', fontSize: '0.9rem' }}>SVG 无法解析，请检查源码。</p>
      ) : null}
      {preview_state.status === 'initializing' ? (
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>预览加载中...</p>
      ) : null}
    </div>
  );
}
