import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Play, Mail, ArrowRight, ExternalLink, Calendar, Filter,
} from 'lucide-react';
import Panel from '@/components/primitives/Panel';
import Badge from '@/components/primitives/Badge';
import IconButton from '@/components/primitives/IconButton';
import EmptyState from '@/components/primitives/EmptyState';
import { toolbarSelectCls, caretBackground } from '@/components/primitives/fieldStyles';
import { useFeatureStore } from '@/components/FeatureStore';
import { KB_MODULES, moduleByName, plural, releaseNoteGroups, sortedNewsletters } from '@/data/knowledge';
import { formatDate } from '@/data/features';

/* Release notes, newsletters and the video library. Three lists that share a
   header, a module filter and an "open this thing" affordance, so they share a
   component rather than three files that would drift.

   All three read visibleFeatures, so an unpublished draft never reaches a
   customer-facing list by way of the Knowledge Hub. */

export type SectionKey = 'release-notes' | 'newsletters' | 'videos';

const COPY: Record<SectionKey, { title: string; lede: string }> = {
  'release-notes': {
    title: 'Release notes',
    lede: 'One release note document per release, newest first. Open a release in Release Management for the feature-by-feature detail.',
  },
  newsletters: {
    title: 'Newsletters',
    lede: 'The customer newsletter for each release — the short version of what shipped and why.',
  },
  videos: {
    title: 'Video library',
    lede: 'Module walkthroughs and a demo for every feature that ships with one.',
  },
};

