import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Chatbot from '@/components/Chatbot';
import ReleaseBanner from '@/components/ReleaseBanner';
import WhatsNewButton from '@/components/WhatsNewButton';
import { useUserRole, type UserRole } from '@/components/UserRoleProvider';

/* The rail carries the Phosphor subset embedded in zerra.css - only the
   glyphs declared there exist, so icons are named rather than imported. */
const topRail = [
  { icon: 'squares-four', label: 'Dashboard', path: '/dashboard' },
  { icon: 'briefcase', label: 'Jobs' },
  { icon: 'file-text', label: 'Documents' },
  { icon: 'gear', label: 'Configuration' },
  { icon: 'user-circle', label: 'Candidates' },
  { icon: 'clipboard-text', label: 'Performance', path: '/performance-reviews', isNew: true },
  { icon: 'buildings', label: 'Organisation' },
  { icon: 'users-three', label: 'People' },
  { icon: 'sparkle', label: 'AI tools' },
];

const lowerRail = [
  { icon: 'chart-bar', label: 'Analytics', path: '/insights' },
  { icon: 'rocket-launch', label: 'Release Hub', path: '/release-hub' },
  { icon: 'book-open', label: 'Knowledge base', path: '/knowledge-base' },
];

const ROLES: Array<{ value: UserRole; label: string }> = [
  { value: 'customer', label: 'Customer' },
  { value: 'customer-admin', label: 'Customer Admin' },
  { value: 'creator', label: 'Creator (Internal)' },
  { value: 'implementation', label: 'Implementation Team' },
];

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, setUserRole } = useUserRole();
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem('annDismissed') === '1',
  );

  // The shell's vertical rhythm lives in --annbar so the rail, the canvas and
  // the assistant all move together when the banner goes away.
  useEffect(() => {
    document.documentElement.style.setProperty('--annbar', bannerDismissed ? '0px' : '48px');
  }, [bannerDismissed]);

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/release-hub') return location.pathname.startsWith('/release-hub');
    return location.pathname === path;
  };

  const dismissBanner = () => {
    localStorage.setItem('annDismissed', '1');
    setBannerDismissed(true);
  };

  const railButton = ({ icon, label, path, isNew }: (typeof topRail)[number]) => (
    <button
      key={label}
      type="button"
      className={`rail-btn${isActive(path) ? ' on' : ''}`}
      title={label}
      aria-label={label}
      onClick={() => path && navigate(path)}
    >
      <i className={`ph ph-${icon}`} />
      {isNew && <span className="newdot">NEW</span>}
    </button>
  );

  return (
    <>
      <header className="topbar">
        <button
          className="tb-icon"
          onClick={() => setRailCollapsed((v) => !v)}
          aria-label={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className="ph ph-sidebar-simple" />
        </button>
        <button
          className="brand"
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit' }}
        >
          <div className="brand-mark">Z</div>
          <span className="brand-word">Zwayam</span>
        </button>
        <div className="tb-right">
          <WhatsNewButton />
          <button className="tb-icon" title="Language" aria-label="Language">
            <i className="ph ph-translate" />
          </button>
          <button
            className="tb-icon"
            title="Knowledge Assistant"
            aria-label="Knowledge Assistant"
            onClick={() => setKbOpen((v) => !v)}
          >
            <i className="ph ph-chat-circle-dots" />
          </button>
          <button className="tb-icon" title="Notifications" aria-label="Notifications">
            <i className="ph ph-bell" />
            <span className="nub" />
          </button>
          <button className="tb-icon" title="Profile" aria-label="Profile">
            <i className="ph ph-user-circle" />
          </button>
          <div className="role-wrap">
            <span>Demo Role:</span>
            <select
              className="role-sel"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              aria-label="Demo role"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {!bannerDismissed && (
        <ReleaseBanner railCollapsed={railCollapsed} onDismiss={dismissBanner} />
      )}

      <aside className={`rail${railCollapsed ? ' collapsed' : ''}`}>
        {topRail.map(railButton)}
        <div className="rail-sep" />
        {lowerRail.map(railButton)}
        <div className="rail-foot">
          <button className="rail-btn" title="Settings" aria-label="Settings">
            <i className="ph ph-gear-six" />
          </button>
          <button className="rail-btn" title="Help" aria-label="Help">
            <i className="ph ph-question" />
          </button>
        </div>
      </aside>

      <div className={`shell${kbOpen ? ' kb-open' : ''}${railCollapsed ? ' rail-collapsed' : ''}`}>
        <main className="canvas">
          <Outlet />
        </main>
      </div>

      <aside className={`kb${kbOpen ? ' open' : ''}`}>
        <div className="kb-head">
          <div className="ic">
            <i className="ph ph-sparkle" />
          </div>
          <div>
            <div className="t">Knowledge Assistant</div>
            <div className="s">Ask about this release</div>
          </div>
          <button className="tb-icon x" onClick={() => setKbOpen(false)} aria-label="Close assistant">
            <i className="ph ph-x" />
          </button>
        </div>
        <Chatbot />
      </aside>
    </>
  );
};

export default Navigation;
