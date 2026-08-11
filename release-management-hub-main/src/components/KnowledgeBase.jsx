import { useState } from "react";
import { PiArrowLeft, PiFileText, PiPlay, PiDownloadSimple, PiArrowSquareOut } from "react-icons/pi";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import KnowledgeBaseHome from "./KnowledgeBaseHome";
import { knowledgeBaseModules as modules } from "@/components/knowledgeBaseModules";

const releaseNotes = [
  { feature: "AI-Powered Performance Review Analysis v1.0", module: "Performance Management", date: "July 1, 2026", description: "AI review insights that surface themes and coaching recommendations." },
  { feature: "Advanced Candidate Sourcing v2.1", module: "Recruiting", date: "July 1, 2026", description: "LinkedIn profile import with automatic parsing and candidate matching." },
  { feature: "Flexible Benefits Marketplace v1.4", module: "Benefits", date: "July 1, 2026", description: "Plan comparisons, cost calculators and personalized recommendations." },
  { feature: "Custom Report Builder v3.0", module: "Analytics", date: "July 1, 2026", description: "Drag-and-drop dashboards with scheduled delivery and sharing." },
  { feature: "Document Retention Policies v1.0", module: "Core HR", date: "June 1, 2026", description: "Retention schedules per document type with an auditable deletion log." },
];

const KnowledgeBase = () => {
  const [currentView, setCurrentView] = useState("home");
  const [selectedSection, setSelectedSection] = useState("release-notes");
  const [selectedModule, setSelectedModule] = useState(modules[0]);

  const handleNavigateToSection = (section, module) => {
    if (section === "all-docs") {
      setSelectedSection("module");
      setSelectedModule(modules[0]);
    } else if (section === "module" && module) {
      setSelectedSection("module");
      setSelectedModule(modules.find((m) => m.name === module.name) || modules[0]);
    } else {
      setSelectedSection(section);
    }
    setCurrentView("detailed");
  };

  if (currentView === "home") {
    return <KnowledgeBaseHome onNavigateToSection={handleNavigateToSection} />;
  }

  const moduleFor = (name) => modules.find((m) => m.name === name) || modules[0];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => setCurrentView("home")} icon={<PiArrowLeft />}>
          Back to Knowledge Base Home
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-[#BC3AD2] bg-clip-text text-transparent mb-1">
          Knowledge Base
        </h1>
        <p className="text-sm text-grey-300">Access release notes, documentation, and training videos for all product modules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-card">
            <h2 className="text-base font-semibold text-grey-500 mb-3">Navigation</h2>
            <button
              type="button"
              onClick={() => setSelectedSection("release-notes")}
              className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left mb-1 ${
                selectedSection === "release-notes" ? "bg-blue-600 text-white" : "text-grey-400 hover:bg-gray-50"
              }`}
            >
              <PiFileText size={16} /> Release Notes
            </button>

            <div className="border-t border-gray-100 pt-3 mt-3">
              <h3 className="text-xs font-medium text-grey-300 mb-2">Product Modules</h3>
              {modules.map((module) => {
                const active = selectedSection === "module" && selectedModule.name === module.name;
                return (
                  <button
                    key={module.name}
                    type="button"
                    onClick={() => { setSelectedSection("module"); setSelectedModule(module); }}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left mb-1 ${
                      active ? "bg-blue-600 text-white" : "text-grey-400 hover:bg-gray-50"
                    }`}
                  >
                    {active ? (
                      <Badge variant="base" backgroundColor="bg-white/20" textColor="text-white">{module.name}</Badge>
                    ) : (
                      <Badge variant={module.tint.badge}>{module.name}</Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-base font-semibold text-grey-500 mb-4">
              {selectedSection === "release-notes" ? (
                <>
                  <PiFileText size={18} /> Latest Release Notes
                </>
              ) : (
                <>
                  <Badge variant={selectedModule.tint.badge}>{selectedModule.name}</Badge>
                  Module Documentation
                </>
              )}
            </h2>

            {selectedSection === "release-notes" ? (
              <div className="flex flex-col gap-3">
                {releaseNotes.map((note) => (
                  <div key={note.feature} className="rounded-lg border border-gray-100 p-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-grey-500">{note.feature}</h3>
                        <Badge variant={moduleFor(note.module).tint.badge}>{note.module}</Badge>
                      </div>
                      <p className="text-xs text-grey-300 mb-1">Released on {note.date}</p>
                      <p className="text-sm text-grey-400">{note.description}</p>
                    </div>
                    <Button variant="secondary" icon={<PiFileText />}>View</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-grey-500">Documentation & Videos</h3>
                {Array.from({ length: selectedModule.features }, (_, fi) => (
                  <div key={fi} className="rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-grey-500">{selectedModule.name} capability {fi + 1}</h4>
                      <div className="flex gap-2">
                        <Badge variant="base" backgroundColor="bg-gray-100" textColor="text-grey-400">
                          {selectedModule.features} docs
                        </Badge>
                        <Badge variant="base" backgroundColor="bg-gray-100" textColor="text-grey-400">
                          {selectedModule.videos} videos
                        </Badge>
                      </div>
                    </div>
                    <div className="rounded-md border border-gray-100 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <PiFileText className="text-blue-600" size={16} />
                          <span className="text-sm font-medium text-grey-500">{selectedModule.name} Guide {fi + 1}</span>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1.5 text-grey-300 hover:text-grey-500 rounded" title="Open"><PiArrowSquareOut size={14} /></button>
                          <button className="p-1.5 text-grey-300 hover:text-grey-500 rounded" title="Download"><PiDownloadSimple size={14} /></button>
                        </div>
                      </div>
                      {fi < selectedModule.videos && (
                        <div className="ml-6 pt-2 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <PiPlay className="text-[#1F4E21]" size={14} />
                            <span className="text-xs text-grey-300">Related tutorial video</span>
                          </div>
                          <span className="text-xs text-grey-300">5:30</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
