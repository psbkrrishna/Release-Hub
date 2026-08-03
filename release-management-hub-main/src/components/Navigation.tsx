import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  LayoutDashboard,
  MessageCircle,
  Rocket,
  Settings,
  Sparkles,
  UserCircle,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Chatbot from '@/components/Chatbot';
import DashboardReleaseBanner from '@/components/DashboardReleaseBanner';
import WhatsNewButton from '@/components/WhatsNewButton';
import { DemoRoleSelector, useUserRole } from '@/components/UserRoleProvider';

const topSidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Briefcase, label: 'Jobs' },
  { icon: FileText, label: 'Documents' },
  { icon: Settings, label: 'Setup' },
  { icon: UserCircle, label: 'Candidates' },
  { icon: ClipboardCheck, label: 'Performance Reviews', path: '/performance-reviews', isNew: true },
  { icon: Building2, label: 'Organization' },
  { icon: Users, label: 'Teams' },
  { icon: Sparkles, label: 'AI' },
];

const primaryNav = [
  { icon: BarChart3, label: 'Insights', path: '/insights' },
  { icon: Rocket, label: 'Release Hub', path: '/release-hub' },
  { icon: BookOpen, label: 'Knowledge Base', path: '/knowledge-base' },
];

const bottomSidebarItems = [
  { icon: Settings, label: 'Settings' },
  { icon: HelpCircle, label: 'Help' },
];

const getBreadcrumb = (pathname: string) => {
  if (pathname === '/dashboard') return ['Home', 'Dashboard'];
  if (pathname === '/performance-reviews') return ['Performance', 'Performance Reviews'];
  if (pathname.startsWith('/release-hub/features/')) return ['Release Hub', 'Feature Details'];
  if (pathname.startsWith('/release-hub')) return ['Resources', 'Release Management Hub'];
  if (pathname.startsWith('/knowledge-base')) return ['Resources', 'Knowledge Base'];
  if (pathname.startsWith('/insights')) return ['Insights', 'Hiring Funnel Reports'];
  return ['Home', 'Zwayam'];
};

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isInternal } = useUserRole();
  const [chatOpen, setChatOpen] = useState(true);
  const [parentCrumb, pageCrumb] = getBreadcrumb(location.pathname);

  const isActivePath = (path?: string) => {
    if (!path) return false;
    if (path === '/release-hub') return location.pathname.startsWith('/release-hub');
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-50">
      <header className="z-30 flex h-14 flex-shrink-0 items-center justify-between border-b bg-white px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className="mr-1 flex flex-none items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:mr-6">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">Z</div>
            <span className="hidden font-semibold text-gray-800 sm:inline">Zwayam</span>
          </button>
          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center text-sm text-gray-600 md:flex">
            <span className="truncate text-blue-600">{parentCrumb}</span>
            <ChevronRight className="mx-1 h-4 w-4 flex-none text-gray-400" />
            <span className="truncate font-medium text-gray-800">{pageCrumb}</span>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <WhatsNewButton />
          <div className="hidden lg:block"><DemoRoleSelector /></div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="z-20 flex w-14 flex-shrink-0 flex-col items-center border-r bg-white py-3">
          <div className="flex flex-col items-center gap-1">
            {topSidebarItems.map(({ icon: Icon, label, path, isNew }) => {
              const active = isActivePath(path);
              const showNew = isNew && !isInternal;
              return (
                <button key={label} type="button" title={showNew ? `${label} — new feature` : label} onClick={() => path && navigate(path)} className={`relative flex h-10 w-10 items-center justify-center rounded-md transition-all ${active ? 'bg-blue-100 text-blue-700 shadow-sm' : showNew ? 'bg-gradient-to-br from-blue-50 to-purple-50 text-blue-700 ring-1 ring-blue-200 hover:from-blue-100 hover:to-purple-100' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}>
                  {active && <span className="absolute bottom-1 left-0 top-1 w-0.5 rounded-r bg-blue-600" />}
                  <Icon className="h-5 w-5" />
                  {showNew && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm ring-2 ring-white">
                      New
                    </span>
                  )}
                </button>
              );
            })}

            <div className="my-2 h-px w-8 bg-gray-200" />

            {primaryNav.map(({ icon: Icon, label, path }) => {
              const active = isActivePath(path);
              return (
                <button key={path} type="button" title={label} onClick={() => navigate(path)} className={`relative flex h-10 w-10 items-center justify-center rounded-md transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}>
                  {active && <span className="absolute bottom-1 left-0 top-1 w-0.5 rounded-r bg-blue-600" />}
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>

          <div className="mt-auto flex flex-col items-center gap-1">
            {bottomSidebarItems.map(({ icon: Icon, label }) => <button key={label} type="button" title={label} className="flex h-10 w-10 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"><Icon className="h-5 w-5" /></button>)}
          </div>
        </aside>

        <div className="relative flex min-w-0 flex-1">
          <main className="min-w-0 flex-1 overflow-auto">
            {location.pathname === '/dashboard' && <DashboardReleaseBanner />}
            <Outlet />
          </main>

          <button onClick={() => setChatOpen(!chatOpen)} className="absolute right-0 top-4 z-20 hidden rounded-l-md border border-r-0 bg-white p-1.5 shadow-sm transition-colors hover:bg-gray-50 xl:block" style={{ right: chatOpen ? '24rem' : '0' }} title={chatOpen ? 'Collapse assistant' : 'Open assistant'} aria-label={chatOpen ? 'Collapse assistant' : 'Open assistant'}>
            {chatOpen ? <ChevronRight className="h-4 w-4 text-gray-600" /> : <ChevronLeft className="h-4 w-4 text-gray-600" />}
          </button>

          {chatOpen && (
            <aside className="hidden w-96 flex-shrink-0 flex-col border-l bg-white shadow-lg xl:flex">
              <div className="flex flex-shrink-0 items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                <h3 className="flex items-center gap-2 text-base font-semibold text-white"><MessageCircle className="h-5 w-5" /> Knowledge Assistant</h3>
              </div>
              <div className="min-h-0 flex-1"><Chatbot /></div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;
