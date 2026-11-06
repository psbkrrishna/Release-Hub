import { useEffect, useMemo, useState } from 'react';
import { DownloadSimple, LockSimple, MagnifyingGlass, RocketLaunch, UsersThree, X } from '@phosphor-icons/react';
import Button from '@/components/primitives/Button';
import Crumb from '@/components/primitives/Crumb';
import EmptyState from '@/components/primitives/EmptyState';
import { inputStyle } from '@/components/primitives/fieldStyles';
import { useFeatureStore } from '@/components/FeatureStore';
import ContactCard from '@/components/adoption/ContactCard';
import CustomerDrawer from '@/components/adoption/CustomerDrawer';
import DataTable from '@/components/adoption/DataTable';
import FilterBar from '@/components/adoption/FilterBar';
import FunnelPanel from '@/components/adoption/FunnelPanel';
import MetricGlossary from '@/components/adoption/MetricGlossary';
import MetricLine from '@/components/adoption/MetricLine';
import Note from '@/components/adoption/Note';
import PersonDrawer from '@/components/adoption/PersonDrawer';
import ScopeSentence from '@/components/adoption/ScopeSentence';
import TrendPanel from '@/components/adoption/TrendPanel';
import {
  accountColumns, actionColumns, customerColumns, customerExportColumns, featureColumns, moduleColumns, type Column,
} from '@/components/adoption/columns';
import { formatDate } from '@/data/features';
import {
  asOf, customerName, customerOf, eventLabel, featureTitle, getBreakdown, getCustomerFeatures, getFunnel, getKpis,
  getTrend, isReleased, toCsv, type BreakdownRow,
} from '@/data/usage/query';
import { listsApply, useAdoptionFilters } from '@/hooks/useAdoptionFilters';
import type { AdoptionList, Breakdown, Period } from '@/types/Usage';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Feature adoption - for the platform, a module, or one feature.

   Laid out as the guidelines' analytics report (Hiring Funnel Reports):
     - a sentence header: "Adoption of <level>, by <breakdown>";
     - a sticky filter bar: customer, action, period;
     - the charts first - the customer funnel from the whole base, and the
       trend - with the usage numbers on one line under them;
     - one table, with the same numbers on every row, filtered by a funnel
       step or a next step without leaving the page.
   A company opens in a drawer (its SPOC, its people); a person opens stacked
   over it. Nothing else leaves the page.
   --------------------------------------------------------------------------- */

const PERIOD_WORD: Record<Period, string> = { '30d': '30 days', '90d': '90 days', '180d': '180 days', '12m': '12 months' };
const BY_TITLE: Record<Breakdown, string> = { customers: 'Customers', modules: 'Modules', features: 'Features', actions: 'Actions' };

/** The next-step filters, in the order they are worked. */
const NEXT_LISTS: Array<{ key: AdoptionList; label: string }> = [
  { key: 'start', label: 'To start' },
  { key: 'declining', label: 'Declining' },
  { key: 'offer', label: 'Could switch on' },
  { key: 'references', label: 'Reference-ready' },
];
/** Funnel steps, shown as a removable filter when picked from the funnel. */
const STEP_LABEL: Partial<Record<AdoptionList, string>> = { 'can-use': 'Can use it', on: 'Switched on', using: 'Using it' };

/** What to do for each list - one line, always through the SPOC. */
const LIST_ADVICE: Partial<Record<AdoptionList, string>> = {
  start: 'Contact the SPOC to book an enablement session, and walk their team through the first task.',
  declining: 'Ask the SPOC what changed: a new admin, a process change, or a problem with the feature.',
  offer: 'Raise it with the SPOC in the next account review, naming a reference-ready customer as proof.',
  references: 'Ask the SPOC to introduce you to their power users for a case study, webinar or beta.',
};
/** The step each list asks for, shown in the Next step column while it is on. */
const LIST_STEP: Partial<Record<AdoptionList, string>> = {
  start: 'Book an enablement session',
  declining: 'Check in on the drop',
  offer: 'Offer to switch it on',
  references: 'Ask the SPOC for an introduction',
};

