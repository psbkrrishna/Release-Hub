import { ArrowRight, CalendarDays, CheckCircle2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { latestRelease } from '@/data/releases';
import type { Feature } from '@/types/Feature';

interface FeatureReleaseDialogProps {
  feature: Feature;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeatureReleaseDialog = ({ feature, open, onOpenChange }: FeatureReleaseDialogProps) => {
  const navigate = useNavigate();

  const reviewAllFeatures = () => {
    onOpenChange(false);
    navigate(`/release-hub?release=${latestRelease.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] !w-[calc(100vw-2rem)] max-w-xl overflow-y-auto p-0 sm:!w-full">
        <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 px-6 py-7 text-white">
          <div className="mb-4 flex items-center justify-between gap-3 pr-7">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">July 2026 release</Badge>
          </div>
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl leading-tight text-white">{feature.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-blue-100">
              {feature.summary?.split('\n')[0]}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex items-center gap-2 text-xs text-blue-100">
            <CalendarDays className="h-4 w-4" /> Released July 1, 2026 · {feature.productModule}
          </div>
        </div>

        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-gray-900">What&apos;s included</h3>
          <ul className="mt-3 space-y-3">
            {(feature.announcementBullets ?? []).slice(0, 3).map((bullet) => (
              <li key={bullet} className="flex gap-3 text-sm leading-relaxed text-gray-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-500" />
                {bullet}
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-sm font-medium text-gray-900">Available now in Performance Reviews</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              You&apos;re already on the page where this capability lives. Close this window to continue exploring it.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t bg-gray-50 px-6 py-4 sm:justify-between sm:space-x-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Continue exploring</Button>
          <Button className="gap-2" onClick={reviewAllFeatures}>
            Review all July features <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureReleaseDialog;
