import { ChartLine } from '@phosphor-icons/react';
import EmptyState from '@/components/primitives/EmptyState';
import LineChart from '@/components/adoption/charts/LineChart';
import Segmented from '@/components/adoption/Segmented';
import type { getTrend } from '@/data/usage/query';
import type { TrendMetric } from '@/types/Usage';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* How usage moved across the period, one measure at a time - one axis, never
   two. Release months inside the period are marked, which is usually the first
   thing anyone asks about a jump. */
const TrendPanel = ({
  trend,
  metric,
  onMetric,
}: {
  trend: ReturnType<typeof getTrend>;
  metric: TrendMetric;
  onMetric: (m: TrendMetric) => void;
}) => {
  const empty = trend.points.every((p) => p.value === 0);
  return (
    <section
      aria-labelledby="trend-title"
      style={{
        background: T.card,
        border: `1px solid ${T.bd2}`,
        borderRadius: RADIUS.control,
        padding: SPACE.x4,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACE.x3,
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.x3 }}>
        <div>
          <h2 id="trend-title" style={{ margin: 0, ...TYPE.cardTitle }}>{trend.name}</h2>
          <p style={{ margin: `${SPACE.x1}px 0 0`, ...TYPE.helper, fontSize: 12 }}>
            One point per {trend.grain}. Dashed lines mark a release.
          </p>
        </div>
        <Segmented
          label="Measure"
          value={metric}
          onChange={onMetric}
          options={[
            { value: 'users', label: 'Active users' },
            { value: 'customers', label: 'Active customers' },
            { value: 'events', label: 'Actions' },
          ]}
        />
      </div>
      {empty ? (
        <EmptyState icon={<ChartLine size={28} />} title="No usage in this period">
          Nobody in scope used it in the selected period. Try a longer period or a broader filter.
        </EmptyState>
      ) : (
        <LineChart points={trend.points} markers={trend.markers} name={trend.name} />
      )}
    </section>
  );
};

export default TrendPanel;
