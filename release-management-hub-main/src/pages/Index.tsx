import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CreateFeatureModal from '@/components/CreateFeatureModal';
import RowMenu, { type RowMenuItem } from '@/components/hub/RowMenu';
import SummaryCell from '@/components/hub/SummaryCell';
import { useFeatureStore } from '@/components/FeatureStore';
import { MODULES, formatDate, sortReleaseMonths } from '@/data/features';
import { supportQueue } from '@/data/features';
import type { Feature } from '@/types/Feature';

const Crumb = ({ current }: { current: string }) => {
  const navigate = useNavigate();
  return (
    <nav className="crumb">
      <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Dashboard</a>
      <i className="ph ph-caret-right" />
      <b>{current}</b>
    </nav>
  );
};

/* One label per feature, two possible values. The old icon cluster asked the
   reader to decode five tooltips to learn one thing. */
const TagLabel = ({ feature }: { feature: Feature }) => {
  const isNew = feature.featureTag === 'New Feature';
  return <span className={`flabel ${isNew ? 'is-new' : 'is-enh'}`}>{isNew ? 'New Feature' : 'Enhancement'}</span>;
};

const ContentIcons = ({ feature, onOpen }: { feature: Feature; onOpen: (label: string, url?: string) => void }) => {
  const items: Array<[string, string, string | undefined]> = [];
  if (feature.releaseNotes) items.push(['book-open', 'Release notes', feature.releaseNotes]);
  if (feature.demoVideo) items.push(['play', 'Demo video', feature.demoVideo]);
  if (feature.configurationDoc) items.push(['file-text', 'Config document', feature.configurationDoc]);
  return (
    <div className="content-icons">
      {items.length === 0 && <span className="none">—</span>}
      {items.map(([icon, label, url]) => (
        <button key={label} className="icon-btn" title={label} onClick={() => onOpen(label, url)}>
          <i className={`ph ph-${icon}`} />
        </button>
      ))}
    </div>
  );
};

