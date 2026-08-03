import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import FeatureRow from '@/components/FeatureRow';
import CreateFeatureModal from '@/components/CreateFeatureModal';
import { useUserRole } from '@/components/UserRoleProvider';
import { sampleFeatures } from '@/data/sampleFeatures';
import { releases } from '@/data/releases';
import type { Feature } from '@/types/Feature';

const DashboardContent = () => {
  const { userRole, isInternal } = useUserRole();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const releaseFilter = searchParams.get('release');
  const selectedRelease = releases.find((release) => release.id === releaseFilter);
  const showNotFoundNotice = searchParams.get('notice') === 'feature-not-found';
  const [features, setFeatures] = useState<Feature[]>(sampleFeatures);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [featureToDelete, setFeatureToDelete] = useState<string | null>(null);

  const handleCreateFeature = (newFeature: Omit<Feature, 'id'>) => {
    const feature: Feature = {
      ...newFeature,
      id: `FEAT-${String(features.length + 1).padStart(3, '0')}`
    };
    setFeatures([feature, ...features]);
    setIsCreateModalOpen(false);
  };

  const handleToggleFeature = (featureId: string) => {
    setFeatures(features.map(feature => 
      feature.id === featureId 
        ? { ...feature, status: feature.status === 'Enabled' ? 'Disabled' : 'Enabled' }
        : feature
    ));
  };

  const handleRequestEnablement = (featureId: string) => {
    const feature = features.find(f => f.id === featureId);
    toast({
      title: "Enablement Requested",
      description: `Your request to enable "${feature?.title}" has been sent to the Customer Admin.`,
    });
  };

  const handleRequestDeferment = (featureId: string) => {
    const feature = features.find(f => f.id === featureId);
    toast({
      title: "Deferment Requested", 
      description: `Your request to defer "${feature?.title}" has been sent to the Customer Admin.`,
    });
  };

  const handleDeferFeature = (featureId: string) => {
    setFeatures(features.map(feature => 
      feature.id === featureId 
        ? { ...feature, status: 'Deferred' }
        : feature
    ));
  };

  const handleEnableFeature = (featureId: string) => {
    setFeatures(features.map(feature => 
      feature.id === featureId 
        ? { ...feature, status: 'Disabled' }
        : feature
    ));
  };

  const handleEditFeature = (feature: Feature) => {
    setEditingFeature(feature);
    setIsCreateModalOpen(true);
  };

  const handleUpdateFeature = (updatedFeature: Omit<Feature, 'id'>) => {
    if (editingFeature) {
      setFeatures(features.map(feature => 
        feature.id === editingFeature.id 
          ? { ...updatedFeature, id: editingFeature.id }
          : feature
      ));
      setEditingFeature(null);
      setIsCreateModalOpen(false);
    }
  };

  const handleDeleteFeature = (featureId: string) => {
    setFeatureToDelete(featureId);
  };

  const confirmDeleteFeature = () => {
    if (featureToDelete) {
      setFeatures(features.filter(feature => feature.id !== featureToDelete));
      setFeatureToDelete(null);
    }
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingFeature(null);
  };

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.releaseNotes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'all' || feature.productModule === selectedModule;
    const matchesRelease = !releaseFilter || feature.releaseId === releaseFilter;
    
    // For implementation team, only show features that need support
    if (userRole === 'implementation') {
      return matchesSearch && matchesModule && matchesRelease && feature.supportNeeded;
    }
    
    return matchesSearch && matchesModule && matchesRelease;
  });

  // Group features by customer name for implementation team,
  // or by release month (desc) for everyone else so the newest release shows first.
  const formatReleaseMonth = (dateStr: string) => {
    if (!dateStr) return 'Unscheduled';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unscheduled';
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatReleaseDate = (dateStr: string) => {
    if (!dateStr) return 'Unscheduled';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Unscheduled';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  let groupedFeatures: Record<string, Feature[]>;
  const groupReleaseDates: Record<string, string> = {};
  if (userRole === 'implementation') {
    groupedFeatures = filteredFeatures.reduce((groups, feature) => {
      const customerName = feature.customerName || 'Unassigned';
      (groups[customerName] ||= []).push(feature);
      return groups;
    }, {} as Record<string, Feature[]>);
    // Sort customers alphabetically, then features within each customer by date desc
    Object.keys(groupedFeatures).sort().forEach(key => {
      groupedFeatures[key].sort((a, b) => {
        const dateA = new Date(a.prodEnablementDate).getTime();
        const dateB = new Date(b.prodEnablementDate).getTime();
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      });
    });
  } else {
    const byMonth = filteredFeatures.reduce((groups, feature) => {
      const key = formatReleaseMonth(feature.prodEnablementDate);
      (groups[key] ||= []).push(feature);
      return groups;
    }, {} as Record<string, Feature[]>);
    // Sort features within each group desc by date and capture the single release date for the month
    Object.entries(byMonth).forEach(([key, list]) => {
      list.sort((a, b) => new Date(b.prodEnablementDate).getTime() - new Date(a.prodEnablementDate).getTime());
      groupReleaseDates[key] = formatReleaseDate(list[0].prodEnablementDate);
    });
    // Sort groups desc by date (Unscheduled last)
    groupedFeatures = Object.fromEntries(
      Object.entries(byMonth).sort(([a, av], [b, bv]) => {
        if (a === 'Unscheduled') return 1;
        if (b === 'Unscheduled') return -1;
        return new Date(bv[0].prodEnablementDate).getTime() - new Date(av[0].prodEnablementDate).getTime();
      })
    );
  }

  // Flatten grouped features into a single sorted list for the unified table.
  const sortedFeatures = userRole === 'implementation'
    ? Object.keys(groupedFeatures).sort().flatMap(key => groupedFeatures[key])
    : Object.values(groupedFeatures).flat();

  const getGroupName = (feature: Feature) => {
    if (userRole === 'implementation') return feature.customerName || 'Unassigned';
    const month = formatReleaseMonth(feature.prodEnablementDate);
    return groupReleaseDates[month] || formatReleaseDate(feature.prodEnablementDate);
  };

  const modules = [...new Set(features.map(f => f.productModule))];

  const getRoleDisplayName = () => {
    switch (userRole) {
      case 'customer':
        return 'Customer';
      case 'customer-admin':
        return 'Customer Admin';
      case 'creator':
        return 'Creator (Internal)';
      case 'implementation':
        return 'Implementation Team';
      default:
        return 'Customer';
    }
  };

  const getPageTitle = () => {
    if (userRole === 'implementation') {
      return 'Implementation Support Queue';
    }
    return 'Release Management Suite';
  };

  const getPageSubtitle = () => {
    if (userRole === 'implementation') {
      return 'Features requiring implementation support';
    }
    return selectedRelease
      ? `${selectedRelease.summary} · Released ${new Date(`${selectedRelease.date}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
      : 'Manage and showcase product features and enhancements';
  };

  // Determine if we should show the creator layout
  const isCreatorLayout = userRole === 'creator';
  // Store if the user can create features
  const canCreateFeatures = userRole === 'creator';

  const totalFeatures = features.length;
  const enabledFeatures = features.filter(f => f.status === 'Enabled').length;
  const platformUtilization = totalFeatures > 0 ? Math.round((enabledFeatures / totalFeatures) * 100) : 0;
  const supportRequiredCount = features.filter(f => f.supportNeeded).length;
  const supportEnabledCount = features.filter(f => f.supportNeeded && f.status === 'Enabled').length;

  return (
    <div className="max-w-full overflow-hidden">
      {showNotFoundNotice && (
        <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          That feature could not be found. You&apos;ve been returned to the Release Hub.
        </div>
      )}
      {/* Header + Filters + Stats — condensed */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
          <div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-600">
              {getPageSubtitle()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isInternal ? "default" : "secondary"} className="text-xs">
              {getRoleDisplayName()}
            </Badge>
            {canCreateFeatures && (
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create Feature
              </Button>
            )}
          </div>
        </div>

        {/* Filters + Stats on a single compact row */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex gap-2 flex-1 min-w-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <Input
                placeholder="Search features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm border-gray-200 focus:border-blue-400"
              />
            </div>
            <div className="w-52">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="h-9 text-sm border-gray-200 focus:border-blue-400">
                  <Filter className="w-3.5 h-3.5 mr-1.5" />
                  <SelectValue placeholder="Filter by module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map(module => (
                    <SelectItem key={module} value={module}>{module}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lean stat pills */}
          <div className="flex gap-2">
            {userRole === 'implementation' ? (
              <>
                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 h-9">
                  <span className="text-sm font-semibold text-blue-600">{supportRequiredCount}</span>
                  <span className="text-xs text-gray-600">Support Required</span>
                </div>
                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 h-9">
                  <span className="text-sm font-semibold text-green-600">{supportEnabledCount}</span>
                  <span className="text-xs text-gray-600">Enabled</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 h-9">
                  <span className="text-sm font-semibold text-blue-600">{totalFeatures}</span>
                  <span className="text-xs text-gray-600">Total Features</span>
                </div>
                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 h-9">
                  <span className="text-sm font-semibold text-green-600">{enabledFeatures}</span>
                  <span className="text-xs text-gray-600">Enabled Features</span>
                </div>
                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 h-9">
                  <span className="text-sm font-semibold text-purple-600">{platformUtilization}%</span>
                  <span className="text-xs text-gray-600">Platform Utilization</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Table - unified table with Release Month / Customer as first column */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isCreatorLayout ? (
          <div className="relative">
            <ScrollArea className="w-full">
              <div className="min-w-[1600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold w-40 sticky left-0 bg-white z-30 border-r shadow-sm">Release Date</TableHead>
                      <TableHead className="font-semibold w-80 sticky left-40 bg-white z-30 border-r shadow-sm">Feature Name</TableHead>
                      <TableHead className="font-semibold w-[600px]">Summary</TableHead>
                      <TableHead className="font-semibold w-48">Product Module</TableHead>
                      <TableHead className="font-semibold w-28">Release Content</TableHead>
                      <TableHead className="font-semibold w-32 text-center"># Enabled Customers</TableHead>
                      <TableHead className="font-semibold w-32 text-center"># Active Customers</TableHead>
                      <TableHead className="font-semibold w-32 text-center"># MAU (Last 30 Days)</TableHead>
                      <TableHead className="font-semibold w-32 text-center"># DAU (Last 30 Day Avg)</TableHead>
                      <TableHead className="font-semibold w-12 sticky right-0 bg-white z-30 border-l shadow-sm"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFeatures.map((feature) => (
                      <FeatureRow
                        key={feature.id}
                        feature={feature}
                        groupName={getGroupName(feature)}
                        groupMode="release"
                        onToggle={handleToggleFeature}
                        onEdit={handleEditFeature}
                        onDelete={handleDeleteFeature}
                        onDefer={handleDeferFeature}
                        onEnable={handleEnableFeature}
                        onRequestEnablement={handleRequestEnablement}
                        onRequestDeferment={handleRequestDeferment}
                        canEdit={isInternal}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        ) : userRole === 'implementation' ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold w-48">Customer</TableHead>
                <TableHead className="font-semibold w-80">Feature Name</TableHead>
                <TableHead className="font-semibold w-[500px]">Summary</TableHead>
                <TableHead className="font-semibold w-48">Product Module</TableHead>
                <TableHead className="font-semibold w-28">Release Content</TableHead>
                <TableHead className="font-semibold w-24 text-center">Config Doc</TableHead>
                <TableHead className="font-semibold w-36">Status</TableHead>
                <TableHead className="font-semibold w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFeatures.map((feature) => (
                <FeatureRow
                  key={feature.id}
                  feature={feature}
                  groupName={feature.customerName || 'Unassigned'}
                  groupMode="customer"
                  onToggle={handleToggleFeature}
                  onEdit={handleEditFeature}
                  onDelete={handleDeleteFeature}
                  onDefer={handleDeferFeature}
                  onEnable={handleEnableFeature}
                  onRequestEnablement={handleRequestEnablement}
                  onRequestDeferment={handleRequestDeferment}
                  canEdit={isInternal}
                />
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold w-40">Release Date</TableHead>
                <TableHead className="font-semibold w-80">Feature Name</TableHead>
                <TableHead className="font-semibold w-[500px]">Summary</TableHead>
                <TableHead className="font-semibold w-48">Product Module</TableHead>
                <TableHead className="font-semibold w-28">Release Content</TableHead>
                <TableHead className="font-semibold w-36">Status</TableHead>
                <TableHead className="font-semibold w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFeatures.map((feature) => (
                <FeatureRow
                  key={feature.id}
                  feature={feature}
                  groupName={getGroupName(feature)}
                  groupMode="release"
                  onToggle={handleToggleFeature}
                  onEdit={handleEditFeature}
                  onDelete={handleDeleteFeature}
                  onDefer={handleDeferFeature}
                  onEnable={handleEnableFeature}
                  onRequestEnablement={handleRequestEnablement}
                  onRequestDeferment={handleRequestDeferment}
                  canEdit={isInternal}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">
            {userRole === 'implementation' 
              ? 'No features requiring implementation support found'
              : 'No features found matching your criteria'}
          </div>
        </div>
      )}
      
      <CreateFeatureModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSubmit={editingFeature ? handleUpdateFeature : handleCreateFeature}
        editingFeature={editingFeature}
      />

      <AlertDialog open={!!featureToDelete} onOpenChange={() => setFeatureToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feature</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feature? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFeature} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Index = () => {
  return <div className="mx-auto max-w-[1800px] px-4 py-6"><DashboardContent /></div>;
};

export default Index;
