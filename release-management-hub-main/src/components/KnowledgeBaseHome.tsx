
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Play, 
  BookOpen, 
  Lightbulb, 
  Users, 
  ArrowRight, 
  Clock,
  Star,
  Zap
} from 'lucide-react';

interface KnowledgeBaseHomeProps {
  onNavigateToSection: (section: string, module?: { name: string }) => void;
}

const modules = [
  {
    name: 'Hire',
    color: 'bg-blue-100 text-blue-700',
    icon: Users,
    description: 'Streamline your recruitment process with advanced candidate scoring and interview management.',
    features: 3,
    videos: 6,
  },
  {
    name: 'Amplify',
    color: 'bg-green-100 text-green-700',
    icon: Zap,
    description: 'Boost performance with analytics, goal setting, and comprehensive feedback systems.',
    features: 3,
    videos: 5,
  },
  {
    name: 'Analytics',
    color: 'bg-purple-100 text-purple-700',
    icon: BookOpen,
    description: 'Create custom dashboards and generate detailed reports with our powerful analytics tools.',
    features: 3,
    videos: 8,
  },
  {
    name: 'Brand',
    color: 'bg-orange-100 text-orange-700',
    icon: Star,
    description: 'Customize your platform appearance with logo management and theme customization.',
    features: 3,
    videos: 5,
  },
  {
    name: 'Plan',
    color: 'bg-indigo-100 text-indigo-700',
    icon: Lightbulb,
    description: 'Manage subscriptions, track usage, and handle billing with integrated management tools.',
    features: 3,
    videos: 6,
  },
];

const KnowledgeBaseHome = ({ onNavigateToSection }: KnowledgeBaseHomeProps) => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Knowledge Base
        </h1>
        <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
          Your comprehensive resource hub for product documentation, release notes, and training materials. 
          Everything you need to master our platform and stay up-to-date with the latest features.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600">
            <FileText className="w-5 h-5" />
            <span>Detailed Documentation</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Play className="w-5 h-5" />
            <span>Video Tutorials</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span>Latest Updates</span>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Release Notes Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onNavigateToSection('release-notes')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Latest Release Notes</CardTitle>
                  <p className="text-gray-600 text-sm">Stay updated with new features</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Discover the newest enhancements, bug fixes, and improvements across all product modules. 
              Get detailed information about feature releases and their impact.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Last updated: Dec 15, 2024
              </span>
              <Badge variant="secondary">5 New Updates</Badge>
            </div>
          </CardContent>
        </Card>

        {/* All Documentation Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => onNavigateToSection('all-docs')}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Browse All Documentation</CardTitle>
                  <p className="text-gray-600 text-sm">Complete guides and tutorials</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Access comprehensive documentation for all modules, including step-by-step guides, 
              video tutorials, and best practices to help you get the most out of our platform.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                50+ Documents
              </span>
              <span className="flex items-center gap-1">
                <Play className="w-4 h-4" />
                30+ Videos
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Modules Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Product Modules</h2>
        <p className="text-gray-600 mb-8">
          Explore documentation and tutorials for each of our powerful product modules
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Card 
                key={module.name} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => onNavigateToSection('module', module)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${module.color.replace('text-', 'bg-').replace('-700', '-100')}`}>
                        <IconComponent className={`w-6 h-6 ${module.color.split(' ')[1]}`} />
                      </div>
                      <Badge className={module.color}>
                        {module.name}
                      </Badge>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <CardTitle className="text-lg">{module.name} Module</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    {module.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {module.features} Features
                    </span>
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {module.videos} Videos
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
                  >
                    Explore Documentation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Platform Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">50+</div>
                <div className="text-gray-600 text-sm">Documentation Pages</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">30+</div>
                <div className="text-gray-600 text-sm">Video Tutorials</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">5</div>
                <div className="text-gray-600 text-sm">Product Modules</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">Weekly</div>
                <div className="text-gray-600 text-sm">Content Updates</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBaseHome;
