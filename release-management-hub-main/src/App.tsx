import { Toaster } from 'sonner';
import { ChartBar } from '@phosphor-icons/react';
import { ROOT, T, RADIUS } from '@/styles/zerra';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
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
import KnowledgeLayout from './pages/hub/KnowledgeLayout';
import KnowledgeHome from './pages/hub/KnowledgeHome';
import KnowledgeSection from './pages/hub/KnowledgeSection';
import ModuleDocs from './pages/hub/ModuleDocs';
import UserRoleProvider from './components/UserRoleProvider';
import FeatureStore from './components/FeatureStore';

const queryClient = new QueryClient();

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
        <FeatureStore>
          <Routes>
            <Route element={<Navigation />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* The Release Hub: three peer tabs under one shell. Feature
                  detail keeps the URL it has always had - the release banner,
                  What's New and the feature table all point at it. */}
              <Route path="release-hub" element={<ReleaseHubLayout />}>
                <Route index element={<HubIndexRedirect />} />
                <Route path="overview" element={<Overview />} />
                {/* The first tab shipped as "home" before it was renamed. */}
                <Route path="home" element={<Navigate to="/release-hub/overview" replace />} />
                <Route path="releases" element={<Index />} />
                <Route path="features/:featureId" element={<FeatureDetail />} />
                {/* The documentation tab carries its own left nav pane, so it
                    is a layout route - the pane then survives navigation
                    between its pages instead of remounting under each one. */}
                <Route path="knowledge" element={<KnowledgeLayout />}>
                  <Route index element={<KnowledgeHome />} />
                  <Route path="release-notes" element={<KnowledgeSection section="release-notes" />} />
                  <Route path="newsletters" element={<KnowledgeSection section="newsletters" />} />
                  <Route path="videos" element={<KnowledgeSection section="videos" />} />
                  <Route path="modules/:moduleSlug" element={<ModuleDocs />} />
                </Route>
              </Route>

              {/* The Knowledge Base was its own destination before the merge.
                  Bookmarks and the left rail's old entry both land here. */}
              <Route path="knowledge-base" element={<Navigate to="/release-hub/knowledge" replace />} />

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
        </FeatureStore>
      </UserRoleProvider>
    </BrowserRouter>
  </QueryClientProvider>
  </div>
);

export default App;
