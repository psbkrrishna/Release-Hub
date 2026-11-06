import { ArrowDownRight, ArrowUpRight, Info } from '@phosphor-icons/react';
import Tooltip from '@/components/primitives/Tooltip';
import type { Kpi } from '@/data/usage/query';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* The usage numbers behind the funnel, on one line - each with its change on
   the period before. Direction is shown by the arrow, never by colour. */

const fmt = (k: Kpi) =>
  k.display ?? (k.format === 'percent' ? `${(k.value * 100).toFixed(k.value < 0.1 ? 1 : 0)}%` : Math.round(k.value).toLocaleString('en-IN'));

const delta = (k: Kpi) => {
  if (k.previous === null || k.compare === false) return null;
  const diff = k.value - k.previous;
  if (Math.abs(diff) < 1e-9) return { up: null, text: 'No change' };
  if (k.format === 'percent') return { up: diff > 0, text: `${diff > 0 ? '+' : '-'}${Math.abs(diff * 100).toFixed(1)} pts` };
  if (!k.previous) return { up: true, text: 'New' };
  return { up: diff > 0, text: `${diff > 0 ? '+' : '-'}${Math.abs(Math.round((100 * diff) / k.previous))}%` };
};

const MetricLine = ({ kpis, periodWord }: { kpis: Kpi[]; periodWord: string }) => (
  <section
    aria-label="Usage numbers"
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 1,
      background: T.bd,
      border: `1px solid ${T.bd2}`,
      borderRadius: RADIUS.control,
      overflow: 'hidden',
    }}
  >
    {kpis.map((k) => {
      const d = delta(k);
      return (
        <div key={k.key} style={{ flex: '1 1 150px', minWidth: 0, background: T.card, padding: `${SPACE.x3}px ${SPACE.x4}px` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.x1 }}>
            <span style={{ ...TYPE.fieldLabel, color: T.tx3 }}>{k.label}</span>
            <Tooltip label={k.hint}>
              <span tabIndex={0} aria-label={k.hint} style={{ display: 'inline-flex', color: T.tx4, cursor: 'help' }}>
                <Info size={13} />
              </span>
            </Tooltip>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACE.x2, marginTop: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: T.tx, fontVariantNumeric: 'tabular-nums' }}>{fmt(k)}</span>
            {d && (
              <span
                aria-label={`${d.text} vs previous ${periodWord}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, color: T.tx3, fontVariantNumeric: 'tabular-nums' }}
              >
                {d.up === true && <ArrowUpRight size={12} weight="bold" />}
                {d.up === false && <ArrowDownRight size={12} weight="bold" />}
                {d.text}
              </span>
            )}
          </div>
        </div>
      );
    })}
  </section>
);

export default MetricLine;
