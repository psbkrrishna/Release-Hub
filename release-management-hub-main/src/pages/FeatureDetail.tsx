import { useNavigate, useParams } from 'react-router-dom';
import {
  Search, ArrowRight, Calendar, SlidersHorizontal, CheckCircle, Play, BookOpen,
  FileText, ExternalLink,
} from 'lucide-react';
import Button from '@/components/primitives/Button';
import Panel from '@/components/primitives/Panel';
import Badge from '@/components/primitives/Badge';
import Crumb from '@/components/primitives/Crumb';
import EmptyState from '@/components/primitives/EmptyState';
import { useFeatureStore } from '@/components/FeatureStore';
import { formatDate } from '@/data/features';

const FeatureDetail = () => {
  const { featureId } = useParams();
  const navigate = useNavigate();
  const { byId, visibleFeatures, isCreator, toast } = useFeatureStore();
  const feature = featureId ? byId(featureId) : undefined;

  // A draft is only the creator's to see; anyone else lands back on the hub.
  if (!feature || (!feature.published && !isCreator)) {
    return (
      <EmptyState
        icon={<Search size={26} />}
        title="That feature isn't available"
        action={
          <Button variant="secondary" onClick={() => navigate('/release-hub')}>
            <ArrowRight size={18} />Back to the Release Hub
          </Button>
        }
      >
        It may have been removed, or it hasn't been published yet.
      </EmptyState>
    );
  }

  const openRes = (label: string, url?: string) =>
    toast(url ? `${label} → ${url}` : `${label} not attached to this feature.`, 'info');

  const [summary, ...rest] = (feature.summary || '').split('\n');
  const more = rest.join(' ');
  const inRelease = visibleFeatures.filter((f) => f.releaseMonth === feature.releaseMonth).length;

  const statusTag =
    feature.status === 'Enabled' ? <Badge variant="green">Enabled</Badge>
    : feature.status === 'Enablement requested' ? <Badge variant="amber">Enablement requested</Badge>
    : feature.status === 'Contact CSM' ? <Badge variant="amber">Contact CSM</Badge>
    : <Badge variant="outline">Disabled</Badge>;

  /* Resource links share a shape, so they share one class string rather than
     three near-identical ones. */
  const resLink = 'flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-brand no-underline hover:bg-brand-soft';

  return (
    <>
      <Crumb
        levels={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Release Hub', path: '/release-hub' },
          { label: 'Feature Details' },
        ]}
      />

      <div className="mb-5 rounded-lg border border-brand-border bg-brand-soft p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="solid">{feature.featureTag}</Badge>
          <Badge variant="outline">{feature.productModule}</Badge>
          {feature.published ? statusTag : <Badge variant="amber">Unpublished</Badge>}
        </div>
        <h2 className="mb-3 text-26 font-bold leading-tight tracking-[-0.01em]">{feature.title}</h2>
        <p className="mb-2 max-w-lede text-ink-600">{summary}</p>
        {more && <p className="mb-2 max-w-lede text-ink-600">{more}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-13 text-ink-500">
          <span className="inline-flex items-center gap-2">
            <Calendar size={14} />
            {feature.published ? 'Released' : 'Planned for'} {formatDate(feature.prodEnablementDate)}
          </span>
          <Badge variant="code">{feature.id}</Badge>
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={14} />{feature.featureType}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 min-[901px]:grid-cols-[1.6fr_1fr]">
        <div>
          <Panel>
            <h3 className="mb-3 text-base font-semibold">What's new</h3>
            <p className="mb-3 max-w-prose text-ink-600">{[summary, more].filter(Boolean).join(' ')}</p>

            <h3 className="mb-3 mt-5 text-base font-semibold">What this helps you do</h3>
            <ul className="mb-4 flex max-w-prose list-none flex-col gap-2 p-0">
              {(feature.announcementBullets ?? []).map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 rounded-md border border-ink-150 bg-ink-25 p-3 text-sm"
                >
                  <CheckCircle size={18} className="shrink-0 text-green-600" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              onClick={() =>
                feature.productRoute
                  ? navigate(feature.productRoute)
                  : toast(`Opening ${feature.productModule} — this is where the capability lives.`)
              }
            >
              View it in the product <ArrowRight size={18} />
            </Button>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel>
            <h3 className="mb-3 text-base font-semibold">Release resources</h3>
            <div className="flex flex-col gap-0.5">
              {feature.demoVideo && (
                <a
                  className={resLink}
                  href="#"
                  onClick={(e) => { e.preventDefault(); openRes('Demo video', feature.demoVideo); }}
                >
                  <Play size={18} />Watch demo
                  <ExternalLink size={14} className="ml-auto text-ink-500" />
                </a>
              )}
              <a
                className={resLink}
                href="#"
                onClick={(e) => { e.preventDefault(); openRes('Release notes', feature.releaseNotes); }}
              >
                <BookOpen size={18} />Read release notes
                <ArrowRight size={14} className="ml-auto text-ink-500" />
              </a>
              {feature.configurationDoc && (
                <a
                  className={resLink}
                  href="#"
                  onClick={(e) => { e.preventDefault(); openRes('Config document', feature.configurationDoc); }}
                >
                  <FileText size={18} />Configuration document
                  <ExternalLink size={14} className="ml-auto text-ink-500" />
                </a>
              )}
            </div>
          </Panel>

          {isCreator && (
            <Panel>
              <h3 className="mb-3 text-base font-semibold">Adoption</h3>
              <dl className="m-0">
                {([
                  ['Enabled customers', feature.enabledCustomers ?? 0, true],
                  ['Active customers', feature.activeCustomers ?? 0, true],
                  ['MAU (last 30 days)', (feature.mauLast30Days ?? 0).toLocaleString(), true],
                  ['DAU (30-day avg)', feature.dauLast30DayAvg ?? 0, true],
                  ['Feature flag', feature.productGate, false],
                ] as const).map(([term, value, isNumber]) => (
                  <div
                    key={term}
                    className="flex justify-between gap-4 border-b border-ink-150 py-3 text-sm last:border-b-0"
                  >
                    <dt className="text-ink-500">{term}</dt>
                    <dd
                      className={[
                        'm-0 text-right',
                        isNumber ? 'font-medium tabular-nums' : 'font-normal text-ink-500',
                      ].join(' ')}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          )}

          <div className="rounded-lg border border-brand-border bg-brand-soft p-5">
            <div className="mb-0.5 text-xs font-semibold uppercase tracking-[.04em] text-brand-text">
              Included in
            </div>
            <h4 className="mb-2 text-base font-semibold">{feature.releaseMonth} Release</h4>
            <p className="mb-3 text-sm text-ink-600">{inRelease} features in this release.</p>
            <Button
              variant="secondary"
              onClick={() => navigate(`/release-hub?month=${encodeURIComponent(feature.releaseMonth)}`)}
            >
              View this release <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeatureDetail;
