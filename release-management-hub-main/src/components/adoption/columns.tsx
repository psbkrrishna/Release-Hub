import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Star } from '@phosphor-icons/react';
import Badge from '@/components/primitives/Badge';
import { formatDate } from '@/data/features';
import type { ActivityRow, BreakdownRow } from '@/data/usage/query';
import type { UsageStatus } from '@/types/Usage';
import { SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The columns of every table on the adoption page and in its drawers.

   Each column renders a cell and gives the plain value the CSV export writes,
   so a downloaded list has the columns its reader was looking at. Every
   column is left-aligned. Values are never coloured red or green - status
   lives in one badge column, and the next step says what to do about it.
   --------------------------------------------------------------------------- */

export interface Column<R> {
  key: string;
  header: string;
  width?: number;
  /** The export's header, where the screen's would lose a unit. */
  csvHeader?: string;
  render: (row: R) => ReactNode;
  csv: (row: R) => string | number | undefined;
}

const count = (v?: number) => Math.round(v ?? 0).toLocaleString('en-IN');
const num = (v?: number) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count(v)}</span>;
const pct = (v?: number | null) => (v === null || v === undefined ? '-' : `${Math.round(v * 100)}%`);
const pctCsv = (v?: number | null) => (v === null || v === undefined ? '' : Math.round(v * 100));

/** The row's own name, with its context underneath. Its colour inherits from
 *  the cell, which turns it brand blue on row hover. */
