import { useEffect, useState } from 'react';

/* A media query as a boolean.
 *
 * The app styles from inline styles, which cannot express a breakpoint, so a
 * component that genuinely changes shape at one - rather than just changing a
 * size - reads it here instead. Subscribes to the query rather than to resize,
 * so it fires once per crossing and not on every pixel. */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    // Keep in step if the query itself changes between renders.
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

/** The width the hub switches from stacked to side-by-side at. */
export const WIDE = '(min-width: 1181px)';
