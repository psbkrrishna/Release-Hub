import { useState, type ComponentType } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Briefcase, FileText, Settings, UserCircle, ClipboardList, Building2,
  Users, Sparkles, BarChart3, Rocket, BookOpen, Settings2, HelpCircle,
  PanelLeft, Languages, MessageCircle, Bell, X,
} from 'lucide-react';
import Chatbot from '@/components/Chatbot';
import ReleaseBanner from '@/components/ReleaseBanner';
import WhatsNewButton from '@/components/WhatsNewButton';
import IconButton from '@/components/primitives/IconButton';
import { caretBackgroundLight } from '@/components/primitives/fieldStyles';
import { useUserRole, type UserRole } from '@/components/UserRoleProvider';

/* Icons are component references now, not name strings. The previous version
   built class names as `ph ph-${icon}`, which meant seven of the rail's icons
   never appeared in a search for the icon set - worth avoiding again. */
type RailItem = {
  icon: ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  path?: string;
  isNew?: boolean;
};

const topRail: RailItem[] = [
  { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
  { icon: Briefcase, label: 'Jobs' },
  { icon: FileText, label: 'Documents' },
  { icon: Settings, label: 'Configuration' },
  { icon: UserCircle, label: 'Candidates' },
  { icon: ClipboardList, label: 'Performance', path: '/performance-reviews', isNew: true },
  { icon: Building2, label: 'Organisation' },
  { icon: Users, label: 'People' },
  { icon: Sparkles, label: 'AI tools' },
];

const lowerRail: RailItem[] = [
  { icon: BarChart3, label: 'Analytics', path: '/insights' },
  { icon: Rocket, label: 'Release Hub', path: '/release-hub' },
  { icon: BookOpen, label: 'Knowledge base', path: '/knowledge-base' },
];

const footRail: RailItem[] = [
  { icon: Settings2, label: 'Settings' },
  { icon: HelpCircle, label: 'Help' },
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
  // The rail widens on hover to reveal labels and overlays the canvas rather
  // than reflowing it, so the shell keeps its 72px offset either way.
  const [railExpanded, setRailExpanded] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem('annDismissed') === '1',
  );

  /* The banner's height used to be a CSS variable so the shell and the
     assistant could both react to it. With no stylesheet to hold that
     variable, the offset is computed here and passed down as classes - one
     place, still only stated once. */
  const topOffset = bannerDismissed ? 'top-topbar' : 'top-shell-top';
  const shellPadTop = bannerDismissed ? 'pt-topbar' : 'pt-shell-top';

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/release-hub') return location.pathname.startsWith('/release-hub');
    return location.pathname === path;
  };

  const dismissBanner = () => {
    localStorage.setItem('annDismissed', '1');
    setBannerDismissed(true);
  };

  const railButton = ({ icon: Icon, label, path, isNew }: RailItem) => {
    const active = isActive(path);
    return (
      <button
        key={label}
        type="button"
        className={[
          'relative mx-3 flex shrink-0 items-center gap-3 rounded-lg p-2.5 text-sm transition-colors',
          railExpanded ? 'justify-start' : 'justify-center',
          active ? 'bg-brand text-white' : 'text-ink-700 hover:bg-brand hover:text-white',
        ].join(' ')}
        title={railExpanded ? undefined : label}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        onClick={() => path && navigate(path)}
      >
        <Icon size={24} className="shrink-0" />
        {railExpanded && <span className="overflow-hidden whitespace-nowrap">{label}</span>}
        {isNew && (
          <span
            className={[
              'rounded bg-purple-500 px-[3px] py-px text-[9px] font-bold leading-[1.2] tracking-[.02em] text-white',
              railExpanded ? 'ml-auto' : 'absolute right-2 top-0.5',
            ].join(' ')}
          >
            NEW
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-topbar flex h-topbar items-center gap-4 bg-brand px-4 text-white">
        <IconButton
          tone="onBrand"
          className="rounded-lg"
          onClick={() => setRailCollapsed((v) => !v)}
          aria-label={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={railCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft size={18} />
        </IconButton>

        <button
          className="flex shrink-0 cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-inherit"
          onClick={() => navigate('/dashboard')}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[.16] text-base font-bold">
            Z
          </span>
          <span className="text-base font-semibold tracking-[-0.01em]">Zwayam</span>
        </button>

        <div className="ml-auto flex items-center gap-3">
          <WhatsNewButton />
          <IconButton tone="onBrand" className="rounded-lg" title="Language" aria-label="Language">
            <Languages size={18} />
          </IconButton>
          <IconButton
            tone="onBrand"
            className="rounded-lg"
            title="Knowledge Assistant"
            aria-label="Knowledge Assistant"
            onClick={() => setKbOpen((v) => !v)}
          >
            <MessageCircle size={18} />
          </IconButton>
          <IconButton tone="onBrand" className="relative rounded-lg" title="Notifications" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
          </IconButton>
          <IconButton tone="onBrand" className="rounded-lg" title="Profile" aria-label="Profile">
            <UserCircle size={18} />
          </IconButton>

          <div className="flex items-center gap-2 text-sm text-white/85">
            <span>Demo Role:</span>
            <select
              className="h-8 min-w-[168px] cursor-pointer appearance-none rounded-md border border-white/[.34] bg-white/[.12] pl-3 pr-4 text-base font-medium text-white"
              style={caretBackgroundLight}
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
              aria-label="Demo role"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value} className="bg-white text-ink-900">
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {!bannerDismissed && <ReleaseBanner railCollapsed={railCollapsed} onDismiss={dismissBanner} />}

      <aside
        className={[
          'fixed bottom-0 left-0 top-topbar z-rail flex flex-col items-stretch gap-2 overflow-hidden',
          'border-r border-ink-150 bg-white py-3 shadow-rail transition-[width] duration-200',
          railCollapsed ? 'w-0' : railExpanded ? 'w-rail-open' : 'w-rail',
        ].join(' ')}
        onMouseEnter={() => setRailExpanded(true)}
        onMouseLeave={() => setRailExpanded(false)}
      >
        {topRail.map(railButton)}
        <div className="mx-3 my-2 h-px bg-ink-150" />
        {lowerRail.map(railButton)}
        <div className="mt-auto flex flex-col gap-1">{footRail.map(railButton)}</div>
      </aside>

      <div
        className={[
          'transition-[padding]',
          shellPadTop,
          railCollapsed ? 'pl-0' : 'pl-rail',
          /* The assistant only gets its own column once there is room for it;
             below that it overlays the canvas instead. */
          kbOpen ? 'min-[1181px]:pr-kb' : '',
        ].join(' ')}
      >
        <main className="px-4 pb-12 pt-4 min-[861px]:px-6 min-[861px]:pt-5">
          <Outlet />
        </main>
      </div>

      {kbOpen && (
        <aside
          className={[
            'fixed bottom-0 right-0 z-kb flex w-[min(340px,100%)] flex-col border-l border-ink-150 bg-white',
            'shadow-elev3 min-[1181px]:w-kb min-[1181px]:shadow-none',
            topOffset,
          ].join(' ')}
        >
          <div className="flex items-center gap-3 bg-brand px-5 py-4 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[.18]">
              <Sparkles size={16} />
            </span>
            <div>
              <div className="text-sm font-semibold">Knowledge Assistant</div>
              <div className="text-xs text-white/[.78]">Ask about this release</div>
            </div>
            <IconButton
              tone="onBrand"
              className="ml-auto rounded-lg"
              onClick={() => setKbOpen(false)}
              aria-label="Close assistant"
            >
              <X size={16} />
            </IconButton>
          </div>
          <Chatbot />
        </aside>
      )}
    </>
  );
};

export default Navigation;
