import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sparkle, X } from '@phosphor-icons/react';
import { toast } from 'sonner';
import Chatbot from '@/components/Chatbot';
import IconButton from '@/components/primitives/IconButton';
import { useUserRole } from '@/components/UserRoleProvider';
import { ShellProvider, useShell } from '@/components/shell/ShellContext';
import SideRail, { type RailLabel } from '@/components/shell/SideRail';
import { ReleaseModal, TopBar, WebinarBanner } from '@/components/shell/TopBar';

/* ---------------------------------------------------------------------------
   The app shell, as the Release Hub V2 design draws it: a 56px brand top bar,
   the green webinar banner under it while a webinar is ahead, the collapsible
   Side Rail, and the page offset by both. "Get help" is the rail entry for the
   whole help centre - what used to be the Product Hub.
   --------------------------------------------------------------------------- */

const ROUTES: Partial<Record<RailLabel, string>> = {
  Dashboard: '/dashboard',
  Insights: '/insights/adoption',
  'Get help': '/product-hub',
};

const activeFor = (path: string): RailLabel | '' => {
  if (path.startsWith('/product-hub')) return 'Get help';
  if (path.startsWith('/dashboard')) return 'Dashboard';
  if (path.startsWith('/insights')) return 'Insights';
  return '';
};

const Shell = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { shellTop } = useShell();
  const { userRole } = useUserRole();

  /* Switching to Creator while in Get help lands on Configuration, the creator's
     home there - not on whichever customer page was open. */
  useEffect(() => {
    if (userRole === 'creator' && location.pathname.startsWith('/product-hub') && !location.pathname.startsWith('/product-hub/configure')) {
      navigate('/product-hub/configure', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);
  const [zeva, setZeva] = useState(false);
  /* The release pop-up opens once per session, on first landing on the
     dashboard - the way the design times it. */
  const [relModal, setRelModal] = useState(false);
  const [relSeen, setRelSeen] = useState(false);

  /* Published for sticky layers below the shell (table heads, docs nav). */
  useEffect(() => { document.documentElement.style.setProperty('--shell-top', `${shellTop}px`); }, [shellTop]);

  useEffect(() => {
    if (location.pathname.startsWith('/dashboard') && !relSeen) {
      const t = window.setTimeout(() => setRelModal(true), 380);
      return () => window.clearTimeout(t);
    }
  }, [location.pathname, relSeen]);

  const onNavigate = (label: RailLabel) => {
    const to = ROUTES[label];
    if (to) navigate(to);
    else toast(`${label} isn't part of this prototype`);
  };

  return (
    <>
      <TopBar onZeva={() => setZeva((v) => !v)} zevaOpen={zeva} />
      <WebinarBanner />
      <SideRail active={activeFor(location.pathname)} top={shellTop} onNavigate={onNavigate} />

      <div style={{ marginLeft: 'var(--rail-w, 64px)', paddingTop: shellTop, transition: 'margin-left 180ms cubic-bezier(0.4,0,0.2,1)', paddingRight: zeva ? 380 : 0 }}>
        <main style={{ padding: 16, background: 'var(--bg)', minHeight: `calc(100vh - ${shellTop}px)`, boxSizing: 'border-box' }}>
          <Outlet />
        </main>
      </div>

      {zeva && (
        <aside
          aria-label="Zēva"
          style={{ position: 'fixed', top: shellTop, right: 0, bottom: 0, width: 'min(380px, 100%)', zIndex: 180, display: 'flex', flexDirection: 'column', background: 'var(--card)', borderLeft: '1px solid var(--bd2)', fontFamily: "'Source Sans 3', -apple-system, sans-serif" }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--bd2)' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand-soft)', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkle size={16} weight="fill" />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>Zēva</div>
              <div style={{ fontSize: 12, color: 'var(--tx3)' }}>Ask about this release</div>
            </div>
            <IconButton size="compact" onClick={() => setZeva(false)} title="Close Zēva" aria-label="Close Zēva">
              <X size={16} />
            </IconButton>
          </div>
          <Chatbot />
        </aside>
      )}

      <ReleaseModal open={relModal} onClose={() => { setRelModal(false); setRelSeen(true); }} />
    </>
  );
};

const Navigation = () => (
  <ShellProvider>
    <Shell />
  </ShellProvider>
);

export default Navigation;
