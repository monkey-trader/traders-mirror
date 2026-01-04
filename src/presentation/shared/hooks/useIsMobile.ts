import { useEffect, useState } from 'react';

export function useIsMobile(maxWidth = 480) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof globalThis === 'undefined' || typeof (globalThis as any).matchMedia === 'undefined') return false;
    try {
      return (globalThis as any).matchMedia(`(max-width:${maxWidth}px)`).matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof globalThis === 'undefined' || typeof (globalThis as any).matchMedia === 'undefined') return;
    const mq = (globalThis as any).matchMedia(`(max-width:${maxWidth}px)`);
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
