import { Navigate, Route, Routes } from "react-router-dom";
import { PiChartBar } from "react-icons/pi";
import { AppLayout } from "@/layout";
import { UserRoleProvider } from "@/components/UserRoleProvider";
import { FeatureStore } from "@/components/FeatureStore";
import Dashboard from "@/pages/Dashboard";
import PerformanceReviews from "@/pages/PerformanceReviews";
import NotFound from "@/pages/NotFound";
import ReleaseManagementSuite from "@/pages/ReleaseManagement/ReleaseManagementSuite";
import FeatureDetail from "@/pages/ReleaseManagement/FeatureDetail";
import KnowledgeBase from "@/components/KnowledgeBase";

/* AppLayout takes children directly (matching production's own App.jsx -
   a plain wrapper around <Routes>, not a layout route with <Outlet>). */
const App = () => (
  <UserRoleProvider>
    <FeatureStore>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/release-hub" element={<ReleaseManagementSuite />} />
          <Route path="/release-hub/features/:featureId" element={<FeatureDetail />} />
          <Route path="/performance-reviews" element={<PerformanceReviews />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          <Route
            path="/insights"
            element={
              <div className="p-6 flex flex-col items-center text-center py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-grey-100 mb-4">
                  <PiChartBar size={26} />
                </div>
                <h4 className="text-base font-semibold text-grey-500 mb-1">Insights</h4>
                <p className="text-sm text-grey-300">Placeholder for future analytics views.</p>
              </div>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </FeatureStore>
  </UserRoleProvider>
);

export default App;
