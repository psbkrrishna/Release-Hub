import { Play, FileText, MoreVertical, Edit, Trash2, BookOpen, Clock, MessageSquare, AlertCircle, Star, Wrench, Zap, Settings2, DollarSign, Headphones, ChevronDown, ChevronUp } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useUserRole } from './UserRoleProvider';
import type { Feature } from '@/types/Feature';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FeatureRowProps {
  feature: Feature;
  groupName?: string;
  groupMode?: 'release' | 'customer';
  onToggle: (featureId: string) => void;
  onEdit?: (feature: Feature) => void;
  onDelete?: (featureId: string) => void;
  onDefer?: (featureId: string) => void;
  onEnable?: (featureId: string) => void;
  onRequestEnablement?: (featureId: string) => void;
  onRequestDeferment?: (featureId: string) => void;
  canEdit: boolean;
}

const FeatureRow = ({ feature, groupName, groupMode, onToggle, onEdit, onDelete, onDefer, onEnable, onRequestEnablement, onRequestDeferment, canEdit }: FeatureRowProps) => {
  const { userRole } = useUserRole();
  const navigate = useNavigate();
  const [showNonDeferrableAlert, setShowNonDeferrableAlert] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

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

  const getFeatureTagIcon = (tag: string) => {
    return tag === 'New Feature' ? Star : Wrench;
  };

  const getFeatureTypeIcon = (type: string) => {
    const icons = {
      'Direct Enablement': Zap,
      'Non Deferrable': AlertCircle,
      'Self Configurable': Settings2,
      'Support Required': Headphones
    };
    return icons[type as keyof typeof icons] || Zap;
  };

  const getToggleLabel = () => {
    if (feature.isPaid && (userRole === 'customer' || userRole === 'customer-admin')) {
      return 'Contact CSM';
    }
    
    if (feature.status === 'Deferred') {
      return 'Deferred';
    }
    
    if (feature.supportNeeded) {
      if (userRole === 'customer') {
        return feature.status === 'Enabled' ? 'Support Requested' : 'Disabled';
      } else if (userRole === 'implementation') {
        return feature.status === 'Enabled' ? 'Enabled' : 'Support Requested';
      }
    }
    return feature.status === 'Enabled' ? 'Enabled' : 'Disabled';
  };

  const getSwitchColor = () => {
    if (feature.status === 'Deferred') {
      return 'data-[state=checked]:bg-gray-400';
    }
    
    if (feature.supportNeeded) {
      if (userRole === 'customer') {
        // For customers: orange when requesting support (enabled state)
        return feature.status === 'Enabled' ? 'data-[state=checked]:bg-orange-500' : '';
      } else if (userRole === 'implementation') {
        // For implementation: orange when support is requested (disabled state), green when enabled
        return feature.status === 'Enabled' ? 'data-[state=checked]:bg-green-500' : 'data-[state=unchecked]:bg-orange-500';
      }
    }
    return 'data-[state=checked]:bg-green-500';
  };

  const handleDeferClick = () => {
    if (feature.featureType === 'Non Deferrable') {
      setShowNonDeferrableAlert(true);
    } else {
      onDefer?.(feature.id);
    }
  };

  // For implementation team, only show features that need support
  if (userRole === 'implementation' && !feature.supportNeeded) {
    return null;
  }

  // Check if config doc should be shown for customers
  const shouldShowConfigDoc = userRole === 'customer' && feature.featureType === 'Self Configurable' && feature.configurationDoc;

  const isDeferred = feature.status === 'Deferred';
  const isPaidCustomerOrAdmin = feature.isPaid && (userRole === 'customer' || userRole === 'customer-admin');

  const FeatureTagIcon = getFeatureTagIcon(feature.featureTag);
  const FeatureTypeIcon = getFeatureTypeIcon(feature.featureType || 'Direct Enablement');

  return (
    <>
      <TableRow className="hover:bg-gray-50 transition-colors">
        {/* Group column - Release Month or Customer */}
        {groupName && (
          <TableCell className={`${groupMode === 'customer' ? 'w-48' : 'w-40'} ${userRole === 'creator' && groupMode === 'release' ? 'sticky left-0 bg-white z-30 border-r shadow-sm' : ''}`}>
            <div className="text-sm font-medium text-zinc-800">{groupName}</div>
          </TableCell>
        )}

        <TableCell className={`font-medium w-80 ${userRole === 'creator' ? `sticky bg-white z-30 border-r shadow-sm ${groupMode === 'release' ? 'left-40' : 'left-0'}` : ''}`}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => navigate(`/release-hub/features/${feature.id}`)}
                className="text-left font-semibold text-gray-900 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {feature.title}
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono w-fit">
                  {feature.id}
                </Badge>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-100 text-blue-700">
                        <FeatureTagIcon className="w-3 h-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{feature.featureTag}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {feature.isPaid && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-center w-5 h-5 rounded bg-amber-100 text-amber-700">
                          <DollarSign className="w-3 h-3" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Paid Feature</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`flex items-center justify-center w-5 h-5 rounded ${
                        feature.featureType === 'Support Required' ? 'bg-red-100 text-red-700' :
                        feature.featureType === 'Non Deferrable' ? 'bg-orange-100 text-orange-700' :
                        feature.featureType === 'Self Configurable' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        <FeatureTypeIcon className="w-3 h-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{feature.featureType || 'Direct Enablement'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </TableCell>

        {/* Summary column - clamped to 2 lines with expand option */}
        <TableCell className={`${userRole === 'creator' ? 'w-[600px]' : 'w-[500px]'}`}>
          {feature.summary ? (
            <div>
              <div className={`text-sm text-gray-600 leading-relaxed whitespace-pre-line ${isSummaryExpanded ? '' : 'line-clamp-2'}`}>
                {feature.summary}
              </div>
              {feature.summary.length > 120 && (
                <button
                  type="button"
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                >
                  {isSummaryExpanded ? (
                    <>
                      Show less <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Show more <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">No summary available</span>
          )}
        </TableCell>
        
        <TableCell className="w-48">
          <Badge className={`${getModuleColor(feature.productModule)} text-xs px-2 py-1`}>
            {feature.productModule}
          </Badge>
        </TableCell>
        
        {/* Release Content column - left aligned with tooltips */}
        <TableCell className="w-28">
          <TooltipProvider>
            <div className="flex justify-start gap-1">
              {feature.releaseNotes && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 p-2 h-8 w-8">
                      <BookOpen className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Release Notes</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {feature.demoVideo && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 p-2 h-8 w-8">
                      <Play className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Demo Video</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {shouldShowConfigDoc && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 p-2 h-8 w-8">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Config Doc</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </TableCell>

        {/* Configuration Doc column - only for implementation team */}
        {userRole === 'implementation' && (
          <TableCell className="w-24 text-center">
            {feature.configurationDoc ? (
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 p-2 h-8 w-8">
                <FileText className="w-4 h-4" />
              </Button>
            ) : (
              <span className="text-gray-400 text-sm">—</span>
            )}
          </TableCell>
        )}

        {/* Analytics columns - only for creator view */}
        {userRole === 'creator' && (
          <>
            <TableCell className="w-32 text-center">
              <div className="text-sm font-medium text-zinc-900">
                {feature.enabledCustomers || 0}
              </div>
            </TableCell>
            <TableCell className="w-32 text-center">
              <div className="text-sm font-medium text-zinc-900">
                {feature.activeCustomers || 0}
              </div>
            </TableCell>
            <TableCell className="w-32 text-center">
              <div className="text-sm font-medium text-zinc-900">
                {feature.mauLast30Days?.toLocaleString() || 0}
              </div>
            </TableCell>
            <TableCell className="w-32 text-center">
              <div className="text-sm font-medium text-zinc-900">
                {feature.dauLast30DayAvg || 0}
              </div>
            </TableCell>
          </>
        )}
        
        {/* Only show status column for customers, customer-admin and implementation team, not creators */}
        {userRole !== 'creator' && (
          <TableCell className="w-36">
            {isPaidCustomerOrAdmin ? (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                <AlertCircle className="w-3 h-3 mr-1" />
                Contact CSM
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Switch
                  checked={feature.status === 'Enabled'}
                  onCheckedChange={() => !isDeferred && userRole === 'customer-admin' && onToggle(feature.id)}
                  className={getSwitchColor()}
                  disabled={isDeferred || userRole === 'customer'}
                />
                <span className={`text-sm min-w-[80px] ${
                  isDeferred 
                    ? 'text-gray-400' 
                    : feature.supportNeeded && (
                      (userRole === 'customer' && feature.status === 'Enabled') || 
                      (userRole === 'implementation' && feature.status === 'Disabled')
                    ) ? 'text-orange-600 font-medium' : 'text-gray-600'
                }`}>
                  {getToggleLabel()}
                </span>
              </div>
            )}
          </TableCell>
        )}

        {/* Kebab menu - for creators, customer-admin, and customers */}
        {(userRole === 'creator' || userRole === 'customer-admin' || userRole === 'customer') && (
          <TableCell className={`w-12 ${userRole === 'creator' ? 'sticky right-0 bg-white z-20 border-l shadow-sm' : ''}`}>
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {userRole === 'creator' && (
                    <>
                      <DropdownMenuItem onClick={() => onEdit?.(feature)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(feature.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                  {userRole === 'customer-admin' && !isPaidCustomerOrAdmin && (
                    <>
                      {!isDeferred ? (
                        <DropdownMenuItem onClick={handleDeferClick}>
                          <Clock className="h-4 w-4 mr-2" />
                          Defer
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onEnable?.(feature.id)}>
                          <Play className="h-4 w-4 mr-2" />
                          Enable
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  {userRole === 'customer' && !isPaidCustomerOrAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => onRequestEnablement?.(feature.id)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Request Enablement
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onRequestDeferment?.(feature.id)}>
                        <Clock className="h-4 w-4 mr-2" />
                        Request Deferment
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        )}
      </TableRow>

      {/* Non-Deferrable Alert Dialog */}
      <AlertDialog open={showNonDeferrableAlert} onOpenChange={setShowNonDeferrableAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Feature Cannot Be Deferred</AlertDialogTitle>
            <AlertDialogDescription>
              This feature is Non Deferrable and cannot be deferred. It must remain in its current state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowNonDeferrableAlert(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FeatureRow;
