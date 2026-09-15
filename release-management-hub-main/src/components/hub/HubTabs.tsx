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
  /* "Documentation", not "Product & Feature Documentation": a nav label is
     read at a glance, and the long form was wider than the other two tabs
     combined. The pages under it still say what they document. */
  { key: 'knowledge', label: 'Documentation', path: '/release-hub/knowledge' },
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
       is 1680px wide and the strip must not ride that horizontal scroll.

       No bottom margin - the strip is the last thing in the white header
       container, and its rule is that container's bottom edge. */
    <div
      style={{
        margin: `0 -${SPACE.x4}px`,
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
                    /* The active tab overrides borderBottomColor alone, so that
                       one property has to be declared here as the same longhand
                       and must have no shorthand competing with it. React warns
                       - and drops the override - when a shorthand and its
                       longhand are both set across a rerender, and `border`,
                       `borderBottom`, `borderColor` and `borderWidth` are all
                       shorthands for it. Width and style never change, so they
                       can stay shorthand. */
                    borderWidth: 0,
                    borderBottomWidth: 2,
                    borderStyle: 'solid',
                    borderBottomColor: 'transparent',
                    borderTopLeftRadius: RADIUS.control,
                    borderTopRightRadius: RADIUS.control,
                    /* 4px between the label and the underline, not 12. The
                       label and its stroke are one mark; a wide gap read as
                       two unrelated things. The weight moves to the top
                       padding so the strip keeps a sensible touch target.
                       16 + 20 + 4 + 2 = 42, which SHELL.hubHeader counts on. */
                    padding: `${SPACE.x4}px ${SPACE.x4}px ${SPACE.x1}px`,
                    lineHeight: '20px',
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
