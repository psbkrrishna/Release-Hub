import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Play, Mail, ArrowRight, Clock, Rocket } from 'lucide-react';
import Panel from '@/components/primitives/Panel';
import Badge from '@/components/primitives/Badge';
import { moduleIcon, TONE_TINT } from '@/components/hub/moduleVisuals';
import { useFeatureStore } from '@/components/FeatureStore';
import { KB_MODULES, plural, releaseNoteGroups, sortedNewsletters } from '@/data/knowledge';
import { formatDate } from '@/data/features';

/* The Knowledge Hub landing page. Three ways in by content type, then the
   module grid - which is the one people actually came for, so it gets the
   room. Counts are computed rather than written down: the old page advertised
   "50+ documents" beside a list of fifteen. */

const KnowledgeHome = () => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();

  const newsletters = useMemo(() => sortedNewsletters(), []);
  const releases = useMemo(() => releaseNoteGroups(visibleFeatures), [visibleFeatures]);

  const guideCount = KB_MODULES.reduce((n, m) => n + m.docs.length, 0);
  const videoCount =
    KB_MODULES.reduce((n, m) => n + m.videos.length, 0) +
    visibleFeatures.filter((f) => f.demoVideo).length;

  const latest = releases[0];

  const entries = [
    {
      key: 'release-notes',
      icon: FileText,
      tint: 'bg-brand-soft text-brand',
      title: 'Release notes',
      sub: 'What changed, release by release',
      body: 'Every feature and enhancement in each monthly release, with the detail behind each one.',
      meta: latest ? `Latest: ${latest.month} · ${latest.features.length} items` : 'No releases yet',
      path: '/release-hub/knowledge/release-notes',
    },
    {
      key: 'newsletters',
      icon: Mail,
      tint: 'bg-purple-50 text-purple-500',
      title: 'Newsletters',
      sub: 'The monthly round-up',
      body: 'The customer newsletter for each release — the short version of what shipped and why it matters.',
      meta: newsletters[0] ? `Latest issue: ${formatDate(newsletters[0].date)}` : 'No issues yet',
      path: '/release-hub/knowledge/newsletters',
    },
    {
      key: 'videos',
      icon: Play,
      tint: 'bg-green-50 text-green-600',
      title: 'Video library',
      sub: 'Walkthroughs and demos',
      body: 'Training walkthroughs for each module, plus a demo for every feature that ships with one.',
      meta: plural(videoCount, 'video'),
      path: '/release-hub/knowledge/videos',
    },
  ];

  return (
    <>
      <div className="mb-5">
        <h1 className="mb-1 text-xl font-semibold leading-tight tracking-[-0.01em] text-brand">
          Knowledge Hub
        </h1>
        <p className="max-w-lede text-sm text-ink-600">
          Module documentation, release notes, newsletters and training videos — everything that
          explains how the platform works.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 min-[901px]:grid-cols-3">
        {entries.map(({ key, icon: Icon, tint, title, sub, body, meta, path }) => (
          <Panel key={key} onClick={() => navigate(path)} className="transition-shadow hover:shadow-elev2">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold group-hover:text-brand">{title}</h2>
                  <p className="text-13 text-ink-600">{sub}</p>
                </div>
              </div>
              <ArrowRight size={18} className="shrink-0 text-ink-400 transition-colors group-hover:text-brand" />
            </div>
            <p className="mb-4 text-sm text-ink-700">{body}</p>
            <span className="flex items-center gap-1 text-13 text-ink-600">
              <Clock size={14} />
              {meta}
            </span>
          </Panel>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-22 font-semibold text-ink-900">Module documentation</h2>
        <span className="text-13 text-ink-600">
          {plural(guideCount, 'guide')} across {plural(KB_MODULES.length, 'module')}
        </span>
      </div>
      <p className="mb-5 max-w-lede text-sm text-ink-600">
        Every product module, its guides, its videos, and the features that have shipped in it.
      </p>

      <div className="grid grid-cols-1 gap-5 min-[901px]:grid-cols-2 min-[1181px]:grid-cols-3">
        {KB_MODULES.map((m) => {
          const Icon = moduleIcon(m.name);
          const features = visibleFeatures.filter((f) => f.productModule === m.name).length;
          return (
            <Panel
              key={m.slug}
              onClick={() => navigate(`/release-hub/knowledge/modules/${m.slug}`)}
              className="flex flex-col transition-shadow hover:shadow-elev2"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONE_TINT[m.tone]}`}>
                    <Icon size={20} />
                  </div>
                  <Badge variant={m.tone}>{m.name}</Badge>
                </div>
                <ArrowRight size={16} className="shrink-0 text-ink-400 transition-colors group-hover:text-brand" />
              </div>

              <p className="mb-4 flex-1 text-sm text-ink-600">{m.blurb}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-500">
                <span className="flex items-center gap-1"><FileText size={13} />{plural(m.docs.length, 'guide')}</span>
                <span className="flex items-center gap-1"><Play size={13} />{plural(m.videos.length, 'video')}</span>
                <span className="flex items-center gap-1"><Rocket size={13} />{plural(features, 'feature')}</span>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
};

export default KnowledgeHome;
