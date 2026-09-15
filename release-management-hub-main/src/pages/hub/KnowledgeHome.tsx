import { useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import HubHeader from '@/components/hub/HubHeader';
import ModuleCard from '@/components/hub/ModuleCard';
import { DOC_SECTIONS } from '@/components/hub/docSections';
import { useFeatureStore } from '@/components/FeatureStore';
import { KB_MODULES } from '@/data/knowledge';
import { RADIUS, SPACE, T, TYPE, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The documentation landing page: search, the three cross-module destinations,
   then every module.

   Two groups, and they have to read as two kinds of thing. Release notes,
   newsletters and videos span every module; a module card is one module's own
   documentation. They were briefly the same kind of card here, stacked three
   abreast above the grid, and the page read as six equal choices - so these
   three are now compact tinted tiles, roughly a third the height of a module
   card, under their own eyebrow and separated by a rule.

   The module grid is one flat list, not families. Ten modules split five ways
   gave most groups one or two cards each, which is a heading per card - a
   grouping that does no grouping. When there are enough modules for a family to
   mean something, the grid is where that goes back.
   --------------------------------------------------------------------------- */

/** One cross-module destination. Deliberately unlike ModuleCard: no count
 *  chips, no footer action, one line of copy, and a tinted ground. */
const SectionTile = ({
  icon: Icon,
  label,
  sub,
  onOpen,
}: {
  icon: ComponentType<{ size?: number | string }>;
  label: string;
  sub: string;
  onOpen: () => void;
}) => {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={sx(
        {
          display: 'flex',
          alignItems: 'center',
          gap: SPACE.x3,
          width: '100%',
          textAlign: 'left',
          background: T.brandSoft,
          /* Longhand, not the `border` shorthand: hover changes only the
             background, and React warns when a shorthand and its longhand are
             both set across a rerender. */
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: T.brandBorder,
          borderRadius: RADIUS.control,
          padding: SPACE.x3,
          cursor: 'pointer',
          transition: 'background 120ms ease, border-color 120ms ease',
        },
        /* The interaction rules' usual hover fill - soft blue - is already this
           tile's resting colour, so both halves of the hover step once further
           into the same ramp: --brand-softHover for the fill, and the border
           --brand-border -> --brand, which is ModuleCard's exact grammar. */
        hover && { background: T.brandSoftHover, borderColor: T.brand },
      )}
    >
      <span style={{ display: 'flex', flexShrink: 0, color: T.brand }}>
        <Icon size={20} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={sx({ display: 'block', ...TYPE.cardTitle }, hover && { color: T.brand })}>
          {label}
        </span>
        {/* One line, ellipsed - a longer sub can never take the tile to two. */}
        <span
          style={{
            display: 'block',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            ...TYPE.helper,
          }}
        >
          {sub}
        </span>
      </span>
    </button>
  );
};

const KnowledgeHome = () => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();

  return (
    <>
      <HubHeader />

      <h2 style={{ margin: `0 0 ${SPACE.x2}px`, ...TYPE.eyebrow }}>Across all modules</h2>
      <div className="grid grid-cols-1 gap-3 min-[601px]:grid-cols-3">
        {DOC_SECTIONS.map(({ label, sub, icon, path }) => (
          <SectionTile
            key={path}
            icon={icon}
            label={label}
            sub={sub}
            onOpen={() => navigate(path)}
          />
        ))}
      </div>

      <h2
        style={{
          margin: `${SPACE.x6}px 0 ${SPACE.x2}px`,
          paddingTop: SPACE.x6,
          /* --bd2, not --bd. This rule sits on the canvas (--bg #FAFAFA), not
             on a white card, and --bd (#ECECEE) against that is all but
             invisible. */
          borderTop: `1px solid ${T.bd2}`,
          ...TYPE.eyebrow,
        }}
      >
        By module
      </h2>
      <div className="grid grid-cols-1 gap-4 min-[601px]:grid-cols-2 min-[1181px]:grid-cols-3">
        {KB_MODULES.map((m) => (
          <ModuleCard
            key={m.slug}
            name={m.name}
            /* The tagline, not the blurb: it is written to fit one line,
               which the blurb is not. */
            tagline={m.tagline}
            docs={m.docs.length}
            videos={m.videos.length}
            features={visibleFeatures.filter((f) => f.productModule === m.name).length}
            onOpen={() => navigate(`/release-hub/knowledge/modules/${m.slug}`)}
          />
        ))}
      </div>
    </>
  );
};

export default KnowledgeHome;