const KnowledgeSection = ({ section }: { section: SectionKey }) => {
  const navigate = useNavigate();
  const { visibleFeatures, byId, toast } = useFeatureStore();
  const [module, setModule] = useState('all');

  const open = (label: string, url?: string) =>
    toast(url ? `${label} → ${url}` : `${label} isn't attached yet.`, 'info');

  const inModule = (name: string) => module === 'all' || name === module;

  const releases = useMemo(
    () =>
      releaseNoteGroups(visibleFeatures.filter((f) => inModule(f.productModule)))
        .filter((g) => g.features.length),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleFeatures, module],
  );

  const newsletters = useMemo(() => sortedNewsletters(), []);

  /* Two sources, one list: the evergreen module walkthroughs, and the demo
     attached to each feature that has one. */
  const videos = useMemo(() => {
    const fromModules = KB_MODULES.filter((m) => inModule(m.name)).flatMap((m) =>
      m.videos.map((v) => ({
        id: v.id,
        title: v.title,
        module: m.name,
        duration: v.duration,
        url: v.url,
        featureId: undefined as string | undefined,
      })),
    );
    const fromFeatures = visibleFeatures
      .filter((f) => f.demoVideo && inModule(f.productModule))
      .map((f) => ({
        id: `demo-${f.id}`,
        title: `${f.title} — demo`,
        module: f.productModule,
        duration: '',
        url: f.demoVideo,
        featureId: f.id,
      }));
    return [...fromModules, ...fromFeatures];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleFeatures, module]);

  const { title, lede } = COPY[section];
  const showFilter = section !== 'newsletters';

  const empty = (
    <EmptyState icon={<Filter size={26} />} title={`Nothing here for ${module}`}>
      Choose a different module, or switch back to all modules.
    </EmptyState>
  );

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 min-[861px]:flex-row min-[861px]:items-start min-[861px]:justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold leading-tight tracking-[-0.01em] text-brand">{title}</h1>
          <p className="max-w-lede text-sm text-ink-600">{lede}</p>
        </div>
        {showFilter && (
          <div className="relative inline-flex shrink-0 items-center">
            <Filter size={16} className="pointer-events-none absolute left-3 z-[1] text-ink-600" />
            <select
              className={toolbarSelectCls}
              style={caretBackground}
              aria-label="Filter by product module"
              value={module}
              onChange={(e) => setModule(e.target.value)}
            >
              <option value="all">All Modules</option>
              {KB_MODULES.map((m) => <option key={m.slug}>{m.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* One document per release, not one per feature. The per-feature detail
          is Release Management's job, and it is one click away on each row. */}
      {section === 'release-notes' &&
        (releases.length ? (
          <div className="flex flex-col gap-3">
            {releases.map((g) => (
              <Panel key={g.month} className="flex flex-col gap-4 min-[901px]:flex-row min-[901px]:items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <FileText size={20} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{g.month} Release Notes</h2>
                    {g.newCount > 0 && <Badge variant="purple">{g.newCount} new</Badge>}
                    {g.enhancementCount > 0 && (
                      <Badge variant="neutral">{plural(g.enhancementCount, 'enhancement')}</Badge>
                    )}
                  </div>
                  <div className="mb-1 flex items-center gap-2 text-13 text-ink-500">
                    <Calendar size={13} />Released {formatDate(g.date)}
                  </div>
                  {/* Under a module filter the counts describe that module's
                      slice of the release, so the line has to say so - "4
                      changes across Recruiting" would misstate the document. */}
                  <p className="max-w-lede text-13 text-ink-600">
                    {module === 'all'
                      ? `${plural(g.features.length, 'change')} across ${g.modules.join(', ')}.`
                      : `${plural(g.features.length, 'change')} in ${module}.`}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate(`/release-hub/releases?month=${encodeURIComponent(g.month)}`)}
                    className="inline-flex items-center gap-1 rounded text-13 font-semibold text-brand hover:underline"
                  >
                    Open in Release Management <ArrowRight size={13} />
                  </button>
                  <IconButton
                    tone="brand"
                    title={`Open ${g.month} release notes`}
                    aria-label={`Open ${g.month} release notes`}
                    onClick={() => open(`${g.month} release notes`, g.url)}
                  >
                    <ExternalLink size={16} />
                  </IconButton>
                </div>
              </Panel>
            ))}
          </div>
        ) : (
          empty
        ))}

      {section === 'newsletters' && (
        <div className="flex flex-col gap-4">
          {newsletters.map((n) => (
            <Panel key={n.id}>
              <div className="flex flex-col gap-4 min-[901px]:flex-row min-[901px]:items-start">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
                  <Mail size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{n.title}</h2>
                    <Badge variant="purple">{n.month}</Badge>
                  </div>
                  <p className="mb-1 text-13 text-ink-500">Sent {formatDate(n.date)}</p>
                  <p className="mb-3 max-w-lede text-sm text-ink-700">{n.summary}</p>

                  <div className="flex flex-wrap items-center gap-2">
                    {n.featureIds.map((id) => {
                      const f = byId(id);
                      // A newsletter can name a feature the signed-in role
                      // can't open - a draft, or one pulled from the release.
                      if (!f || !visibleFeatures.some((v) => v.id === id)) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => navigate(`/release-hub/features/${id}`)}
                          className="rounded-lg border border-ink-150 px-2 py-1 text-xs font-medium text-ink-700 transition-colors hover:border-brand-border hover:bg-brand-soft hover:text-brand-text"
                        >
                          {f.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <IconButton
                  tone="brand"
                  className="shrink-0"
                  title="Open newsletter"
                  aria-label={`Open ${n.title}`}
                  onClick={() => open(n.title, n.url)}
                >
                  <ExternalLink size={16} />
                </IconButton>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {section === 'videos' &&
        (videos.length ? (
          <div className="grid grid-cols-1 gap-4 min-[901px]:grid-cols-2 min-[1181px]:grid-cols-3">
            {videos.map((v) => {
              const tone = moduleByName(v.module)?.tone ?? 'neutral';
              return (
                <Panel key={v.id} className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                      <Play size={18} />
                    </span>
                    <Badge variant={tone}>{v.module}</Badge>
                  </div>
                  <h3 className="mb-2 flex-1 text-sm font-semibold">{v.title}</h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => open(v.title, v.url)}
                      className="inline-flex items-center gap-1 rounded text-13 font-semibold text-brand hover:underline"
                    >
                      <Play size={13} />Watch
                    </button>
                    {v.duration && (
                      <span className="text-xs tabular-nums text-ink-500">{v.duration}</span>
                    )}
                    {v.featureId && (
                      <button
                        onClick={() => navigate(`/release-hub/features/${v.featureId}`)}
                        className="ml-auto inline-flex items-center gap-1 rounded text-13 text-ink-600 hover:text-brand"
                      >
                        Feature <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </Panel>
              );
            })}
          </div>
        ) : (
          empty
        ))}

      {section === 'release-notes' && releases.length > 0 && (
        <p className="mt-5 flex items-center gap-2 text-13 text-ink-600">
          <FileText size={14} />
          Looking for how a module works rather than what changed?{' '}
          <button
            onClick={() => navigate('/release-hub/knowledge')}
            className="rounded font-semibold text-brand hover:underline"
          >
            Browse module documentation
          </button>
        </p>
      )}
    </>
  );
};

export default KnowledgeSection;
