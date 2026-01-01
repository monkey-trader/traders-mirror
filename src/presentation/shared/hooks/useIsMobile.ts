import { useEffect, useState } from 'react';

export function useIsMobile(maxWidth = 480) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return false;
    try {
      return window.matchMedia(`(max-width:${maxWidth}px)`).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') return;
    const mq = window.matchMedia(`(max-width:${maxWidth}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    try {
      mq.addEventListener('change', handler);
    } catch {
      // older browsers - fallback to legacy API if available
      (
        mq as unknown as { addListener?: (h: (e: MediaQueryListEvent) => void) => void }
      ).addListener?.(handler);
    }
    setIsMobile(mq.matches);
    return () => {
      try {
        mq.removeEventListener('change', handler);
      } catch {
        // older browsers - fallback to legacy API if available
        (
          mq as unknown as { removeListener?: (h: (e: MediaQueryListEvent) => void) => void }
        ).removeListener?.(handler);
      }
    };
  }, [maxWidth]);

  return isMobile;
}

export default useIsMobile;