const StatusCell = ({ feature }: { feature: Feature }) => {
  const { canToggle, toggleEnabled } = useFeatureStore();
  if (feature.status === 'Contact CSM') {
    return (
      <div className="status-cell">
        <span className="pill-csm"><i className="ph ph-warning-circle" />Contact CSM</span>
      </div>
    );
  }
  if (feature.status === 'Enablement requested') {
    return (
      <div className="status-cell">
        <span className="pill-req"><i className="ph ph-clock-counter-clockwise" />Enablement requested</span>
      </div>
    );
  }
  const tip = canToggle
    ? `Toggle ${feature.title}`
    : 'Read-only for this role — open the feature to request enablement';
  return (
    <div className="status-cell">
      <button
        className={`switch${feature.isEnabled ? ' on' : ''}`}
        disabled={!canToggle}
        title={tip}
        aria-label={tip}
        onClick={() => toggleEnabled(feature.id)}
      >
        <span className="knob" />
      </button>
      <span className="status-txt">{feature.isEnabled ? 'Enabled' : 'Disabled'}</span>
    </div>
  );
};

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

  const publishedCount = features.filter((f) => f.published).length;
  const enabledCount = features.filter((f) => f.published && f.isEnabled).length;
  const draftCount = features.filter((f) => !f.published).length;
  const utilisation = publishedCount ? Math.round((100 * enabledCount) / publishedCount) : 0;
  const supportCount = supportQueue.filter((r) => r.status === 'support').length;
  const queueEnabled = supportQueue.filter((r) => r.status === 'enabled').length;

  const menuFor = (f: Feature): RowMenuItem[] =>
    f.published
      ? [
          { label: 'Edit feature', icon: 'pencil-simple', onSelect: () => { setEditing(f); setModalOpen(true); } },
          { label: 'View feature details', icon: 'arrow-right', separatorBefore: true, onSelect: () => navigate(`/release-hub/features/${f.id}`) },
        ]
      : [
          { label: 'Publish feature', icon: 'rocket-launch', onSelect: () => publish(f.id) },
          { label: 'Edit feature', icon: 'pencil-simple', onSelect: () => { setEditing(f); setModalOpen(true); } },
          { label: 'Delete feature', icon: 'trash', danger: true, separatorBefore: true, onSelect: () => remove(f.id) },
        ];

  /* A group header inside the table body. The creator's table is one table
     with two sections, so the split reads as an ordering of the same list
     rather than two places to look. */
  const sectionRow = (kind: 'unpub' | 'pub') => {
    const unpub = kind === 'unpub';
    const count = featureRows.filter((f) => (f.published ? 'pub' : 'unpub') === kind).length;
    return (
      <tr className={`secrow ${kind}`} key={`sec-${kind}`}>
        <td colSpan={cols}>
          <span className="lab">
            {unpub ? 'Unpublished' : 'Published'}
            <span className="n">{count}</span>
            <span className="note">
              {unpub ? 'Not visible to customers until published' : 'Live for customers'}
            </span>
          </span>
        </td>
      </tr>
    );
  };

  const body: React.ReactNode[] = [];
  if (isImplementation) {
    (slice as Array<(typeof supportQueue)[number]>).forEach((row) => {
      const f = features.find((x) => x.id === row.featureId);
      if (!f) return;
      body.push(
        <tr key={`${row.customer}-${row.featureId}`}>
          <td className="mid stick stick-1"><b style={{ fontWeight: 600 }}>{row.customer}</b></td>
          <td className="stick stick-2">
            <button className="fname-link" onClick={() => navigate(`/release-hub/features/${f.id}`)}>{f.title}</button>
            <div className="fmeta-row" style={{ marginTop: 6 }}><TagLabel feature={f} /><span className="code">{f.id}</span></div>
          </td>
          <td><SummaryCell text={(f.summary || '').split('\n').join(' ')} /></td>
          <td className="mid"><span className="mod-pill">{f.productModule}</span></td>
          <td className="mid"><ContentIcons feature={f} onOpen={openRes} /></td>
          <td className="mid">
            {f.configurationDoc ? (
              <button className="icon-btn" title="Config document" onClick={() => openRes('Config document', f.configurationDoc)}>
                <i className="ph ph-file-text" />
              </button>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--tx4)' }}>—</span>
            )}
          </td>
          <td className="mid">
            {row.status === 'support' ? (
              <span className="pill-csm"><i className="ph ph-headset" />Support Requested</span>
            ) : (
              <span className="tag green"><i className="ph ph-check" style={{ fontSize: 12 }} /> Enabled</span>
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
        <tr key={f.id}>
          <td className="mid cell-date stick stick-1">{formatDate(f.prodEnablementDate)}</td>
          <td className="stick stick-2">
            <button className="fname-link" onClick={() => navigate(`/release-hub/features/${f.id}`)}>{f.title}</button>
            <div className="fmeta-row" style={{ marginTop: 6 }}><TagLabel feature={f} /><span className="code">{f.id}</span></div>
          </td>
          <td><SummaryCell text={(f.summary || '').split('\n').join(' ')} /></td>
          <td className="mid"><span className="mod-pill">{f.productModule}</span></td>
          {isCreator && <td className="mid cell-type">{f.featureType}</td>}
          <td className={`mid${isCreator ? ' sepr' : ''}`}><ContentIcons feature={f} onOpen={openRes} /></td>
          {isCreator ? (
            <>
              <td className="num mid">{f.enabledCustomers ?? 0}</td>
              <td className="num mid">{f.activeCustomers ?? 0}</td>
              <td className="num mid">{(f.mauLast30Days ?? 0).toLocaleString()}</td>
              <td className="num mid">{f.dauLast30DayAvg ?? 0}</td>
              <td className="mid stick stick-r" style={{ textAlign: 'right' }}>
                <RowMenu label={f.title} items={menuFor(f)} />
              </td>
            </>
          ) : (
            <td className="mid"><StatusCell feature={f} /></td>
          )}
        </tr>,
      );
    });
  }

  const title = isImplementation ? 'Implementation Support Queue' : 'Release Management Suite';
  const tableClass = isCreator ? 'wide wide-creator' : isImplementation ? 'wide q' : '';

  return (
    <>
      <Crumb current={isImplementation ? 'Implementation Support Queue' : 'Release Management Hub'} />

      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {/* The customer-facing hub spans several releases now, so it carries
              no single-release strapline; the month filter states the scope. */}
          {isImplementation && (
            <p className="lede">Every customer awaiting enablement support for a released feature.</p>
          )}
        </div>
        <div className="head-actions">
          {isCreator && (
            <button className="btn btn-primary btn-lg" onClick={() => { setEditing(null); setModalOpen(true); }}>
              <i className="ph ph-plus" />Create Feature
            </button>
          )}
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <input
            placeholder={isImplementation ? 'Search customers or features…' : 'Search features…'}
            value={query}
            onChange={(e) => setFilter(() => setQuery(e.target.value))}
          />
          <i className="ph ph-magnifying-glass" />
        </div>
        <div className="selwrap">
          <i className="ph ph-funnel" />
          <select className="sel" aria-label="Filter by product module" value={module} onChange={(e) => setFilter(() => setModule(e.target.value))}>
            <option value="all">All Modules</option>
            {MODULES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="selwrap">
          <i className="ph ph-calendar-blank" />
          <select className="sel" aria-label="Filter by release month" value={month} onChange={(e) => setFilter(() => setMonth(e.target.value))}>
            <option value="all">All Release Months</option>
            {releaseMonths.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div className="stats">
          {isImplementation ? (
            <>
              <div className="stat is-amber"><span className="stat-n">{supportCount}</span><span className="stat-l">Support Required</span></div>
              <div className="stat is-green"><span className="stat-n">{queueEnabled}</span><span className="stat-l">Enabled</span></div>
            </>
          ) : (
            <>
              {isCreator && <div className="stat is-amber"><span className="stat-n">{draftCount}</span><span className="stat-l">Unpublished</span></div>}
              <div className="stat is-brand"><span className="stat-n">{publishedCount}</span><span className="stat-l">Published Features</span></div>
              <div className="stat is-green"><span className="stat-n">{enabledCount}</span><span className="stat-l">Enabled Features</span></div>
              <div className="stat is-brand"><span className="stat-n">{utilisation}%</span><span className="stat-l">Platform Utilization</span></div>
            </>
          )}
        </div>
      </div>

      <div className="card-table">
        <div className="tscroll">
          <table className={tableClass}>
            <thead>
              {isImplementation ? (
                <tr>
                  <th className="stick stick-1">Customer</th>
                  <th className="stick stick-2">Feature</th>
                  <th>Summary</th><th>Module</th><th>Release Content</th><th>Config Doc</th><th>Status</th>
                </tr>
              ) : (
                <tr>
                  <th className="stick stick-1">Release Date</th>
                  <th className="stick stick-2">Feature Name</th>
                  <th>Summary</th>
                  <th>Product Module</th>
                  {isCreator && <th>Feature Type</th>}
                  <th className={isCreator ? 'sepr' : undefined}>Release Content</th>
                  {isCreator ? (
                    <>
                      <th className="num"># Enabled Customers</th>
                      <th className="num"># Active Customers</th>
                      <th className="num"># MAU (Last 30 Days)</th>
                      <th className="num"># DAU (Last 30 Day Avg)</th>
                      <th className="stick stick-r" />
                    </>
                  ) : (
                    <th>Status</th>
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
                    <div className="empty">
                      <div className="ico"><i className="ph ph-magnifying-glass" /></div>
                      <h4>No {isImplementation ? 'queue rows' : 'features'} match your filters</h4>
                      <p>Try a broader search, or clear the module and release month filters to see everything.</p>
                      <button className="btn btn-ghost" onClick={clearFilters}><i className="ph ph-arrow-right" />Clear filters</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {list.length > 0 && (
          <div className="tfoot">
            <div className="rpv">
              <span>Rows per view</span>
              <select value={perPage} onChange={(e) => setFilter(() => setPerPage(Number(e.target.value)))}>
                {[10, 20, 50].map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <span className="range">{list.length ? `${from + 1}–${to}` : 0} of {list.length}</span>
            <div className="pager">
              <button className="icon-btn" disabled={current <= 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
                <i className="ph ph-caret-left" />
              </button>
              <span className="lbl">{current} of {pages}</span>
              <button className="icon-btn" disabled={current >= pages} onClick={() => setPage(current + 1)} aria-label="Next page">
                <i className="ph ph-caret-right" />
              </button>
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
