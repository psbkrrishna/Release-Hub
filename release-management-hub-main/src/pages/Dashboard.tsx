import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, Calendar, History, ArrowRight, Check } from 'lucide-react';
import Button from '@/components/primitives/Button';
import Panel from '@/components/primitives/Panel';
import Badge from '@/components/primitives/Badge';
import Crumb from '@/components/primitives/Crumb';
import { PERF } from '@/data/performance';

const initialPriorities = [
  { title: 'Approve 3 offer letters', sub: 'Recruiting', done: true },
  { title: 'Review payroll variance', sub: 'Payroll', done: false },
  { title: 'Complete manager calibration', sub: 'Performance', done: false },
  { title: 'Publish onboarding checklist', sub: 'Employee Experience', done: false },
];

/* The four stat tiles differ only by their icon tint, so the tints are a
   lookup rather than four near-identical blocks. */
const TINT = {
  blue: 'bg-brand-soft text-brand',
  purple: 'bg-purple-50 text-purple-500',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-700',
} as const;

const StatCard = ({
  label, value, sub, tint, children,
}: {
  label: string;
  value: string;
  sub: string;
  tint: keyof typeof TINT;
  children: ReactNode;
}) => (
  <div className="flex items-start justify-between rounded-xl border border-ink-150 bg-white p-5 shadow-elev1">
    <div>
      <div className="text-13 text-ink-600">{label}</div>
      <div className="my-1 text-32 font-bold tabular-nums">{value}</div>
      <div className="text-xs text-ink-500">{sub}</div>
    </div>
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TINT[tint]}`}>
      {children}
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState(initialPriorities);

  const toggle = (i: number) =>
    setPriorities((list) => list.map((t, idx) => (idx === i ? { ...t, done: !t.done } : t)));

  return (
    <>
      <Crumb levels={[{ label: 'Dashboard' }]} />

      <div className="mb-5 flex flex-col gap-6 min-[861px]:flex-row min-[861px]:items-start min-[861px]:justify-between">
        <div>
          <div className="mb-1 text-sm font-semibold text-brand">Wednesday, July 22</div>
          <h1 className="mb-1 text-xl font-semibold leading-tight tracking-[-0.01em] text-brand">
            Good afternoon, Ananya
          </h1>
          <p className="max-w-lede text-sm text-ink-600">
            Here's what's happening across your organization.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button size="lg" onClick={() => navigate('/performance-reviews')}>
            Open performance reviews
          </Button>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 min-[901px]:grid-cols-2 min-[1181px]:grid-cols-4">
        <StatCard label="Open positions" value="24" sub="6 closing this month" tint="blue">
          <Briefcase size={19} />
        </StatCard>
        <StatCard label="Active candidates" value="186" sub="18 added this week" tint="purple">
          <Users size={19} />
        </StatCard>
        <StatCard
          label="Reviews in progress"
          value={`${PERF.completion}%`}
          sub={`${PERF.submitted} of ${PERF.people} completed`}
          tint="green"
        >
          <Calendar size={19} />
        </StatCard>
        <StatCard label="Tasks due" value="7" sub="2 need attention today" tint="amber">
          <History size={19} />
        </StatCard>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 min-[901px]:grid-cols-[1.4fr_1fr]">
        <Panel>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Performance review cycle</h2>
              <div className="mt-0.5 text-13 text-ink-600">Mid-year review · July 1–31</div>
            </div>
            <Badge variant="green" className="shrink-0 font-semibold">On track</Badge>
          </div>

          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span>{PERF.submitted} of {PERF.people} reviews complete</span>
            <span className="font-semibold tabular-nums text-ink-900">{PERF.completion}%</span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-[600ms] ease-out"
              style={{ width: `${PERF.completion}%` }}
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 min-[901px]:grid-cols-3">
            {([
              ['Self reviews', PERF.self],
              ['Manager reviews', PERF.manager],
              ['Calibrations', PERF.calib],
            ] as const).map(([label, pair]) => (
              <div key={label} className="rounded-lg border border-ink-150 bg-ink-50 px-4 py-3">
                <div className="mb-1 text-xs text-ink-600">{label}</div>
                <div className="text-base font-semibold tabular-nums">
                  {pair[0]} / {pair[1]}
                </div>
              </div>
            ))}
          </div>

          <a
            className="inline-flex items-center gap-1 rounded text-sm font-medium text-brand no-underline hover:underline"
            href="/performance-reviews"
            onClick={(e) => { e.preventDefault(); navigate('/performance-reviews'); }}
          >
            View performance reviews <ArrowRight size={14} />
          </a>
        </Panel>

        <Panel>
          <h2 className="mb-4 text-base font-semibold">Today's priorities</h2>
          {priorities.map((t, i) => (
            <button
              key={t.title}
              onClick={() => toggle(i)}
              className="flex w-full items-start gap-3 border-b border-ink-150 py-3 text-left last:border-b-0 last:pb-0"
            >
              <span
                className={[
                  'mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  t.done ? 'border-brand bg-brand text-white' : 'border-ink-200 text-transparent',
                ].join(' ')}
              >
                <Check size={13} />
              </span>
              <span className="flex flex-col gap-0.5">
                <span
                  className={[
                    'text-sm font-semibold',
                    t.done ? 'text-ink-600 line-through' : 'text-ink-900',
                  ].join(' ')}
                >
                  {t.title}
                </span>
                <span className="text-xs text-ink-600">{t.sub}</span>
              </span>
            </button>
          ))}
        </Panel>
      </div>
    </>
  );
};

export default Dashboard;
