import { ArrowRight, CalendarDays, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { latestRelease } from '@/data/releases';
import { sampleFeatures } from '@/data/sampleFeatures';
import { useReleaseVisibility } from './ReleaseVisibilityProvider';

const ReleaseOverviewDialog = () => {
  const navigate = useNavigate();
  const { getAnnouncement, isCustomerAudience, isSeen, markSeen } = useReleaseVisibility();
  const announcement = getAnnouncement('login');
  const [open, setOpen] = useState(false);
  const releaseFeatures = latestRelease.featureIds
    .map((id) => sampleFeatures.find((feature) => feature.id === id))
    .filter(Boolean);

  useEffect(() => {
    setOpen(Boolean(isCustomerAudience && announcement && !isSeen(announcement.id)));
  }, [announcement, isCustomerAudience, isSeen]);

  if (!announcement || !isCustomerAudience) return null;

  const close = () => {
    markSeen(announcement.id);
    setOpen(false);
  };

  const explore = () => {
    close();
    navigate(`/release-hub?release=${latestRelease.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? close() : setOpen(true))}>
      <DialogContent className="max-h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto overflow-x-hidden p-0 sm:!w-full">
        <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-purple-600 px-5 py-6 text-white sm:px-6 sm:py-7">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <Sparkles className="h-6 w-6" />
          </div>
          <DialogHeader className="text-left">
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-100">
              <CalendarDays className="h-4 w-4" />
              Released July 1, 2026
            </div>
            <DialogTitle className="text-2xl text-white">4 features released</DialogTitle>
            <DialogDescription className="max-w-xl text-base text-blue-100">
              {announcement.summary}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid gap-3 px-4 py-4 sm:grid-cols-2 sm:px-6 sm:py-5">
          {releaseFeatures.map((feature) =>
            feature ? (
              <button
                key={feature.id}
                type="button"
                onClick={() => {
                  close();
                  navigate(feature.productRoute ? `${feature.productRoute}?release=${feature.id}` : `/release-hub/features/${feature.id}`);
                }}
                className="group min-w-0 rounded-lg border p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:p-4"
              >
                <Badge variant="secondary" className="mb-2 text-[11px]">
                  {feature.featureTag}
                </Badge>
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 break-words text-sm font-semibold text-gray-900">{feature.title}</span>
                  <ArrowRight className="mt-0.5 h-4 w-4 flex-none text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" />
                </div>
                <p className="mt-1 text-xs text-gray-500">{feature.productModule}</p>
              </button>
            ) : null,
          )}
        </div>

        <DialogFooter className="sticky bottom-0 border-t bg-gray-50 px-4 py-3 sm:justify-between sm:space-x-0 sm:px-6 sm:py-4">
          <Button variant="ghost" onClick={close}>Maybe later</Button>
          <Button onClick={explore} className="gap-2">
            Explore July release <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseOverviewDialog;
