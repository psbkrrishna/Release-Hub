import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import Index from './pages/Index';
import FeatureDetail from './pages/FeatureDetail';
import PerformanceReviews from './pages/PerformanceReviews';
import KnowledgeBase from './components/KnowledgeBase';
import UserRoleProvider from './components/UserRoleProvider';
import ReleaseVisibilityProvider from './components/ReleaseVisibilityProvider';
import FeatureStore from './components/FeatureStore';

const queryClient = new QueryClient();

/* Toasts are the Zerra `.toast` rendered by FeatureStore, so the shadcn and
   sonner toasters are no longer mounted - two toast systems on one page was
   the only reason messages appeared in two different visual languages. */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <UserRoleProvider>
          <ReleaseVisibilityProvider>
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
                      <div className="empty">
                        <div className="ico"><i className="ph ph-chart-bar" /></div>
                        <h4>Insights</h4>
                        <p>Placeholder for future analytics views.</p>
                      </div>
                    }
                  />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </FeatureStore>
          </ReleaseVisibilityProvider>
        </UserRoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
