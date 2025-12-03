import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { prepare_svg_markup } from '../services/svg_renderer';
import { use_element_size } from '../hooks/use_element_size';

interface SvgCanvasProps {
  readonly svg_source: string;
  readonly on_swipe?: (direction: 'left' | 'right' | 'up' | 'down') => void;
  readonly orientation?: 'landscape' | 'portrait';
}

type PreviewStatus = 'initializing' | 'empty' | 'error' | 'ready';

interface SwipeTracker {
  readonly pointer_id: number;
  readonly start_x: number;
  readonly start_y: number;
}

const SWIPE_THRESHOLD = 60;
const FALLBACK_HEIGHT = 200;

function resolve_pointer_position(event: ReactPointerEvent<HTMLDivElement>): {
  readonly x: number;
  readonly y: number;
} {
  const native_event = event.nativeEvent as PointerEvent | undefined;
  const pick = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  const x =
    pick(event.clientX) ??
    pick(native_event?.clientX) ??
    pick(event.pageX) ??
    pick(native_event?.pageX) ??
    pick(event.screenX) ??
    pick(native_event?.screenX) ??
    0;
  const y =
    pick(event.clientY) ??
    pick(native_event?.clientY) ??
    pick(event.pageY) ??
    pick(native_event?.pageY) ??
    pick(event.screenY) ??
    pick(native_event?.screenY) ??
    0;
  return { x, y };
}

export function SvgCanvas({ svg_source, on_swipe, orientation = 'landscape' }: SvgCanvasProps) {
  const { attach_ref, size } = use_element_size();
  const swipe_tracker = useRef<SwipeTracker | null>(null);
  const [viewport, set_viewport] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const update_viewport = () => {
      if (typeof window === 'undefined') {
        return;
      }
      set_viewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    update_viewport();
    window.addEventListener('resize', update_viewport);
    return () => {
      window.removeEventListener('resize', update_viewport);
    };
  }, []);

  const trimmed_source = svg_source.trim();
  const is_container_measured = size.width > 0 && size.height > 0;
  const aspect_ratio = orientation === 'portrait' ? 12 / 21 : 21 / 12;

  const dimensions = useMemo(() => {
    const width_limit_candidates = [
      size.width > 0 ? size.width : Number.POSITIVE_INFINITY,
      viewport.width > 0 ? viewport.width - 64 : Number.POSITIVE_INFINITY,
    ];
    const height_limit_candidates = [viewport.height > 0 ? viewport.height - 220 : Number.POSITIVE_INFINITY];
    const max_width = Math.min(...width_limit_candidates);
    const max_height = Math.min(...height_limit_candidates);

    let width = Number.isFinite(max_width) && max_width > 0 ? max_width : FALLBACK_HEIGHT * aspect_ratio;
    let height = width / aspect_ratio;

    if (Number.isFinite(max_height) && max_height > 0 && height > max_height) {
      height = max_height;
      width = height * aspect_ratio;
    }

    if (width <= 0 || height <= 0) {
      height = FALLBACK_HEIGHT;
      width = height * aspect_ratio;
    }

    return {
      width: Math.floor(width),
      height: Math.floor(height),
    };
  }, [aspect_ratio, size.width, viewport.height, viewport.width]);

  const preview_state = useMemo((): { status: PreviewStatus; markup: string } => {
    if (trimmed_source.length === 0) {
      return { status: 'empty', markup: '' };
    }
    if (!is_container_measured) {
      return { status: 'initializing', markup: '' };
    }
    if (dimensions.width === 0 || dimensions.height === 0) {
      return { status: 'initializing', markup: '' };
    }
    const markup = prepare_svg_markup(trimmed_source, {
      container_width: dimensions.width,
      container_height: dimensions.height,
    });
    if (!markup) {
      return { status: 'error', markup: '' };
    }
    return { status: 'ready', markup };
  }, [dimensions.height, dimensions.width, is_container_measured, trimmed_source]);

  const handle_pointer_down = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const position = resolve_pointer_position(event);
    swipe_tracker.current = {
      pointer_id: event.pointerId,
      start_x: position.x,
      start_y: position.y,
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
      const position = resolve_pointer_position(event);
      const delta_x = position.x - swipe_tracker.current.start_x;
      const delta_y = position.y - swipe_tracker.current.start_y;
      swipe_tracker.current = null;
      const abs_x = Math.abs(delta_x);
      const abs_y = Math.abs(delta_y);
      if (abs_x < SWIPE_THRESHOLD && abs_y < SWIPE_THRESHOLD) {
        return;
      }
      const direction =
        abs_x >= abs_y ? (delta_x > 0 ? 'right' : 'left') : delta_y > 0 ? 'down' : 'up';
      on_swipe(direction);
    },
    [on_swipe],
  );

  return (
    <div
      ref={attach_ref}
      className="svg-canvas flex w-full items-center justify-center touch-none border border-app bg-surface p-4 text-muted"
      style={{ touchAction: 'none', minHeight: 160 }}
      onPointerDown={handle_pointer_down}
      onPointerCancel={handle_pointer_cancel}
      onPointerUp={handle_pointer_up}
    >
      {preview_state.status === 'ready' ? (
        <div
          aria-label="svg-preview"
          className="mx-auto"
          style={{
            width: dimensions.width,
            height: dimensions.height,
            fontFamily: '"游明朝", "Yu Mincho", "YuMincho", serif',
          }}
          dangerouslySetInnerHTML={{ __html: preview_state.markup }}
        />
      ) : null}
      {preview_state.status === 'empty' ? (
        <p className="text-sm text-[#94a3b8]">Fill in the card details to preview it here.</p>
      ) : null}
      {preview_state.status === 'error' ? (
        <p className="text-sm text-red-400">SVG could not be parsed. Please check the source.</p>
      ) : null}
      {preview_state.status === 'initializing' ? (
        <p className="text-sm text-[#6b7280]">Loading preview...</p>
      ) : null}
    </div>
  );
}
