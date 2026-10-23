import { useState, type CSSProperties, type ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DOC_SECTIONS } from '@/components/hub/docSections';
import { KB_MODULES } from '@/data/knowledge';
import { useMediaQuery, WIDE } from '@/hooks/useMediaQuery';
import { useHubVersion } from '@/components/HubVersionProvider';
import { CONTENT_TOP, RADIUS, SHELL, SPACE, T, TYPE, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Navigation for a module page.

   A column of modules, and nothing else - the per-section documentation links
   that used to sit in here made the pane a mixed list of destinations and
   content, and a reader scanning for "Recruiting" had to read past them.

   It runs from the bottom of the hub header to the bottom of the viewport, so
   it is the page's left edge rather than a card floating in the corner. The
   three section destinations are pinned to the foot of it as quick links,
   where a persistent nav usually keeps them.

   Below 1181px it stacks above the content as a plain bordered block: a 248px
   column and a content column do not both fit, and at that width the nav is
   the first thing you want anyway.
   --------------------------------------------------------------------------- */

const ROW: CSSProperties = {
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  gap: SPACE.x2,
  padding: `${SPACE.x2}px ${SPACE.x3}px`,
  borderRadius: RADIUS.control,
  border: 'none',
  background: 'none',
  textAlign: 'left',
  fontSize: 14,
  color: T.tx2,
  cursor: 'pointer',
  transition: 'background 120ms ease, color 120ms ease',
};

const EYEBROW: CSSProperties = {
  margin: `0 0 ${SPACE.x1}px ${SPACE.x3}px`,
  ...TYPE.eyebrow,
};

/** One navigable row. `current` renders it as the page you are on rather than
 *  as a link to it. */
const NavRow = ({
  label,
  icon: Icon,
  current,
  onSelect,
}: {
  label: string;
  icon?: ComponentType<{ size?: number | string }>;
  current: boolean;
  onSelect: () => void;
}) => {
  const [hover, setHover] = useState(false);

  if (current) {
    return (
      <span
        aria-current="page"
        style={sx(ROW, { background: T.brandSoft, color: T.brand, fontWeight: 600, cursor: 'default' })}
      >
        {Icon && <Icon size={15} />}
        <span style={{ minWidth: 0, flex: 1 }}>{label}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={sx(ROW, hover && { background: T.su2, color: T.tx })}
    >
      {Icon && <Icon size={15} />}
      <span style={{ minWidth: 0, flex: 1 }}>{label}</span>
    </button>
  );
};

/** Whether `pathname` is this row's own page, or something nested under it -
 *  a document under its module, or a release note / newsletter under its
 *  list - so opening one of those keeps the right row marked current rather
 *  than lighting nothing up. */
const isCurrent = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);

const DocsNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const wide = useMediaQuery(WIDE);
  const { version } = useHubVersion();

  /* V1's header is sticky and a known height, so the nav fills the viewport
     below it. V2's header scrolls away, so there is nothing to measure: the
     nav sticks 16px under the top bar at its natural height, capped to the
     viewport, and the quick links follow the modules instead of being pinned
     to a foot that would sit below the fold at scroll 0. */
  const stickyStyle =
    version === 'v2'
      ? {
          top: SHELL.topBar + SPACE.x4,
          maxHeight: `calc(100vh - ${SHELL.topBar + SPACE.x4}px)`,
        }
      : { top: CONTENT_TOP, height: `calc(100vh - ${CONTENT_TOP}px)` };

  return (
    <nav
      aria-label="Modules"
      style={sx(
        { display: 'flex', flexDirection: 'column', flexShrink: 0, background: T.card },
        wide
          ? {
              position: 'sticky',
              alignSelf: 'flex-start',
              width: 248,
              borderRight: `1px solid ${T.bd2}`,
              ...stickyStyle,
            }
          : { width: '100%', borderBottom: `1px solid ${T.bd2}` },
      )}
    >
      <div
        style={sx(
          {
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: `${SPACE.x3}px ${SPACE.x2}px`,
          },
          /* Stacked above the content, the full list is 570px of nav before
             the page starts. Capped, it scrolls within itself and the quick
             links below it stay in view. */
          !wide && { maxHeight: 200 },
        )}
      >
        <h2 style={EYEBROW}>Modules</h2>
        {KB_MODULES.map((m) => (
          <NavRow
            key={m.slug}
            label={m.name}
            current={isCurrent(pathname, `/product-hub/knowledge/modules/${m.slug}`)}
            onSelect={() => navigate(`/product-hub/knowledge/modules/${m.slug}`)}
          />
        ))}
      </div>

      <div
        style={{
          borderTop: `1px solid ${T.bd}`,
          padding: `${SPACE.x3}px ${SPACE.x2}px`,
        }}
      >
        <h2 style={EYEBROW}>Quick links</h2>
        {DOC_SECTIONS.map(({ label, icon, path }) => (
          <NavRow
            key={path}
            label={label}
            icon={icon}
            current={isCurrent(pathname, path)}
            onSelect={() => navigate(path)}
          />
        ))}
      </div>
    </nav>
  );
};

export default DocsNav;
