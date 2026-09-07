import { Outlet, useLocation } from 'react-router-dom';
import Crumb, { type CrumbLevel } from '@/components/primitives/Crumb';
import HubTabs, { HUB_TABS, hubTabOf } from '@/components/hub/HubTabs';
import { moduleBySlug } from '@/data/knowledge';

/* ---------------------------------------------------------------------------
   The Feature Hub shell: page title, tab strip, and whichever tab is open.

   The breadcrumb is deliberately absent at a tab root. Arriving by tab needs
   no trail - the title says where you are and the strip says which tab - so a
   crumb reading "Dashboard > Feature Hub" would only restate the two lines
   directly above it. It appears only on pages below a tab root, where it is
   doing real work: naming the current page and offering the way back up.
   --------------------------------------------------------------------------- */

/** The label for a page below a tab root, or '' when we are at one. */
const leafOf = (pathname: string): string => {
  if (pathname.startsWith('/release-hub/features/')) return 'Feature details';

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

/** Scoped to the hub: the tab, then the page. The app-level trail back to the
 *  Dashboard is the left rail's job, not this. */
const crumbFor = (pathname: string): CrumbLevel[] | null => {
  const leaf = leafOf(pathname);
  if (!leaf) return null;
  const tab = HUB_TABS.find((t) => t.key === hubTabOf(pathname))!;
  return [{ label: tab.label, path: tab.path }, { label: leaf }];
};

const ReleaseHubLayout = () => {
  const { pathname } = useLocation();
  const crumb = crumbFor(pathname);

  return (
    <>
      <h1 className="mb-2 text-xl font-semibold leading-tight tracking-[-0.01em] text-brand">
        Feature Hub
      </h1>
      <HubTabs />
      {crumb && <Crumb levels={crumb} />}
      <Outlet />
    </>
  );
};

export default ReleaseHubLayout;
