import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowCounterClockwise, ArrowRight, ArrowSquareOut, ArrowsDownUp, ArrowDown, ArrowUp, CaretDown, CaretRight,
  DotsThreeVertical, Headset, Info, LockSimple, MagnifyingGlass,
} from '@phosphor-icons/react';
import Hoverable from '@/components/primitives/Hoverable';
import DesignPager from '@/components/hub/DesignPager';
import UsageLink from '@/components/adoption/UsageLink';
import { useFeatureStore } from '@/components/FeatureStore';
import { useUserRole } from '@/components/UserRoleProvider';
import { MODULES, sortReleaseMonths } from '@/data/features';
import { fmtDate, statusOf, tagLabel, tagStyle, typeLabel, typeTip } from '@/lib/featureUi';
import type { Feature } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   Releases, from the Release Hub V2 design.

   Customers and customer admins get one table grouped by release month, with
   the feature's status for their organisation (a toggle for admins). Creators
   get the internal table: unpublished first, then published, with activation
   and adoption columns, and a row menu that hands off to Configure.
   --------------------------------------------------------------------------- */

const TH: CSSProperties = { padding: '8px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--tx4)' };
const CREATOR_COLS = '112px minmax(280px,1.4fr) 128px minmax(260px,1.2fr) 190px 130px 112px 112px 112px 112px 56px';
const CUSTOMER_COLS = 'minmax(0,1.4fr) 128px minmax(0,1.4fr) 130px 160px 40px';
const STICK = 'calc(var(--shell-top, 56px) + var(--hub-hdr-h, 0px))';

const selectStyle = (min: number): CSSProperties => ({
  appearance: 'none', WebkitAppearance: 'none', height: 36, borderRadius: 8, border: '1px solid var(--bd2)', background: 'var(--card)',
  color: 'var(--tx)', fontFamily: 'inherit', fontSize: 14, padding: '0 36px 0 12px', cursor: 'pointer', minWidth: min,
});

const TagPill = ({ f }: { f: Feature }) => {
  const t = tagStyle(f);
  return <span style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 8px', borderRadius: 999, background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', flex: 'none' }}>{tagLabel(f)}</span>;
};

/** The summary, clipped to two lines' worth with View more / View less. */
const Summary = ({ text, limit }: { text: string; limit: number }) => {
  const [open, setOpen] = useState(false);
  const long = text.length > limit;
  const cut = long && !open ? `${text.slice(0, limit).replace(/\s+\S*$/, '').replace(/[\s.,;:]+$/, '')}…` : text;
  return (
    <div role="cell" style={{ padding: '10px 12px', fontSize: 13, lineHeight: 1.4, color: 'var(--tx3)', minWidth: 0 }}>
      <span>{cut}</span>
      {long && (
        <>
          {' '}
          <button
            type="button"
            aria-expanded={open}
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
            style={{ display: 'inline', padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.4, fontWeight: 600, color: 'var(--brand)', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {open ? 'View less' : 'View more'}
          </button>
        </>
      )}
    </div>
  );
};

const GroupHead = ({ label, count, z }: { label: string; count: number; z: number }) => (
  <div role="row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--brand-soft)', borderBottom: '1px solid var(--brand-border)', position: 'sticky', top: `calc(${STICK} + 33px)`, zIndex: z }}>
    <span role="rowheader" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--tx)' }}>{label}</span>
    <span style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 6px', borderRadius: 999, background: 'var(--card)', border: '1px solid var(--bd2)', fontSize: 11, fontWeight: 600, color: 'var(--tx2)' }}>{count}</span>
  </div>
);

const FeatureCell = ({ f, onOpen }: { f: Feature; onOpen: () => void }) => (
  <div role="cell" style={{ padding: '10px 12px', minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, lineHeight: '20px' }}>
      <Hoverable
        as="button"
        type="button"
        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpen(); }}
        title={f.title}
        style={{ display: 'block', minWidth: 0, maxWidth: '100%', lineHeight: '20px', padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--tx)', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        hoverStyle={{ color: 'var(--brand)' }}
      >
        {f.title}
      </Hoverable>
    </div>
    <div style={{ lineHeight: '16px' }}><span style={{ fontSize: 12, lineHeight: '16px', color: 'var(--tx4)' }}>{f.id}</span></div>
  </div>
);

