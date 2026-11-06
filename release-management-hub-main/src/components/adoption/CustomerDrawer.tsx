import { useMemo } from 'react';
import { Buildings, UsersThree } from '@phosphor-icons/react';
import Button from '@/components/primitives/Button';
import EmptyState from '@/components/primitives/EmptyState';
import ContactCard from '@/components/adoption/ContactCard';
import DataTable from '@/components/adoption/DataTable';
import Drawer from '@/components/adoption/Drawer';
import KpiRow from '@/components/adoption/KpiRow';
import Note from '@/components/adoption/Note';
import { Change, STATUS, accountColumns, peopleColumns } from '@/components/adoption/columns';
import {
  customerOf, featureTitle, getBreakdown, getCustomerFeatures, getKpis, type BreakdownRow,
} from '@/data/usage/query';
import type { Period } from '@/types/Usage';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   One company, opened from any list without leaving the page.

   Company first, then its people - the way a CSM actually works an account:
     1. who to talk to (the SPOC, and the Zwayam CSM who owns it);
     2. where it stands and what to do;
     3. three numbers, and for a declining account, what dropped;
     4. the people using it, power users marked, reached through the SPOC;
     5. every other feature at the account - each opens as the page's
        feature, which is how someone moves sideways without starting over.
   --------------------------------------------------------------------------- */

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x2 }}>
    <h3 style={{ margin: 0, ...TYPE.cardTitle }}>{title}</h3>
    {children}
  </section>
);

/** Tables run edge to edge inside the drawer's padding. */
const Bleed = ({ children }: { children: React.ReactNode }) => (
  <div style={{ margin: `0 -${SPACE.x4}px` }}>{children}</div>
);

const CustomerDrawer = ({
  customerId,
  featureId,
  period,
  level = 0,
  onClose,
  onOpenPerson,
  onOpenFeature,
  onOpenAccount,
}: {
  customerId: string | null;
  featureId?: string;
  period: Period;
  level?: number;
  onClose: () => void;
  onOpenPerson: (id: string) => void;
  onOpenFeature: (id: string) => void;
  onOpenAccount: (id: string) => void;
}) => {
  const scope = useMemo(
    () => ({ period, customer: customerId ?? undefined, feature: featureId }),
    [period, customerId, featureId],
  );
  const customer = customerOf(customerId ?? undefined);
  const here: BreakdownRow | undefined = useMemo(
    () => (customerId && featureId ? getBreakdown(scope, 'customer')[0] : undefined),
    [scope, customerId, featureId],
  );
  const features = useMemo(() => (customerId ? getCustomerFeatures({ period, customer: customerId }) : []), [period, customerId]);
  /* Everyone using it, power users first - the people the SPOC can
     introduce. */
  const people = useMemo(
    () =>
      customerId && featureId
        ? [...getBreakdown(scope, 'user')].sort((a, b) => Number(b.power) - Number(a.power) || b.events - a.events)
        : [],
    [scope, customerId, featureId],
  );
  /* For a declining account: which actions fell, most first. */
  const dropped = useMemo(
    () =>
      here?.status === 'declining'
        ? getBreakdown(scope, 'event')
            .filter((e) => e.change !== null && e.change < 0)
            .sort((a, b) => (a.change ?? 0) - (b.change ?? 0))
        : [],
    [scope, here],
  );
  const kpis = useMemo(() => {
    if (!customerId) return [];
    /* Actions first: it is what Growing and Declining are judged on, so the
       first number agrees with the status above it. */
    const all = getKpis(scope);
    return ['actions', 'users', 'power']
      .map((key) => all.find((k) => k.key === key)!)
      .map((k) => ({ ...k, spark: undefined, note: undefined, label: k.key === 'users' ? 'Active users' : k.label }));
  }, [scope, customerId]);

  if (!customer) return null;
  const toFollow = features.filter((f) => f.status === 'not-started' || f.status === 'stopped' || f.status === 'declining').length;
  const powerCount = people.filter((p) => p.power).length;

  return (
    <Drawer
      open
      level={level}
      onClose={onClose}
      title={customer.name}
      subtitle={`${customer.industry} · ${customer.tier}`}
      footer={
        !featureId ? undefined : (
          <Button variant="secondary" onClick={() => onOpenAccount(customer.id)}>
            <Buildings size={18} />See all of {customer.name}
          </Button>
        )
      }
    >
      <ContactCard customer={customer} />

      {here?.status ? (
        <Note>
          <b style={{ color: T.tx }}>{STATUS[here.status].label}</b> on {featureTitle(featureId)}.{' '}
          {here.nextStep === 'No action needed' ? 'No action needed.' : `Next step: ${here.nextStep!.toLowerCase()}.`}
        </Note>
      ) : (
        !featureId && (
          <Note>
            {toFollow
              ? `${toFollow} of ${features.length} features here need a follow-up. They are listed first below.`
              : 'Every feature switched on here is in use. No follow-up needed.'}
          </Note>
        )
      )}

      <KpiRow kpis={kpis} minTile={120} periodWord={period === '12m' ? '12 months' : `${parseInt(period, 10)} days`} />

      {dropped.length > 0 && (
        <Section title="What dropped">
          <div style={{ border: `1px solid ${T.bd2}`, borderRadius: RADIUS.control, overflow: 'hidden' }}>
            {dropped.map((e, i) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: SPACE.x3,
                  padding: `${SPACE.x2}px ${SPACE.x3}px`,
                  borderTop: i ? `1px solid ${T.bd}` : 'none',
                  fontSize: 13,
                }}
              >
                <span style={{ color: T.tx, fontWeight: 600 }}>{e.name}</span>
                <span style={{ display: 'inline-flex', gap: SPACE.x3, color: T.tx2, whiteSpace: 'nowrap' }}>
                  <span style={{ color: T.tx3 }}>{Math.round(e.events).toLocaleString('en-IN')} times now</span>
                  <Change value={e.change} />
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {featureId && (
        <Section title="People using it">
          {powerCount > 0 && (
            <Note icon={<UsersThree size={16} />}>
              {powerCount} power {powerCount === 1 ? 'user is' : 'users are'} listed first. Reach them through{' '}
              {customer.spoc.name}, not directly.
            </Note>
          )}
          <Bleed>
            <DataTable
              rows={people}
              columns={peopleColumns
                .filter((c) => ['name', 'events', 'days'].includes(c.key))
                .map((c) => (c.key === 'name' ? { ...c, width: 220 } : c))}
              onOpen={(r) => onOpenPerson(r.id)}
              openLabel={(r) => `Open ${r.name}`}
              perPage={5}
              resetKey={`${customerId}|${featureId}|${period}`}
              empty={<EmptyState icon={<UsersThree size={28} />} title="Nobody used it in this period" />}
            />
          </Bleed>
        </Section>
      )}

      <Section title={featureId ? 'Other features at this account' : 'Features at this account'}>
        <Bleed>
          <DataTable
            rows={features.filter((f) => f.id !== featureId)}
            columns={accountColumns
              .filter((c) => ['name', 'status', 'step'].includes(c.key))
              .map((c) => (c.key === 'name' ? { ...c, width: 180 } : c.key === 'step' ? { ...c, width: 150 } : c))}
            onOpen={(r) => onOpenFeature(r.id)}
            openLabel={(r) => `Show ${r.name}`}
            perPage={6}
            resetKey={`${customerId}|${period}`}
            empty={<EmptyState icon={<Buildings size={28} />} title="No other features switched on or available" />}
          />
        </Bleed>
      </Section>
    </Drawer>
  );
};

export default CustomerDrawer;
