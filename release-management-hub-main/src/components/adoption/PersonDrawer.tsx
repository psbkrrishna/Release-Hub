import { useMemo } from 'react';
import { UserCircle } from '@phosphor-icons/react';
import EmptyState from '@/components/primitives/EmptyState';
import DataTable from '@/components/adoption/DataTable';
import Drawer from '@/components/adoption/Drawer';
import KpiRow from '@/components/adoption/KpiRow';
import { activityColumns } from '@/components/adoption/columns';
import { customerName, getPersonKpis, getUserActivity, periodWord, userOf } from '@/data/usage/query';
import type { Period } from '@/types/Usage';
import { SPACE, TYPE } from '@/styles/zerra';

/* One person: how much, how often, how recently, and what they actually did.
   The deepest level, so it is a drawer over whatever opened it rather than a
   page of its own. */
const PersonDrawer = ({
  personId,
  featureId,
  period,
  level = 0,
  onClose,
}: {
  personId: string | null;
  featureId?: string;
  period: Period;
  level?: number;
  onClose: () => void;
}) => {
  const scope = useMemo(
    () => ({ period, features: featureId ? [featureId] : undefined, user: personId ?? undefined }),
    [period, featureId, personId],
  );
  const kpis = useMemo(() => (personId ? getPersonKpis(scope) : []), [scope, personId]);
  const activity = useMemo(() => (personId ? getUserActivity(scope) : []), [scope, personId]);
  const person = userOf(personId ?? undefined);
  if (!person) return null;

  return (
    <Drawer
      open
      level={level}
      onClose={onClose}
      title={person.name}
      subtitle={`${person.role} · ${customerName(person.customerId)}`}
    >
      <KpiRow minTile={120} kpis={featureId ? kpis.filter((k) => k.key !== 'features') : kpis} periodWord={periodWord(period)} />
      <section style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x2 }}>
        <h3 style={{ margin: 0, ...TYPE.cardTitle }}>What they did</h3>
        <div style={{ margin: `0 -${SPACE.x4}px` }}>
          <DataTable
            rows={activity}
            columns={activityColumns(!featureId)}
            resetKey={`${personId}|${featureId}|${period}`}
            empty={<EmptyState icon={<UserCircle size={28} />} title="No activity in this period" />}
          />
        </div>
      </section>
    </Drawer>
  );
};

export default PersonDrawer;
