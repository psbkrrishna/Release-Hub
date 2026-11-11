import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  type Icon as PhIcon, ArrowCounterClockwise, ArrowSquareOut, Books, CaretDown, CaretLeft, CaretRight, EnvelopeSimpleOpen, Eye,
  FileText, Info, MagnifyingGlass, PencilSimple, PlayCircle, Plus, RocketLaunch, Trash,
} from '@phosphor-icons/react';
import Hoverable from '@/components/primitives/Hoverable';
import UsageLink from '@/components/adoption/UsageLink';
import CreatorTabs from '@/components/hub/CreatorTabs';
import Button from '@/components/primitives/Button';
import IconButton from '@/components/primitives/IconButton';
import { inputStyle, selectStyle } from '@/components/primitives/fieldStyles';
import { useFeatureStore } from '@/components/FeatureStore';
import { useReleaseStore } from '@/components/ReleaseStore';
import {
  CONTENT_MODULES, ContentDrawer, DeleteConfirm, FeatureDrawer, KIND_ICON, PublishConfirm, ReleaseDrawer, StatusPill,
  featureTypeLabel, featureTypeSub, type ContentKind, type HelpContent,
} from '@/components/config/ConfigDrawers';
import { MODULES, formatDate, sortReleaseMonths } from '@/data/features';
import { MONTH_NAMES } from '@/data/features';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';
import type { Feature } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   The creator's view of the Product Hub, after the "Product Hub Configuration"
   design: one console with two tabs - Features & releases, and Help content -
   where everything customers see is created, edited and published.

   Features are grouped by release month, and each group header carries the
   release's own action (edit its details, or create it). Each row has one
   obvious action as a split CTA - Publish while unpublished, Edit once live -
   with the rest behind its caret. Everything opens in a right-hand drawer.
   --------------------------------------------------------------------------- */

const TOTAL_CUSTOMERS = 140;
const PER_PAGE = 10;

const FEAT_COLS = 'minmax(280px,2fr) 120px 116px minmax(150px,1fr) 128px 96px 96px 120px 136px 148px';
const CONT_COLS = 'minmax(280px,2fr) 128px 120px minmax(150px,1fr) minmax(180px,1fr) 120px 112px 120px 136px 148px';

const TH: CSSProperties = {
  padding: '8px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: T.tx4,
};
const STICKY_L: CSSProperties = { position: 'sticky', left: 0, zIndex: 1, background: 'inherit', boxShadow: `inset -1px 0 0 ${T.bd2}` };
const STICKY_R: CSSProperties = { position: 'sticky', right: 0, zIndex: 1, background: 'inherit', boxShadow: `inset 1px 0 0 ${T.bd2}` };

const seedContent = (): HelpContent[] => {
  const C = (
    id: string, kind: ContentKind, title: string, module: string, link: string, published: boolean,
    updated: string, views: number, src: string, size = 0,
  ): HelpContent => ({
    id, kind, title, module, link, published, updated, views, desc: '',
    file: kind === 'Video' ? undefined : { name: src, size }, url: kind === 'Video' ? src : '',
  });
  return [
    C('DOC-003', 'Document', 'Exit interview template configuration', 'Core HR', 'FEAT-020', false, '2026-08-03', 0, 'Exit interview template configuration.pdf', 1310720),
    C('VID-003', 'Video', 'Shift swap requests walkthrough', 'Time Tracking', 'FEAT-019', false, '2026-08-02', 0, 'https://videos.zwayam.com/guides/shift-swaps'),
    C('NEWS-003', 'Newsletter', 'Zwayam Monthly, August 2026', 'General', '', false, '2026-08-01', 0, 'Zwayam Monthly August 2026.pdf', 3250585),
    C('VID-001', 'Video', 'Building your first custom report', 'Analytics', '', true, '2026-07-05', 966, 'https://videos.zwayam.com/guides/custom-reports'),
    C('NEWS-001', 'Newsletter', 'Zwayam Monthly, July 2026', 'General', '', true, '2026-07-03', 2140, 'Zwayam Monthly July 2026.pdf', 2936012),
    C('DOC-001', 'Document', 'Performance review analysis setup guide', 'Performance Management', 'FEAT-001', true, '2026-07-02', 412, 'Performance review analysis setup guide.pdf', 1887436),
    C('DOC-002', 'Document', 'Recruiting admin handbook', 'Recruiting', '', true, '2026-06-18', 1208, 'Recruiting admin handbook.docx', 4404019),
    C('VID-002', 'Video', 'Panel availability sync in 3 minutes', 'Recruiting', 'FEAT-013', true, '2026-06-10', 534, 'https://videos.zwayam.com/guides/panel-sync'),
    C('NEWS-002', 'Newsletter', 'Zwayam Monthly, June 2026', 'General', '', true, '2026-06-02', 1876, 'Zwayam Monthly June 2026.pdf', 2621440),
    C('DOC-004', 'Document', 'Goal cascade templates guide', 'Performance Management', 'FEAT-015', true, '2026-06-01', 318, 'Goal cascade templates guide.pdf', 982016),
    C('VID-004', 'Video', 'Timesheet approval reminders in practice', 'Time Tracking', 'FEAT-016', true, '2026-05-12', 241, 'https://videos.zwayam.com/guides/timesheet-reminders'),
  ];
};

