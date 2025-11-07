import { useEffect, useState } from 'react';

interface ViewportSize {
  readonly width: number;
  readonly height: number;
}

const INITIAL_SIZE: ViewportSize = {
  width: 0,
  height: 0,
};

function get_safe_viewport_size(): ViewportSize {
  if (typeof window === 'undefined') {
    return INITIAL_SIZE;
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function useViewportSize(): ViewportSize {
  const [size, set_size] = useState<ViewportSize>(get_safe_viewport_size);

  useEffect(() => {
    function handle_resize() {
      set_size(get_safe_viewport_size());
    }

    window.addEventListener('resize', handle_resize);
    return () => {
      window.removeEventListener('resize', handle_resize);
    };
  }, []);

  return size;
}

export const use_viewport_size = useViewportSize;
