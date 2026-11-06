import { useEffect, useMemo, useState } from 'react';
import { DownloadSimple, LockSimple, MagnifyingGlass, RocketLaunch, UsersThree, X } from '@phosphor-icons/react';
import Button from '@/components/primitives/Button';
import EmptyState from '@/components/primitives/EmptyState';
import { inputStyle } from '@/components/primitives/fieldStyles';
import { useFeatureStore } from '@/components/FeatureStore';
import ContactCard from '@/components/adoption/ContactCard';
import CustomerDrawer from '@/components/adoption/CustomerDrawer';
import { ActionDrawer, FeatureDrawer, ModuleDrawer } from '@/components/adoption/EntityDrawers';
import DataTable from '@/components/adoption/DataTable';
import FilterBar from '@/components/adoption/FilterBar';
import FunnelPanel from '@/components/adoption/FunnelPanel';
import MetricGlossary from '@/components/adoption/MetricGlossary';
import MetricLine from '@/components/adoption/MetricLine';
import Note from '@/components/adoption/Note';
import PersonDrawer from '@/components/adoption/PersonDrawer';
import ReportHeader from '@/components/adoption/ReportHeader';
import TrendPanel from '@/components/adoption/TrendPanel';
import {
  accountColumns, actionColumns, customerColumns, customerExportColumns, featureColumns, moduleColumns, type Column,
} from '@/components/adoption/columns';
import {
  asOf, customerOf, getBreakdown, getCustomerFeatures, getFunnel, getKpis,
  getTrend, isAccountView, isReleased, periodWord, toCsv, type BreakdownRow,
} from '@/data/usage/query';
import { listsApply, useAdoptionFilters } from '@/hooks/useAdoptionFilters';
import { scopeText } from '@/components/adoption/ScopeSentence';
import { only, type AdoptionList, type Breakdown } from '@/types/Usage';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Feature adoption - for the platform, any modules, features or customers.

   Laid out as the guidelines' analytics report (Hiring Funnel Reports):
     - the report header: "Feature adoption for [Customers ▾]" - the group
       by is the header's selector;
     - the filter bar under it, sticky with the header: saved views, quick
       filters, the date range, All filters, applied chips, Save as view and
       Clear;
     - the charts first - the customer funnel from the whole base, and the
       trend - with the usage numbers on one line under them;
     - one table, with the same numbers on every row, filtered by a funnel
       step or a next step without leaving the page.
   A company opens in a drawer (its SPOC, its people); a person opens stacked
   over it. Nothing else leaves the page.
   --------------------------------------------------------------------------- */

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

/** What can be open in a drawer, each over the one it came from. */
type Layer =
  | { kind: 'customer'; id: string; featureId?: string }
  | { kind: 'person'; id: string; featureId?: string }
  | { kind: 'module'; id: string }
  | { kind: 'feature'; id: string }
  | { kind: 'action'; id: string };

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
  const scopeKey = [filters.modules, filters.features, filters.customers].map((s) => (s ?? []).join(',')).join('|');
  useEffect(() => { setLayers([]); setQuery(''); }, [scopeKey]);

  const released = isReleased(filters.features);
  const accountView = isAccountView(filters);
  const oneFeature = only(filters.features);
  const scopedCustomer = customerOf(only(filters.customers));

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

  /* One rule for every row: clicking it opens its drawer and leaves the page
     as it is. Filtering the page is the explicit button in that drawer. */
  const openRow = (r: BreakdownRow) => {
    if (by === 'modules') push({ kind: 'module', id: r.id });
    else if (by === 'features') push({ kind: 'feature', id: r.id });
    else if (by === 'actions') push({ kind: 'action', id: r.id });
    else push({ kind: 'customer', id: r.id, featureId: oneFeature });
  };
  /** A drawer's "Filter page to this ..." button. */
  const filterTo = (patch: Parameters<typeof update>[0]) => { closeAll(); setQuery(''); update(patch); };

  const exportTable = () => {
    const cols = columns.map((c) => ({ header: c.csvHeader ?? c.header, value: c.csv as (r: BreakdownRow) => unknown }));
    const text = toCsv(shown, by === 'customers' ? [...cols, ...customerExportColumns] : cols);
    const parts = [scopeText(filters), by, list !== 'all' ? list : ''].filter(Boolean).map((s) => slug(s));
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
    <>
    {/* The report header and its filter bar run the full width and stick;
        the content under them holds a centred column. */}
    <ReportHeader by={by} onBy={(b) => { setQuery(''); update({ by: b }); }} onAbout={() => setGlossary(true)}>
      <FilterBar filters={filters} onChange={update} />
    </ReportHeader>

    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x4, maxWidth: 1200, margin: `${SPACE.x4}px auto 0` }}>
      {scopedCustomer && <ContactCard customer={scopedCustomer} />}

      {!released ? (
        <div style={{ background: T.card, border: `1px solid ${T.bd2}`, borderRadius: RADIUS.control }}>
          <EmptyState
            icon={<RocketLaunch size={28} />}
            title="Not released yet"
            action={<Button variant="secondary" onClick={() => update({ features: undefined })}>Show the platform</Button>}
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

          <MetricLine kpis={metrics} periodWord={periodWord(filters.period)} />

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
              openLabel={(r) => `Open ${r.name}`}
              empty={emptyTable}
              resetKey={`${JSON.stringify(filters)}|${by}|${list}|${q}`}
            />
          </section>
        </>
      )}

      {layers.map((l, i) => {
        const common = {
          filters,
          level: i,
          onClose: pop,
          onOpenCustomer: (id: string, featureId?: string) => push({ kind: 'customer', id, featureId: featureId ?? oneFeature }),
        };
        if (l.kind === 'module') {
          return (
            <ModuleDrawer
              key={`module-${l.id}-${i}`}
              {...common}
              module={l.id}
              onOpenFeature={(id) => push({ kind: 'feature', id })}
              onFilter={() => filterTo({ modules: [l.id] })}
            />
          );
        }
        if (l.kind === 'feature') {
          return (
            <FeatureDrawer
              key={`feature-${l.id}-${i}`}
              {...common}
              feature={l.id}
              onOpenAction={(key) => push({ kind: 'action', id: key })}
              onFilter={() => filterTo({ features: [l.id] })}
              onFilterList={(k) => filterTo({ features: [l.id], by: 'customers', list: k })}
            />
          );
        }
        if (l.kind === 'action') {
          return (
            <ActionDrawer
              key={`action-${l.id}-${i}`}
              {...common}
              action={l.id}
              onFilter={() => filterTo({ events: [l.id] })}
            />
          );
        }
        if (l.kind === 'customer') {
          return (
            <CustomerDrawer
              key={`customer-${l.id}-${i}`}
              customerId={l.id}
              featureId={l.featureId}
              period={filters.period}
              level={i}
              onClose={pop}
              onOpenPerson={(id) => push({ kind: 'person', id, featureId: l.featureId })}
              onOpenFeature={(id) => push({ kind: 'feature', id })}
              onOpenAccount={(id) => filterTo({ customers: [id], features: undefined })}
            />
          );
        }
        return (
          <PersonDrawer key={`person-${l.id}-${i}`} personId={l.id} featureId={l.featureId} period={filters.period} level={i} onClose={pop} />
        );
      })}

      <MetricGlossary open={glossary} onClose={() => setGlossary(false)} asOf={asOf()} />
    </div>
    </>
  );
};

export default AdoptionPage;
