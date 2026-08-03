
import { useState } from 'react';
import { Calendar, Play, Users, Settings, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserRole } from './UserRoleProvider';
import type { Feature } from '@/types/Feature';

interface FeatureCardProps {
  feature: Feature;
  onToggle: (featureId: string) => void;
  canEdit: boolean;
}

const FeatureCard = ({ feature, onToggle, canEdit }: FeatureCardProps) => {
  const { isInternal } = useUserRole();
  const [showProductGate, setShowProductGate] = useState(false);

  const getModuleColor = (module: string) => {
    const colors = {
      'Performance Management': 'bg-blue-100 text-blue-800',
      'Recruiting': 'bg-green-100 text-green-800',
      'Payroll': 'bg-purple-100 text-purple-800',
      'Benefits': 'bg-orange-100 text-orange-800',
      'Time Tracking': 'bg-cyan-100 text-cyan-800',
      'Learning': 'bg-pink-100 text-pink-800',
      'Analytics': 'bg-indigo-100 text-indigo-800',
      'Employee Experience': 'bg-emerald-100 text-emerald-800',
    };
    return colors[module as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 group">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{feature.title}</CardTitle>
              <Badge variant="outline" className="text-xs font-mono">
                {feature.id}
              </Badge>
            </div>
            <Badge className={getModuleColor(feature.productModule)}>
              {feature.productModule}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            {feature.supportNeeded && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="destructive" className="animate-pulse">
                    <Users className="w-3 h-3 mr-1" />
                    Support Needed
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Implementation support required</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {feature.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <Switch
                checked={feature.isEnabled}
                onCheckedChange={() => onToggle(feature.id)}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Release Notes</h4>
          <p className="text-gray-700 leading-relaxed">{feature.releaseNotes}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Enablement Date:</span>
            <span>{feature.enablementDate}</span>
          </div>
          
          {feature.demoVideo && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>
          )}
        </div>

        {/* Internal Only Section */}
        {isInternal && feature.productGate && (
          <div className="border-t pt-4 mt-4 bg-gray-50 -mx-6 px-6 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Internal Settings</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProductGate(!showProductGate)}
                className="p-1 h-6 w-6"
              >
                {showProductGate ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            </div>
            {showProductGate && (
              <div className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                Product Gate: {feature.productGate}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
