import { useState } from 'react';
import { ArrowLeft, FileText, Play, Download, ExternalLink } from 'lucide-react';
import KnowledgeBaseHome from './KnowledgeBaseHome';
import Panel from '@/components/primitives/Panel';
import Button from '@/components/primitives/Button';
import Badge from '@/components/primitives/Badge';
import IconButton from '@/components/primitives/IconButton';

/* Badge tones rather than hand-written colour pairs, so a module looks the same
   here as it does on the Knowledge Base home. */
type Tone = 'brand' | 'green' | 'purple' | 'amber' | 'neutral';

const modules: Array<{
  name: string;
  tone: Tone;
  features: Array<{ name: string; documents: number; videos: number }>;
}> = [
  {
    name: 'Hire',
    tone: 'brand',
    features: [
      { name: 'Candidate Scoring', documents: 3, videos: 2 },
      { name: 'Interview Scheduling', documents: 2, videos: 1 },
      { name: 'Application Tracking', documents: 4, videos: 3 },
    ],
  },
  {
    name: 'Amplify',
    tone: 'green',
    features: [
      { name: 'Performance Analytics', documents: 5, videos: 2 },
      { name: 'Goal Setting', documents: 3, videos: 1 },
      { name: 'Feedback System', documents: 2, videos: 2 },
    ],
  },
  {
    name: 'Analytics',
    tone: 'purple',
    features: [
      { name: 'Custom Dashboards', documents: 4, videos: 3 },
      { name: 'Data Export', documents: 2, videos: 1 },
      { name: 'Report Builder', documents: 6, videos: 4 },
    ],
  },
  {
    name: 'Brand',
    tone: 'amber',
    features: [
      { name: 'Logo Management', documents: 2, videos: 1 },
      { name: 'Theme Customization', documents: 3, videos: 2 },
      { name: 'Brand Guidelines', documents: 4, videos: 2 },
    ],
  },
  {
    name: 'Plan',
    tone: 'neutral',
    features: [
      { name: 'Subscription Management', documents: 3, videos: 2 },
      { name: 'Usage Tracking', documents: 2, videos: 1 },
      { name: 'Billing Integration', documents: 4, videos: 3 },
    ],
  },
];

const releaseNotes = [
  { feature: 'Candidate Scoring v2.1.0', module: 'Hire', date: 'December 15, 2024', description: 'Enhanced AI-powered scoring algorithm with improved accuracy.' },
  { feature: 'Performance Analytics v3.0.0', module: 'Amplify', date: 'December 10, 2024', description: 'New real-time analytics dashboard with predictive insights.' },
  { feature: 'Custom Dashboards v1.8.0', module: 'Analytics', date: 'December 8, 2024', description: 'Drag-and-drop interface for creating personalized dashboards.' },
  { feature: 'Theme Customization v2.5.0', module: 'Brand', date: 'December 5, 2024', description: 'Advanced theming options with dark mode support.' },
  { feature: 'Billing Integration v1.2.0', module: 'Plan', date: 'December 3, 2024', description: 'Streamlined billing process with automated invoicing.' },
];

/* The left-hand nav entries. Selected is a filled brand row; the rest are quiet
   until hovered - the same treatment the app's left rail uses. */
const navItem = (active: boolean) =>
  [
    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
    active ? 'bg-brand font-medium text-white' : 'text-ink-700 hover:bg-ink-50',
  ].join(' ');

