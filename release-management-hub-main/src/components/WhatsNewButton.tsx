import { Bell, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { latestRelease } from '@/data/releases';
import { sampleFeatures } from '@/data/sampleFeatures';
import { useReleaseVisibility } from './ReleaseVisibilityProvider';

const WhatsNewButton = () => {
  const navigate = useNavigate();
  const { getAnnouncement, isCustomerAudience, isSeen, markSeen, reset } = useReleaseVisibility();
  const overview = getAnnouncement('login');
  const unreadCount = overview && !isSeen(overview.id) ? latestRelease.featureIds.length : 0;
  const features = latestRelease.featureIds
    .map((id) => sampleFeatures.find((feature) => feature.id === id))
    .filter(Boolean);

  if (!isCustomerAudience) return null;

  return (
    <Popover onOpenChange={(open) => open && overview && markSeen(overview.id)}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2" aria-label={`What's New${unreadCount ? `, ${unreadCount} unread` : ''}`}>
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">What&apos;s New</span>
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0">
        <div className="border-b bg-gradient-to-r from-blue-50 to-purple-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Sparkles className="h-4 w-4 text-blue-600" />
            {latestRelease.name}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">{latestRelease.summary}</p>
        </div>
        <div className="max-h-72 overflow-auto p-2">
          {features.map((feature) =>
            feature ? (
              <button
                key={feature.id}
                type="button"
                onClick={() => navigate(feature.productRoute ? `${feature.productRoute}?release=${feature.id}` : `/release-hub/features/${feature.id}`)}
                className="flex w-full items-center gap-3 rounded-md p-2.5 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{feature.title}</p>
                  <p className="text-xs text-gray-500">{feature.productModule}</p>
                </div>
                <ChevronRight className="h-4 w-4 flex-none text-gray-400" />
              </button>
            ) : null,
          )}
        </div>
        <div className="flex items-center justify-between border-t p-2">
          <Button variant="ghost" size="sm" className="text-xs" onClick={reset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset demo
          </Button>
          <Button variant="ghost" size="sm" className="text-xs text-blue-600" onClick={() => navigate(`/release-hub?release=${latestRelease.id}`)}>
            View release <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default WhatsNewButton;