/* ---- Small parts -------------------------------------------------------- */

const Pill = ({ children, bg, fg, bd }: { children: ReactNode; bg: string; fg: string; bd: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: RADIUS.pill, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', background: bg, color: fg, border: `1px solid ${bd}` }}>
    {children}
  </span>
);

/** A metric in a 76px chip; `share` (0-1) draws the soft bar behind it. */
const Metric = ({ value, share, title, link }: { value?: string; share?: number; title: string; link?: { feature: Feature; metric: string } }) => {
  /* A feature's usage number opens its adoption report; help content has no
     report yet, so its numbers stay plain. */
  const shown = link && value !== undefined
    ? <span onClick={(e) => e.stopPropagation()}><UsageLink feature={link.feature} metric={link.metric} trail={[{ label: 'Configure', path: '/product-hub/configure' }]}>{value}</UsageLink></span>
    : value;
  return (
  <div role="cell" title={link ? undefined : title} style={{ padding: '10px 12px', alignSelf: 'stretch', display: 'flex', alignItems: 'center', cursor: 'default' }}>
    {value === undefined ? (
      <span style={{ fontSize: 14, color: T.tx4 }}>-</span>
    ) : share !== undefined ? (
      <span style={{ position: 'relative', display: 'flex', alignItems: 'center', width: 76, height: 24, padding: '0 8px', borderRadius: RADIUS.tag, background: T.su2, overflow: 'hidden' }}>
        <span aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round(Math.min(1, share) * 100)}%`, background: T.brandSoftHover }} />
        <span style={{ position: 'relative', fontSize: 14, fontWeight: 600, color: T.tx, fontVariantNumeric: 'tabular-nums' }}>{shown}</span>
      </span>
    ) : (
      <span style={{ display: 'flex', alignItems: 'center', width: 76, height: 24, padding: '0 8px', borderRadius: RADIUS.tag, border: `1px solid ${T.bd2}`, background: T.card, fontSize: 14, fontWeight: 600, color: T.tx, fontVariantNumeric: 'tabular-nums' }}>{shown}</span>
    )}
  </div>
  );
};

/** One obvious action, plus a caret for the rest. */
const SplitCta = ({ label, onPrimary, onMenu, menuLabel }: { label: string; onPrimary: () => void; onMenu?: (el: HTMLElement) => void; menuLabel: string }) => (
  <div style={{ display: 'inline-flex', height: 28, border: `1px solid ${T.brandBorder}`, borderRadius: RADIUS.control, overflow: 'hidden', background: T.card }}>
    <Hoverable
      as="button"
      type="button"
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); onPrimary(); }}
      style={{ width: 64, height: 26, padding: 0, border: 'none', background: 'transparent', color: T.brand, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
      hoverStyle={{ background: T.brandSoft }}
    >
      {label}
    </Hoverable>
    {onMenu && (
      <Hoverable
        as="button"
        type="button"
        aria-label={menuLabel}
        title="More actions"
        aria-haspopup="menu"
        onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); onMenu(e.currentTarget); }}
        style={{ width: 26, height: 26, padding: 0, border: 'none', borderLeft: `1px solid ${T.brandBorder}`, background: 'transparent', color: T.brand, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        hoverStyle={{ background: T.brandSoft }}
      >
        <CaretDown size={12} weight="bold" />
      </Hoverable>
    )}
  </div>
);

interface MenuItem { label: string; icon: PhIcon; onClick: () => void; danger?: boolean; divider?: boolean }

const Menu = ({ at, items, onClose }: { at: { top: number; left: number }; items: MenuItem[]; onClose: () => void }) => (
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300 }} />
    <div role="menu" style={{ position: 'fixed', top: at.top, left: at.left, zIndex: 301, width: 200, background: T.card, border: `1px solid ${T.bd}`, borderRadius: RADIUS.control, boxShadow: T.elev3, padding: 4, animation: 'riseIn 120ms ease' }}>
      {items.map((it) => (
        <div key={it.label}>
          {it.divider && <div style={{ height: 1, background: T.bd, margin: '4px 0' }} />}
          <Hoverable
            as="button"
            type="button"
            role="menuitem"
            onClick={() => { onClose(); it.onClick(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: 8, border: 'none', borderRadius: RADIUS.control, background: 'transparent', fontFamily: 'inherit', fontSize: 14, color: it.danger ? T.dangText : T.tx, cursor: 'pointer', textAlign: 'left' }}
            hoverStyle={{ background: it.danger ? T.dangSoft : T.su2 }}
          >
            <it.icon size={16} />{it.label}
          </Hoverable>
        </div>
      ))}
    </div>
  </>
);

const Pager = ({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (n: number) => void }) => {
  const [draft, setDraft] = useState(String(page));
  useEffect(() => setDraft(String(page)), [page]);
  const commit = () => { const n = parseInt(draft, 10); onPage(Number.isNaN(n) ? page : Math.min(Math.max(1, n), pages)); };
  const from = total ? (page - 1) * PER_PAGE + 1 : 0;
  const to = Math.min(page * PER_PAGE, total);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.x4, borderTop: `1px solid ${T.bd}`, padding: '8px 16px', ...TYPE.cellSecondary }}>
      <span>Showing <b style={{ color: T.tx }}>{from}-{to}</b> of <b style={{ color: T.tx }}>{total}</b></span>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.x2, marginLeft: 'auto' }}>
        <IconButton bordered size="compact" style={{ width: 32, height: 32 }} disabled={page <= 1} onClick={() => onPage(page - 1)} title={page <= 1 ? 'Already on the first page' : 'Previous page'} aria-label="Previous page"><CaretLeft size={16} /></IconButton>
        <input
          aria-label="Page"
          value={draft}
          inputMode="numeric"
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          style={{ width: 32, height: 32, textAlign: 'center', borderRadius: RADIUS.control, border: `1px solid ${T.bd2}`, background: T.card, color: T.tx, outline: 'none', fontFamily: 'inherit', fontSize: 14, fontVariantNumeric: 'tabular-nums' }}
        />
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>of {pages}</span>
        <IconButton bordered size="compact" style={{ width: 32, height: 32 }} disabled={page >= pages} onClick={() => onPage(page + 1)} title={page >= pages ? 'Already on the last page' : 'Next page'} aria-label="Next page"><CaretRight size={16} /></IconButton>
      </div>
    </div>
  );
};

const FilterSelect = ({ label, value, onChange, width, children }: { label: string; value: string; onChange: (v: string) => void; width: number; children: ReactNode }) => {
  const [f, setF] = useState(false);
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)} style={{ ...selectStyle({ focused: f }), width }}>
      {children}
    </select>
  );
};

const SearchBox = ({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) => {
  const [f, setF] = useState(false);
  return (
    <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
      <MagnifyingGlass size={14} color="var(--tx4)" style={{ position: 'absolute', left: 12, top: 11, pointerEvents: 'none' }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)} placeholder={placeholder} aria-label={label} style={inputStyle({ leadingIcon: true, focused: f })} />
    </div>
  );
};

const Empty = ({ icon: Ic, title, sub, action }: { icon: PhIcon; title: string; sub: string; action: ReactNode }) => (
  <div style={{ padding: '48px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
    <Ic size={28} color="var(--tx4)" />
    <div style={{ ...TYPE.cellPrimary, marginTop: 8 }}>{title}</div>
    <div style={{ ...TYPE.helper, marginBottom: 12 }}>{sub}</div>
    {action}
  </div>
);

/* ---- The console -------------------------------------------------------- */

type Confirm =
  | { kind: 'publish'; id: string }
  | { kind: 'delete'; id: string }
  | { kind: 'publishContent'; id: string }
  | { kind: 'deleteContent'; id: string }
  | null;

const ConfigConsole = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { features, publish, remove, toast } = useFeatureStore();
  const { releaseFor } = useReleaseStore();

  const tab = params.get('tab') === 'content' ? 'content' : 'feat';
  const setTab = (t: 'feat' | 'content') => {
    const next = new URLSearchParams(params);
    if (t === 'content') next.set('tab', 'content'); else next.delete('tab');
    setParams(next, { replace: true });
  };

  // Features & releases filters. ?month= from elsewhere in the hub lands here.
  const [q, setQ] = useState('');
  const [fStatus, setFStatus] = useState('all');
  const [fModule, setFModule] = useState('all');
  const [fMonth, setFMonth] = useState(params.get('month') ?? 'all');
  const [page, setPage] = useState(1);

  // Help content
  const [contents, setContents] = useState<HelpContent[]>(seedContent);
  const [cq, setCq] = useState('');
  const [cStatus, setCStatus] = useState('all');
  const [cType, setCType] = useState('all');
  const [cModule, setCModule] = useState('all');
  const [cPage, setCPage] = useState(1);

  // Overlays
  const [menu, setMenu] = useState<{ top: number; left: number; items: MenuItem[] } | null>(null);
  const [featDrawer, setFeatDrawer] = useState<{ feature: Feature | null } | null>(null);

  /* "Manage in Configure" from a feature page lands here with ?edit=<id>:
     open that feature's drawer, then drop the param so closing it sticks. */
  const editId = params.get('edit');
  useEffect(() => {
    if (!editId) return;
    const f = features.find((x) => x.id === editId);
    if (f) setFeatDrawer({ feature: f });
    const next = new URLSearchParams(params);
    next.delete('edit');
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);
  const [relDrawer, setRelDrawer] = useState<{ month: string; create: boolean } | null>(null);
  const [contDrawer, setContDrawer] = useState<{ content: HelpContent | null; kind: ContentKind } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const openMenu = (el: HTMLElement, items: MenuItem[]) => {
    const r = el.getBoundingClientRect();
    setMenu({ top: r.bottom + 6, left: Math.max(8, r.right - 200), items });
  };

  const months = useMemo(() => sortReleaseMonths([...new Set(features.map((f) => f.releaseMonth).filter(Boolean))]), [features]);

  /* Months a release can be created for: any with features and no record yet,
     plus the month after the newest one, so the next release can be set up
     before its first feature lands. */
  const createMonths = useMemo(() => {
    const open = months.filter((m) => !releaseFor(m));
    const [mName, y] = (months[0] ?? '').split(' ');
    const i = MONTH_NAMES.indexOf(mName);
    if (i >= 0) {
      const next = i === 11 ? `${MONTH_NAMES[0]} ${Number(y) + 1}` : `${MONTH_NAMES[i + 1]} ${y}`;
      if (!releaseFor(next) && !open.includes(next)) open.unshift(next);
    }
    return open;
  }, [months, releaseFor]);

  const maxEnabled = Math.max(1, ...features.map((f) => f.enabledCustomers ?? 0));

  const featList = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = features.filter((f) => {
      if (fStatus === 'pub' && !f.published) return false;
      if (fStatus === 'unpub' && f.published) return false;
      if (fModule !== 'all' && f.productModule !== fModule) return false;
      if (fMonth !== 'all' && f.releaseMonth !== fMonth) return false;
      return !ql || `${f.title} ${f.id}`.toLowerCase().includes(ql);
    });
    // Newest release first; within one, unpublished (the working set) first.
    return list.sort((a, b) => months.indexOf(a.releaseMonth) - months.indexOf(b.releaseMonth) || Number(a.published) - Number(b.published));
  }, [features, q, fStatus, fModule, fMonth, months]);

  const pages = Math.max(1, Math.ceil(featList.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const slice = featList.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const groups = useMemo(() => {
    const out: Array<{ month: string; rows: Feature[] }> = [];
    slice.forEach((f) => {
      const last = out[out.length - 1];
      if (last && last.month === f.releaseMonth) last.rows.push(f); else out.push({ month: f.releaseMonth, rows: [f] });
    });
    return out;
  }, [slice]);

  const contList = useMemo(() => {
    const ql = cq.trim().toLowerCase();
    return contents.filter((c) => {
      if (cStatus === 'pub' && !c.published) return false;
      if (cStatus === 'unpub' && c.published) return false;
      if (cType !== 'all' && c.kind !== cType) return false;
      if (cModule !== 'all' && c.module !== cModule) return false;
      return !ql || `${c.title} ${c.id}`.toLowerCase().includes(ql);
    });
  }, [contents, cq, cStatus, cType, cModule]);
  const cPages = Math.max(1, Math.ceil(contList.length / PER_PAGE));
  const cCur = Math.min(cPage, cPages);
  const cSlice = contList.slice((cCur - 1) * PER_PAGE, cCur * PER_PAGE);
  const maxViews = Math.max(1, ...contents.filter((c) => c.published).map((c) => c.views));

  const clearFilters = () => { setQ(''); setFStatus('all'); setFModule('all'); setFMonth('all'); setPage(1); };
  const clearCFilters = () => { setCq(''); setCStatus('all'); setCType('all'); setCModule('all'); setCPage(1); };

  const saveContent = (c: Omit<HelpContent, 'id' | 'published' | 'updated' | 'views'>, editId?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    if (editId) {
      setContents((cur) => cur.map((x) => (x.id === editId ? { ...x, ...c, updated: today } : x)));
      toast(`${c.title} updated`);
      return;
    }
    const prefix = c.kind === 'Document' ? 'DOC' : c.kind === 'Video' ? 'VID' : 'NEWS';
    setContents((cur) => {
      const n = cur.filter((x) => x.id.startsWith(prefix)).reduce((m, x) => Math.max(m, Number(x.id.split('-')[1]) || 0), 0) + 1;
      return [{ ...c, id: `${prefix}-${String(n).padStart(3, '0')}`, published: false, updated: today, views: 0 }, ...cur];
    });
    toast(`${c.title} added. Publish it to make it visible to customers`);
  };

  const confFeature = confirm && (confirm.kind === 'publish' || confirm.kind === 'delete') ? features.find((f) => f.id === confirm.id) : undefined;
  const confContent = confirm && (confirm.kind === 'publishContent' || confirm.kind === 'deleteContent') ? contents.find((c) => c.id === confirm.id) : undefined;


  return (
    <>
      {/* ---- Header: breadcrumb, title, actions, tabs ------------------- */}
      <header style={{ margin: '-16px -16px 0', background: T.card, borderBottom: `1px solid ${T.bd2}` }}>
        <div style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <h1 style={{ margin: 0, ...TYPE.pageTitle }}>Get help configuration</h1>
              <span style={{ fontSize: 12, color: T.tx3 }}>Create, edit and publish the features and release details customers see in Get help</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
              <Button
                variant="secondary"
                onClick={() => setRelDrawer({ month: createMonths[0] ?? months[0], create: true })}
                disabled={!createMonths.length}
                title={createMonths.length ? undefined : 'Every month with features already has a release'}
                style={createMonths.length ? { color: T.brand, borderColor: T.brandBorder } : undefined}
              >
                Create release
              </Button>
              <Button
                aria-haspopup="menu"
                onClick={(e) => openMenu(e.currentTarget, [
                  { label: 'Feature', icon: RocketLaunch, onClick: () => { setTab('feat'); setFeatDrawer({ feature: null }); } },
                  { label: 'Document', icon: FileText, divider: true, onClick: () => { setTab('content'); setContDrawer({ content: null, kind: 'Document' }); } },
                  { label: 'Newsletter', icon: EnvelopeSimpleOpen, onClick: () => { setTab('content'); setContDrawer({ content: null, kind: 'Newsletter' }); } },
                  { label: 'Video', icon: PlayCircle, onClick: () => { setTab('content'); setContDrawer({ content: null, kind: 'Video' }); } },
                ])}
                style={{ paddingRight: 14 }}
              >
                Add new<CaretDown size={12} weight="bold" />
              </Button>
            </div>
          </div>
          <CreatorTabs />
        </div>
      </header>

      <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* ---- Features & releases ----------------------------------- */}
        {tab === 'feat' && (
          <section aria-label="Features" style={{ background: T.card, border: `1px solid ${T.bd}`, borderRadius: RADIUS.panel, boxShadow: T.elev1, overflow: 'clip' }}>
            <div style={{ minHeight: 52, padding: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: `1px solid ${T.bd}` }}>
              <SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search by feature name or ID" label="Search features" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
                <FilterSelect label="Status" value={fStatus} onChange={(v) => { setFStatus(v); setPage(1); }} width={148}>
                  <option value="all">All statuses</option><option value="unpub">Unpublished</option><option value="pub">Published</option>
                </FilterSelect>
                <FilterSelect label="Product module" value={fModule} onChange={(v) => { setFModule(v); setPage(1); }} width={200}>
                  <option value="all">All modules</option>{MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
                </FilterSelect>
                <FilterSelect label="Release" value={fMonth} onChange={(v) => { setFMonth(v); setPage(1); }} width={160}>
                  <option value="all">All releases</option>{months.map((m) => <option key={m} value={m}>{m}</option>)}
                </FilterSelect>
              </div>
            </div>

            {featList.length ? (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <div role="table" aria-label="Features" style={{ minWidth: 1392 }}>
                    <div role="row" style={{ display: 'grid', gridTemplateColumns: FEAT_COLS, background: T.su1, borderBottom: `1px solid ${T.bd}` }}>
                      <div role="columnheader" style={{ ...TH, ...STICKY_L }}>Feature</div>
                      <div role="columnheader" style={TH}>Status</div>
                      <div role="columnheader" style={TH}>Tag</div>
                      <div role="columnheader" style={TH}>Module</div>
                      <div role="columnheader" style={{ ...TH, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Feature type<span title="What happens to the feature at release, from the customer's side" style={{ display: 'inline-flex' }}><Info size={13} /></span>
                      </div>
                      <div role="columnheader" title="Customers with this feature turned on. The bar shows the share of all customers" style={{ ...TH, borderLeft: `1px solid ${T.bd2}` }}>Enabled</div>
                      <div role="columnheader" title="Customers using this feature. The bar shows the share of customers who have it enabled" style={TH}>Active</div>
                      <div role="columnheader" title="Monthly active users, last 30 days" style={TH}>MAU · 30 days</div>
                      <div role="columnheader" title="Daily active users, averaged over the last 30 days" style={TH}>DAU · 30-day avg</div>
                      <div role="columnheader" style={{ ...TH, ...STICKY_R }}>Actions</div>
                    </div>

                    {groups.map((g) => {
                      const all = features.filter((f) => f.releaseMonth === g.month);
                      const pubN = all.filter((f) => f.published).length;
                      const hasRel = !!releaseFor(g.month);
                      const rec = releaseFor(g.month);
                      return (
                        <div role="rowgroup" key={g.month} style={{ display: 'contents' }}>
                          <div role="row" style={{ padding: '6px 12px', background: T.su2, borderBottom: `1px solid ${T.bd}` }}>
                            <div style={{ position: 'sticky', left: 12, width: 'max-content', minHeight: 28, display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: T.tx }}>{g.month} release</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 6px', borderRadius: RADIUS.pill, background: T.card, border: `1px solid ${T.bd2}`, fontSize: 11, fontWeight: 600, color: T.tx2 }}>{all.length}</span>
                                <span style={{ fontSize: 12, color: T.tx3 }}>
                                  {pubN === all.length ? 'All published' : pubN === 0 ? 'Not published yet' : `${pubN} of ${all.length} published`}
                                </span>
                                {hasRel && (
                                  <span style={{ fontSize: 12, color: T.tx4 }}>
                                    · {rec?.releaseNotes ? 'Release notes added' : 'No release notes'} · {rec?.webinar ? 'Webinar scheduled' : 'No webinar'}
                                  </span>
                                )}
                              </span>
                              {hasRel ? (
                                <Hoverable as="button" type="button" onClick={() => setRelDrawer({ month: g.month, create: false })} style={{ height: 28, padding: '0 10px', borderRadius: RADIUS.control, border: 'none', background: 'transparent', color: T.brand, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} hoverStyle={{ background: T.brandSoft }}>
                                  <PencilSimple size={14} />Edit release details
                                </Hoverable>
                              ) : (
                                <Hoverable as="button" type="button" onClick={() => setRelDrawer({ month: g.month, create: true })} style={{ height: 28, padding: '0 10px', borderRadius: RADIUS.control, border: 'none', background: 'transparent', color: T.brand, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} hoverStyle={{ background: T.brandSoft }}>
                                  <Plus size={12} weight="bold" />Create release
                                </Hoverable>
                              )}
                            </div>
                          </div>

                          {g.rows.map((f) => {
                            const isNew = f.featureTag === 'New Feature';
                            const pub = f.published;
                            return (
                              <Hoverable
                                key={f.id}
                                role="row"
                                onClick={() => setFeatDrawer({ feature: f })}
                                style={{ display: 'grid', gridTemplateColumns: FEAT_COLS, alignItems: 'center', background: T.card, borderBottom: `1px solid ${T.bd}`, cursor: 'pointer', transition: 'background 120ms ease' }}
                                hoverStyle={{ background: T.su1 }}
                              >
                                {(h: boolean) => (
                                  <>
                                    <div role="cell" style={{ padding: '10px 12px', minWidth: 0, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center', ...STICKY_L }}>
                                      <div title={f.title} style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: h ? T.brand : T.tx, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.title}</div>
                                      <div title={`Production enablement ${formatDate(f.prodEnablementDate)}`} style={{ fontSize: 12, lineHeight: '16px', color: T.tx4 }}>{f.id}</div>
                                    </div>
                                    <div role="cell" style={{ padding: '10px 12px' }}><StatusPill published={pub} /></div>
                                    <div role="cell" style={{ padding: '10px 12px' }}>
                                      <Pill bg={isNew ? T.brandSoft : T.su2} fg={isNew ? T.brand : T.tx3} bd={isNew ? T.brandBorder : T.bd2}>{isNew ? 'New feature' : 'Enhancement'}</Pill>
                                    </div>
                                    <div role="cell" style={{ padding: '10px 12px', fontSize: 13, lineHeight: 1.4, color: T.tx3, minWidth: 0 }}>{f.productModule}</div>
                                    <div role="cell" title={featureTypeSub(f.featureType)} style={{ padding: '10px 12px', fontSize: 13, color: T.tx2, whiteSpace: 'nowrap', cursor: 'default' }}>{featureTypeLabel(f.featureType)}</div>
                                    <div style={{ borderLeft: `1px solid ${T.bd2}`, alignSelf: 'stretch', display: 'flex' }}>
                                      <Metric
                                        value={pub ? String(f.enabledCustomers ?? 0) : undefined}
                                        share={(f.enabledCustomers ?? 0) / Math.max(TOTAL_CUSTOMERS, maxEnabled)}
                                        title={pub ? `${f.enabledCustomers ?? 0} of ${TOTAL_CUSTOMERS} customers have it on` : 'Shows once published'}
                                        link={{ feature: f, metric: 'Enabled customers' }}
                                      />
                                    </div>
                                    <Metric
                                      value={pub ? String(f.activeCustomers ?? 0) : undefined}
                                      share={(f.activeCustomers ?? 0) / Math.max(1, f.enabledCustomers ?? 0)}
                                      title={pub ? `${f.activeCustomers ?? 0} of ${f.enabledCustomers ?? 0} enabled customers use it` : 'Shows once published'}
                                      link={{ feature: f, metric: 'Active customers' }}
                                    />
                                    <Metric link={{ feature: f, metric: 'MAU, last 30 days' }} value={pub ? (f.mauLast30Days ?? 0).toLocaleString('en-IN') : undefined} title={pub ? 'Monthly active users, last 30 days' : 'Shows once published'} />
                                    <Metric link={{ feature: f, metric: 'DAU, 30-day average' }} value={pub ? String(f.dauLast30DayAvg ?? 0) : undefined} title={pub ? 'Daily active users, 30-day average' : 'Shows once published'} />
                                    <div role="cell" onClick={(e) => e.stopPropagation()} style={{ padding: '6px 12px', alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 12, cursor: 'default', ...STICKY_R }}>
                                      {pub ? (
                                        <SplitCta label="Edit" menuLabel={`More actions for ${f.title}`} onPrimary={() => setFeatDrawer({ feature: f })} />
                                      ) : (
                                        <SplitCta
                                          label="Publish"
                                          menuLabel={`More actions for ${f.title}`}
                                          onPrimary={() => setConfirm({ kind: 'publish', id: f.id })}
                                          onMenu={(el) => openMenu(el, [
                                            { label: 'Publish feature', icon: RocketLaunch, onClick: () => setConfirm({ kind: 'publish', id: f.id }) },
                                            { label: 'Edit feature', icon: PencilSimple, onClick: () => setFeatDrawer({ feature: f }) },
                                            { label: 'Delete feature', icon: Trash, danger: true, divider: true, onClick: () => setConfirm({ kind: 'delete', id: f.id }) },
                                          ])}
                                        />
                                      )}
                                      <CaretRight aria-hidden size={12} weight="bold" color="var(--tx4)" style={{ marginLeft: 'auto' }} />
                                    </div>
                                  </>
                                )}
                              </Hoverable>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Pager page={cur} pages={pages} total={featList.length} onPage={setPage} />
              </>
            ) : features.length ? (
              <Empty icon={MagnifyingGlass} title="No features match your filters" sub="Try another name or ID, or widen the module and release filters." action={<Button variant="secondary" onClick={clearFilters}><ArrowCounterClockwise size={16} />Clear filters</Button>} />
            ) : (
              <Empty icon={RocketLaunch} title="No features yet" sub="Features you create stay unpublished until you publish them." action={<Button onClick={() => setFeatDrawer({ feature: null })}>Add feature</Button>} />
            )}
          </section>
        )}

        {/* ---- Help content ------------------------------------------- */}
        {tab === 'content' && (
          <section aria-label="Help content" style={{ background: T.card, border: `1px solid ${T.bd}`, borderRadius: RADIUS.panel, boxShadow: T.elev1, overflow: 'clip' }}>
            <div style={{ minHeight: 52, padding: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: `1px solid ${T.bd}` }}>
              <SearchBox value={cq} onChange={(v) => { setCq(v); setCPage(1); }} placeholder="Search by title or ID" label="Search help content" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginLeft: 'auto' }}>
                <FilterSelect label="Status" value={cStatus} onChange={(v) => { setCStatus(v); setCPage(1); }} width={148}>
                  <option value="all">All statuses</option><option value="unpub">Unpublished</option><option value="pub">Published</option>
                </FilterSelect>
                <FilterSelect label="Content type" value={cType} onChange={(v) => { setCType(v); setCPage(1); }} width={148}>
                  <option value="all">All types</option><option value="Document">Documents</option><option value="Newsletter">Newsletters</option><option value="Video">Videos</option>
                </FilterSelect>
                <FilterSelect label="Product module" value={cModule} onChange={(v) => { setCModule(v); setCPage(1); }} width={200}>
                  <option value="all">All modules</option>{CONTENT_MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
                </FilterSelect>
              </div>
            </div>

            {contList.length ? (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <div role="table" aria-label="Help content" style={{ minWidth: 1440 }}>
                    <div role="row" style={{ display: 'grid', gridTemplateColumns: CONT_COLS, background: T.su1, borderBottom: `1px solid ${T.bd}` }}>
                      <div role="columnheader" style={{ ...TH, ...STICKY_L }}>Title</div>
                      <div role="columnheader" style={TH}>Type</div>
                      <div role="columnheader" style={TH}>Status</div>
                      <div role="columnheader" style={TH}>Module</div>
                      <div role="columnheader" style={TH}>Linked feature</div>
                      <div role="columnheader" style={TH}>Updated</div>
                      <div role="columnheader" title="Customer views in the last 30 days" style={{ ...TH, borderLeft: `1px solid ${T.bd2}` }}>Views · 30 days</div>
                      <div role="columnheader" title="Monthly active users, last 30 days" style={TH}>MAU · 30 days</div>
                      <div role="columnheader" title="Daily active users, averaged over the last 30 days" style={TH}>DAU · 30-day avg</div>
                      <div role="columnheader" style={{ ...TH, ...STICKY_R }}>Actions</div>
                    </div>
                    {cSlice.map((c) => {
                      const lf = c.link ? features.find((f) => f.id === c.link) : undefined;
                      const KIcon = KIND_ICON[c.kind];
                      const seed = Number(c.id.split('-')[1]) || 1;
                      const mau = Math.round(c.views * (0.34 + seed * 0.04));
                      const dau = Math.max(1, Math.round(mau * (0.1 + seed * 0.015)));
                      const open = () => setContDrawer({ content: c, kind: c.kind });
                      return (
                        <Hoverable
                          key={c.id}
                          role="row"
                          onClick={open}
                          style={{ display: 'grid', gridTemplateColumns: CONT_COLS, alignItems: 'center', background: T.card, borderBottom: `1px solid ${T.bd}`, cursor: 'pointer', transition: 'background 120ms ease' }}
                          hoverStyle={{ background: T.su1 }}
                        >
                          {(h: boolean) => (
                            <>
                              <div role="cell" style={{ padding: '10px 12px', minWidth: 0, alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center', ...STICKY_L }}>
                                <div title={c.title} style={{ fontSize: 14, lineHeight: '20px', fontWeight: 600, color: h ? T.brand : T.tx, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                                <div style={{ fontSize: 12, lineHeight: '16px', color: T.tx4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {c.id} · {c.kind === 'Video' ? (c.url ?? '').replace(/^https?:\/\//, '') : c.file?.name}
                                </div>
                              </div>
                              <div role="cell" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.tx2 }}>
                                <KIcon size={16} />{c.kind}
                              </div>
                              <div role="cell" style={{ padding: '10px 12px' }}><StatusPill published={c.published} /></div>
                              <div role="cell" style={{ padding: '10px 12px', fontSize: 13, color: T.tx3 }}>{c.module}</div>
                              <div role="cell" title={lf?.title} style={{ padding: '10px 12px', fontSize: 13, color: lf ? T.tx2 : T.tx4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{lf ? lf.title : 'Not linked'}</div>
                              <div role="cell" style={{ padding: '10px 12px', fontSize: 13, color: T.tx3, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatDate(c.updated)}</div>
                              <div style={{ borderLeft: `1px solid ${T.bd2}`, alignSelf: 'stretch', display: 'flex' }}>
                                <Metric value={c.published ? c.views.toLocaleString('en-IN') : undefined} share={c.views / maxViews} title={c.published ? 'Customer views in the last 30 days' : 'Shows once published'} />
                              </div>
                              <Metric value={c.published ? mau.toLocaleString('en-IN') : undefined} title={c.published ? 'Monthly active users, last 30 days' : 'Shows once published'} />
                              <Metric value={c.published ? String(dau) : undefined} title={c.published ? 'Daily active users, 30-day average' : 'Shows once published'} />
                              <div role="cell" onClick={(e) => e.stopPropagation()} style={{ padding: '6px 12px', alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 12, cursor: 'default', ...STICKY_R }}>
                                <SplitCta
                                  label={c.published ? 'Edit' : 'Publish'}
                                  menuLabel={`More actions for ${c.title}`}
                                  onPrimary={c.published ? open : () => setConfirm({ kind: 'publishContent', id: c.id })}
                                  onMenu={(el) => openMenu(el, c.published
                                    ? [
                                        { label: 'Edit', icon: PencilSimple, onClick: open },
                                        { label: c.kind === 'Video' ? 'Watch' : 'View', icon: Eye, onClick: () => { if (c.kind === 'Video' && c.url) window.open(c.url, '_blank', 'noopener'); else if (c.file?.url) window.open(c.file.url, '_blank', 'noopener'); else toast(`${c.file?.name ?? c.title} opens in the viewer`, 'info'); } },
                                        { label: 'Unpublish', icon: ArrowCounterClockwise, divider: true, onClick: () => { setContents((cur) => cur.map((x) => (x.id === c.id ? { ...x, published: false } : x))); toast(`${c.title} unpublished. Customers no longer see it`); } },
                                      ]
                                    : [
                                        { label: 'Publish', icon: RocketLaunch, onClick: () => setConfirm({ kind: 'publishContent', id: c.id }) },
                                        { label: 'Edit', icon: PencilSimple, onClick: open },
                                        { label: 'Delete', icon: Trash, danger: true, divider: true, onClick: () => setConfirm({ kind: 'deleteContent', id: c.id }) },
                                      ])}
                                />
                                <CaretRight aria-hidden size={12} weight="bold" color="var(--tx4)" style={{ marginLeft: 'auto' }} />
                              </div>
                            </>
                          )}
                        </Hoverable>
                      );
                    })}
                  </div>
                </div>
                <Pager page={cCur} pages={cPages} total={contList.length} onPage={setCPage} />
              </>
            ) : contents.length ? (
              <Empty icon={MagnifyingGlass} title="No content matches your filters" sub="Try another title or ID, or widen the type and module filters." action={<Button variant="secondary" onClick={clearCFilters}><ArrowCounterClockwise size={16} />Clear filters</Button>} />
            ) : (
              <Empty icon={Books} title="No help content yet" sub="Documents, newsletters and videos you add stay unpublished until you publish them." action={<Button onClick={() => setContDrawer({ content: null, kind: 'Document' })}>Add content</Button>} />
            )}
          </section>
        )}
      </div>

      {menu && <Menu at={menu} items={menu.items} onClose={() => setMenu(null)} />}

      <FeatureDrawer open={!!featDrawer} feature={featDrawer?.feature ?? null} onClose={() => setFeatDrawer(null)} />
      <ReleaseDrawer
        open={!!relDrawer}
        month={relDrawer?.month ?? ''}
        create={!!relDrawer?.create}
        monthOptions={relDrawer?.create ? (createMonths.includes(relDrawer.month) ? [relDrawer.month, ...createMonths.filter((m) => m !== relDrawer.month)] : createMonths) : []}
        onClose={() => setRelDrawer(null)}
      />
      <ContentDrawer
        open={!!contDrawer}
        content={contDrawer?.content ?? null}
        initialKind={contDrawer?.kind ?? 'Document'}
        onClose={() => setContDrawer(null)}
        onSave={saveContent}
      />

      <PublishConfirm
        open={!!confFeature && confirm?.kind === 'publish'}
        title={confFeature?.title ?? ''}
        month={confFeature?.releaseMonth}
        onCancel={() => setConfirm(null)}
        onConfirm={() => { if (confFeature) publish(confFeature.id); setConfirm(null); }}
      />
      <PublishConfirm
        open={!!confContent && confirm?.kind === 'publishContent'}
        what={confContent?.kind.toLowerCase()}
        title={confContent?.title ?? ''}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confContent) {
            setContents((cur) => cur.map((x) => (x.id === confContent.id ? { ...x, published: true, updated: new Date().toISOString().slice(0, 10) } : x)));
            toast(`${confContent.title} published. Customers can see it now`);
          }
          setConfirm(null);
        }}
      />
      <DeleteConfirm
        open={!!confFeature && confirm?.kind === 'delete'}
        heading="Delete feature"
        title={confFeature?.title ?? ''}
        tail="and its details will be removed. It was never published, so no customer has seen it."
        onCancel={() => setConfirm(null)}
        onConfirm={() => { if (confFeature) remove(confFeature.id); setConfirm(null); }}
      />
      <DeleteConfirm
        open={!!confContent && confirm?.kind === 'deleteContent'}
        heading={`Delete ${confContent?.kind.toLowerCase() ?? 'content'}`}
        title={confContent?.title ?? ''}
        tail="will be removed. It was never published, so no customer has seen it."
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confContent) { setContents((cur) => cur.filter((x) => x.id !== confContent.id)); toast(`${confContent.title} deleted`); }
          setConfirm(null);
        }}
      />
    </>
  );
};

export default ConfigConsole;
