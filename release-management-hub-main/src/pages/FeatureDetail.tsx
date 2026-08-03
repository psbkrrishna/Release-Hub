import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, CheckCircle2, ExternalLink, PlayCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { releases } from '@/data/releases';
import { sampleFeatures } from '@/data/sampleFeatures';

const FeatureDetail = () => {
  const { featureId } = useParams();
  const navigate = useNavigate();
  const feature = sampleFeatures.find((item) => item.id === featureId);
  const release = releases.find((item) => item.id === feature?.releaseId);

  useEffect(() => {
    if (!feature) navigate('/release-hub?notice=feature-not-found', { replace: true });
  }, [feature, navigate]);

  if (!feature) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
      <Button variant="ghost" className="mb-5 -ml-3 text-gray-600" onClick={() => navigate(`/release-hub?release=${feature.releaseId ?? ''}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to release
      </Button>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 px-6 py-8 sm:px-10 sm:py-10">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge>{feature.featureTag}</Badge>
            <Badge variant="outline">{feature.productModule}</Badge>
            <Badge variant={feature.status === 'Enabled' ? 'secondary' : 'outline'}>{feature.status}</Badge>
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-gray-900">{feature.title}</h1>
          <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-gray-600">{feature.summary}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Released {release ? new Date(`${release.date}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : feature.prodEnablementDate}</span>
            <span className="font-mono text-xs">{feature.id}</span>
          </div>
        </div>

        <div className="grid gap-8 px-6 py-8 sm:px-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">What&apos;s new</h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">{feature.releaseNotes}</p>

            <h2 className="mt-8 text-lg font-semibold text-gray-900">What this helps you do</h2>
            <div className="mt-4 space-y-3">
              {(feature.announcementBullets ?? ['Work more efficiently with the latest product experience']).map((bullet) => (
                <div key={bullet} className="flex gap-3 rounded-lg border bg-gray-50/60 p-4 text-sm text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-500" /> {bullet}
                </div>
              ))}
            </div>

            {feature.productRoute && (
              <Button className="mt-7 gap-2" onClick={() => navigate(`${feature.productRoute}?release=${feature.id}`)}>
                View it in the product <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <Card className="shadow-none"><CardContent className="p-5"><h3 className="text-sm font-semibold text-gray-900">Release resources</h3><div className="mt-3 space-y-2"><a href={feature.demoVideo} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-md p-2 text-sm text-blue-700 hover:bg-blue-50"><span className="flex items-center gap-2"><PlayCircle className="h-4 w-4" /> Watch demo</span><ExternalLink className="h-3.5 w-3.5" /></a><button type="button" className="flex w-full items-center justify-between rounded-md p-2 text-sm text-blue-700 hover:bg-blue-50"><span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Read release notes</span><ArrowRight className="h-3.5 w-3.5" /></button></div></CardContent></Card>
            <Card className="border-blue-100 bg-blue-50/50 shadow-none"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Included in</p><p className="mt-1 text-sm font-semibold text-gray-900">{release?.name ?? 'Product release'}</p><p className="mt-2 text-xs leading-relaxed text-gray-600">{release?.summary}</p><Button variant="link" className="mt-2 h-auto p-0 text-xs" onClick={() => navigate(`/release-hub?release=${release?.id ?? ''}`)}>View all release features <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></CardContent></Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureDetail;
