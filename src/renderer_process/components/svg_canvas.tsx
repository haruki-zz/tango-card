import { useCallback, useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { prepare_svg_markup } from '../services/svg_renderer';
import { use_element_size } from '../hooks/use_element_size';

interface SvgCanvasProps {
  readonly svg_source: string;
  readonly on_swipe?: (direction: 'left' | 'right' | 'up' | 'down') => void;
}

type PreviewStatus = 'initializing' | 'empty' | 'error' | 'ready';

interface SwipeTracker {
  readonly pointer_id: number;
  readonly start_x: number;
  readonly start_y: number;
}

const SWIPE_THRESHOLD = 60;

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
      className="w-full min-h-[240px] touch-none rounded-xl bg-white p-4 [aspect-ratio:21/12]"
      style={{ touchAction: 'none' }}
      onPointerDown={handle_pointer_down}
      onPointerCancel={handle_pointer_cancel}
      onPointerUp={handle_pointer_up}
    >
      {preview_state.status === 'ready' ? (
        <div aria-label="svg-preview" dangerouslySetInnerHTML={{ __html: preview_state.markup }} />
      ) : null}
      {preview_state.status === 'empty' ? (
        <p className="text-sm text-[#6b7280]">Fill in the card details to preview it here.</p>
      ) : null}
      {preview_state.status === 'error' ? (
        <p className="text-sm text-red-600">SVG could not be parsed. Please check the source.</p>
      ) : null}
      {preview_state.status === 'initializing' ? (
        <p className="text-sm text-[#6b7280]">Loading preview...</p>
      ) : null}
    </div>
  );
}
