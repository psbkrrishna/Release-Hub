import { useLocation, useNavigate } from 'react-router-dom';
import { House, Rocket, BookOpen } from 'lucide-react';

/* ---------------------------------------------------------------------------
   The hub's three sections.

   They are peers, not a hierarchy, which is why the breadcrumb above this strip
   never restates the active tab - the strip already says which one you are on.
   The breadcrumb only names a level deeper than a tab root.
   --------------------------------------------------------------------------- */

export type HubTab = 'home' | 'releases' | 'knowledge';

export const HUB_TABS = [
  { key: 'home', label: 'Home', icon: House, path: '/release-hub/home' },
  { key: 'releases', label: 'Release Management', icon: Rocket, path: '/release-hub/releases' },
  { key: 'knowledge', label: 'Knowledge Hub', icon: BookOpen, path: '/release-hub/knowledge' },
] as const;

/** Feature detail has no tab of its own - it is a leaf of Release Management,
 *  and reads as one. */
export const hubTabOf = (pathname: string): HubTab => {
  if (pathname.startsWith('/release-hub/knowledge')) return 'knowledge';
  if (pathname.startsWith('/release-hub/releases') || pathname.startsWith('/release-hub/features')) {
    return 'releases';
  }
  return 'home';
};

const HubTabs = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = hubTabOf(pathname);

  return (
    /* The rule sits on the wrapper and the scroller carries the -1px, so the
       active underline straddles it without a negative margin inside the
       scroll box - `overflow-x: auto` makes the cross axis scrollable too, and
       a 1px overhang there would earn a stray vertical scrollbar.

       It needs its own scroller at all because the creator's feature table is
       1680px wide; without one the strip would ride that horizontal scroll. */
    <div className="mb-5 border-b border-ink-150">
      <nav aria-label="Release Hub sections" className="-mb-px overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {HUB_TABS.map(({ key, label, icon: Icon, path }) => {
            const on = key === active;
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigate(path)}
                aria-current={on ? 'page' : undefined}
                className={[
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5',
                  'text-sm transition-colors',
                  on
                    ? 'border-brand font-semibold text-brand'
                    : 'border-transparent text-ink-600 hover:border-ink-200 hover:text-ink-900',
                ].join(' ')}
              >
                <Icon size={16} className="shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default HubTabs;
