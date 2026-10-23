import { Toaster } from 'sonner';
import { ChartBar } from '@phosphor-icons/react';
import { ROOT, T, RADIUS } from '@/styles/zerra';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { HUB, LEGACY_HUB } from '@/lib/routes';
import EmptyState from '@/components/primitives/EmptyState';
import Navigation from './components/Navigation';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import Index from './pages/Index';
import FeatureDetail from './pages/FeatureDetail';
import PerformanceReviews from './pages/PerformanceReviews';
import ReleaseHubLayout from './pages/hub/ReleaseHubLayout';
import HubIndexRedirect from './pages/hub/HubIndexRedirect';
import Overview from './pages/hub/Overview';
import ModuleLayout from './pages/hub/ModuleLayout';
import KnowledgeHome from './pages/hub/KnowledgeHome';
import KnowledgeSection from './pages/hub/KnowledgeSection';
import ModuleDocs from './pages/hub/ModuleDocs';
import DocumentDetail from './pages/hub/DocumentDetail';
import ReleaseNoteDetail from './pages/hub/ReleaseNoteDetail';
import NewsletterDetail from './pages/hub/NewsletterDetail';
import UserRoleProvider from './components/UserRoleProvider';
import HubVersionProvider from './components/HubVersionProvider';
import FeatureStore from './components/FeatureStore';
import ReleaseStore from './components/ReleaseStore';

const queryClient = new QueryClient();

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
                <Route path="releases" element={<Index />} />
                <Route path="features/:featureId" element={<FeatureDetail />} />
                {/* The documentation tab's landing page is a plain page:
                    search, then the modules. Everything below it - a module,
                    or one of the three section lists - shares a layout route
                    that adds the left nav, so the nav survives navigation
                    between those pages instead of remounting under each. */}
                <Route path="knowledge">
                  <Route index element={<KnowledgeHome />} />
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

              <Route path="performance-reviews" element={<PerformanceReviews />} />
              <Route
                path="insights"
                element={
                  <EmptyState icon={<ChartBar size={28} />} title="Insights">
                    Placeholder for future analytics views.
                  </EmptyState>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ReleaseStore>
        </FeatureStore>
        </HubVersionProvider>
      </UserRoleProvider>
    </BrowserRouter>
  </QueryClientProvider>
  </div>
);

export default App;
