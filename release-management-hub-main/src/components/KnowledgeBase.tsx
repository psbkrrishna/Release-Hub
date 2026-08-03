
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import KnowledgeBaseHome from './KnowledgeBaseHome';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Play, Download, ExternalLink } from 'lucide-react';

const modules = [
  {
    name: 'Hire',
    color: 'bg-blue-100 text-blue-700',
    features: [
      { name: 'Candidate Scoring', documents: 3, videos: 2 },
      { name: 'Interview Scheduling', documents: 2, videos: 1 },
      { name: 'Application Tracking', documents: 4, videos: 3 },
    ],
  },
  {
    name: 'Amplify',
    color: 'bg-green-100 text-green-700',
    features: [
      { name: 'Performance Analytics', documents: 5, videos: 2 },
      { name: 'Goal Setting', documents: 3, videos: 1 },
      { name: 'Feedback System', documents: 2, videos: 2 },
    ],
  },
  {
    name: 'Analytics',
    color: 'bg-purple-100 text-purple-700',
    features: [
      { name: 'Custom Dashboards', documents: 4, videos: 3 },
      { name: 'Data Export', documents: 2, videos: 1 },
      { name: 'Report Builder', documents: 6, videos: 4 },
    ],
  },
  {
    name: 'Brand',
    color: 'bg-orange-100 text-orange-700',
    features: [
      { name: 'Logo Management', documents: 2, videos: 1 },
      { name: 'Theme Customization', documents: 3, videos: 2 },
      { name: 'Brand Guidelines', documents: 4, videos: 2 },
    ],
  },
  {
    name: 'Plan',
    color: 'bg-indigo-100 text-indigo-700',
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
      const matchingModule = modules.find(m => m.name === module.name) || modules[0];
      setSelectedModule(matchingModule);
    } else {
      setSelectedSection(section);
    }
    setCurrentView('detailed');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  // If we're on the home view, show the home component
  if (currentView === 'home') {
    return <KnowledgeBaseHome onNavigateToSection={handleNavigateToSection} />;
  }

  const getModuleColor = (moduleName: string) => {
    const module = modules.find(m => m.name === moduleName);
    return module ? module.color : 'bg-gray-100 text-gray-700';
  };

  // Detailed view (existing functionality)
  return (
    <div>
      {/* Back to Home Button */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={handleBackToHome}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Knowledge Base Home
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Knowledge Base
        </h1>
        <p className="text-lg text-gray-600">
          Access release notes, documentation, and training videos for all product modules
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Release Notes Section */}
              <Button
                variant={selectedSection === 'release-notes' ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setSelectedSection('release-notes')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Release Notes
              </Button>
              
              <div className="border-t pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Product Modules</h4>
                {modules.map((module) => (
                  <Button
                    key={module.name}
                    variant={selectedSection === 'module' && selectedModule.name === module.name ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedSection('module');
                      setSelectedModule(module);
                    }}
                  >
                    <Badge className={`mr-2 ${module.color}`}>
                      {module.name}
                    </Badge>
                    {module.features.length} Features
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedSection === 'release-notes' ? (
                  <>
                    <FileText className="w-5 h-5" />
                    Latest Release Notes
                  </>
                ) : (
                  <>
                    <Badge className={selectedModule.color}>
                      {selectedModule.name}
                    </Badge>
                    Module Documentation
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSection === 'release-notes' ? (
                <div className="space-y-4">
                  {releaseNotes.map((note, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{note.feature}</h4>
                            <Badge className={getModuleColor(note.module)}>
                              {note.module}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Released on {note.date}
                          </p>
                          <p className="text-sm text-gray-700">
                            {note.description}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Documentation & Videos</h3>
                  {selectedModule.features.map((feature, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{feature.name}</h4>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{feature.documents} docs</Badge>
                          <Badge variant="secondary">{feature.videos} videos</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {Array.from({ length: feature.documents }, (_, docIndex) => (
                          <div key={docIndex} className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium">{feature.name} Guide {docIndex + 1}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {/* Associated Videos */}
                            {docIndex < feature.videos && (
                              <div className="ml-6 pt-2 border-t">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Play className="w-3 h-3 text-green-600" />
                                    <span className="text-xs text-gray-600">Related Tutorial Video</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">5:30</span>
                                    <Button variant="ghost" size="sm">
                                      <Play className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
