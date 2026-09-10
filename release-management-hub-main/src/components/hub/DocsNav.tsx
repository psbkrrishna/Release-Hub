import { useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CaretRight, FileText, Envelope, MonitorPlay, Books } from '@phosphor-icons/react';
import { KB_GROUPS } from '@/data/knowledge';
import { RADIUS, SPACE, T, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Navigation for the Product & Feature Documentation tab.

   This used to be an "Other modules" panel sitting in the right column of a
   module page, below the videos - which put the way out of a page after all of
   its content, and made a set of destinations read as tags. As a left pane it
   is where navigation belongs: present on every page of the tab, showing the
   whole shape of the documentation, with the current page marked.

   Sticky, so it stays put while a long module page scrolls beside it.
   --------------------------------------------------------------------------- */

const SECTIONS = [
  { label: 'Release notes', icon: FileText, path: '/release-hub/knowledge/release-notes' },
  { label: 'Newsletters', icon: Envelope, path: '/release-hub/knowledge/newsletters' },
  { label: 'Video library', icon: MonitorPlay, path: '/release-hub/knowledge/videos' },
];

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

/** One navigable row. `current` renders it as the page you are on rather than
 *  as a link to it. */
const NavRow = ({
  label,
  icon: Icon,
  current,
  onSelect,
}: {
  label: string;
  icon?: typeof FileText;
  current: boolean;
  onSelect: () => void;
}) => {
  const [hover, setHover] = useState(false);

  if (current) {
    return (
      <span
        aria-current="page"
        style={sx(ROW, {
          background: T.brandSoft,
          color: T.brand,
          fontWeight: 600,
          cursor: 'default',
        })}
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
      <CaretRight size={12} style={{ flexShrink: 0, color: T.tx4 }} />
    </button>
  );
};

const DocsNav = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isRoot = pathname === '/release-hub/knowledge';

  return (
    <nav
      aria-label="Documentation"
      style={{
        position: 'sticky',
        /* Clears the fixed 56px top bar plus the page's 16px padding. */
        top: 72,
        alignSelf: 'start',
        background: T.card,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: T.bd2,
        borderRadius: RADIUS.control,
        boxShadow: T.elev1,
        padding: SPACE.x3,
        maxHeight: 'calc(100vh - 96px)',
        overflowY: 'auto',
      }}
    >
      <NavRow
        label="All documentation"
        icon={Books}
        current={isRoot}
        onSelect={() => navigate('/release-hub/knowledge')}
      />

      <div style={{ marginTop: SPACE.x2, borderTop: `1px solid ${T.bd}`, paddingTop: SPACE.x2 }}>
        {SECTIONS.map(({ label, icon, path }) => (
          <NavRow
            key={path}
            label={label}
            icon={icon}
            current={pathname === path}
            onSelect={() => navigate(path)}
          />
        ))}
      </div>

      <div style={{ marginTop: SPACE.x2, borderTop: `1px solid ${T.bd}`, paddingTop: SPACE.x3 }}>
        <h3
          style={{
            margin: `0 0 ${SPACE.x2}px ${SPACE.x3}px`,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: T.tx4,
          }}
        >
          By module
        </h3>

        {KB_GROUPS.map((group) => (
          <div key={group.name} style={{ marginBottom: SPACE.x2 }}>
            <h4
              style={{
                margin: `0 0 ${SPACE.x1}px ${SPACE.x3}px`,
                fontSize: 12,
                fontWeight: 600,
                color: T.tx3,
              }}
            >
              {group.name}
            </h4>
            {group.modules.map((m) => (
              <NavRow
                key={m.slug}
                label={m.name}
                current={pathname === `/release-hub/knowledge/modules/${m.slug}`}
                onSelect={() => navigate(`/release-hub/knowledge/modules/${m.slug}`)}
              />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default DocsNav;
