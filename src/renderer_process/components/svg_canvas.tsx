import { useCallback, useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { prepare_svg_markup } from '../services/svg_renderer';
import { use_element_size } from '../hooks/use_element_size';

interface SvgCanvasProps {
  readonly svg_source: string;
  readonly on_swipe?: (direction: 'left' | 'right') => void;
}

type PreviewStatus = 'initializing' | 'empty' | 'error' | 'ready';

interface SwipeTracker {
  readonly pointer_id: number;
  readonly start_x: number;
  readonly start_y: number;
}

const SWIPE_THRESHOLD = 60;

export function SvgCanvas({ svg_source, on_swipe }: SvgCanvasProps) {
  const { attach_ref, size } = use_element_size();
  const swipe_tracker = useRef<SwipeTracker | null>(null);

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

  const handle_pointer_down = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    swipe_tracker.current = {
      pointer_id: event.pointerId,
      start_x: event.clientX,
      start_y: event.clientY,
    };
  }, []);

  const handle_pointer_cancel = useCallback(() => {
    swipe_tracker.current = null;
  }, []);

  const handle_pointer_up = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!on_swipe) {
        swipe_tracker.current = null;
        return;
      }
      if (!swipe_tracker.current || swipe_tracker.current.pointer_id !== event.pointerId) {
        swipe_tracker.current = null;
        return;
      }
      const delta_x = event.clientX - swipe_tracker.current.start_x;
      const delta_y = event.clientY - swipe_tracker.current.start_y;
      swipe_tracker.current = null;
      if (Math.abs(delta_x) < SWIPE_THRESHOLD || Math.abs(delta_x) <= Math.abs(delta_y)) {
        return;
      }
      const direction = delta_x > 0 ? 'right' : 'left';
      on_swipe(direction);
    },
    [on_swipe],
  );

  return (
    <div
      ref={attach_ref}
      className="svg-canvas"
      style={{ width: '100%', height: '100%' }}
      onPointerDown={handle_pointer_down}
      onPointerCancel={handle_pointer_cancel}
      onPointerUp={handle_pointer_up}
    >
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
