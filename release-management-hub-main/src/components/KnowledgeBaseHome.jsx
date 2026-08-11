import PropTypes from "prop-types";
import { PiFileText, PiPlay, PiBookOpen, PiArrowRight, PiClock } from "react-icons/pi";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { MODULES } from "@/data/features";
import { knowledgeBaseModules as modules } from "@/components/knowledgeBaseModules";

/* Restyled with the production ui kit; the module list now uses this app's
   real product modules (from data/features.js) instead of the placeholder
   "Hire/Amplify/Brand/Plan" taxonomy the original mock content invented -
   this page sits next to Release Hub and Dashboard, both of which already
   speak in the real module names, so the mismatch would read as a bug. */

const KnowledgeBaseHome = ({ onNavigateToSection }) => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-[#BC3AD2] bg-clip-text text-transparent mb-3">
          Knowledge Base
        </h1>
        <p className="text-base text-grey-300 mb-5 max-w-2xl mx-auto">
          Your comprehensive resource hub for product documentation, release notes, and training materials. Everything
          you need to master our platform and stay up to date with the latest features.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-grey-300">
          <span className="flex items-center gap-1.5"><PiFileText size={16} /> Detailed Documentation</span>
          <span className="flex items-center gap-1.5"><PiPlay size={16} /> Video Tutorials</span>
          <span className="flex items-center gap-1.5"><PiClock size={16} /> Latest Updates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        <button
          type="button"
          onClick={() => onNavigateToSection("release-notes")}
          className="group text-left rounded-lg border border-gray-200 bg-white p-5 shadow-card hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#E7EEF6] rounded-lg"><PiFileText className="text-[#0D59A3]" size={22} /></div>
              <div>
                <div className="text-base font-semibold text-grey-500">Latest Release Notes</div>
                <p className="text-grey-300 text-xs">Stay updated with new features</p>
              </div>
            </div>
            <PiArrowRight className="text-grey-100 group-hover:text-blue-600 transition-colors" size={18} />
          </div>
          <p className="text-sm text-grey-400 mb-3">
            Discover the newest enhancements, bug fixes, and improvements across all product modules.
          </p>
          <div className="flex items-center gap-3 text-xs text-grey-300">
            <span className="flex items-center gap-1"><PiClock size={14} /> Last updated: Dec 15, 2024</span>
            <Badge variant="blue">5 New Updates</Badge>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateToSection("all-docs")}
          className="group text-left rounded-lg border border-gray-200 bg-white p-5 shadow-card hover:shadow-md hover:border-green-300 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#EBF4EC] rounded-lg"><PiBookOpen className="text-[#1F4E21]" size={22} /></div>
              <div>
                <div className="text-base font-semibold text-grey-500">Browse All Documentation</div>
                <p className="text-grey-300 text-xs">Complete guides and tutorials</p>
              </div>
            </div>
            <PiArrowRight className="text-grey-100 group-hover:text-[#1F4E21] transition-colors" size={18} />
          </div>
          <p className="text-sm text-grey-400 mb-3">
            Access comprehensive documentation for all modules, including step-by-step guides and best practices.
          </p>
          <div className="flex items-center gap-3 text-xs text-grey-300">
            <span className="flex items-center gap-1"><PiFileText size={14} /> 50+ Documents</span>
            <span className="flex items-center gap-1"><PiPlay size={14} /> 30+ Videos</span>
          </div>
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold text-grey-500 mb-1">Product Modules</h2>
        <p className="text-sm text-grey-300 mb-5">Explore documentation and tutorials for each of our product modules</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.name}
                type="button"
                onClick={() => onNavigateToSection("module", module)}
                className="group text-left rounded-lg border border-gray-200 bg-white p-5 shadow-card hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${module.tint.bg}`}>
                      <Icon className={module.tint.text} size={20} />
                    </div>
                    <Badge variant={module.tint.badge}>{module.name}</Badge>
                  </div>
                  <PiArrowRight className="text-grey-100 group-hover:text-blue-600 transition-colors flex-shrink-0" size={16} />
                </div>
                <p className="text-sm text-grey-400 mb-3">{module.description}</p>
                <div className="flex items-center gap-3 text-xs text-grey-300 mb-3">
                  <span className="flex items-center gap-1"><PiFileText size={12} /> {module.features} Features</span>
                  <span className="flex items-center gap-1"><PiPlay size={12} /> {module.videos} Videos</span>
                </div>
                <Button variant="secondary" className="w-full justify-center" icon={<PiArrowRight />} iconPosition="right">
                  Explore Documentation
                </Button>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-[#E7EEF6] to-[#FCEBFF] p-8 text-center">
        <h3 className="text-lg font-bold text-grey-500 mb-4">Platform Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            ["50+", "Documentation Pages", "text-blue-600"],
            ["30+", "Video Tutorials", "text-[#1F4E21]"],
            [String(MODULES.length), "Product Modules", "text-[#3A0143]"],
            ["Weekly", "Content Updates", "text-[#99770F]"],
          ].map(([value, label, color]) => (
            <div key={label}>
              <div className={`text-2xl font-bold mb-0.5 ${color}`}>{value}</div>
              <div className="text-grey-300 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

KnowledgeBaseHome.propTypes = {
  onNavigateToSection: PropTypes.func.isRequired,
};

export default KnowledgeBaseHome;
