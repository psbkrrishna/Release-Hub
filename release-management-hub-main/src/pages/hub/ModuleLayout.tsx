import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, EnvelopeSimpleOpen, MagnifyingGlass, PlayCircle, X, type Icon as PhIcon } from '@phosphor-icons/react';
import { DOC_MODULES, MODULE_ICON } from '@/components/hub/docsNavData';

/* ---------------------------------------------------------------------------
   Documentation, from the Release Hub V2 design: a 240px left nav (searchable;
   every module, then release notes, newsletters and the video library "across
   all modules") running from under the page header to the bottom of the
   viewport, and the open section beside it.
   --------------------------------------------------------------------------- */

const TOP = 'calc(var(--shell-top, 56px) + var(--hub-hdr-h, 0px))';

interface NavItem { heading?: false; icon: PhIcon; label: string; path: string }
interface NavHead { heading: true; label: string }

const ModuleLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  const all: Array<NavItem | NavHead> = [
    { heading: true, label: 'Modules' },
    ...DOC_MODULES.map((m) => ({ icon: MODULE_ICON[m.name] ?? BookOpen, label: m.name, path: `/product-hub/knowledge/modules/${m.slug}` })),
    { heading: true, label: 'Across all modules' },
    { icon: BookOpen, label: 'Release notes', path: '/product-hub/knowledge/release-notes' },
    { icon: EnvelopeSimpleOpen, label: 'Newsletters', path: '/product-hub/knowledge/newsletters' },
    { icon: PlayCircle, label: 'Video library', path: '/product-hub/knowledge/videos' },
  ];
  const ql = q.trim().toLowerCase();
  const nav: Array<(NavItem | NavHead) & { pad?: string }> = [];
  let pending: NavHead | null = null;
  all.forEach((n) => {
    if (n.heading) { pending = n; return; }
    if (ql && !n.label.toLowerCase().includes(ql)) return;
    if (pending) { nav.push({ ...pending, pad: nav.length ? '12px 8px 4px' : '4px 8px' }); pending = null; }
    nav.push(n);
  });

  return (
    <section
      data-screen-label="Documentation section"
      style={{ display: 'grid', gridTemplateColumns: '240px minmax(0,1fr)', gap: 16, alignItems: 'start', minHeight: `calc(100vh - ${TOP} - 32px)` }}
    >
      <nav
        aria-label="Documentation"
        style={{ position: 'sticky', top: TOP, height: `calc(100vh - ${TOP})`, boxSizing: 'border-box', overflowY: 'auto', margin: '-16px 0 -16px -16px', background: 'var(--card)', borderRight: '1px solid var(--bd2)', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <div style={{ position: 'relative', marginBottom: 8, flex: 'none' }}>
          <MagnifyingGlass size={14} color="var(--tx4)" aria-hidden style={{ position: 'absolute', left: 10, top: 9, pointerEvents: 'none' }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder="Search"
            aria-label="Search documentation menu"
            style={{ width: '100%', boxSizing: 'border-box', height: 32, borderRadius: 8, border: `1px solid ${focus ? 'var(--brand)' : 'var(--bd2)'}`, boxShadow: focus ? '0 0 0 3px var(--ring)' : 'none', background: 'var(--card)', color: 'var(--tx)', fontFamily: 'inherit', fontSize: 13, padding: '0 28px 0 30px', outline: 'none' }}
          />
          {q && (
            <button type="button" aria-label="Clear search" title="Clear search" onClick={() => setQ('')} style={{ position: 'absolute', right: 4, top: 4, width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--tx3)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={12} />
            </button>
          )}
        </div>
        {nav.length === 0 && <div style={{ padding: 8, fontSize: 13, color: 'var(--tx3)' }}>No matches for “{q}”</div>}
        {nav.map((n) =>
          n.heading ? (
            <div key={`h-${n.label}`} style={{ padding: n.pad, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--tx4)' }}>{n.label}</div>
          ) : ((n: NavItem) => {
            const on = pathname === n.path || pathname.startsWith(`${n.path}/`);
            const h = hover === n.path;
            return (
              <button
                key={n.path}
                type="button"
                aria-current={on ? 'page' : undefined}
                onClick={() => navigate(n.path)}
                onMouseEnter={() => setHover(n.path)}
                onMouseLeave={() => setHover(null)}
                style={{ height: 32, padding: '0 8px', borderRadius: 8, border: 'none', background: on ? 'var(--brand-soft)' : h ? 'var(--su2)' : 'transparent', color: on ? 'var(--brand)' : 'var(--tx2)', fontFamily: 'inherit', fontSize: 14, fontWeight: on ? 600 : 500, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 'none' }}
              >
                <n.icon size={16} style={{ flex: 'none' }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.label}</span>
              </button>
            );
          })(n as NavItem),
        )}
      </nav>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Outlet />
      </div>
    </section>
  );
};

export default ModuleLayout;