const ReleasesPage = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { visibleFeatures, isCreator, toggleEnabled } = useFeatureStore();
  const { userRole } = useUserRole();

  const fMonth = params.get('month') ?? 'all';
  const setMonth = (m: string) => { const n = new URLSearchParams(params); if (m === 'all') n.delete('month'); else n.set('month', m); setParams(n, { replace: true }); setPage(1); };
  const [fName, setFName] = useState('');
  const [fModule, setFModule] = useState('all');
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [sort, setSort] = useState<{ key: 'title' | 'productModule'; dir: 1 | -1 } | null>(null);
  const [menu, setMenu] = useState<{ f: Feature; top: number; left: number } | null>(null);
  const [focus, setFocus] = useState(false);
  useEffect(() => setPage(1), [fMonth]);

  const months = useMemo(() => sortReleaseMonths([...new Set(visibleFeatures.map((f) => f.releaseMonth).filter(Boolean))]), [visibleFeatures]);
  const order = (m: string) => months.indexOf(m);

  const list = useMemo(() => {
    const q = fName.trim().toLowerCase();
    let l = visibleFeatures.filter((f) => (fModule === 'all' || f.productModule === fModule) && (fMonth === 'all' || f.releaseMonth === fMonth) && (!q || `${f.title} ${f.id}`.toLowerCase().includes(q)));
    l = [...l].sort((a, b) => order(a.releaseMonth) - order(b.releaseMonth));
    if (isCreator) l = l.filter((f) => !f.published).concat(l.filter((f) => f.published));
    else if (sort) l = [...l].sort((a, b) => order(a.releaseMonth) - order(b.releaseMonth) || sort.dir * a[sort.key].localeCompare(b[sort.key]));
    return l;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleFeatures, fName, fModule, fMonth, isCreator, sort, months]);

  const pages = Math.max(1, Math.ceil(list.length / per));
  const cur = Math.min(page, pages);
  const slice = list.slice((cur - 1) * per, cur * per);

  const groups: Array<{ label: string; count: number; rows: Feature[] }> = [];
  slice.forEach((f) => {
    const key = isCreator ? (f.published ? 'Published' : 'Unpublished') : f.releaseMonth;
    const last = groups[groups.length - 1];
    if (last && last.label === key) last.rows.push(f);
    else groups.push({ label: key, count: list.filter((x) => (isCreator ? (x.published ? 'Published' : 'Unpublished') : x.releaseMonth) === key).length, rows: [f] });
  });

  const open = (f: Feature) => navigate(`/product-hub/features/${f.id}`);
  const clear = () => { setFName(''); setFModule('all'); setMonth('all'); };

  const sortHead = (key: 'title' | 'productModule', label: string, text: string) => {
    const on = sort?.key === key;
    const asc = on && sort?.dir === 1;
    const Icon = on ? (asc ? ArrowUp : ArrowDown) : ArrowsDownUp;
    return (
      <div role="columnheader" aria-sort={on ? (asc ? 'ascending' : 'descending') : 'none'} style={{ padding: '8px 12px', fontSize: 11, lineHeight: '16px', display: 'flex', alignItems: 'center' }}>
        <Hoverable
          as="button"
          type="button"
          aria-label={`Sort by ${label}`}
          title={`Sort ${label}${asc ? ' Z to A' : ' A to Z'} within each release`}
          onClick={() => { setSort({ key, dir: asc ? -1 : 1 }); setPage(1); }}
          style={{ border: 'none', background: 'none', padding: 0, lineHeight: '16px', height: 16, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: on ? 'var(--brand)' : 'var(--tx3)', whiteSpace: 'nowrap' }}
          hoverStyle={{ color: 'var(--brand)' }}
        >
          {text}<Icon size={12} weight="bold" color={on ? 'var(--brand)' : 'var(--tx5)'} aria-hidden />
        </Hoverable>
      </div>
    );
  };

  const statusCell = (f: Feature) => {
    const st = statusOf(f, userRole);
    return (
      <div role="cell" onClick={(e) => e.stopPropagation()} style={{ padding: '10px 12px', cursor: 'default' }}>
        {st.kind === 'mandatory' && (
          <span title="Required by Zwayam for every customer, so it can't be turned off" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--tx2)', whiteSpace: 'nowrap' }}>
            <LockSimple size={14} color="var(--tx3)" />Product default
          </span>
        )}
        {st.kind === 'badge' && (
          <span title={st.tip} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 20, padding: '0 8px', borderRadius: 999, background: st.bg, color: st.fg, border: `1px solid ${st.bd}`, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
            {st.headset && <Headset size={12} aria-hidden />}{st.label}
          </span>
        )}
        {st.kind === 'toggle' && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              role="switch"
              tabIndex={0}
              aria-checked={st.on}
              aria-label={`Turn on ${f.title}`}
              onClick={() => toggleEnabled(f.id)}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleEnabled(f.id); } }}
              style={{ position: 'relative', display: 'inline-block', flex: 'none', width: 32, height: 18, borderRadius: 999, background: st.on ? 'var(--brand-solid)' : 'var(--switch-off)', cursor: 'pointer', transition: 'background 120ms ease' }}
            >
              <span style={{ position: 'absolute', top: 2, left: st.on ? 16 : 2, width: 14, height: 14, borderRadius: 999, background: 'var(--knob)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', transition: 'left 120ms ease' }} />
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx2)' }}>{st.on ? 'Enabled' : 'Disabled'}</span>
          </span>
        )}
      </div>
    );
  };

  const n = (f: Feature, v?: number) => (f.published ? (v ?? 0).toLocaleString('en-IN') : '-');

  return (
    <section data-screen-label="Releases" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--bd)', borderRadius: 12, boxShadow: 'var(--elev1)', overflow: 'clip' }}>
        <div style={{ minHeight: 52, boxSizing: 'border-box', padding: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--bd)' }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
            <MagnifyingGlass size={14} color="var(--tx4)" style={{ position: 'absolute', left: 12, top: 11, pointerEvents: 'none' }} />
            <input
              value={fName}
              onChange={(e) => { setFName(e.target.value); setPage(1); }}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              placeholder="Search by feature name or ID"
              aria-label="Search features"
              style={{ width: '100%', boxSizing: 'border-box', height: 36, borderRadius: 8, border: `1px solid ${focus ? 'var(--brand)' : 'var(--bd2)'}`, boxShadow: focus ? '0 0 0 3px var(--ring)' : 'none', background: 'var(--card)', color: 'var(--tx)', fontFamily: 'inherit', fontSize: 14, padding: '0 12px 0 32px', outline: 'none' }}
            />
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <select aria-label="Product module" value={fModule} onChange={(e) => { setFModule(e.target.value); setPage(1); }} style={selectStyle(200)}>
              <option value="all">All modules</option>
              {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <CaretDown size={14} color="var(--tx3)" style={{ position: 'absolute', right: 12, top: 11, pointerEvents: 'none' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <select aria-label="Release month" value={fMonth} onChange={(e) => setMonth(e.target.value)} style={selectStyle(170)}>
              <option value="all">All releases</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <CaretDown size={14} color="var(--tx3)" style={{ position: 'absolute', right: 12, top: 11, pointerEvents: 'none' }} />
          </div>
        </div>

        <div style={{ overflowX: isCreator ? 'auto' : 'visible' }}>
          {list.length > 0 && isCreator && (
            <div role="table" aria-label="Features" style={{ minWidth: 1604 }}>
              <div role="row" style={{ display: 'grid', gridTemplateColumns: CREATOR_COLS, background: 'var(--su1)', borderBottom: '1px solid var(--bd)', alignItems: 'center' }}>
                <div role="columnheader" style={TH}>Release</div>
                <div role="columnheader" style={TH}>Feature</div>
                <div role="columnheader" style={TH}>Type</div>
                <div role="columnheader" style={TH}>Summary</div>
                <div role="columnheader" style={TH}>Module</div>
                <div role="columnheader" style={{ ...TH, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Activation<span title="What happens at release, and whether customer admins can change it" style={{ display: 'inline-flex', cursor: 'default' }}><Info size={13} /></span>
                </div>
                <div role="columnheader" style={TH}>Enabled</div>
                <div role="columnheader" style={TH}>Active</div>
                <div role="columnheader" style={TH}>MAU · 30d</div>
                <div role="columnheader" style={TH}>DAU · avg</div>
                <div role="columnheader" aria-label="Actions" style={TH} />
              </div>
              {groups.map((g, gi) => (
                <div role="rowgroup" key={g.label} style={{ display: 'contents' }}>
                  <div role="row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--brand-soft)', borderBottom: '1px solid var(--brand-border)', zIndex: gi + 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--tx)' }}>{g.label}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 6px', borderRadius: 999, background: 'var(--card)', border: '1px solid var(--bd2)', fontSize: 11, fontWeight: 600, color: 'var(--tx2)' }}>{g.count}</span>
                  </div>
                  {g.rows.map((f, i) => (
                    <Hoverable
                      key={f.id}
                      role="row"
                      onClick={() => open(f)}
                      style={{ display: 'grid', gridTemplateColumns: CREATOR_COLS, alignItems: 'start', borderBottom: i === g.rows.length - 1 ? 'none' : '1px solid var(--bd)', transition: 'background 120ms ease', cursor: 'pointer' }}
                      hoverStyle={{ background: 'var(--su1)' }}
                    >
                      <div role="cell" title={`${f.published ? 'Released' : 'Planned for'} ${fmtDate(f.prodEnablementDate)}`} style={{ padding: '10px 12px', fontSize: 13, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{f.releaseMonth}</div>
                      <FeatureCell f={f} onOpen={() => open(f)} />
                      <div role="cell" style={{ padding: '10px 12px' }}><TagPill f={f} /></div>
                      <Summary text={(f.summary || '').split('\n')[0]} limit={55} />
                      <div role="cell" style={{ padding: '10px 12px', fontSize: 13, lineHeight: 1.4, color: 'var(--tx3)' }}>{f.productModule}</div>
                      <div role="cell" title={typeTip(f)} style={{ padding: '10px 12px', fontSize: 13, color: 'var(--tx2)', whiteSpace: 'nowrap' }}>{typeLabel(f)}</div>
                      {([
                        ['Enabled customers', f.enabledCustomers],
                        ['Active customers', f.activeCustomers],
                        ['MAU · last 30 days', f.mauLast30Days],
                        ['DAU · 30-day avg', f.dauLast30DayAvg],
                      ] as const).map(([metric, v]) => (
                        <div key={metric} role="cell" style={{ padding: '10px 12px', fontSize: 14, color: 'var(--tx)', fontVariantNumeric: 'tabular-nums' }}>
                          <UsageLink feature={f} metric={metric}>{n(f, v)}</UsageLink>
                        </div>
                      ))}
                      <div role="cell" onClick={(e) => e.stopPropagation()} style={{ padding: '10px 12px', cursor: 'default' }}>
                        <Hoverable
                          as="button"
                          type="button"
                          aria-label={`Actions for ${f.title}`}
                          title="Actions"
                          onClick={(e: React.MouseEvent<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); setMenu({ f, top: r.bottom + 6, left: Math.max(8, r.right - 200) }); }}
                          style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--tx3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          hoverStyle={{ background: 'var(--su2)' }}
                        >
                          <DotsThreeVertical size={16} weight="bold" />
                        </Hoverable>
                      </div>
                    </Hoverable>
                  ))}
                </div>
              ))}
            </div>
          )}

          {list.length > 0 && !isCreator && (
            <div role="table" aria-label="Features">
              <div role="row" style={{ display: 'grid', gridTemplateColumns: CUSTOMER_COLS, background: 'var(--su1)', borderBottom: '1px solid var(--bd)', position: 'sticky', top: STICK, zIndex: 50, alignItems: 'center' }}>
                {sortHead('title', 'feature', 'Feature')}
                <div role="columnheader" style={TH}>Type</div>
                <div role="columnheader" style={TH}>Summary</div>
                {sortHead('productModule', 'module', 'Module')}
                <div role="columnheader" style={TH}>Status</div>
                <div role="columnheader" aria-label="Open" style={TH} />
              </div>
              {groups.map((g, gi) => (
                <div role="rowgroup" key={g.label} style={{ display: 'contents' }}>
                  <GroupHead label={g.label} count={g.count} z={gi + 1} />
                  {g.rows.map((f, i) => (
                    <Hoverable
                      key={f.id}
                      role="row"
                      onClick={() => open(f)}
                      style={{ display: 'grid', gridTemplateColumns: CUSTOMER_COLS, alignItems: 'start', borderBottom: i === g.rows.length - 1 ? 'none' : '1px solid var(--bd)', transition: 'background 120ms ease', cursor: 'pointer' }}
                      hoverStyle={{ background: 'var(--su1)' }}
                    >
                      <FeatureCell f={f} onOpen={() => open(f)} />
                      <div role="cell" style={{ padding: '10px 12px' }}><TagPill f={f} /></div>
                      <Summary text={(f.summary || '').split('\n')[0]} limit={130} />
                      <div role="cell" style={{ padding: '10px 12px', fontSize: 13, lineHeight: 1.4, color: 'var(--tx3)' }}>{f.productModule}</div>
                      {statusCell(f)}
                      <div role="cell" aria-hidden style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minHeight: 20 }}>
                        <CaretRight size={12} weight="bold" color="var(--tx4)" />
                      </div>
                    </Hoverable>
                  ))}
                </div>
              ))}
            </div>
          )}

          {list.length === 0 && (
            <div style={{ padding: '48px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
              <MagnifyingGlass size={30} color="var(--tx4)" />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', marginTop: 8 }}>No features match your filters</div>
              <div style={{ fontSize: 13, color: 'var(--tx3)' }}>Try a broader search, or clear the module and release filters to see everything.</div>
              <Hoverable
                as="button"
                type="button"
                onClick={clear}
                style={{ marginTop: 12, height: 36, padding: '0 16px', borderRadius: 8, border: '1px solid var(--bd2)', background: 'var(--card)', color: 'var(--dang-text)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                hoverStyle={{ background: 'var(--dang-soft)' }}
              >
                <ArrowCounterClockwise size={16} />Clear filters
              </Hoverable>
            </div>
          )}
        </div>

        <DesignPager total={list.length} page={cur} per={per} onPage={setPage} onPer={(v) => { setPer(v); setPage(1); }} />
      </div>

      {menu && (
        <>
          <div onClick={() => setMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 300 }} />
          <div role="menu" style={{ position: 'fixed', top: menu.top, left: menu.left, zIndex: 301, width: 200, background: 'var(--card)', border: '1px solid var(--bd)', borderRadius: 8, boxShadow: 'var(--elev3)', padding: 4, animation: 'riseIn 120ms ease' }}>
            {[
              { label: 'View feature details', icon: ArrowRight, onClick: () => open(menu.f) },
              { label: 'Manage in Configure', icon: ArrowSquareOut, onClick: () => navigate(`/configure?edit=${encodeURIComponent(menu.f.id)}`) },
            ].map((mi) => (
              <Hoverable
                as="button"
                type="button"
                role="menuitem"
                key={mi.label}
                onClick={() => { setMenu(null); mi.onClick(); }}
                style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--tx2)', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textAlign: 'left' }}
                hoverStyle={{ background: 'var(--su2)' }}
              >
                <mi.icon size={14} color="var(--tx3)" />{mi.label}
              </Hoverable>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default ReleasesPage;
