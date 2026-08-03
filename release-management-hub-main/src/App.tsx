
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import FeatureDetail from "./pages/FeatureDetail";
import PerformanceReviews from "./pages/PerformanceReviews";
import KnowledgeBase from "./components/KnowledgeBase";
import UserRoleProvider from "./components/UserRoleProvider";
import ReleaseVisibilityProvider from "./components/ReleaseVisibilityProvider";
import ReleaseOverviewDialog from "./components/ReleaseOverviewDialog";
import { BarChart3 } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserRoleProvider>
          <ReleaseVisibilityProvider>
            <Routes>
              <Route element={<Navigation />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="release-hub" element={<Index />} />
                <Route path="release-hub/features/:featureId" element={<FeatureDetail />} />
                <Route path="performance-reviews" element={<PerformanceReviews />} />
                <Route path="knowledge-base" element={<div className="container mx-auto max-w-full px-4 py-6"><KnowledgeBase /></div>} />
                <Route path="insights" element={<div className="flex min-h-[70vh] items-center justify-center text-gray-500"><div className="text-center"><BarChart3 className="mx-auto mb-3 h-12 w-12 text-gray-400" /><h2 className="text-xl font-semibold text-gray-700">Insights</h2><p className="mt-1 text-sm">Coming soon — placeholder for future analytics views.</p></div></div>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ReleaseOverviewDialog />
          </ReleaseVisibilityProvider>
        </UserRoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
