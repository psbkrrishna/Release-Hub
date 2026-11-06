/* ---------------------------------------------------------------------------
   Saved views - the whole state of the page (filters, period, grouping, list)
   under a name, so it can be reopened in one click.

   Stored in this browser only, as the query string the page already keeps
   its state in. Storage can be unavailable (private windows, blocked site
   data), so every read and write is guarded and the page works without it.
   --------------------------------------------------------------------------- */

export interface SavedView {
  id: string;
  name: string;
  /** The page's query string, without the leading "?". */
  query: string;
}

const KEY = 'adoption.savedViews.v1';

export const loadViews = (): SavedView[] => {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as SavedView[]) : [];
    return Array.isArray(list) ? list.filter((v) => v && typeof v.name === 'string' && typeof v.query === 'string') : [];
  } catch {
    return [];
  }
};

export const storeViews = (views: SavedView[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(views));
  } catch {
    // Not persisted; the views still work for this visit.
  }
};

/** Two query strings mean the same view when their parameters match,
 *  in any order. */
export const sameQuery = (a: string, b: string) => {
  const norm = (q: string) => [...new URLSearchParams(q).entries()].map(([k, v]) => `${k}=${v}`).sort().join('&');
  return norm(a) === norm(b);
};
