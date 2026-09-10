import { useState } from 'react';
/* RocketLaunch, not Rocket: the icon set changed to Phosphor for the
   guidelines, and plain Rocket sits upright where the previous one was angled
   with a trail. RocketLaunch is the closer match to what was there before. */
import { ArrowRight, FileText, MonitorPlay, RocketLaunch } from '@phosphor-icons/react';
import CountChip from '@/components/hub/CountChip';
import { RADIUS, SPACE, T, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   A module on the documentation grid.

   Two states, per the reference: at rest a white card on a --bd2 hairline; on
   hover the border goes brand and the footer row takes the soft blue fill,
   with "Explore documentation" turning brand. The card body stays white so
   the footer reads as the action rather than the whole card changing colour.

   The footer is a <span>, not a nested button - the card itself is the click
   target, and a button inside a button is invalid.
   --------------------------------------------------------------------------- */

const ModuleCard = ({
  name,
  tagline,
  docs,
  videos,
  features,
  onOpen,
}: {
  name: string;
  /** One line. Truncated rather than wrapped if it ever outgrows the card. */
  tagline: string;
  docs: number;
  videos: number;
  features: number;
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
          flexDirection: 'column',
          height: '100%',
          textAlign: 'left',
          background: T.card,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: T.bd2,
          borderRadius: RADIUS.control,
          overflow: 'hidden',
          padding: 0,
          cursor: 'pointer',
          transition: 'border-color 120ms ease',
        },
        hover && { borderColor: T.brand },
      )}
    >
      <span style={{ display: 'block', padding: SPACE.x4, paddingBottom: SPACE.x3 }}>
        <span
          style={{
            display: 'block',
            fontSize: 16,
            fontWeight: 700,
            color: T.tx,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {name}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: SPACE.x1,
            fontSize: 13,
            lineHeight: 1.4,
            color: T.tx3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {tagline}
        </span>

        <span style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.x2, marginTop: SPACE.x3 }}>
          <CountChip tone="documents" icon={FileText} count={docs} label="Documents" />
          <CountChip tone="videos" icon={MonitorPlay} count={videos} label="Videos" />
          <CountChip tone="features" icon={RocketLaunch} count={features} label="Features released" />
        </span>
      </span>

      <span
        style={sx(
          {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
            marginTop: 'auto',
            padding: `${SPACE.x3}px ${SPACE.x4}px`,
            /* --su1 (#FAFAFA) at rest, so the footer reads as its own surface
               step against the white card body rather than disappearing into
               it. Hover takes it to the soft blue. */
            background: T.su1,
            fontSize: 13,
            fontWeight: 500,
            color: T.tx3,
            transition: 'background 120ms ease, color 120ms ease',
          },
          hover && { background: T.brandSoft, color: T.brand },
        )}
      >
        Explore documentation <ArrowRight size={14} />
      </span>
    </button>
  );
};

export default ModuleCard;
