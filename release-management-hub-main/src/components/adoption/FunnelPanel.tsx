import { useId } from 'react';
import Tooltip from '@/components/primitives/Tooltip';
import type { FunnelStep } from '@/data/usage/query';
import type { AdoptionList } from '@/types/Usage';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   From the whole customer base down to the customers who could vouch for it.

   Starts at every customer, not at "enabled", so the biggest gap - customers
   who never switched it on - is the first thing on the page instead of
   invisible. Each count is a link that filters the table to that step;
   each step says what share of the one above it got there.
   --------------------------------------------------------------------------- */

const FunnelPanel = ({
  steps,
  unit,
  active,
  onPick,
  hint = 'Select a number to list them below.',
}: {
  steps: FunnelStep[];
  unit: 'customers' | 'features';
  /** The step the table is filtered to, if any. */
  active: AdoptionList;
  onPick: (key: AdoptionList) => void;
  /** What selecting a number does - it differs inside a drawer. */
  hint?: string;
}) => {
  const titleId = useId();
  const top = Math.max(1, steps[0]?.count ?? 1);
  return (
    <section
      aria-labelledby={titleId}
      style={{ background: T.card, border: `1px solid ${T.bd2}`, borderRadius: RADIUS.control, padding: SPACE.x4, display: 'flex', flexDirection: 'column', gap: SPACE.x3 }}
    >
      <div>
        <h2 id={titleId} style={{ margin: 0, ...TYPE.cardTitle }}>{unit === 'features' ? 'Feature funnel' : 'Customer funnel'}</h2>
        <p style={{ margin: `${SPACE.x1}px 0 0`, ...TYPE.helper, fontSize: 12 }}>{hint}</p>
      </div>
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1] : null;
        const share = prev && prev.count ? Math.round((100 * s.count) / prev.count) : null;
        const isActive = active === s.key;
        return (
          <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: SPACE.x3 }}>
              <Tooltip label={s.hint}>
                <span tabIndex={0} style={{ fontSize: 13, fontWeight: 600, color: T.tx, cursor: 'help' }}>{s.label}</span>
              </Tooltip>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: SPACE.x2, whiteSpace: 'nowrap' }}>
                <button
                  type="button"
                  onClick={() => onPick(s.key)}
                  aria-label={`List ${s.count} ${unit}: ${s.label.toLowerCase()}`}
                  aria-pressed={isActive}
                  style={{
                    border: 'none',
                    background: isActive ? T.brandSoft : 'transparent',
                    borderRadius: RADIUS.tag,
                    padding: '0 4px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 16,
                    fontWeight: 700,
                    color: T.brand,
                    textDecoration: 'underline',
                    textDecorationColor: T.brandBorder,
                    textUnderlineOffset: 3,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.count.toLocaleString('en-IN')}
                </button>
                <span style={{ ...TYPE.helper, fontSize: 12, minWidth: 64, textAlign: 'left', fontVariantNumeric: 'tabular-nums' }}>
                  {share === null ? '' : `${share}% of above`}
                </span>
              </span>
            </div>
            <div aria-hidden="true" style={{ height: 8, borderRadius: 999, background: T.su2, overflow: 'hidden' }}>
              <div style={{ width: `${(100 * s.count) / top}%`, height: '100%', borderRadius: 999, background: T.brand, opacity: 1 - i * 0.12 }} />
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default FunnelPanel;
