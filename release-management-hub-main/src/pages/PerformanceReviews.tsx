import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, CheckCircle2, Users, MoreVertical, Sparkles, BarChart3,
} from 'lucide-react';
import Button from '@/components/primitives/Button';
import Panel from '@/components/primitives/Panel';
import Badge from '@/components/primitives/Badge';
import Crumb from '@/components/primitives/Crumb';
import IconButton from '@/components/primitives/IconButton';
import Spotlight from '@/components/primitives/Spotlight';
import { PERF, PERF_DEPTS as DEPTS } from '@/data/performance';
import { LATEST_RELEASE } from '@/data/features';

const SPOT_KEY = 'perfSpotSeen';

const StatCard = ({
  label, value, sub, subTone = 'muted', children,
}: {
  label: string;
  value: string | number;
  sub: string;
  subTone?: 'muted' | 'up';
  children: ReactNode;
}) => (
  <div className="flex items-start justify-between rounded-xl border border-ink-150 bg-white p-5 shadow-elev1">
    <div>
      <div className="text-13 text-ink-600">{label}</div>
      <div className="my-1 text-32 font-bold tabular-nums">{value}</div>
      <div className={`text-xs ${subTone === 'up' ? 'text-green-700' : 'text-ink-500'}`}>{sub}</div>
    </div>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
      {children}
    </div>
  </div>
);

const PerformanceReviews = () => {
  const navigate = useNavigate();
  const [spotOpen, setSpotOpen] = useState(false);

  // The spotlight fires the first time this session that the page is opened.
  // If the release popup is still up it waits for the next visit rather than
  // stacking two announcements on top of each other. That popup is detected by
  // a data attribute rather than a class name now, and its mere presence in
  // the DOM is enough: a closed Modal renders nothing.
  useEffect(() => {
    if (sessionStorage.getItem(SPOT_KEY) === '1') return;
    if (document.querySelector('[data-release-popup]')) return;
    const t = window.setTimeout(() => {
      setSpotOpen(true);
      sessionStorage.setItem(SPOT_KEY, '1');
    }, 500);
    return () => window.clearTimeout(t);
  }, []);

  // Escape is handled by Modal, so there is no key listener here any more.
  const close = useCallback(() => setSpotOpen(false), []);

  return (
    <>
      <Crumb levels={[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Performance Reviews' }]} />

      <div className="mb-5 flex flex-col gap-6 min-[861px]:flex-row min-[861px]:items-start min-[861px]:justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold leading-tight tracking-[-0.01em] text-brand">
            Performance reviews
          </h1>
          <p className="max-w-lede text-sm text-ink-600">
            Track progress, understand themes, and support better manager conversations.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button variant="secondary">Export</Button>
          <Button>Review settings</Button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 min-[901px]:grid-cols-3">
        <StatCard label="Completion" value={`${PERF.completion}%`} sub="+12% this week" subTone="up">
          <TrendingUp size={20} />
        </StatCard>
        <StatCard label="Reviews submitted" value={PERF.submitted} sub={`${PERF.remaining} remaining`}>
          <CheckCircle2 size={20} />
        </StatCard>
        <StatCard label="People in cycle" value={PERF.people} sub={`${PERF.depts} departments`}>
          <Users size={20} />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 min-[901px]:grid-cols-[1.4fr_1fr]">
        <Panel>
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Team review progress</h2>
              <p className="mb-4 text-13 text-ink-600">Completion by department</p>
            </div>
            <IconButton title="More options" aria-label="More options">
              <MoreVertical size={16} />
            </IconButton>
          </div>

          {DEPTS.map(([name, done, total]) => (
            <div key={name} className="mb-4 last:mb-0">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm">{name}</span>
                <span className="text-sm tabular-nums text-ink-600">{done} of {total}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-[600ms] ease-out"
                  style={{ width: `${Math.round((100 * done) / total)}%` }}
                />
              </div>
            </div>
          ))}
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel onClick={() => setSpotOpen(true)}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-base font-semibold group-hover:text-brand">
                  AI Review Insights
                  {/* The badge is the control that reopens the announcement, so
                      it's a real button, not decoration on a heading. It sits
                      inside a clickable card, hence stopPropagation. */}
                  <span
                    role="button"
                    tabIndex={0}
                    title="What's new in AI Review Insights"
                    onClick={(e) => { e.stopPropagation(); setSpotOpen(true); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        setSpotOpen(true);
                      }
                    }}
                    className="rounded-lg"
                  >
                    <Badge variant="purple" className="cursor-pointer font-semibold hover:bg-purple-200">
                      <Sparkles size={12} />New
                    </Badge>
                  </span>
                </div>
                <div className="text-13 text-ink-600">Themes from submitted reviews</div>
              </div>
            </div>
          </Panel>

          {([
            ['Strongest theme', 'Cross-team collaboration', 'Mentioned in 31 reviews'],
            ['Growth opportunity', 'Delegation and coaching', 'Mentioned in 18 reviews'],
            ['Sentiment', '84% positive', 'Up 6 points from last cycle'],
          ] as const).map(([overline, value, sub]) => (
            <div key={overline} className="rounded-xl border border-ink-150 bg-white p-4">
              <div className="mb-1 text-2xs font-semibold uppercase tracking-[.04em] text-ink-500">
                {overline}
              </div>
              <div className="text-15 font-semibold text-ink-900">{value}</div>
              <div className="mt-1 text-xs text-ink-600">{sub}</div>
            </div>
          ))}

          <Button variant="secondary" block>
            View full analysis <BarChart3 size={18} />
          </Button>
        </div>
      </div>

      <Spotlight
        open={spotOpen}
        onClose={close}
        tone="brand"
        tag="New feature"
        title="New: AI Review Insights"
        intro="Turn review responses into clear patterns and practical coaching recommendations."
        icon={<Sparkles size={20} />}
        ctaLabel="See what's new"
        onCta={() => {
          close();
          navigate(`/release-hub?month=${encodeURIComponent(LATEST_RELEASE)}`);
        }}
        dismissLabel="Got it, close tour"
      >
        <div className="mb-5 flex flex-col gap-3">
          {[
            'Surface review themes automatically',
            'Generate practical coaching recommendations',
            'Reduce manual analysis time by up to 75%',
          ].map((bullet) => (
            <div key={bullet} className="flex items-start gap-3 text-sm">
              <CheckCircle2 size={18} className="mt-px shrink-0 text-green-600" />
              <span>{bullet}</span>
            </div>
          ))}
        </div>
      </Spotlight>
    </>
  );
};

export default PerformanceReviews;
