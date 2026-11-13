import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  type Icon as PhIcon, Briefcase, ChartLineUp, ChatCircle, FileText, GearSix, MagnifyingGlass, Question, SidebarSimple,
  SquaresFour, UserCheck, Users, UsersThree,
} from '@phosphor-icons/react';

/* ---------------------------------------------------------------------------
   The "Side Rail" component from the Release Hub V2 design project.

   65px collapsed, 280px expanded (remembered), with a tooltip per item while
   collapsed. Rows that do not fit the viewport height fold into a "More" menu
   with its own search. The width is published as --rail-w on <html> so the
   page and every fixed layer can offset against it.
   --------------------------------------------------------------------------- */

export type RailLabel =
  | 'Dashboard' | 'Manage Jobs' | 'Manage Requisitions' | 'Approvals' | 'Manage Interviews'
  | 'Talent Pool Search' | 'Insights' | 'Talent CRM' | 'HireMate' | 'Configure' | 'Get help';

interface Entry {
  i: number;
  label: RailLabel;
  icon?: PhIcon;
  img?: string;
  sub?: 'gear' | 'chat';
  badge?: string;
}

const READ_OPEN = () => { try { return localStorage.getItem('zw-rail-open') === '1'; } catch { return false; } };

const Tile = ({ children, bg }: { children: ReactNode; bg: string }) => (
  <span style={{ position: 'relative', width: 44, height: 44, borderRadius: 8, background: bg, transition: 'background 120ms ease', color: 'inherit', fontSize: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
    {children}
  </span>
);

const SubGlyph = ({ kind, bg }: { kind: 'gear' | 'chat'; bg: string }) => (
  <span aria-hidden style={{ position: 'absolute', right: 9, bottom: 9, width: 13, height: 13, borderRadius: '50%', background: bg, transition: 'background 120ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {kind === 'gear' ? <GearSix size={11} weight="fill" /> : <ChatCircle size={11} weight="fill" />}
  </span>
);

const SideRail = ({
  active, top, approvals = 3, onNavigate,
}: { active: RailLabel | ''; top: number; approvals?: number; onNavigate: (label: RailLabel) => void }) => {
  const [open, setOpen] = useState(READ_OPEN);
  const [tip, setTip] = useState<{ text: string; y: number } | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [fit, setFit] = useState(9);
  const [more, setMore] = useState<{ top: number; left: number; maxH: number } | null>(null);
  const [moreQ, setMoreQ] = useState('');
  const nav = useRef<HTMLElement>(null);
  const moreBtn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--rail-w', open ? '279px' : '64px');
  }, [open]);

  /* Zēva folds the rail away when it opens, as the design does. */
  useEffect(() => {
    const fold = () => { try { localStorage.setItem('zw-rail-open', '0'); } catch { /* storage blocked */ } setOpen(false); setTip(null); setMore(null); };
    window.addEventListener('zw:collapse-rail', fold);
    return () => window.removeEventListener('zw:collapse-rail', fold);
  }, []);

  /* How many of the nine app rows fit, with the rail's fixed furniture
     (padding, bottom pair, divider, collapse toggle) taken out first. */
  const measure = useCallback(() => {
    const el = nav.current; if (!el) return;
    const H = el.clientHeight, T = 9, nMain = 7;
    let f = 0;
    for (let v = T; v >= 0; v--) {
      const rows = v + (v < T ? 1 : 0), div = Math.min(v, nMain) > 0 && v > nMain ? 1 : 0;
      const elems = rows + div + 5;
      if (24 + rows * 44 + div * 9 + 4 + 88 + 1 + 32 + 8 * (elems - 1) <= H) { f = v; break; }
    }
    setFit((cur) => (cur === f ? cur : f));
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (nav.current) ro.observe(nav.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (!more) return;
    const doc = (e: Event) => {
      if (e instanceof KeyboardEvent) { if (e.key === 'Escape') setMore(null); return; }
      const t = e.target as Node;
      if (menu.current?.contains(t) || moreBtn.current?.contains(t)) return;
      setMore(null);
    };
    document.addEventListener('mousedown', doc);
    document.addEventListener('keydown', doc);
    return () => { document.removeEventListener('mousedown', doc); document.removeEventListener('keydown', doc); };
  }, [more]);

  const n = Math.max(0, approvals);
  const badge = n > 99 ? '99+' : n ? String(n) : '';
  const all: Entry[] = [
    { i: 0, label: 'Dashboard', icon: SquaresFour },
    { i: 1, label: 'Manage Jobs', icon: Briefcase },
    { i: 2, label: 'Manage Requisitions', icon: FileText, sub: 'gear' },
    { i: 3, label: 'Approvals', icon: UserCheck, badge },
    { i: 4, label: 'Manage Interviews', icon: Users, sub: 'chat' },
    { i: 5, label: 'Talent Pool Search', icon: UsersThree },
    { i: 6, label: 'Insights', icon: ChartLineUp },
    { i: 7, label: 'Talent CRM', img: '/talent-crm-logo.svg' },
    { i: 8, label: 'HireMate', img: '/hiremate-logo.png' },
  ];
  const vis = all.slice(0, fit).map((x) => x.i);
  const ai = all.findIndex((x) => x.label === active);
  if (ai >= fit && fit > 0) vis[vis.length - 1] = ai;
  const visSet = new Set(vis);
  const hidden = all.filter((x) => !visSet.has(x.i));
  const bottom: Entry[] = [{ i: 9, label: 'Configure', icon: GearSix }, { i: 10, label: 'Get help', icon: Question }];
  const q = moreQ.trim().toLowerCase();
  const pool = q ? all.concat(bottom).filter((x) => x.label.toLowerCase().includes(q)) : hidden;

  const showTip = (e: React.SyntheticEvent<HTMLElement>, text: string) => {
    if (open) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ text, y: Math.round(r.top + r.height / 2) });
  };
  const hideTip = () => setTip(null);
  const go = (label: RailLabel) => { setMore(null); setMoreQ(''); onNavigate(label); };

  const row = (x: Entry) => {
    const on = active === x.label;
    const h = hover === x.i;
    const bg = on ? (h ? 'var(--brand-solidHover)' : 'var(--brand-solid)') : h ? 'var(--brand-soft)' : 'transparent';
    const color = on ? '#fff' : h ? 'var(--brand)' : 'var(--tx3)';
    const tile = on ? (h ? 'var(--brand-solidHover)' : 'var(--brand-solid)') : h ? 'transparent' : 'var(--su2)';
    const tipText = x.label === 'Approvals' && n ? `Approvals · ${n} pending` : x.label;
    const isImg = !!x.img;
    return (
      <button
        key={x.label}
        type="button"
        aria-label={x.label === 'Approvals' && n ? `Approvals, ${n} pending` : x.label}
        aria-current={on ? 'page' : undefined}
        onClick={() => go(x.label)}
        onMouseEnter={(e) => { setHover(x.i); showTip(e, tipText); }}
        onMouseLeave={() => { setHover(null); hideTip(); }}
        onFocus={(e) => showTip(e, tipText)}
        onBlur={hideTip}
        style={{ width: '100%', height: 44, padding: 0, borderRadius: 8, border: 'none', background: isImg ? (h ? 'var(--brand-soft)' : 'transparent') : bg, color: isImg ? (h ? 'var(--brand)' : 'var(--tx3)') : color, transition: 'background 120ms ease, color 120ms ease', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', flex: 'none' }}
      >
        {isImg ? (
          <span style={{ width: 44, height: 44, boxSizing: 'border-box', borderRadius: 8, background: 'var(--card)', border: '1px solid var(--bd2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', overflow: 'hidden' }}>
            <img src={x.img} alt="" style={{ width: x.label === 'Talent CRM' ? 36 : 28, height: x.label === 'Talent CRM' ? 36 : 28, objectFit: 'contain', display: 'block' }} />
          </span>
        ) : (
          <Tile bg={tile}>
            {x.icon && <x.icon size={20} />}
            {x.sub && <SubGlyph kind={x.sub} bg={on ? bg : h ? 'var(--brand-soft)' : tile} />}
            {x.badge && !open && (
              <span aria-hidden style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: `0 ${x.badge.length > 1 ? 5 : 0}px`, boxSizing: 'border-box', borderRadius: 999, background: 'var(--dang-solid)', boxShadow: '0 0 0 2px var(--card)', color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: '18px', textAlign: 'center' }}>{x.badge}</span>
            )}
          </Tile>
        )}
        <span style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>{x.label}</span>
        {x.badge && open && (
          <span aria-hidden style={{ marginLeft: 'auto', marginRight: 12, minWidth: 20, height: 20, padding: '0 6px', boxSizing: 'border-box', borderRadius: 999, background: 'var(--dang-solid)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{x.badge}</span>
        )}
      </button>
    );
  };

  const visMain = all.filter((x) => x.i < 7 && visSet.has(x.i));
  const visApps = all.filter((x) => x.i >= 7 && visSet.has(x.i));
  const moreOpen = !!more && hidden.length > 0;

  return (
    <>
      <nav
        ref={nav}
        aria-label="Main"
        style={{ position: 'fixed', top, left: 0, bottom: 0, width: open ? 280 : 65, boxSizing: 'border-box', overflow: 'hidden', background: 'var(--card)', borderRight: '1px solid var(--bd2)', display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: '12px 10px', gap: 8, zIndex: 190, fontFamily: "'Source Sans 3', -apple-system, sans-serif", transition: 'width 180ms cubic-bezier(0.4,0,0.2,1), top 180ms ease' }}
      >
        {visMain.map(row)}
        {visMain.length > 0 && visApps.length > 0 && <div aria-hidden style={{ height: 1, background: 'var(--bd2)', margin: '4px 0', flex: 'none' }} />}
        {visApps.map(row)}
        {hidden.length > 0 && (
          <button
            ref={moreBtn}
            type="button"
            aria-label={`More, ${hidden.length} items`}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            onClick={(e) => {
              if (more) { setMore(null); return; }
              const r = e.currentTarget.getBoundingClientRect(); const mh = Math.min(320, window.innerHeight - 16);
              setTip(null); setMoreQ('');
              setMore({ maxH: mh, top: Math.max(8, Math.min(r.top, window.innerHeight - mh - 8)), left: Math.round(r.right + 12) });
            }}
            onMouseEnter={(e) => { setHover(99); if (!more) showTip(e, 'More'); }}
            onMouseLeave={() => { setHover(null); hideTip(); }}
            style={{ width: '100%', height: 44, padding: 0, borderRadius: 8, border: 'none', background: moreOpen || hover === 99 ? 'var(--brand-soft)' : 'transparent', color: moreOpen || hover === 99 ? 'var(--brand)' : 'var(--tx3)', transition: 'background 120ms ease, color 120ms ease', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', flex: 'none' }}
          >
            <Tile bg={moreOpen || hover === 99 ? 'transparent' : 'var(--su2)'}>
              <svg viewBox="0 0 256 256" width="20" height="20" fill="currentColor" aria-hidden><circle cx="60" cy="128" r="16" /><circle cx="128" cy="128" r="16" /><circle cx="196" cy="128" r="16" /></svg>
            </Tile>
            <span style={{ fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>More</span>
          </button>
        )}
        <div style={{ flex: '1 1 0', minHeight: 4 }} />
        {bottom.map(row)}
        <div aria-hidden style={{ height: 1, background: 'var(--bd2)', margin: '0 -10px', flex: 'none' }} />
        <button
          type="button"
          onClick={() => { const v = !open; try { localStorage.setItem('zw-rail-open', v ? '1' : '0'); } catch { /* storage blocked */ } setOpen(v); setTip(null); setMore(null); }}
          onMouseEnter={(e) => { setHover(98); showTip(e, 'Expand menu'); }}
          onMouseLeave={() => { setHover(null); hideTip(); }}
          aria-label={open ? 'Collapse menu' : 'Expand menu'}
          aria-expanded={open}
          style={{ width: '100%', height: 32, padding: 0, borderRadius: 8, border: 'none', background: hover === 98 ? 'var(--su2)' : 'transparent', color: hover === 98 ? 'var(--tx)' : 'var(--tx3)', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left', flex: 'none' }}
        >
          <span style={{ width: 44, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <SidebarSimple size={18} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Collapse</span>
        </button>
      </nav>

      {moreOpen && more && (
        <div ref={menu} role="menu" aria-label="More navigation" style={{ position: 'fixed', left: more.left, top: more.top, zIndex: 1001, width: 240, maxHeight: more.maxH, boxSizing: 'border-box', padding: 6, background: 'var(--pop)', border: '1px solid var(--bd2)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', gap: 2, fontFamily: "'Source Sans 3', -apple-system, sans-serif" }}>
          <div style={{ position: 'relative', marginBottom: 4, flex: 'none' }}>
            <MagnifyingGlass size={16} color="var(--tx3)" style={{ position: 'absolute', left: 10, top: 9 }} />
            <input
              autoFocus
              type="text"
              aria-label="Search navigation"
              placeholder="Search"
              value={moreQ}
              onChange={(e) => setMoreQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && pool[0]) go(pool[0].label); }}
              style={{ width: '100%', height: 34, boxSizing: 'border-box', padding: '0 10px 0 32px', border: '1px solid var(--bd2)', borderRadius: 6, background: 'var(--card)', color: 'var(--tx)', fontFamily: 'inherit', fontSize: 14, outline: 'none' }}
            />
          </div>
          <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pool.length === 0 && <div style={{ padding: '8px 10px', fontSize: 14, color: 'var(--tx3)' }}>No matches</div>}
            {pool.map((x) => (
              <button
                key={x.label}
                type="button"
                role="menuitem"
                aria-current={active === x.label ? 'page' : undefined}
                onClick={() => go(x.label)}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--su2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                style={{ height: 36, flex: 'none', padding: '0 10px', border: 'none', borderRadius: 6, background: 'transparent', color: 'var(--tx)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap' }}
              >
                <span style={{ width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  {x.img ? <img src={x.img} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : x.icon && <x.icon size={18} />}
                </span>
                <span>{x.label}</span>
                {x.badge && <span aria-hidden style={{ marginLeft: 'auto', minWidth: 20, height: 20, padding: '0 6px', boxSizing: 'border-box', borderRadius: 999, background: 'var(--dang-solid)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{x.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {tip && !open && (
        <div role="tooltip" style={{ position: 'fixed', left: 62, top: tip.y, transform: 'translateY(-50%)', zIndex: 1000, background: '#1C1C1E', color: '#fff', fontSize: 12, fontWeight: 500, lineHeight: 1.4, padding: '7px 11px', borderRadius: 8, whiteSpace: 'nowrap', pointerEvents: 'none', fontFamily: "'Source Sans 3', -apple-system, sans-serif" }}>
          <span aria-hidden style={{ position: 'absolute', left: -4, top: '50%', width: 8, height: 8, background: '#1C1C1E', transform: 'translateY(-50%) rotate(45deg)', borderRadius: 1 }} />
          {tip.text}
        </div>
      )}
    </>
  );
};

export default SideRail;
