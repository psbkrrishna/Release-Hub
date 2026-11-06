import { useMemo, type ReactNode } from 'react';
import { Buildings, FunnelSimple, UsersThree } from '@phosphor-icons/react';
import Button from '@/components/primitives/Button';
import EmptyState from '@/components/primitives/EmptyState';
import DataTable from '@/components/adoption/DataTable';
import Drawer from '@/components/adoption/Drawer';
import FunnelPanel from '@/components/adoption/FunnelPanel';
import KpiRow from '@/components/adoption/KpiRow';
import Note from '@/components/adoption/Note';
import { actionColumns, customerColumns, featureColumns, type Column } from '@/components/adoption/columns';
import {
  eventFeatureOf, eventLabel, featureInfo, featureTitle, getBreakdown, getFunnel, getKpis, periodWord,
  type BreakdownRow, type Kpi,
} from '@/data/usage/query';
import type { AdoptionFilters, AdoptionList } from '@/types/Usage';
import { SPACE, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The drawers a module, feature or action row opens - the same rule as a
   customer row: clicking a row explains it, it never changes the page.
   Changing the page is an explicit button in the footer ("Filter page to
   this ..."), so a reader always knows which of the two will happen.

   Each drawer keeps the page's other filters (period, customers, ...) so its
   numbers agree with the row that opened it, and each ends at the same
   place: the customers to contact, which open the company drawer on top -
   the SPOC, then the people.
   --------------------------------------------------------------------------- */

const Section = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x2 }}>
    <div>
      <h3 style={{ margin: 0, ...TYPE.cardTitle }}>{title}</h3>
      {hint && <p style={{ margin: `${SPACE.x1}px 0 0`, ...TYPE.helper, fontSize: 12 }}>{hint}</p>}
    </div>
    <div style={{ margin: `0 -${SPACE.x4}px` }}>{children}</div>
  </section>
);

/** Pick columns by key and narrow them to fit a drawer. */
const fit = (cols: Column<BreakdownRow>[], keys: string[], widths: Record<string, number> = {}) =>
  keys.map((k) => cols.find((c) => c.key === k)!).map((c) => (widths[c.key] ? { ...c, width: widths[c.key] } : c));

const pickKpis = (all: Kpi[], keys: string[], labels: Record<string, string> = {}) =>
  keys
    .map((k) => all.find((x) => x.key === k))
    .filter((k): k is Kpi => Boolean(k))
    .map((k) => ({ ...k, spark: undefined, note: undefined, label: labels[k.key] ?? k.label }));

/** Customers who need a nudge here - not started, stopped or declining -
 *  most urgent first, each with its next step. */
const followUps = (scope: AdoptionFilters) =>
  getBreakdown(scope, 'customer').filter((r) => r.lists?.includes('start') || r.lists?.includes('declining'));

const FollowUpTable = ({ rows, onOpen, resetKey }: { rows: BreakdownRow[]; onOpen: (id: string) => void; resetKey: string }) => (
  <DataTable
    rows={rows}
    columns={fit(customerColumns, ['name', 'status', 'step'], { name: 180, step: 170 })}
    onOpen={(r) => onOpen(r.id)}
    openLabel={(r) => `Open ${r.name}`}
    perPage={5}
    resetKey={resetKey}
    empty={<EmptyState icon={<Buildings size={28} />} title="Nobody to follow up">Every customer here is using it, steadily or more.</EmptyState>}
  />
);

const FilterButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Button variant="secondary" onClick={onClick}>
    <FunnelSimple size={18} />{label}
  </Button>
);

type Common = {
  /** The page's filters - kept, so the drawer agrees with its row. */
  filters: AdoptionFilters;
  level: number;
  onClose: () => void;
  onOpenCustomer: (id: string, featureId?: string) => void;
};

/* ---- Module --------------------------------------------------------------- */

export const ModuleDrawer = ({
  module, filters, level, onClose, onOpenCustomer, onOpenFeature, onFilter,
}: Common & { module: string; onOpenFeature: (id: string) => void; onFilter: () => void }) => {
  const scope = useMemo(() => ({ ...filters, modules: [module] }), [filters, module]);
  const kpis = useMemo(
    () => pickKpis(getKpis(scope), ['enabled', 'active', 'users', 'actions'], { enabled: 'Switched on', active: 'Using it' }),
    [scope],
  );
  const features = useMemo(() => getBreakdown(scope, 'feature'), [scope]);
  const toFollow = useMemo(() => followUps(scope), [scope]);

  return (
    <Drawer
      open
      level={level}
      onClose={onClose}
      title={`${module} module`}
      subtitle={`${features.length} released ${features.length === 1 ? 'feature' : 'features'} · last ${periodWord(filters.period)}`}
      footer={<FilterButton label="Filter page to this module" onClick={onFilter} />}
    >
      <KpiRow kpis={kpis} minTile={110} periodWord={periodWord(filters.period)} />
      <Section title="Features in this module" hint="Most follow-ups first. Select one to see how it is doing.">
        <DataTable
          rows={features}
          columns={fit(featureColumns, ['name', 'enabled', 'active', 'followUps'], { name: 200, enabled: 96, active: 80, followUps: 112 })}
          onOpen={(r) => onOpenFeature(r.id)}
          openLabel={(r) => `Open ${r.name}`}
          perPage={6}
          resetKey={`${module}|${filters.period}`}
          empty={<EmptyState icon={<FunnelSimple size={28} />} title="No released features match the filters" />}
        />
      </Section>
      <Section title="Customers to follow up" hint="Switched on but not using a feature here, or using it less.">
        <FollowUpTable rows={toFollow} onOpen={(id) => onOpenCustomer(id)} resetKey={`${module}|f`} />
      </Section>
    </Drawer>
  );
};

