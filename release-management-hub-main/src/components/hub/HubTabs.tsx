import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RADIUS, SPACE, T, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The hub's three sections.

   They are peers, not a hierarchy, which is why the breadcrumb never restates
   the active tab - the strip already says which one you are on, and the
   breadcrumb only names a level deeper than a tab root.

   No icons: three tab labels do not need decorating, and one of them is long
   enough that an icon only pushed it further from its neighbour.
   --------------------------------------------------------------------------- */

export type HubTab = 'overview' | 'releases' | 'knowledge';

export const HUB_TABS = [
  { key: 'overview', label: 'Overview', path: '/release-hub/overview' },
  { key: 'releases', label: 'Release Hub', path: '/release-hub/releases' },
  {
    key: 'knowledge',
    label: 'Product & Feature Documentation',
    path: '/release-hub/knowledge',
  },
] as const;

/** Feature detail has no tab of its own - it is a leaf of the Release Hub tab,
 *  and reads as one. */
export const hubTabOf = (pathname: string): HubTab => {
  if (pathname.startsWith('/release-hub/knowledge')) return 'knowledge';
  if (pathname.startsWith('/release-hub/releases') || pathname.startsWith('/release-hub/features')) {
    return 'releases';
  }
  return 'overview';
};

const HubTabs = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = hubTabOf(pathname);
  const [hover, setHover] = useState<string | null>(null);

  return (
    /* Edge to edge: the strip's rule spans the full canvas, so the 16px page
       padding is cancelled with a negative margin and given back to the tabs
       as padding. The scroller is separate because the creator's feature table
       is 1680px wide and the strip must not ride that horizontal scroll. */
    <div
      style={{
        margin: `0 -${SPACE.x4}px ${SPACE.x4}px`,
        borderBottom: `1px solid ${T.bd2}`,
      }}
    >
      <nav aria-label="Release Hub sections" style={{ overflowX: 'auto', marginBottom: -1 }}>
        <div
          style={{
            display: 'flex',
            gap: SPACE.x1,
            minWidth: 'max-content',
            padding: `0 ${SPACE.x4}px`,
          }}
        >
          {HUB_TABS.map(({ key, label, path }) => {
            const on = key === active;
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigate(path)}
                onMouseEnter={() => setHover(key)}
                onMouseLeave={() => setHover(null)}
                aria-current={on ? 'page' : undefined}
                style={sx(
                  {
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    background: 'none',
                    border: 'none',
                    borderBottom: '2px solid transparent',
                    borderTopLeftRadius: RADIUS.control,
                    borderTopRightRadius: RADIUS.control,
                    padding: `${SPACE.x3}px ${SPACE.x4}px`,
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.tx3,
                    cursor: 'pointer',
                    transition: 'color 120ms ease, border-color 120ms ease',
                  },
                  hover === key && !on && { color: T.tx },
                  on && { color: T.brand, borderBottomColor: T.brand },
                )}
              >
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
