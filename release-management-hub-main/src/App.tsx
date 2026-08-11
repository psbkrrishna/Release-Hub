import { Toaster } from 'sonner';
import { BarChart3 } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import EmptyState from '@/components/primitives/EmptyState';
import Navigation from './components/Navigation';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import Index from './pages/Index';
import FeatureDetail from './pages/FeatureDetail';
import PerformanceReviews from './pages/PerformanceReviews';
import KnowledgeBase from './components/KnowledgeBase';
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
  <QueryClientProvider client={queryClient}>
    <Toaster richColors position="top-right" closeButton />
    <BrowserRouter>
      <UserRoleProvider>
        <FeatureStore>
          <Routes>
            <Route element={<Navigation />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="release-hub" element={<Index />} />
              <Route path="release-hub/features/:featureId" element={<FeatureDetail />} />
              <Route path="performance-reviews" element={<PerformanceReviews />} />
              <Route path="knowledge-base" element={<KnowledgeBase />} />
              <Route
                path="insights"
                element={
                  <EmptyState icon={<BarChart3 size={26} />} title="Insights">
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
);

export default App;
