import {
  FileText, Play, BookOpen, Lightbulb, Users, ArrowRight, Clock, Star, Zap,
} from 'lucide-react';
import Panel from '@/components/primitives/Panel';
import Button from '@/components/primitives/Button';
import Badge from '@/components/primitives/Badge';

interface KnowledgeBaseHomeProps {
  onNavigateToSection: (section: string, module?: { name: string }) => void;
}

/* Each module gets one of the five badge tones the design language already
   carries, rather than the arbitrary Tailwind palette this page used to reach
   for (orange, indigo, and a blue that no longer matched the brand). */
const modules = [
  {
    name: 'Hire',
    tone: 'brand' as const,
    tint: 'bg-brand-soft text-brand',
    icon: Users,
    description: 'Streamline your recruitment process with advanced candidate scoring and interview management.',
    features: 3,
    videos: 6,
  },
  {
    name: 'Amplify',
    tone: 'green' as const,
    tint: 'bg-green-50 text-green-600',
    icon: Zap,
    description: 'Boost performance with analytics, goal setting, and comprehensive feedback systems.',
    features: 3,
    videos: 5,
  },
  {
    name: 'Analytics',
    tone: 'purple' as const,
    tint: 'bg-purple-50 text-purple-600',
    icon: BookOpen,
    description: 'Create custom dashboards and generate detailed reports with our powerful analytics tools.',
    features: 3,
    videos: 8,
  },
  {
    name: 'Brand',
    tone: 'amber' as const,
    tint: 'bg-amber-50 text-amber-700',
    icon: Star,
    description: 'Customize your platform appearance with logo management and theme customization.',
    features: 3,
    videos: 5,
  },
  {
    name: 'Plan',
    tone: 'neutral' as const,
    tint: 'bg-ink-50 text-ink-700',
    icon: Lightbulb,
    description: 'Manage subscriptions, track usage, and handle billing with integrated management tools.',
    features: 3,
    videos: 6,
  },
];

const KnowledgeBaseHome = ({ onNavigateToSection }: KnowledgeBaseHomeProps) => (
  <div>
    <div className="mb-8 text-center">
      <h1 className="mb-2 text-32 font-bold tracking-[-0.01em] text-brand">Knowledge Base</h1>
      <p className="mx-auto mb-5 max-w-prose text-15 text-ink-600">
        Your resource hub for product documentation, release notes, and training materials -
        everything you need to stay current with the platform.
      </p>
      <div className="flex flex-col items-center justify-center gap-4 text-sm text-ink-600 min-[861px]:flex-row">
        <span className="flex items-center gap-2"><FileText size={18} />Detailed documentation</span>
        <span className="flex items-center gap-2"><Play size={18} />Video tutorials</span>
        <span className="flex items-center gap-2"><Clock size={18} />Latest updates</span>
      </div>
    </div>

    <div className="mb-8 grid grid-cols-1 gap-5 min-[901px]:grid-cols-2">
      <Panel
        onClick={() => onNavigateToSection('release-notes')}
        className="transition-shadow hover:shadow-elev2"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold group-hover:text-brand">Latest release notes</h2>
              <p className="text-13 text-ink-600">Stay updated with new features</p>
            </div>
          </div>
          <ArrowRight size={20} className="shrink-0 text-ink-400 transition-colors group-hover:text-brand" />
        </div>
        <p className="mb-4 max-w-prose text-sm text-ink-700">
          The newest enhancements, fixes, and improvements across every product module, with detail
          on what each release changes.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-13 text-ink-600">
          <span className="flex items-center gap-1"><Clock size={16} />Last updated: Dec 15, 2024</span>
          <Badge variant="neutral">5 new updates</Badge>
        </div>
      </Panel>

      <Panel
        onClick={() => onNavigateToSection('all-docs')}
        className="transition-shadow hover:shadow-elev2"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold group-hover:text-brand">Browse all documentation</h2>
              <p className="text-13 text-ink-600">Complete guides and tutorials</p>
            </div>
          </div>
          <ArrowRight size={20} className="shrink-0 text-ink-400 transition-colors group-hover:text-brand" />
        </div>
        <p className="mb-4 max-w-prose text-sm text-ink-700">
          Documentation for every module, including step-by-step guides, video tutorials, and the
          practices that get the most out of the platform.
        </p>
        <div className="flex flex-wrap items-center gap-4 text-13 text-ink-600">
          <span className="flex items-center gap-1"><FileText size={16} />50+ documents</span>
          <span className="flex items-center gap-1"><Play size={16} />30+ videos</span>
        </div>
      </Panel>
    </div>

    <div className="mb-8">
      <h2 className="mb-1 text-22 font-semibold text-ink-900">Product modules</h2>
      <p className="mb-5 text-sm text-ink-600">
        Documentation and tutorials for each product module.
      </p>

      <div className="grid grid-cols-1 gap-5 min-[901px]:grid-cols-2 min-[1181px]:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Panel
              key={module.name}
              onClick={() => onNavigateToSection('module', module)}
              className="transition-shadow hover:shadow-elev2"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${module.tint}`}>
                    <Icon size={20} />
                  </div>
                  <Badge variant={module.tone}>{module.name}</Badge>
                </div>
                <ArrowRight size={16} className="shrink-0 text-ink-400 transition-colors group-hover:text-brand" />
              </div>
              <h3 className="mb-2 text-base font-semibold group-hover:text-brand">
                {module.name} module
              </h3>
              <p className="mb-4 text-sm text-ink-600">{module.description}</p>
              <div className="mb-4 flex items-center gap-4 text-xs text-ink-500">
                <span className="flex items-center gap-1"><FileText size={12} />{module.features} features</span>
                <span className="flex items-center gap-1"><Play size={12} />{module.videos} videos</span>
              </div>
              {/* Reads as the card's affordance, not a second control - the whole
                  card is already the click target, so this is a span. */}
              <span className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-blue-600 text-base font-medium text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                Explore documentation <ArrowRight size={16} />
              </span>
            </Panel>
          );
        })}
      </div>
    </div>

    <div className="rounded-xl border border-brand-border bg-brand-soft p-8 text-center">
      <h3 className="mb-4 text-22 font-semibold text-brand-text">Platform overview</h3>
      <div className="grid grid-cols-2 gap-5 min-[901px]:grid-cols-4">
        {([
          ['50+', 'Documentation pages'],
          ['30+', 'Video tutorials'],
          ['5', 'Product modules'],
          ['Weekly', 'Content updates'],
        ] as const).map(([value, label]) => (
          <div key={label}>
            <div className="mb-1 text-26 font-bold tabular-nums text-brand">{value}</div>
            <div className="text-13 text-ink-600">{label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default KnowledgeBaseHome;