/* ---- Feature -------------------------------------------------------------- */

export const FeatureDrawer = ({
  feature, filters, level, onClose, onOpenCustomer, onOpenAction, onFilter, onFilterList,
}: Common & {
  feature: string;
  onOpenAction: (key: string) => void;
  onFilter: () => void;
  /** Filter the page to this feature and one funnel step. */
  onFilterList: (list: AdoptionList) => void;
}) => {
  const info = featureInfo(feature);
  const scope = useMemo(() => ({ ...filters, modules: undefined, features: [feature] }), [filters, feature]);
  const funnel = useMemo(() => getFunnel(scope), [scope]);
  const kpis = useMemo(
    () => pickKpis(getKpis(scope), ['users', 'daily', 'power', 'actions'], { users: 'Active users' }),
    [scope],
  );
  const actions = useMemo(() => getBreakdown(scope, 'event'), [scope]);
  const toFollow = useMemo(() => followUps(scope), [scope]);

  return (
    <Drawer
      open
      level={level}
      onClose={onClose}
      title={info?.title ?? feature}
      subtitle={`${info?.module ?? ''} · ${info?.releaseMonth ?? ''} release`}
      footer={<FilterButton label="Filter page to this feature" onClick={onFilter} />}
    >
      <FunnelPanel
        steps={funnel.steps}
        unit={funnel.unit}
        active="all"
        onPick={onFilterList}
        hint="Select a number to filter the page to those customers."
      />
      <KpiRow kpis={kpis} minTile={110} periodWord={periodWord(filters.period)} />
      <Section title="How it's used" hint="Each action people take inside it. Select one to see who does it.">
        <DataTable
          rows={actions}
          columns={fit(actionColumns, ['name', 'events', 'users', 'change'], { name: 200, events: 96, users: 80 })}
          onOpen={(r) => onOpenAction(r.id)}
          openLabel={(r) => `Open ${r.name}`}
          perPage={5}
          resetKey={`${feature}|${filters.period}`}
          empty={<EmptyState icon={<UsersThree size={28} />} title="No usage in this period" />}
        />
      </Section>
      <Section title="Customers to follow up" hint="Switched on but not using it, or using it less.">
        <FollowUpTable rows={toFollow} onOpen={(id) => onOpenCustomer(id, feature)} resetKey={`${feature}|f`} />
      </Section>
    </Drawer>
  );
};

/* ---- Action --------------------------------------------------------------- */

export const ActionDrawer = ({
  action, filters, level, onClose, onOpenCustomer, onFilter,
}: Common & { action: string; onFilter: () => void }) => {
  const featureId = eventFeatureOf(action);
  const scope = useMemo(
    () => ({ ...filters, modules: undefined, features: featureId ? [featureId] : undefined, events: [action] }),
    [filters, featureId, action],
  );
  const kpis = useMemo(
    () => pickKpis(getKpis(scope), ['actions', 'users', 'active'], { actions: 'Times done', users: 'People', active: 'Customers' }),
    [scope],
  );
  /* Who does it most - the customers to ask, or to learn from. */
  const customers = useMemo(
    () => getBreakdown(scope, 'customer').filter((r) => r.events > 0).sort((a, b) => b.events - a.events),
    [scope],
  );

  return (
    <Drawer
      open
      level={level}
      onClose={onClose}
      title={eventLabel(action) ?? action}
      subtitle={`An action in ${featureTitle(featureId) ?? 'this feature'}`}
      footer={<FilterButton label="Filter page to this action" onClick={onFilter} />}
    >
      <KpiRow kpis={kpis} minTile={110} periodWord={periodWord(filters.period)} />
      {customers.length > 0 && (
        <Note>Select a customer to see its SPOC and the people doing this action.</Note>
      )}
      <Section title="Customers who do it most">
        <DataTable
          rows={customers}
          columns={fit(customerColumns, ['name', 'events', 'users', 'change'], { name: 200, events: 88, users: 96 })}
          onOpen={(r) => onOpenCustomer(r.id, featureId)}
          openLabel={(r) => `Open ${r.name}`}
          perPage={6}
          resetKey={`${action}|${filters.period}`}
          empty={<EmptyState icon={<UsersThree size={28} />} title="Nobody did this in the period" />}
        />
      </Section>
    </Drawer>
  );
};
