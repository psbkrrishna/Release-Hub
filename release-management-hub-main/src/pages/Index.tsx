import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, Filter, Calendar, Plus, BookOpen, Play, FileText, AlertCircle, History,
  Headset, Check, ChevronLeft, ChevronRight, ArrowRight, Pencil, Rocket, Trash2,
} from 'lucide-react';
import CreateFeatureModal from '@/components/CreateFeatureModal';
import RowMenu, { type RowMenuItem } from '@/components/hub/RowMenu';
import SummaryCell from '@/components/hub/SummaryCell';
import Button from '@/components/primitives/Button';
import Badge from '@/components/primitives/Badge';
import Switch from '@/components/primitives/Switch';
import IconButton from '@/components/primitives/IconButton';
import Crumb from '@/components/primitives/Crumb';
import EmptyState from '@/components/primitives/EmptyState';
import { inputCls, toolbarSelectCls, caretBackground } from '@/components/primitives/fieldStyles';
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
const TH = 'whitespace-nowrap bg-ink-50 px-4 py-3 text-left text-xs font-medium text-ink-600';

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
    variant={feature.featureTag === 'New Feature' ? 'purple' : 'neutral'}
    className="font-semibold"
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
    return <Badge variant="amber"><AlertCircle size={13} />Contact CSM</Badge>;
  }
  if (feature.status === 'Enablement requested') {
    return <Badge variant="brand"><History size={13} />Enablement requested</Badge>;
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

  const [query, setQuery] = useState('');
  const [module, setModule] = useState('all');
  const [month, setMonth] = useState(() => searchParams.get('month') ?? 'all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Feature | null>(null);

  const openRes = (label: string, url?: string) =>
    toast(url ? `${label} → ${url}` : `${label} not attached to this feature.`, 'info');

  const releaseMonths = useMemo(
    () => sortReleaseMonths([...new Set(visibleFeatures.map((f) => f.releaseMonth).filter(Boolean))]),
    [visibleFeatures],
  );

  const matches = (f: Feature) => {
    if (module !== 'all' && f.productModule !== module) return false;
    if (month !== 'all' && f.releaseMonth !== month) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [f.title, f.id, f.summary, f.productModule, f.featureTag, f.featureType, f.releaseMonth]
      .join(' ')
      .toLowerCase()
      .includes(q);
  };

  const featureRows = useMemo(() => {
    const list = visibleFeatures.filter(matches);
    // Unpublished first: it is the creator's working set, and the published
    // rows below it are already out of their hands.
    return isCreator ? [...list.filter((f) => !f.published), ...list.filter((f) => f.published)] : list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleFeatures, module, month, query, isCreator]);

  const queueRows = useMemo(
    () =>
      supportQueue.filter((row) => {
        const f = features.find((x) => x.id === row.featureId);
        if (!f || !f.published) return false;
        if (module !== 'all' && f.productModule !== module) return false;
        if (month !== 'all' && f.releaseMonth !== month) return false;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return [row.customer, f.title, f.id, f.productModule].join(' ').toLowerCase().includes(q);
      }),
    [features, module, month, query],
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

  const clearFilters = () => {
    setQuery('');
    setModule('all');
    setMonth('all');
    setSearchParams({});
    setPage(1);
  };

  // Creator: + Feature Type, + actions. Other personas have no row actions,
  // so they carry no actions column at all.
  const cols = isImplementation ? 7 : isCreator ? 11 : 6;

  /* Width of the first frozen column, and therefore the left offset of the
     second one. */
  const c1 = isImplementation ? 150 : 116;

  const publishedCount = features.filter((f) => f.published).length;
  const enabledCount = features.filter((f) => f.published && f.isEnabled).length;
  const draftCount = features.filter((f) => !f.published).length;
  const utilisation = publishedCount ? Math.round((100 * enabledCount) / publishedCount) : 0;
  const supportCount = supportQueue.filter((r) => r.status === 'support').length;
  const queueEnabled = supportQueue.filter((r) => r.status === 'enabled').length;

  const menuFor = (f: Feature): RowMenuItem[] =>
    f.published
      ? [
          { label: 'Edit feature', icon: Pencil, onSelect: () => { setEditing(f); setModalOpen(true); } },
          { label: 'View feature details', icon: ArrowRight, separatorBefore: true, onSelect: () => navigate(`/release-hub/features/${f.id}`) },
        ]
      : [
          { label: 'Publish feature', icon: Rocket, onSelect: () => publish(f.id) },
          { label: 'Edit feature', icon: Pencil, onSelect: () => { setEditing(f); setModalOpen(true); } },
          { label: 'Delete feature', icon: Trash2, danger: true, separatorBefore: true, onSelect: () => remove(f.id) },
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
          <td className={TD_MID}><Badge variant="neutral">{f.productModule}</Badge></td>
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
              <Badge variant="amber"><Headset size={13} />Support Requested</Badge>
            ) : (
              <Badge variant="green"><Check size={12} />Enabled</Badge>
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
          <td
            className={`${TD_MID} sticky left-0 z-[2] whitespace-nowrap tabular-nums text-ink-700 ${STICKY_BG}`}
            style={{ width: c1, minWidth: c1 }}
          >
            {formatDate(f.prodEnablementDate)}
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
          <td className={TD_MID}><Badge variant="neutral">{f.productModule}</Badge></td>
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

  const title = isImplementation ? 'Implementation Support Queue' : 'Release Management Suite';

  return (
    <>
      <Crumb
        levels={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: isImplementation ? 'Implementation Support Queue' : 'Release Management Hub' },
        ]}
      />

      <div className="mb-5 flex flex-col gap-6 min-[861px]:flex-row min-[861px]:items-start min-[861px]:justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold leading-tight tracking-[-0.01em] text-brand">{title}</h1>
          {/* The customer-facing hub spans several releases now, so it carries
              no single-release strapline; the month filter states the scope. */}
          {isImplementation && (
            <p className="max-w-lede text-sm text-ink-600">
              Every customer awaiting enablement support for a released feature.
            </p>
          )}
        </div>
        {isCreator && (
          <div className="flex shrink-0 items-center gap-3">
            <Button size="lg" onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus size={18} />Create Feature
            </Button>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] max-w-[520px] flex-1">
          <input
            className={`${inputCls()} pl-10`}
            placeholder={isImplementation ? 'Search customers or features…' : 'Search features…'}
            value={query}
            onChange={(e) => setFilter(() => setQuery(e.target.value))}
          />
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        </div>

        <div className="relative inline-flex items-center">
          <Filter size={16} className="pointer-events-none absolute left-3 z-[1] text-ink-600" />
          <select
            className={toolbarSelectCls}
            style={caretBackground}
            aria-label="Filter by product module"
            value={module}
            onChange={(e) => setFilter(() => setModule(e.target.value))}
          >
            <option value="all">All Modules</option>
            {MODULES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div className="relative inline-flex items-center">
          <Calendar size={16} className="pointer-events-none absolute left-3 z-[1] text-ink-600" />
          <select
            className={toolbarSelectCls}
            style={caretBackground}
            aria-label="Filter by release month"
            value={month}
            onChange={(e) => setFilter(() => setMonth(e.target.value))}
          >
            <option value="all">All Release Months</option>
            {releaseMonths.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div className="flex flex-wrap gap-3 min-[861px]:ml-auto">
          {isImplementation ? (
            <>
              <StatChip n={supportCount} label="Support Required" tone="amber" />
              <StatChip n={queueEnabled} label="Enabled" tone="green" />
            </>
          ) : (
            <>
              {isCreator && <StatChip n={draftCount} label="Unpublished" tone="amber" />}
              <StatChip n={publishedCount} label="Published Features" tone="brand" />
              <StatChip n={enabledCount} label="Enabled Features" tone="green" />
              <StatChip n={`${utilisation}%`} label="Platform Utilization" tone="brand" />
            </>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-150 bg-white shadow-elev1">
        <div className="overflow-x-auto">
          <table
            className={[
              'w-full border-collapse',
              isCreator ? 'min-w-[1680px]' : isImplementation ? 'min-w-[1180px]' : '',
            ].join(' ')}
          >
            <thead>
              {isImplementation ? (
                <tr>
                  <th className={`${TH} sticky left-0 z-[4]`} style={{ width: c1, minWidth: c1 }}>Customer</th>
                  <th className={`${TH} sticky z-[4] ${SEAM_R}`} style={{ left: c1 }}>Feature</th>
                  <th className={TH}>Summary</th>
                  <th className={TH}>Module</th>
                  <th className={TH}>Release Content</th>
                  <th className={TH}>Config Doc</th>
                  <th className={TH}>Status</th>
                </tr>
              ) : (
                <tr>
                  <th className={`${TH} sticky left-0 z-[4]`} style={{ width: c1, minWidth: c1 }}>Release Date</th>
                  <th className={`${TH} sticky z-[4] ${SEAM_R}`} style={{ left: c1 }}>Feature Name</th>
                  <th className={TH}>Summary</th>
                  <th className={TH}>Product Module</th>
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

        {list.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 border-t border-ink-150 bg-ink-50 px-4 py-3 text-13 text-ink-600">
            <div className="flex items-center gap-2">
              <span>Rows per view</span>
              <select
                className="h-8 cursor-pointer appearance-none rounded-md border border-[#D4D4D8] bg-white pl-3 pr-8 text-13 text-ink-900 outline-none"
                style={caretBackground}
                value={perPage}
                onChange={(e) => setFilter(() => setPerPage(Number(e.target.value)))}
                aria-label="Rows per view"
              >
                {[10, 20, 50].map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <span className="tabular-nums">
              {list.length ? `${from + 1}–${to}` : 0} of {list.length}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <IconButton
                bordered
                disabled={current <= 1}
                onClick={() => setPage(current - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </IconButton>
              <span className="min-w-[64px] text-center text-13 tabular-nums text-ink-700">
                {current} of {pages}
              </span>
              <IconButton
                bordered
                disabled={current >= pages}
                onClick={() => setPage(current + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
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
