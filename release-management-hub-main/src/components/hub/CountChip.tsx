import { useState, type ComponentType } from 'react';
import { RADIUS, SPACE, T, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   A count on a module card: a tinted chip holding an icon and a number, with
   the noun on a tooltip rather than in the label - three spelled-out counts
   made the card's last line longer than its title.

   The tooltip is the Zerra one: --neutral-strong, white, 12px, radius 6,
   6px 8px padding, with a caret pointing back at the chip. Built here rather
   than as a native `title` so it matches the rest of the system.
   --------------------------------------------------------------------------- */

type Tone = 'documents' | 'videos' | 'features';

const TONE: Record<Tone, { background: string; color: string }> = {
  /* Documents are brand; videos take the success family, matching the
     reference design. Features stay neutral - a third accent would be
     inventing a colour the palette does not have. */
  documents: { background: T.brandSoft, color: T.brand },
  videos: { background: T.succSoft, color: T.succText },
  features: { background: T.su2, color: T.tx3 },
};

const CountChip = ({
  tone,
  icon: Icon,
  count,
  label,
}: {
  tone: Tone;
  icon: ComponentType<{ size?: number | string }>;
  count: number;
  /** The noun shown on hover, e.g. "Documents". */
  label: string;
}) => {
  const [hover, setHover] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        style={sx(
          {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 24,
            padding: `0 ${SPACE.x2}px`,
            borderRadius: RADIUS.tag,
            fontSize: 12,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          },
          TONE[tone],
        )}
      >
        <Icon size={13} />
        {count}
      </span>

      {hover && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 40,
            display: 'inline-block',
            whiteSpace: 'nowrap',
            background: T.neutralStrong,
            color: '#FFFFFF',
            borderRadius: RADIUS.tag,
            padding: '6px 8px',
            fontSize: 12,
            fontWeight: 400,
            animation: 'scrimIn 120ms ease',
          }}
        >
          {/* The caret, pointing back up at the chip. */}
          <span
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 10,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: `5px solid ${T.neutralStrong}`,
            }}
          />
          {label}
        </span>
      )}
    </span>
  );
};

export default CountChip;