const Name = ({ name, sub }: { name: string; sub?: string }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ ...TYPE.cellPrimary, color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {name}
    </div>
    {sub && (
      <div style={{ ...TYPE.cellSecondary, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {sub}
      </div>
    )}
  </div>
);

/** Period-on-period change: direction by arrow, never by colour. */
export const Change = ({ value }: { value: number | null }) => {
  if (value === null) return <span style={{ color: T.tx4 }}>-</span>;
  const p = Math.round(value * 100);
  if (p === 0) return <span style={{ fontVariantNumeric: 'tabular-nums' }}>0%</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
      {p > 0 ? <ArrowUpRight size={12} weight="bold" /> : <ArrowDownRight size={12} weight="bold" />}
      {p > 0 ? '+' : '-'}{Math.abs(p)}%
    </span>
  );
};
const changeCsv = (v: number | null) => (v === null ? '' : Math.round(v * 100));

export const STATUS: Record<UsageStatus, { label: string; variant: 'success' | 'static' | 'danger' | 'warning' }> = {
  growing: { label: 'Growing', variant: 'success' },
  steady: { label: 'Steady', variant: 'static' },
  declining: { label: 'Declining', variant: 'danger' },
  stopped: { label: 'Stopped using', variant: 'warning' },
  'not-started': { label: 'Not started', variant: 'warning' },
  eligible: { label: 'Not switched on', variant: 'static' },
  none: { label: 'No access', variant: 'static' },
};

const StatusBadge = ({ status }: { status?: UsageStatus }) =>
  status ? (
    <Badge variant={STATUS[status].variant} style={{ height: 20, fontWeight: 500 }}>{STATUS[status].label}</Badge>
  ) : null;

/** The instruction, plain; "No action needed" recedes so the rows that need
 *  something stand out down the column. */
const Step = ({ text }: { text?: string }) => (
  <span style={{ color: text === 'No action needed' ? T.tx4 : T.tx, fontWeight: text === 'No action needed' ? 400 : 600 }}>
    {text}
  </span>
);

const changeCol: Column<BreakdownRow> = {
  key: 'change',
  header: 'Change',
  csvHeader: 'Change %',
  width: 88,
  render: (r) => <Change value={r.change} />,
  csv: (r) => changeCsv(r.change),
};
const statusCol: Column<BreakdownRow> = {
  key: 'status', header: 'Status', width: 132,
  render: (r) => <StatusBadge status={r.status} />, csv: (r) => (r.status ? STATUS[r.status].label : ''),
};
const stepCol: Column<BreakdownRow> = {
  key: 'step', header: 'Next step', width: 220, render: (r) => <Step text={r.nextStep} />, csv: (r) => r.nextStep,
};
const usersCol: Column<BreakdownRow> = {
  key: 'users', header: 'Active users', width: 108, render: (r) => num(r.activeUsers), csv: (r) => r.activeUsers,
};

const actionsCol: Column<BreakdownRow> = {
  key: 'events', header: 'Actions', width: 96, render: (r) => num(r.events), csv: (r) => r.events,
};

/** Customers, with the usage numbers on every row. The SPOC and CSM are in
 *  the company drawer, and in the export, rather than taking two columns. */
export const customerColumns: Column<BreakdownRow>[] = [
  { key: 'name', header: 'Customer', width: 220, render: (r) => <Name name={r.name} sub={r.sub} />, csv: (r) => r.name },
  statusCol,
  usersCol,
  {
    key: 'daily', header: 'Daily avg', width: 92,
    render: (r) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{(r.dailyAvg ?? 0).toFixed(1)}</span>,
    csv: (r) => (r.dailyAvg ?? 0).toFixed(1),
  },
  actionsCol,
  { key: 'power', header: 'Power users', width: 104, render: (r) => num(r.powerUsers), csv: (r) => r.powerUsers },
  changeCol,
  stepCol,
];

/** Extra columns for an exported customer list - who to contact. */
export const customerExportColumns: Array<{ header: string; value: (r: BreakdownRow) => unknown }> = [
  { header: 'SPOC', value: (r) => r.spocName },
  { header: 'SPOC role', value: (r) => r.spocRole },
  { header: 'SPOC email', value: (r) => r.spocEmail },
  { header: 'CSM', value: (r) => r.csm },
];

/** Modules, for the platform view. */
export const moduleColumns: Column<BreakdownRow>[] = [
  { key: 'name', header: 'Module', width: 260, render: (r) => <Name name={r.name} sub={r.sub} />, csv: (r) => r.name },
  { key: 'enabled', header: 'Switched on', width: 112, render: (r) => num(r.enabledCustomers), csv: (r) => r.enabledCustomers },
  { key: 'active', header: 'Using it', width: 96, render: (r) => num(r.activeCustomers), csv: (r) => r.activeCustomers },
  { key: 'activation', header: 'Activation', csvHeader: 'Activation %', width: 96, render: (r) => pct(r.activation), csv: (r) => pctCsv(r.activation) },
  usersCol,
  actionsCol,
  changeCol,
];

/** Every action in scope, so a single action's numbers are one row away. */
export const actionColumns: Column<BreakdownRow>[] = [
  { key: 'name', header: 'Action', width: 300, render: (r) => <Name name={r.name} sub={r.sub} />, csv: (r) => r.name },
  { key: 'events', header: 'Times done', width: 104, render: (r) => num(r.events), csv: (r) => r.events },
  { key: 'users', header: 'People', width: 88, render: (r) => num(r.activeUsers), csv: (r) => r.activeUsers },
  { key: 'customers', header: 'Customers', width: 100, render: (r) => num(r.activeCustomers), csv: (r) => r.activeCustomers },
  changeCol,
];

/** Every feature, for the overall view: how far each has got, and how many
 *  customers need a nudge. */
export const featureColumns: Column<BreakdownRow>[] = [
  { key: 'name', header: 'Feature', width: 300, render: (r) => <Name name={r.name} sub={r.sub} />, csv: (r) => r.name },
  { key: 'enabled', header: 'Switched on', width: 112, render: (r) => num(r.enabledCustomers), csv: (r) => r.enabledCustomers },
  { key: 'active', header: 'Using it', width: 96, render: (r) => num(r.activeCustomers), csv: (r) => r.activeCustomers },
  { key: 'activation', header: 'Activation', csvHeader: 'Activation %', width: 96, render: (r) => pct(r.activation), csv: (r) => pctCsv(r.activation) },
  usersCol,
  actionsCol,
  changeCol,
  {
    key: 'followUps',
    header: 'To follow up',
    width: 132,
    render: (r) =>
      r.followUps ? (
        <span style={{ fontWeight: 600, color: T.tx }}>{count(r.followUps)} {r.followUps === 1 ? 'customer' : 'customers'}</span>
      ) : (
        <span style={{ color: T.tx4 }}>None</span>
      ),
    csv: (r) => r.followUps,
  },
];

/** One customer's features - the account view. */
export const accountColumns: Column<BreakdownRow>[] = [
  { key: 'name', header: 'Feature', width: 300, render: (r) => <Name name={r.name} sub={r.sub} />, csv: (r) => r.name },
  statusCol,
  usersCol,
  actionsCol,
  changeCol,
  stepCol,
];

export const peopleColumns: Column<BreakdownRow>[] = [
  {
    key: 'name',
    header: 'Person',
    width: 260,
    render: (r) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.x2, minWidth: 0 }}>
        <Name name={r.name} sub={r.role} />
        {r.power && (
          <Badge variant="static" style={{ height: 20, padding: '0 8px', fontWeight: 500, flexShrink: 0 }}>
            <Star size={12} weight="fill" />Power user
          </Badge>
        )}
      </div>
    ),
    csv: (r) => r.name,
  },
  { key: 'customer', header: 'Customer', width: 180, render: (r) => r.customerName, csv: (r) => r.customerName },
  { key: 'events', header: 'Actions', width: 96, render: (r) => num(r.events), csv: (r) => r.events },
  { key: 'days', header: 'Active days', width: 104, render: (r) => num(r.activeDays), csv: (r) => r.activeDays },
  { key: 'last', header: 'Last active', width: 120, render: (r) => formatDate(r.lastActive), csv: (r) => r.lastActive },
];

export const activityColumns = (showFeature: boolean): Column<ActivityRow>[] => [
  { key: 'date', header: 'Date', width: 104, render: (r) => formatDate(r.date), csv: (r) => r.date },
  { key: 'event', header: 'Action', width: 220, render: (r) => <Name name={r.event} sub={showFeature ? r.feature : undefined} />, csv: (r) => r.event },
  { key: 'count', header: 'Times', width: 64, render: (r) => num(r.count), csv: (r) => r.count },
];
