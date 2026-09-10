import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Play, Envelope as Mail, ArrowRight, Clock } from '@phosphor-icons/react';
import Panel from '@/components/primitives/Panel';
import HubHeader from '@/components/hub/HubHeader';
import ModuleCard from '@/components/hub/ModuleCard';
import { useFeatureStore } from '@/components/FeatureStore';
import { KB_GROUPS, KB_MODULES, plural, releaseNoteGroups, sortedNewsletters } from '@/data/knowledge';
import { formatDate } from '@/data/features';

/* The Product & Feature Documentation landing page. Three ways in by content
   type, then the documentation itself grouped by product family - which is
   what people came for, so it gets the room. Counts are computed rather than
   written down: the old page advertised "50+ documents" beside a list of
   fifteen. */

const KnowledgeHome = () => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();

  const newsletters = useMemo(() => sortedNewsletters(), []);
  const releases = useMemo(() => releaseNoteGroups(visibleFeatures), [visibleFeatures]);

  const docCount = KB_MODULES.reduce((n, m) => n + m.docs.length, 0);
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
      {/* No heading: the layout's page title and the active tab already say
          "Knowledge Hub". The lede still earns its place - it says what is
          in here, which neither of those does. */}
      <HubHeader lede="Module documentation, release notes, newsletters and training videos — everything that explains how the platform works." />

      <div className="mb-8 grid grid-cols-1 gap-5 min-[901px]:grid-cols-3">
        {entries.map(({ key, icon: Icon, tint, title, sub, body, meta, path }) => (
          <Panel key={key} onClick={() => navigate(path)}>
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

      {/* ---- Documentation, grouped by product family -------------------
          Ten cards in one flat grid gave the reader no way in. Each group is
          a band with its own heading and module count, separated by a rule -
          so the page is scanned by product first, module second. */}
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-22 font-semibold text-ink-900">Product &amp; feature documentation</h2>
        <span className="text-13 text-ink-600">
          {plural(docCount, 'document')} across {plural(KB_MODULES.length, 'module')}
        </span>
      </div>
      <p className="mb-6 text-sm text-ink-600">
        Every product module, its documents, its videos, and the features released in it.
      </p>

      {KB_GROUPS.map((group, i) => (
        <section key={group.name} className={i > 0 ? 'mt-8 border-t border-ink-150 pt-8' : ''}>
          <h3 className="mb-4 flex items-center gap-2 text-15 font-semibold text-ink-900">
            {group.name}
            <span aria-hidden className="text-ink-300">·</span>
            <span className="font-normal text-ink-600">{plural(group.modules.length, 'Module')}</span>
          </h3>

          <div className="grid grid-cols-1 gap-5 min-[901px]:grid-cols-2 min-[1181px]:grid-cols-3">
            {group.modules.map((m) => {
              const features = visibleFeatures.filter((f) => f.productModule === m.name).length;
              return (
                <ModuleCard
                  key={m.slug}
                  name={m.name}
                  /* The tagline, not the blurb: it is written to fit one line,
                     which the blurb is not. */
                  tagline={m.tagline}
                  docs={m.docs.length}
                  videos={m.videos.length}
                  features={features}
                  onOpen={() => navigate(`/release-hub/knowledge/modules/${m.slug}`)}
                />
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
};

export default KnowledgeHome;
