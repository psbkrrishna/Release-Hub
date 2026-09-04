import { Outlet, useLocation } from 'react-router-dom';
import Crumb, { type CrumbLevel } from '@/components/primitives/Crumb';
import HubTabs, { HUB_TABS, hubTabOf } from '@/components/hub/HubTabs';
import { moduleBySlug } from '@/data/knowledge';

/* ---------------------------------------------------------------------------
   The Release Hub shell: breadcrumb, tab strip, and whichever tab is open.

   The three tabs are peers, so at a tab root the breadcrumb stops at "Release
   Hub" rather than repeating what the strip already says. Only a page deeper
   than a tab root adds levels - and then the tab becomes a link, which is the
   way back up from a module or a feature.
   --------------------------------------------------------------------------- */

/** The label for a page below a tab root, or '' when we are at one. */
const leafOf = (pathname: string): string => {
  if (pathname.startsWith('/release-hub/features/')) return 'Feature Details';

  const kb = pathname.match(/^\/release-hub\/knowledge\/(.+)$/)?.[1];
  if (!kb) return '';
  if (kb === 'release-notes') return 'Release notes';
  if (kb === 'newsletters') return 'Newsletters';
  if (kb === 'videos') return 'Video library';

  const slug = kb.match(/^modules\/([^/]+)$/)?.[1];
  // An unknown slug renders its own not-found state; the crumb stays generic
  // rather than echoing whatever was typed into the address bar.
  return slug ? moduleBySlug(slug)?.name ?? 'Module documentation' : '';
};

const crumbFor = (pathname: string): CrumbLevel[] => {
  const dashboard: CrumbLevel = { label: 'Dashboard', path: '/dashboard' };
  const leaf = leafOf(pathname);
  if (!leaf) return [dashboard, { label: 'Release Hub' }];

  const tab = HUB_TABS.find((t) => t.key === hubTabOf(pathname))!;
  return [
    dashboard,
    // Points at /release-hub, not at a tab, so this link keeps working if the
    // hub's default tab ever changes.
    { label: 'Release Hub', path: '/release-hub' },
    { label: tab.label, path: tab.path },
    { label: leaf },
  ];
};

const ReleaseHubLayout = () => {
  const { pathname } = useLocation();

  return (
    <>
      <Crumb levels={crumbFor(pathname)} />
      <HubTabs />
      <Outlet />
    </>
  );
};

export default ReleaseHubLayout;
