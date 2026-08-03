import { ArrowRight, BarChart3, BrainCircuit, CheckCircle2, MoreHorizontal, Sparkles, TrendingUp, Users, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sampleFeatures } from '@/data/sampleFeatures';
import { useReleaseVisibility } from '@/components/ReleaseVisibilityProvider';
import FeatureReleaseDialog from '@/components/FeatureReleaseDialog';

const PerformanceReviews = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const feature = sampleFeatures.find((item) => item.id === 'FEAT-001');
  const { getAnnouncement, isCustomerAudience, isDismissed, dismiss } = useReleaseVisibility();
  const announcement = getAnnouncement('contextual', 'FEAT-001');
  const showCoachmark = Boolean(announcement && isCustomerAudience && !isDismissed(announcement.id));
  const [coachmarkReplayOpen, setCoachmarkReplayOpen] = useState(false);
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(searchParams.get('release') === 'FEAT-001');
  const coachmarkOpen = Boolean(announcement && isCustomerAudience && !releaseDialogOpen && (showCoachmark || coachmarkReplayOpen));
  const insightCardRef = useRef<HTMLDivElement>(null);
  const [coachmarkPosition, setCoachmarkPosition] = useState({ top: 120, left: 80, side: 'left' as 'left' | 'below' });

  useEffect(() => {
    if (searchParams.get('release') === 'FEAT-001') setReleaseDialogOpen(true);
  }, [searchParams]);

  const handleReleaseDialogChange = (open: boolean) => {
    setReleaseDialogOpen(open);
    if (!open && searchParams.has('release')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('release');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const openReleaseDetails = () => {
    if (announcement) dismiss(announcement.id);
    setCoachmarkReplayOpen(false);
    setReleaseDialogOpen(true);
  };

  const closeCoachmark = () => {
    if (announcement) dismiss(announcement.id);
    setCoachmarkReplayOpen(false);
  };

  useLayoutEffect(() => {
    if (!coachmarkOpen) return;

    const updatePosition = () => {
      const rect = insightCardRef.current?.getBoundingClientRect();
      if (!rect) return;

      const tooltipWidth = Math.min(340, window.innerWidth - 32);
      const estimatedHeight = 390;
      if (rect.left >= tooltipWidth + 34) {
        setCoachmarkPosition({
          left: rect.left - tooltipWidth - 18,
          top: Math.max(16, Math.min(rect.top, window.innerHeight - estimatedHeight - 16)),
          side: 'left',
        });
      } else {
        setCoachmarkPosition({
          left: Math.max(16, Math.min(rect.left, window.innerWidth - tooltipWidth - 16)),
          top: Math.max(16, Math.min(rect.bottom + 18, window.innerHeight - estimatedHeight - 16)),
          side: 'below',
        });
      }
    };

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePosition);
    };
  }, [coachmarkOpen]);

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 lg:px-6">
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            Performance <span>/</span> Mid-year review
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Performance reviews</h1>
          <p className="mt-1 text-sm text-gray-600">Track progress, understand themes, and support better manager conversations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export</Button>
          <Button>Review settings</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Completion', '68%', '+12% this week', TrendingUp],
          ['Reviews submitted', '42', '20 remaining', CheckCircle2],
          ['People in cycle', '62', '8 departments', Users],
        ].map(([label, value, helper, Icon]) => (
          <Card key={String(label)} className="shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div><p className="text-sm text-gray-500">{String(label)}</p><p className="mt-1 text-2xl font-semibold">{String(value)}</p><p className="text-xs text-gray-500">{String(helper)}</p></div>
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600"><Icon className="h-5 w-5" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div><CardTitle className="text-base">Team review progress</CardTitle><p className="mt-1 text-sm text-gray-500">Completion by department</p></div>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              ['Engineering', 82, '18 of 22'],
              ['Product & Design', 71, '10 of 14'],
              ['Sales', 60, '9 of 15'],
              ['Customer Success', 45, '5 of 11'],
            ].map(([name, percent, count]) => (
              <div key={String(name)}>
                <div className="mb-2 flex justify-between text-sm"><span className="font-medium text-gray-700">{name}</span><span className="text-gray-500">{count}</span></div>
                <div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${percent}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div ref={insightCardRef} className={`relative ${coachmarkOpen ? 'z-[60] pointer-events-none' : ''}`}>
          <Card className={`border-blue-200 bg-gradient-to-br from-white to-blue-50/60 shadow-sm transition-all ${coachmarkOpen ? 'ring-2 ring-blue-400 ring-offset-4 shadow-2xl' : ''}`}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div className="flex gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-2.5 text-white"><BrainCircuit className="h-5 w-5" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">AI Review Insights</CardTitle>
                    <button
                      type="button"
                      onClick={() => setCoachmarkReplayOpen(true)}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label="Replay the AI Review Insights feature tour"
                      title="Replay feature tour"
                    >
                      <Sparkles className="h-3 w-3" /> New
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Themes from submitted reviews</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  ['Strongest theme', 'Cross-team collaboration', 'Mentioned in 31 reviews'],
                  ['Growth opportunity', 'Delegation and coaching', 'Mentioned in 18 reviews'],
                  ['Sentiment', '84% positive', 'Up 6 points from last cycle'],
                ].map(([label, value, helper]) => (
                  <div key={label} className="rounded-lg border bg-white p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 text-sm font-semibold text-gray-900">{value}</p><p className="text-xs text-gray-500">{helper}</p></div>
                ))}
              </div>
              <Button variant="outline" className="mt-4 w-full gap-2">View full analysis <BarChart3 className="h-4 w-4" /></Button>
            </CardContent>
          </Card>

        </div>
      </div>

      {announcement && feature && (
        <DialogPrimitive.Root open={coachmarkOpen} onOpenChange={(open) => !open && closeCoachmark()} modal>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[1px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
            <DialogPrimitive.Content
              className="fixed z-[70] w-[calc(100vw-2rem)] max-w-[340px] overflow-visible rounded-xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-700 p-5 text-white shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
              style={{ top: coachmarkPosition.top, left: coachmarkPosition.left }}
              onPointerDownOutside={(event) => event.preventDefault()}
              onInteractOutside={(event) => event.preventDefault()}
            >
              <div className={`absolute h-4 w-4 rotate-45 ${coachmarkPosition.side === 'left' ? '-right-2 top-10 bg-indigo-700' : '-top-2 right-10 bg-blue-700'}`} />
              <button type="button" onClick={closeCoachmark} className="absolute right-3 top-3 rounded p-1 text-blue-100 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label="Close AI Review Insights feature tour"><X className="h-4 w-4" /></button>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15"><Sparkles className="h-4 w-4" /></div>
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-50">New feature</span>
              </div>
              <DialogPrimitive.Title className="pr-6 text-lg font-semibold">{announcement.title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-2 text-sm leading-relaxed text-blue-100">{announcement.summary}</DialogPrimitive.Description>
              <ul className="mt-4 space-y-2.5">
                {feature.announcementBullets?.slice(0, 3).map((bullet) => <li key={bullet} className="flex gap-2 text-xs leading-relaxed text-blue-50"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-none text-emerald-300" />{bullet}</li>)}
              </ul>
              <Button variant="secondary" className="mt-5 w-full gap-2 bg-white text-blue-700 hover:bg-blue-50" onClick={openReleaseDetails}>See what&apos;s new <ArrowRight className="h-4 w-4" /></Button>
              <button type="button" onClick={closeCoachmark} className="mt-3 w-full rounded-md py-1.5 text-xs font-medium text-blue-100 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Got it, close tour</button>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}

      {feature && (
        <FeatureReleaseDialog feature={feature} open={releaseDialogOpen} onOpenChange={handleReleaseDialogChange} />
      )}
    </div>
  );
};

export default PerformanceReviews;
