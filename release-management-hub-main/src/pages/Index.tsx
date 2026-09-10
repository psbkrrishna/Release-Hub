import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlass as Search, Plus, BookOpen, Play, FileText, WarningCircle as AlertCircle,
  ClockCounterClockwise as History, X, Headset, Check, CaretLeft, CaretRight,
  ArrowRight, PencilSimple as Pencil, Rocket, Trash,
} from '@phosphor-icons/react';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';
import CreateFeatureModal from '@/components/CreateFeatureModal';
import HubHeader from '@/components/hub/HubHeader';
import ColumnFilter from '@/components/hub/ColumnFilter';
import RowMenu, { type RowMenuItem } from '@/components/hub/RowMenu';
import SummaryCell from '@/components/hub/SummaryCell';
import Button from '@/components/primitives/Button';
import Badge from '@/components/primitives/Badge';
import Switch from '@/components/primitives/Switch';
import IconButton from '@/components/primitives/IconButton';
import EmptyState from '@/components/primitives/EmptyState';
import { caretBackground } from '@/components/primitives/fieldStyles';
import { useFeatureStore } from '@/components/FeatureStore';
import { MODULES, formatDate, sortReleaseMonths, supportQueue } from '@/data/features';
import type { Feature } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   Cell classes that repeat on every row, kept as constants so a change lands
   in one place - which is all the old `.mid` / `.num` / `td` rules were doing.

   The frozen columns need real sticky offsets, and the second one's left edge
   depends on the first one's width, which differs between the feature table
   and the implementation queue (whose first column holds a customer name, not
   a date). That width is measured once below and applied inline, rather than
   being restated as a magic number in four class strings.
   --------------------------------------------------------------------------- */
const TD = 'border-b border-ink-150 p-4 align-top text-sm';
const TD_MID = `${TD} align-middle`;
const TD_NUM = `${TD_MID} whitespace-nowrap text-right tabular-nums`;
const TH = 'whitespace-nowrap bg-ink-50 px-4 py-2.5 text-left text-xs font-medium text-ink-600';
/* Label and its filter button on one baseline. -my-1 keeps the 24px button
   from growing the header band. */
const TH_ROW = 'flex items-center gap-1.5 -my-1';

/* A sticky cell needs its own background or the scrolling content shows
   through it - which in turn means the row hover has to be restated on it,
   hence the `group` on each <tr>. */
const STICKY_BG = 'bg-white group-hover:bg-[#F9FAFB]';
/* The 1px seam marking where the frozen columns end. Pseudo-elements because
   a border would scroll away with the cell's own box. */
const SEAM_R = "after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-ink-150 after:content-['']";
const SEAM_L = "before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-ink-150 before:content-['']";

/* One label per feature, two possible values. The old icon cluster asked the
   reader to decode five tooltips to learn one thing. */
const TagLabel = ({ feature }: { feature: Feature }) => (
  <Badge
    variant={feature.featureTag === 'New Feature' ? 'new' : 'static'}
  >
    {feature.featureTag === 'New Feature' ? 'New Feature' : 'Enhancement'}
  </Badge>
);

const ContentIcons = ({
  feature,
  onOpen,
}: {
  feature: Feature;
  onOpen: (label: string, url?: string) => void;
}) => {
  const items: Array<[ReactNode, string, string | undefined]> = [];
  if (feature.releaseNotes) items.push([<BookOpen size={16} />, 'Release notes', feature.releaseNotes]);
  if (feature.demoVideo) items.push([<Play size={16} />, 'Demo video', feature.demoVideo]);
  if (feature.configurationDoc) items.push([<FileText size={16} />, 'Config document', feature.configurationDoc]);

  if (!items.length) return <span className="text-xs text-ink-500">—</span>;

  return (
    <div className="flex items-center gap-1">
      {items.map(([icon, label, url]) => (
        <IconButton key={label} tone="brand" title={label} aria-label={label} onClick={() => onOpen(label, url)}>
          {icon}
        </IconButton>
      ))}
    </div>
  );
};

