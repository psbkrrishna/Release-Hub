import { Toaster } from 'sonner';
import { ROOT, T, RADIUS } from '@/styles/zerra';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { ADOPTION, HUB, LEGACY_HUB } from '@/lib/routes';
import Navigation from './components/Navigation';
import AdoptionPage from './pages/adoption/AdoptionPage';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import Index from './pages/Index';
import FeatureDetail from './pages/FeatureDetail';
import PerformanceReviews from './pages/PerformanceReviews';
import ReleaseHubLayout from './pages/hub/ReleaseHubLayout';
import HubIndexRedirect from './pages/hub/HubIndexRedirect';
import Overview from './pages/hub/Overview';
import ModuleLayout from './pages/hub/ModuleLayout';
import KnowledgeSection from './pages/hub/KnowledgeSection';
import ModuleDocs from './pages/hub/ModuleDocs';
import DocumentDetail from './pages/hub/DocumentDetail';
import ReleaseNoteDetail from './pages/hub/ReleaseNoteDetail';
import NewsletterDetail from './pages/hub/NewsletterDetail';
import UserRoleProvider from './components/UserRoleProvider';
import HubVersionProvider from './components/HubVersionProvider';
import FeatureStore from './components/FeatureStore';
import ReleaseStore from './components/ReleaseStore';
import TicketStore from './components/TicketStore';
import { CreateTicketModal } from './components/hub/Tickets';
import TicketsPage from './pages/hub/TicketsPage';
import ConfigConsole from './pages/hub/ConfigConsole';
import { useFeatureStore } from './components/FeatureStore';

import ReleasesPage from './pages/hub/ReleasesPage';
import { DOCS_HOME } from './components/hub/docsNavData';

/* Releases per the Release Hub V2 design: customers, customer admins and
   creators each get their table there. The implementation team keeps its
   support queue, which the design does not cover. */
const ReleasesRoute = () => {
  const { isImplementation } = useFeatureStore();
  return isImplementation ? <Index /> : <ReleasesPage />;
};

/* Configure (the rail entry) is where creators manage Get help - the Product
   Hub Configuration design. Other roles have nothing to configure here. */
const ConfigureRoute = () => {
  const { isCreator } = useFeatureStore();
  if (isCreator) return <ConfigConsole />;
  return (
    <div style={{ padding: '64px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>Get help configuration is for Zwayam creators</div>
      <div style={{ fontSize: 13, color: 'var(--tx3)', marginTop: 4 }}>Switch the demo role to Creator (internal) to manage features, releases and help content.</div>
    </div>
  );
};

const queryClient = new QueryClient();

/* The token block also goes on <html>. Tooltips, menus and drawers portal
   into <body>, outside the wrapper below, and without this every var(--…)
   inside them resolved to nothing - a tooltip was white text on no
   background. The wrapper keeps its copy; this only extends the reach. */
Object.entries(ROOT).forEach(([k, v]) => {
  if (k.startsWith('--')) document.documentElement.style.setProperty(k, String(v));
});

const LegacyHubRedirect = () => {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`${HUB}${pathname.slice(LEGACY_HUB.length)}${search}${hash}`} replace />;
};

/* Toaster configured exactly as production's AppLayout mounts it. The
   shadcn TooltipProvider that used to wrap this is gone with the rest of
   components/ui - nothing rendered a Tooltip, the rail and top bar use native
   `title` attributes. ReleaseVisibilityProvider went the same way: it was
   mounted here but had no consumer, so it only wrote a localStorage key that
   nothing read back. FeatureStore owns release state. */
const App = () => (
  /* The Zerra token block sits on this wrapper, so every descendant - and the
     document-level rules in index.html - resolve var(--token). A plain div
     with no transform, so the shell's fixed header and rail are unaffected. */
  <div style={ROOT}>
  <QueryClientProvider client={queryClient}>
    {/* One toast treatment: black with white text. richColors is gone - it
        produced per-status coloured cards, which the guidelines rule out. */}
    <Toaster
      position="top-right"
      closeButton
      toastOptions={{
        style: {
          background: T.neutralStrong,
          color: '#FFFFFF',
          border: 'none',
          borderRadius: RADIUS.control,
          fontSize: 13,
          padding: '10px 14px',
        },
      }}
    />
    <BrowserRouter>
      <UserRoleProvider>
        <HubVersionProvider>
        <FeatureStore>
        <ReleaseStore>
        <TicketStore>
          <CreateTicketModal />
          <Routes>
            <Route element={<Navigation />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Old /release-hub/... links land on the same page under the
                  new base, query string included. */}
              <Route path="release-hub/*" element={<LegacyHubRedirect />} />

              {/* The Product Hub: three peer tabs under one shell. Feature
                  detail keeps its URL shape - the release banner, What's New
                  and the feature table all point at it. */}
              <Route path="product-hub" element={<ReleaseHubLayout />}>
                <Route index element={<HubIndexRedirect />} />
                <Route path="overview" element={<Overview />} />
                {/* The first tab shipped as "home" before it was renamed. */}
                <Route path="home" element={<Navigate to="/product-hub/overview" replace />} />
                <Route path="releases" element={<ReleasesRoute />} />
                <Route path="tickets" element={<TicketsPage />} />
                <Route path="features/:featureId" element={<FeatureDetail />} />
                {/* The documentation tab's landing page is a plain page:
                    search, then the modules. Everything below it - a module,
                    or one of the three section lists - shares a layout route
                    that adds the left nav, so the nav survives navigation
                    between those pages instead of remounting under each. */}
                <Route path="knowledge">
                  <Route index element={<Navigate to={DOCS_HOME} replace />} />
                  <Route element={<ModuleLayout />}>
                    <Route path="release-notes" element={<KnowledgeSection section="release-notes" />} />
                    {/* A release's notes, and a newsletter issue, each render in
                        full on their own address - documents that used to be a
                        toast naming a URL nothing served. */}
                    <Route path="release-notes/:month" element={<ReleaseNoteDetail />} />
                    <Route path="newsletters" element={<KnowledgeSection section="newsletters" />} />
                    <Route path="newsletters/:id" element={<NewsletterDetail />} />
                    <Route path="videos" element={<KnowledgeSection section="videos" />} />
                    <Route path="modules/:moduleSlug" element={<ModuleDocs />} />
                    <Route path="modules/:moduleSlug/documents/:docId" element={<DocumentDetail />} />
                  </Route>
                </Route>
              </Route>

              {/* The Knowledge Base was its own destination before the merge.
                  Bookmarks and the left rail's old entry both land here. */}
              <Route path="knowledge-base" element={<Navigate to="/product-hub/knowledge" replace />} />

              <Route path="configure" element={<ConfigureRoute />} />
              <Route path="performance-reviews" element={<PerformanceReviews />} />
              {/* Analytics opens on feature adoption, its only view so far.
                  The Releases table's usage numbers link straight into it. */}
              <Route path="insights">
                <Route index element={<Navigate to={ADOPTION} replace />} />
                <Route path="adoption" element={<AdoptionPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TicketStore>
        </ReleaseStore>
        </FeatureStore>
        </HubVersionProvider>
      </UserRoleProvider>
    </BrowserRouter>
  </QueryClientProvider>
  </div>
);

export default App;