const KnowledgeBase = () => {
  const [currentView, setCurrentView] = useState<'home' | 'detailed'>('home');
  const [selectedSection, setSelectedSection] = useState('release-notes');
  const [selectedModule, setSelectedModule] = useState(modules[0]);

  const handleNavigateToSection = (section: string, module?: { name: string }) => {
    if (section === 'all-docs') {
      // Show all modules in detailed view
      setSelectedSection('module');
      setSelectedModule(modules[0]);
    } else if (section === 'module' && module) {
      setSelectedSection('module');
      // Find the matching module from our local modules array by name
      const matchingModule = modules.find((m) => m.name === module.name) || modules[0];
      setSelectedModule(matchingModule);
    } else {
      setSelectedSection(section);
    }
    setCurrentView('detailed');
  };

  // If we're on the home view, show the home component
  if (currentView === 'home') {
    return <KnowledgeBaseHome onNavigateToSection={handleNavigateToSection} />;
  }

  const toneOf = (moduleName: string): Tone =>
    modules.find((m) => m.name === moduleName)?.tone ?? 'neutral';

  // Detailed view
  return (
    <div>
      <div className="mb-5">
        <Button variant="secondary" onClick={() => setCurrentView('home')}>
          <ArrowLeft size={18} />Back to Knowledge Base home
        </Button>
      </div>

      <div className="mb-5">
        <h1 className="mb-1 text-xl font-semibold leading-tight tracking-[-0.01em] text-brand">
          Knowledge Base
        </h1>
        <p className="max-w-lede text-sm text-ink-600">
          Release notes, documentation, and training videos for every product module.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 min-[901px]:grid-cols-[240px_1fr]">
        <Panel>
          <h2 className="mb-3 text-base font-semibold">Navigation</h2>

          <button
            className={navItem(selectedSection === 'release-notes')}
            onClick={() => setSelectedSection('release-notes')}
          >
            <FileText size={16} />Release notes
          </button>

          <div className="mt-4 border-t border-ink-150 pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[.04em] text-ink-500">
              Product modules
            </h3>
            <div className="flex flex-col gap-1">
              {modules.map((module) => {
                const active = selectedSection === 'module' && selectedModule.name === module.name;
                return (
                  <button
                    key={module.name}
                    className={navItem(active)}
                    onClick={() => {
                      setSelectedSection('module');
                      setSelectedModule(module);
                    }}
                  >
                    <span className={active ? 'font-medium' : ''}>{module.name}</span>
                    <span className={`ml-auto text-xs ${active ? 'text-white/80' : 'text-ink-500'}`}>
                      {module.features.length} features
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>

        <Panel>
          {selectedSection === 'release-notes' ? (
            <>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
                <FileText size={18} />Latest release notes
              </h2>
              <div className="flex flex-col gap-3">
                {releaseNotes.map((note) => (
                  <div
                    key={note.feature}
                    className="flex items-start justify-between gap-4 rounded-lg border border-ink-150 bg-ink-25 p-4"
                  >
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold">{note.feature}</h3>
                        <Badge variant={toneOf(note.module)}>{note.module}</Badge>
                      </div>
                      <p className="mb-1 text-13 text-ink-500">Released on {note.date}</p>
                      <p className="text-sm text-ink-700">{note.description}</p>
                    </div>
                    <Button variant="secondary" className="shrink-0">
                      <FileText size={16} />View
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
                <Badge variant={selectedModule.tone}>{selectedModule.name}</Badge>
                Module documentation
              </h2>
              <div className="flex flex-col gap-4">
                {selectedModule.features.map((feature) => (
                  <div key={feature.name} className="rounded-lg border border-ink-150 bg-ink-25 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">{feature.name}</h3>
                      <div className="flex gap-2">
                        <Badge variant="neutral">{feature.documents} docs</Badge>
                        <Badge variant="neutral">{feature.videos} videos</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      {Array.from({ length: feature.documents }, (_, docIndex) => (
                        <div key={docIndex} className="rounded-md border border-ink-150 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="shrink-0 text-brand" />
                              <span className="text-sm font-medium">
                                {feature.name} Guide {docIndex + 1}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <IconButton tone="brand" aria-label="Open document">
                                <ExternalLink size={14} />
                              </IconButton>
                              <IconButton tone="brand" aria-label="Download document">
                                <Download size={14} />
                              </IconButton>
                            </div>
                          </div>
                          {docIndex < feature.videos && (
                            <div className="mt-2 border-t border-ink-150 pt-2 pl-6">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <Play size={12} className="shrink-0 text-green-600" />
                                  <span className="text-xs text-ink-600">Related tutorial video</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs tabular-nums text-ink-500">5:30</span>
                                  <IconButton tone="brand" aria-label="Play video">
                                    <Play size={12} />
                                  </IconButton>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default KnowledgeBase;
