import { useCallback, useRef, useState } from 'react';

interface ElementSize {
  readonly width: number;
  readonly height: number;
}

const INITIAL_SIZE: ElementSize = { width: 0, height: 0 };

function useElementSize() {
  const resize_observer_ref = useRef<ResizeObserver | null>(null);
  const [size, set_size] = useState<ElementSize>(INITIAL_SIZE);

  const release_observer = useCallback(() => {
    if (resize_observer_ref.current) {
      resize_observer_ref.current.disconnect();
      resize_observer_ref.current = null;
    }
  }, []);

  const attach_ref = useCallback(
    (node: HTMLElement | null) => {
      release_observer();
      if (!node) {
        set_size(INITIAL_SIZE);
        return;
      }

      if (typeof ResizeObserver === 'undefined') {
        const { width, height } = node.getBoundingClientRect();
        set_size({
          width: Math.round(width),
          height: Math.round(height),
        });
        return;
      }

      resize_observer_ref.current = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        const { width, height } = entry.contentRect;
        set_size({
          width: Math.round(width),
          height: Math.round(height),
        });
      });
      resize_observer_ref.current.observe(node);
    },
    [release_observer],
  );

  return {
    attach_ref,
    size,
  };
}

export const use_element_size = useElementSize;