type Layer = { kind: 'customer'; id: string; featureId?: string } | { kind: 'person'; id: string; featureId?: string };

const download = (name: string, text: string) => {
  // A BOM so Excel reads the file as UTF-8.
  const url = URL.createObjectURL(new Blob(['﻿', text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const AdoptionPage = () => {
  const { isCreator, isImplementation, toast } = useFeatureStore();
  const { filters, by, list, metric, update } = useAdoptionFilters();
  const [query, setQuery] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [glossary, setGlossary] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);

  /* Arriving from the Releases table keeps that page's scroll position. */
  useEffect(() => { window.scrollTo(0, 0); }, []);
  /* A new scope closes whatever was open over the old one. */
  useEffect(() => { setLayers([]); setQuery(''); }, [filters.feature, filters.module, filters.customer]);

  const released = isReleased(filters.feature);
  const accountView = Boolean(filters.customer && !filters.feature);
  const levelName = featureTitle(filters.feature) ?? (filters.module ? `${filters.module} module` : 'Platform');
  const scopedCustomer = customerOf(filters.customer);

  const funnel = useMemo(() => getFunnel(filters), [filters]);
  const trend = useMemo(() => getTrend(filters, metric), [filters, metric]);
  const metrics = useMemo(() => {
    const all = getKpis(filters);
    return ['users', 'daily', 'stickiness', 'power', 'actions'].map((k) => all.find((x) => x.key === k)!);
  }, [filters]);

  /* The one table. */
  const allRows: BreakdownRow[] = useMemo(() => {
    if (by === 'customers') return getBreakdown(filters, 'customer');
    if (by === 'modules') return getBreakdown(filters, 'module');
    if (by === 'actions') return getBreakdown(filters, 'event');
    return accountView ? getCustomerFeatures(filters, true) : getBreakdown(filters, 'feature');
  }, [filters, by, accountView]);
  const filterable = listsApply(filters, by);
  const listCount = (k: AdoptionList) => allRows.filter((r) => r.lists?.includes(k)).length;
  const listed = useMemo(() => {
    if (!filterable || list === 'all') return allRows;
    const step = LIST_STEP[list];
    return allRows.filter((r) => r.lists?.includes(list)).map((r) => (step ? { ...r, nextStep: step } : r));
  }, [allRows, filterable, list]);
  const q = query.trim().toLowerCase();
  const shown = q ? listed.filter((r) => `${r.name} ${r.sub ?? ''}`.toLowerCase().includes(q)) : listed;
  const columns: Column<BreakdownRow>[] =
    by === 'customers' ? customerColumns
    : by === 'modules' ? moduleColumns
    : by === 'actions' ? actionColumns
    : accountView ? accountColumns : featureColumns;

  if (!isCreator && !isImplementation) {
    return (
      <EmptyState icon={<LockSimple size={28} />} title="Feature adoption is for internal teams">
        Switch the demo role to Creator or Implementation Team to see who uses each feature.
      </EmptyState>
    );
  }

  /* Drawers stack: each opens over the one it came from. */
  const push = (l: Layer) => setLayers((ls) => [...ls, l]);
  const pop = () => setLayers((ls) => ls.slice(0, -1));
  const closeAll = () => setLayers([]);

  /* Modules and features narrow the level; an action applies the Action
     filter; a company opens in a drawer. */
  const openRow = (r: BreakdownRow) => {
    if (by === 'modules') update({ module: r.id });
    else if (by === 'features') update({ feature: r.id });
    else if (by === 'actions') update({ event: r.id });
    else push({ kind: 'customer', id: r.id, featureId: filters.feature });
  };

  const exportTable = () => {
    const cols = columns.map((c) => ({ header: c.csvHeader ?? c.header, value: c.csv as (r: BreakdownRow) => unknown }));
    const text = toCsv(shown, by === 'customers' ? [...cols, ...customerExportColumns] : cols);
    const parts = [levelName, customerName(filters.customer), eventLabel(filters.event), by, list !== 'all' ? list : '']
      .filter(Boolean)
      .map((s) => slug(s!));
    download(`adoption-${parts.join('-')}-${asOf()}.csv`, text);
    toast(`Exported ${shown.length.toLocaleString('en-IN')} ${shown.length === 1 ? 'row' : 'rows'}`);
  };

  const pickList = (key: AdoptionList) => {
    setQuery('');
    update({ list: key, by: accountView ? 'features' : 'customers' });
  };

  const tab = (key: AdoptionList, label: string, removable = false) => {
    const active = list === key;
    return (
      <button
        key={key}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => pickList(removable && active ? 'all' : key)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: SPACE.x2, height: 44, padding: 0,
          border: 'none', borderBottom: `2px solid ${active ? T.brand : 'transparent'}`, marginBottom: -1,
          background: 'transparent', color: active ? T.tx : T.tx3, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {label}
        <span
          style={{
            minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, lineHeight: '20px', textAlign: 'center',
            background: active ? T.brandSoft : T.su2, color: active ? T.brand : T.tx3, fontSize: 12, fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {listCount(key).toLocaleString('en-IN')}
        </span>
        {removable && <X size={12} weight="bold" aria-label="Remove this filter" />}
      </button>
    );
  };

  const emptyTable = q ? (
    <EmptyState icon={<MagnifyingGlass size={28} />} title="Nothing matches your search"
      action={<Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>}>
      Search looks at names.
    </EmptyState>
  ) : list !== 'all' ? (
    <EmptyState icon={<UsersThree size={28} />} title="Nobody in this list right now"
      action={<Button variant="secondary" onClick={() => pickList('all')}>Show all</Button>}>
      Try another list, or a longer period.
    </EmptyState>
  ) : (
    <EmptyState icon={<UsersThree size={28} />} title="No usage in this period">
      Try a longer period, or remove the action filter.
    </EmptyState>
  );

  return (
    /* Centred: on a wide screen the content holds a readable column. */
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x4, maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x1 }}>
        <Crumb levels={[{ label: 'Releases', path: '/product-hub/releases' }, { label: 'Feature adoption' }]} />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: SPACE.x4 }}>
          <h1 style={{ margin: 0, ...TYPE.pageTitle }}>Feature adoption</h1>
          <button
            type="button"
            onClick={() => setGlossary(true)}
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: T.brand, fontSize: 13, fontWeight: 600 }}
          >
            About these numbers
          </button>
        </div>
        <ScopeSentence filters={filters} by={by} onChange={(p) => { setQuery(''); update(p); }} />
        <span style={{ ...TYPE.helper, fontSize: 12 }}>
          Data to {formatDate(asOf())}. Changes compare with the {PERIOD_WORD[filters.period]} before.
        </span>
      </header>

      <FilterBar filters={filters} onChange={update} />

      {scopedCustomer && <ContactCard customer={scopedCustomer} />}

      {!released ? (
        <div style={{ background: T.card, border: `1px solid ${T.bd2}`, borderRadius: RADIUS.control }}>
          <EmptyState
            icon={<RocketLaunch size={28} />}
            title="Not released yet"
            action={<Button variant="secondary" onClick={() => update({ feature: undefined })}>Show the platform</Button>}
          >
            Usage appears after the feature is published and customers switch it on.
          </EmptyState>
        </div>
      ) : (
        <>
          {/* The charts first: where customers stand, and how use is moving. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.x4, alignItems: 'stretch' }}>
            <div style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <FunnelPanel steps={funnel.steps} unit={funnel.unit} active={filterable ? list : 'all'} onPick={pickList} />
            </div>
            <div style={{ flex: '2 1 480px', minWidth: 0 }}>
              <TrendPanel trend={trend} metric={metric} onMetric={(m) => update({ metric: m })} />
            </div>
          </div>

          <MetricLine kpis={metrics} periodWord={PERIOD_WORD[filters.period]} />

          {/* One table, same numbers per row, filtered in place. */}
          <section
            aria-labelledby="table-title"
            style={{ background: T.card, border: `1px solid ${T.bd}`, borderRadius: RADIUS.panel, boxShadow: T.elev1, overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.x3, padding: `${SPACE.x2}px ${SPACE.x4}px`, borderBottom: `1px solid ${T.bd}` }}>
              <h2 id="table-title" style={{ display: 'flex', alignItems: 'baseline', gap: SPACE.x2, margin: '0 auto 0 0', ...TYPE.cardTitle }}>
                {BY_TITLE[by]}
                <span style={{ ...TYPE.helper, fontSize: 13, fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
                  {shown.length.toLocaleString('en-IN')}
                  {filterable ? ' · follow-ups listed first' : ''}
                </span>
              </h2>
              <div style={{ position: 'relative', flex: '0 1 240px', minWidth: 160 }}>
                <MagnifyingGlass size={16} aria-hidden="true" style={{ position: 'absolute', left: 12, top: 10, color: T.tx4, pointerEvents: 'none' }} />
                <input
                  type="search"
                  aria-label="Search the table"
                  placeholder={`Search ${BY_TITLE[by].toLowerCase()}`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocus(true)}
                  onBlur={() => setSearchFocus(false)}
                  style={inputStyle({ leadingIcon: true, focused: searchFocus })}
                />
              </div>
              <Button variant="secondary" onClick={exportTable} disabled={!shown.length}>
                <DownloadSimple size={18} />Export
              </Button>
            </div>

            {filterable && (
              <>
                <div role="tablist" aria-label="Filter the table" style={{ display: 'flex', gap: SPACE.x4, overflowX: 'auto', padding: `0 ${SPACE.x4}px`, borderBottom: `1px solid ${T.bd}` }}>
                  {tab('all', accountView ? 'All features' : 'All customers')}
                  {STEP_LABEL[list] && tab(list, STEP_LABEL[list]!, true)}
                  {NEXT_LISTS.map((l) => tab(l.key, l.label))}
                </div>
                {LIST_ADVICE[list] && (
                  <div style={{ padding: `${SPACE.x3}px ${SPACE.x4}px 0` }}>
                    <Note>{LIST_ADVICE[list]} Export adds each SPOC's email.</Note>
                  </div>
                )}
              </>
            )}

            <DataTable
              rows={shown}
              columns={columns}
              onOpen={openRow}
              openLabel={(r) => (by === 'customers' ? `Open ${r.name}` : by === 'actions' ? `Filter by ${r.name}` : `Show ${r.name}`)}
              empty={emptyTable}
              resetKey={`${JSON.stringify(filters)}|${by}|${list}|${q}`}
            />
          </section>
        </>
      )}

      {layers.map((l, i) =>
        l.kind === 'customer' ? (
          <CustomerDrawer
            key={`customer-${l.id}-${i}`}
            customerId={l.id}
            featureId={l.featureId}
            period={filters.period}
            level={i}
            onClose={pop}
            onOpenPerson={(id) => push({ kind: 'person', id, featureId: l.featureId })}
            onOpenFeature={(id) => { closeAll(); update({ feature: id }); }}
            onOpenAccount={(id) => { closeAll(); update({ customer: id, feature: undefined }); }}
          />
        ) : (
          <PersonDrawer key={`person-${l.id}-${i}`} personId={l.id} featureId={l.featureId} period={filters.period} level={i} onClose={pop} />
        ),
      )}

      <MetricGlossary open={glossary} onClose={() => setGlossary(false)} asOf={asOf()} />
    </div>
  );
};

export default AdoptionPage;