const StatusCell = ({ feature }: { feature: Feature }) => {
  const { canToggle, toggleEnabled } = useFeatureStore();

  if (feature.status === 'Contact CSM') {
    return <Badge variant="warning"><AlertCircle size={13} />Contact CSM</Badge>;
  }
  if (feature.status === 'Enablement requested') {
    return <Badge variant="live"><History size={13} />Enablement requested</Badge>;
  }

  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <Switch
        checked={feature.isEnabled}
        disabled={!canToggle}
        onChange={() => toggleEnabled(feature.id)}
        label={
          canToggle
            ? `Toggle ${feature.title}`
            : 'Read-only for this role — open the feature to request enablement'
        }
      />
      <span className="text-sm font-medium text-green-700">
        {feature.isEnabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
};

/* The toolbar's count chips - only the number carries the tint. */
const StatChip = ({
  n,
  label,
  tone,
}: {
  n: number | string;
  label: string;
  tone: 'brand' | 'green' | 'amber';
}) => (
  <div className="flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-ink-150 bg-white px-4">
    <span
      className={[
        'text-base font-semibold tabular-nums',
        tone === 'brand' ? 'text-brand' : tone === 'green' ? 'text-green-600' : 'text-amber-700',
      ].join(' ')}
    >
      {n}
    </span>
    <span className="text-xs text-ink-600">{label}</span>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useFeatureStore();
  const { features, visibleFeatures, isCreator, isImplementation, publish, remove, toast } = store;

  /* One filter per column, named for the column it acts on. `query` used to
     match against seven fields at once, which made a hit hard to explain. */
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState('');
  const [module, setModule] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Feature | null>(null);

  /* The release month lives in the URL rather than in state. Several places
     link here asking for one release - What's New, the release banner, a
     feature's "View this release", the Knowledge Hub's release notes - and
     when this page is already mounted, only the query string changes. Read
     from state, those links quietly did nothing. */
  const month = searchParams.get('month') ?? 'all';
  const setMonth = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'all') params.delete('month');
    else params.set('month', next);
    setSearchParams(params, { replace: true });
  };

  const openRes = (label: string, url?: string) =>
    toast(url ? `${label} → ${url}` : `${label} not attached to this feature.`, 'info');

  const releaseMonths = useMemo(
    () => sortReleaseMonths([...new Set(visibleFeatures.map((f) => f.releaseMonth).filter(Boolean))]),
    [visibleFeatures],
  );

  /** Feature name or id - the two things the name column shows. */
  const nameMatches = (f: Feature) => {
    const q = name.trim().toLowerCase();
    return !q || `${f.title} ${f.id}`.toLowerCase().includes(q);
  };

  const matches = (f: Feature) => {
    if (module !== 'all' && f.productModule !== module) return false;
    if (month !== 'all' && f.releaseMonth !== month) return false;
    return nameMatches(f);
  };

  const featureRows = useMemo(() => {
    const list = visibleFeatures.filter(matches);
    // Unpublished first: it is the creator's working set, and the published
    // rows below it are already out of their hands.
    return isCreator ? [...list.filter((f) => !f.published), ...list.filter((f) => f.published)] : list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleFeatures, module, month, name, isCreator]);

  const queueRows = useMemo(
    () =>
      supportQueue.filter((row) => {
        const f = features.find((x) => x.id === row.featureId);
        if (!f || !f.published) return false;
        if (module !== 'all' && f.productModule !== module) return false;
        // The queue has no release-month column, but a ?month= link still
        // scopes it; "Clear filters" is the way out.
        if (month !== 'all' && f.releaseMonth !== month) return false;
        const c = customer.trim().toLowerCase();
        if (c && !row.customer.toLowerCase().includes(c)) return false;
        return nameMatches(f);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [features, module, month, name, customer],
  );

  const list: Array<Feature | (typeof supportQueue)[number]> = isImplementation ? queueRows : featureRows;
  const pages = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(page, pages);
  const from = (current - 1) * perPage;
  const slice = list.slice(from, from + perPage);
  const to = Math.min(from + perPage, list.length);

  const setFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  /* The page-number input is typed into, so it holds a draft until it is
     committed - clamped to the real range, and reset if the entry is junk. */
  const [pageDraft, setPageDraft] = useState('1');
  useEffect(() => setPageDraft(String(current)), [current]);

  const commitPage = () => {
    const n = Number(pageDraft);
    if (!pageDraft || Number.isNaN(n)) {
      setPageDraft(String(current));
      return;
    }
    setPage(Math.min(Math.max(1, n), pages));
  };

  const clearFilters = () => {
    setName('');
    setCustomer('');
    setModule('all');
    // Clears the month too - it is the only thing this page keeps in the URL.
    setSearchParams({});
    setPage(1);
  };

  /* Both tables carry these two, so they are built once. */
  const moduleFilterControl = (
    <ColumnFilter
      kind="select"
      label="Product module"
      options={MODULES}
      value={module}
      onChange={(v) => setFilter(() => setModule(v))}
    />
  );

  const nameFilterControl = (
    <ColumnFilter
      kind="text"
      label="Feature name"
      placeholder="Name or ID contains…"
      value={name}
      onChange={(v) => setFilter(() => setName(v))}
    />
  );

  /* What is currently narrowing the table, as removable chips. Without this a
     filter set from a column header is easy to forget about - especially the
     month, which can arrive from a link rather than from a click. */
  const activeFilters: Array<{ label: string; value: string; clear: () => void }> = [];
  if (month !== 'all') {
    activeFilters.push({
      label: 'Release month',
      value: month,
      clear: () => setFilter(() => setMonth('all')),
    });
  }
  if (name.trim()) {
    activeFilters.push({
      label: 'Feature name',
      value: name.trim(),
      clear: () => setFilter(() => setName('')),
    });
  }
  if (module !== 'all') {
    activeFilters.push({
      label: 'Product module',
      value: module,
      clear: () => setFilter(() => setModule('all')),
    });
  }
  if (isImplementation && customer.trim()) {
    activeFilters.push({
      label: 'Customer',
      value: customer.trim(),
      clear: () => setFilter(() => setCustomer('')),
    });
  }

  // Creator: + Feature Type, + actions. Other personas have no row actions,
  // so they carry no actions column at all.
  const cols = isImplementation ? 7 : isCreator ? 11 : 6;

  /* Width of the first frozen column, and therefore the left offset of the
     second one. */
  const c1 = isImplementation ? 150 : 116;

  /* The count chips above the table - Unpublished, Published Features,
     Enabled Features, Platform Utilization - are archived until their UX is
     settled. Restoring them means putting a StatChip row back above the table;
     the counts themselves were:
       published   = features.filter(f => f.published).length
       enabled     = features.filter(f => f.published && f.isEnabled).length
       drafts      = features.filter(f => !f.published).length
       utilisation = Math.round((100 * enabled) / published)
       queue       = supportQueue counts by status
     The implementation queue keeps its two, which are triage numbers rather
     than a dashboard. */
  const supportCount = supportQueue.filter((r) => r.status === 'support').length;
  const queueEnabled = supportQueue.filter((r) => r.status === 'enabled').length;

  const lede = isImplementation
    ? 'Every customer awaiting enablement support for a released feature.'
    : isCreator
      ? 'Every feature and enhancement across releases, published and still in progress.'
      : 'Every released feature, and which of them are switched on for your organization.';

  const menuFor = (f: Feature): RowMenuItem[] =>
    f.published
      ? [
          { label: 'Edit feature', icon: Pencil, onSelect: () => { setEditing(f); setModalOpen(true); } },
          { label: 'View feature details', icon: ArrowRight, separatorBefore: true, onSelect: () => navigate(`/release-hub/features/${f.id}`) },
        ]
      : [
          { label: 'Publish feature', icon: Rocket, onSelect: () => publish(f.id) },
          { label: 'Edit feature', icon: Pencil, onSelect: () => { setEditing(f); setModalOpen(true); } },
          { label: 'Delete feature', icon: Trash, danger: true, separatorBefore: true, onSelect: () => remove(f.id) },
        ];

  /* A group header inside the table body. The creator's table is one table
     with two sections, so the split reads as an ordering of the same list
     rather than two places to look. The label is deliberately not sticky: when
     it tracked the horizontal scroll it slid along its band, which read as
     drift rather than as a heading. */
  const sectionRow = (kind: 'unpub' | 'pub') => {
    const unpub = kind === 'unpub';
    const count = featureRows.filter((f) => (f.published ? 'pub' : 'unpub') === kind).length;
    return (
      <tr key={`sec-${kind}`}>
        <td colSpan={cols} className="border-y border-ink-150 bg-ink-50 px-4 py-2">
          <span
            className={[
              'inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[.04em]',
              unpub ? 'text-amber-700' : 'text-ink-600',
            ].join(' ')}
          >
            {unpub ? 'Unpublished' : 'Published'}
            <span className="rounded-lg border border-ink-150 bg-white px-1.5 tracking-normal tabular-nums text-ink-700">
              {count}
            </span>
            <span className="font-normal normal-case tracking-normal text-ink-500">
              {unpub ? 'Not visible to customers until published' : 'Live for customers'}
            </span>
          </span>
        </td>
      </tr>
    );
  };

  const body: ReactNode[] = [];
  if (isImplementation) {
    (slice as Array<(typeof supportQueue)[number]>).forEach((row) => {
      const f = features.find((x) => x.id === row.featureId);
      if (!f) return;
      body.push(
        <tr key={`${row.customer}-${row.featureId}`} className="group hover:bg-[#F9FAFB]">
          <td className={`${TD_MID} sticky left-0 z-[2] ${STICKY_BG}`} style={{ width: c1, minWidth: c1 }}>
            <b className="font-semibold">{row.customer}</b>
          </td>
          <td className={`${TD} sticky z-[2] min-w-[220px] ${STICKY_BG} ${SEAM_R}`} style={{ left: c1 }}>
            <button
              className="rounded text-left text-sm font-semibold text-ink-900 hover:text-brand hover:underline"
              onClick={() => navigate(`/release-hub/features/${f.id}`)}
            >
              {f.title}
            </button>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <TagLabel feature={f} />
              <Badge variant="code">{f.id}</Badge>
            </div>
          </td>
          <td className={`${TD} min-w-[300px]`}>
            <SummaryCell text={(f.summary || '').split('\n').join(' ')} />
          </td>
          <td className={TD_MID}><Badge variant="static">{f.productModule}</Badge></td>
          <td className={TD_MID}><ContentIcons feature={f} onOpen={openRes} /></td>
          <td className={TD_MID}>
            {f.configurationDoc ? (
              <IconButton
                tone="brand"
                title="Config document"
                aria-label="Config document"
                onClick={() => openRes('Config document', f.configurationDoc)}
              >
                <FileText size={16} />
              </IconButton>
            ) : (
              <span className="text-xs text-ink-500">—</span>
            )}
          </td>
          <td className={TD_MID}>
            {row.status === 'support' ? (
              <Badge variant="warning"><Headset size={13} />Support Requested</Badge>
            ) : (
              <Badge variant="success"><Check size={12} />Enabled</Badge>
            )}
          </td>
        </tr>,
      );
    });
  } else {
    // Headers are emitted whenever the group changes, so a section that
    // straddles a page boundary still announces itself on the next page.
    let group: string | null = null;
    (slice as Feature[]).forEach((f) => {
      if (isCreator) {
        const g = f.published ? 'pub' : 'unpub';
        if (g !== group) {
          group = g;
          body.push(sectionRow(g as 'unpub' | 'pub'));
        }
      }
      body.push(
        <tr key={f.id} className="group hover:bg-[#F9FAFB]">
          {/* The month is what the filter and the release cards speak in; the
              exact date is a detail, so it waits on the tooltip. */}
          <td
            className={`${TD_MID} sticky left-0 z-[2] whitespace-nowrap text-ink-700 ${STICKY_BG}`}
            style={{ width: c1, minWidth: c1 }}
            title={`Released ${formatDate(f.prodEnablementDate)}`}
          >
            {f.releaseMonth}
          </td>
          <td className={`${TD} sticky z-[2] min-w-[220px] ${STICKY_BG} ${SEAM_R}`} style={{ left: c1 }}>
            <button
              className="rounded text-left text-sm font-semibold text-ink-900 hover:text-brand hover:underline"
              onClick={() => navigate(`/release-hub/features/${f.id}`)}
            >
              {f.title}
            </button>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <TagLabel feature={f} />
              <Badge variant="code">{f.id}</Badge>
            </div>
          </td>
          <td className={`${TD} min-w-[300px]`}>
            <SummaryCell text={(f.summary || '').split('\n').join(' ')} />
          </td>
          <td className={TD_MID}><Badge variant="static">{f.productModule}</Badge></td>
          {isCreator && <td className={`${TD_MID} whitespace-nowrap text-ink-700`}>{f.featureType}</td>}
          {/* Group separator: everything left of it describes the feature,
              everything right measures its adoption. A shade heavier than the
              frozen-column seam so the two don't read as one boundary. */}
          <td className={`${TD_MID}${isCreator ? ' border-r border-r-ink-200' : ''}`}>
            <ContentIcons feature={f} onOpen={openRes} />
          </td>
          {isCreator ? (
            <>
              <td className={TD_NUM}>{f.enabledCustomers ?? 0}</td>
              <td className={TD_NUM}>{f.activeCustomers ?? 0}</td>
              <td className={TD_NUM}>{(f.mauLast30Days ?? 0).toLocaleString()}</td>
              <td className={TD_NUM}>{f.dauLast30DayAvg ?? 0}</td>
              <td className={`${TD_MID} sticky right-0 z-[2] w-[52px] min-w-[52px] text-right ${STICKY_BG} ${SEAM_L}`}>
                <RowMenu label={f.title} items={menuFor(f)} />
              </td>
            </>
          ) : (
            <td className={TD_MID}><StatusCell feature={f} /></td>
          )}
        </tr>,
      );
    });
  }

  return (
    <>
      {/* No page title and no breadcrumb here: the layout owns both, and the
          tab strip already says "Release Hub". The count chips that used to
          sit under this are archived - see the note by publishedCount. */}
      <HubHeader
        lede={lede}
        action={
          isCreator ? (
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus size={18} />Create Feature
            </Button>
          ) : undefined
        }
      />

      {/* The queue's two counts stay: they are triage numbers for the work in
          front of this role, not the dashboard-style totals that were
          archived. */}
      {isImplementation && (
        <div className="mb-4 flex flex-wrap gap-3">
          <StatChip n={supportCount} label="Support Required" tone="amber" />
          <StatChip n={queueEnabled} label="Enabled" tone="green" />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-ink-150 bg-white shadow-elev1">
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-ink-150 bg-ink-25 px-4 py-2.5">
            <span className="text-xs font-medium uppercase tracking-[.04em] text-ink-500">
              Filtered by
            </span>
            {activeFilters.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border bg-brand-soft py-1 pl-2 pr-1 text-xs font-medium text-brand-text"
              >
                <span className="text-brand">{f.label}:</span>
                <span className="max-w-[220px] truncate font-semibold">{f.value}</span>
                <button
                  type="button"
                  onClick={f.clear}
                  aria-label={`Remove ${f.label} filter`}
                  className="flex h-4 w-4 items-center justify-center rounded text-brand transition-colors hover:bg-brand-softhover"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-1 rounded text-13 font-semibold text-brand hover:underline"
            >
              Clear all
            </button>
            <span className="ml-auto text-13 tabular-nums text-ink-600">
              {list.length} {list.length === 1 ? 'result' : 'results'}
            </span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table
            className={[
              'w-full border-collapse',
              isCreator ? 'min-w-[1680px]' : isImplementation ? 'min-w-[1180px]' : '',
            ].join(' ')}
          >
            {/* One header row. Filterable columns carry a funnel button next
                to their label, which both offers the filter and shows whether
                one is set - the bare inputs in a second row did neither. */}
            <thead>
              {isImplementation ? (
                <tr>
                  <th className={`${TH} sticky left-0 z-[4]`} style={{ width: c1, minWidth: c1 }}>
                    <span className={TH_ROW}>
                      Customer
                      <ColumnFilter
                        kind="text"
                        label="Customer"
                        placeholder="Customer contains…"
                        value={customer}
                        onChange={(v) => setFilter(() => setCustomer(v))}
                      />
                    </span>
                  </th>
                  <th className={`${TH} sticky z-[4] ${SEAM_R}`} style={{ left: c1 }}>
                    <span className={TH_ROW}>
                      Feature
                      {nameFilterControl}
                    </span>
                  </th>
                  <th className={TH}>Summary</th>
                  <th className={TH}>
                    <span className={TH_ROW}>Module{moduleFilterControl}</span>
                  </th>
                  <th className={TH}>Release Content</th>
                  <th className={TH}>Config Doc</th>
                  <th className={TH}>Status</th>
                </tr>
              ) : (
                <tr>
                  <th className={`${TH} sticky left-0 z-[4]`} style={{ width: c1, minWidth: c1 }}>
                    <span className={TH_ROW}>
                      Release Month
                      <ColumnFilter
                        kind="select"
                        label="Release month"
                        options={releaseMonths}
                        value={month}
                        onChange={(v) => setFilter(() => setMonth(v))}
                      />
                    </span>
                  </th>
                  <th className={`${TH} sticky z-[4] ${SEAM_R}`} style={{ left: c1 }}>
                    <span className={TH_ROW}>
                      Feature Name
                      {nameFilterControl}
                    </span>
                  </th>
                  <th className={TH}>Summary</th>
                  <th className={TH}>
                    <span className={TH_ROW}>Product Module{moduleFilterControl}</span>
                  </th>
                  {isCreator && <th className={TH}>Feature Type</th>}
                  <th className={`${TH}${isCreator ? ' border-r border-r-ink-200' : ''}`}>Release Content</th>
                  {isCreator ? (
                    <>
                      <th className={`${TH} text-right`}># Enabled Customers</th>
                      <th className={`${TH} text-right`}># Active Customers</th>
                      <th className={`${TH} text-right`}># MAU (Last 30 Days)</th>
                      <th className={`${TH} text-right`}># DAU (Last 30 Day Avg)</th>
                      <th className={`${TH} sticky right-0 z-[4] w-[52px] ${SEAM_L}`} />
                    </>
                  ) : (
                    <th className={TH}>Status</th>
                  )}
                </tr>
              )}
            </thead>
            <tbody>
              {list.length ? (
                body
              ) : (
                <tr>
                  <td colSpan={cols}>
                    <EmptyState
                      icon={<Search size={26} />}
                      title={`No ${isImplementation ? 'queue rows' : 'features'} match your filters`}
                      action={
                        <Button variant="secondary" onClick={clearFilters}>
                          <ArrowRight size={18} />Clear filters
                        </Button>
                      }
                    >
                      Try a broader search, or clear the module and release month filters to see everything.
                    </EmptyState>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination per the guidelines: "Showing 1-12 of 12" on the left,
            and on the right two 32px chevrons around a 32x32 page-number
            input plus an "of N" label. No "Page" prefix, and no combined
            "Page 1 of 1" string - the input is the page number. */}
        {list.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: SPACE.x4,
              borderTop: `1px solid ${T.bd}`,
              padding: `${SPACE.x2}px ${SPACE.x4}px`,
              ...TYPE.cellSecondary,
            }}
          >
            <span>
              Showing <b style={{ color: T.tx }}>{from + 1}-{to}</b> of{' '}
              <b style={{ color: T.tx }}>{list.length}</b>
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACE.x2,
                marginLeft: 'auto',
              }}
            >
              <IconButton
                bordered
                size="compact"
                style={{ height: 32, width: 32 }}
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
                title={current <= 1 ? 'Already on the first page' : 'Previous page'}
                aria-label="Previous page"
              >
                <CaretLeft size={16} />
              </IconButton>

              <input
                type="text"
                inputMode="numeric"
                aria-label="Page number"
                value={pageDraft}
                onChange={(e) => setPageDraft(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={commitPage}
                onKeyDown={(e) => e.key === 'Enter' && commitPage()}
                style={{
                  height: 32,
                  width: 32,
                  textAlign: 'center',
                  borderRadius: RADIUS.control,
                  border: `1px solid ${T.bd2}`,
                  background: T.card,
                  color: T.tx,
                  outline: 'none',
                  fontVariantNumeric: 'tabular-nums',
                  ...TYPE.input,
                }}
              />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>of {pages}</span>

              <IconButton
                bordered
                size="compact"
                style={{ height: 32, width: 32 }}
                disabled={current >= pages}
                onClick={() => setPage(current + 1)}
                title={current >= pages ? 'Already on the last page' : 'Next page'}
                aria-label="Next page"
              >
                <CaretRight size={16} />
              </IconButton>
            </div>
          </div>
        )}
      </div>

      <CreateFeatureModal
        open={modalOpen}
        feature={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
      />
    </>
  );
};

export default Index;
