import { ArrowDownRight, ArrowUpRight, Info } from '@phosphor-icons/react';
import Tooltip from '@/components/primitives/Tooltip';
import Sparkline from '@/components/adoption/charts/Sparkline';
import type { Kpi } from '@/data/usage/query';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The headline numbers for whatever is in scope. Six tiles split by 1px
   internal borders rather than gaps - the grid's own --bd background shows
   through a 1px gap - so they wrap to fewer columns on a narrow screen without
   any tile losing its edge.
   --------------------------------------------------------------------------- */

const show = (k: Kpi, v: number) =>
  k.format === 'percent' ? `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%` : Math.round(v).toLocaleString();

/** Change against the previous period, in words a reader can repeat. */
const Delta = ({ kpi, period }: { kpi: Kpi; period: string }) => {
  if (kpi.previous === null) {
    return <span style={{ fontSize: 12, color: T.tx4 }}>No earlier period to compare</span>;
  }
  const diff = kpi.value - kpi.previous;
  if (kpi.previous === 0 && kpi.value === 0) {
    return <span style={{ fontSize: 12, color: T.tx4 }}>No change vs previous {period}</span>;
  }
  const text =
    kpi.format === 'percent'
      ? `${diff >= 0 ? '+' : '−'}${Math.abs(diff * 100).toFixed(1)} pts`
      : kpi.previous === 0
        ? 'New this period'
        : `${diff >= 0 ? '+' : '−'}${Math.abs(Math.round((100 * diff) / kpi.previous))}%`;
  const up = diff > 0;
  const flat = Math.abs(diff) < 1e-9;
  if (flat) return <span style={{ fontSize: 12, color: T.tx3 }}>No change vs previous {period}</span>;
  const color = up ? T.succText : T.dangText;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE.x1, fontSize: 12, fontWeight: 600, color }}>
      {up ? <ArrowUpRight size={12} weight="bold" /> : <ArrowDownRight size={12} weight="bold" />}
      {text}
      <span style={{ fontWeight: 400, color: T.tx3 }}>vs previous {period}</span>
    </span>
  );
};

const KpiRow = ({
  kpis,
  periodWord,
  minTile = 190,
}: {
  kpis: Kpi[];
  periodWord: string;
  /** Narrowest a tile gets before the row wraps; smaller inside a drawer. */
  minTile?: number;
}) => (
  /* Flex rather than grid: a wrapped last row stretches its tiles to the
     edge, where a grid would leave an empty cell of border colour. */
  <div
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
    {kpis.map((k) => (
      <div
        key={k.key}
        style={{
          flex: `1 1 ${minTile}px`,
          background: T.card,
          padding: SPACE.x4,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACE.x1,
          minWidth: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.x1 }}>
          <span style={TYPE.fieldLabel}>{k.label}</span>
          <Tooltip label={k.hint}>
            <span tabIndex={0} aria-label={k.hint} style={{ display: 'inline-flex', color: T.tx4, cursor: 'help' }}>
              <Info size={14} />
            </span>
          </Tooltip>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: SPACE.x2 }}>
          <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.2, color: T.tx, fontVariantNumeric: 'tabular-nums' }}>
            {k.display ?? show(k, k.value)}
          </span>
          {k.spark && <Sparkline values={k.spark} width={72} height={24} />}
        </div>
        <div style={{ fontSize: 12, color: T.tx3, minHeight: 16 }}>{k.note ?? ' '}</div>
        {k.compare !== false && <Delta kpi={k} period={periodWord} />}
      </div>
    ))}
  </div>
);

export default KpiRow;
