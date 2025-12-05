import { useEffect, useState } from 'react';

interface WindowSize {
  readonly width: number;
  readonly height: number;
}

const INITIAL_SIZE: WindowSize = { width: 0, height: 0 };

function useWindowSize(): WindowSize {
  const [size, set_size] = useState<WindowSize>(INITIAL_SIZE);

  useEffect(() => {
    const update = () => {
      if (typeof window === 'undefined') {
        return;
      }
      set_size({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}

export const use_window_size = useWindowSize;
