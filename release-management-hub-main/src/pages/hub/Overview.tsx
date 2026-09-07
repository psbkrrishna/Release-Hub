import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, ArrowRight, FileText, Play, Mail, BookOpen,
} from 'lucide-react';
import Panel from '@/components/primitives/Panel';
import Button from '@/components/primitives/Button';
import HubHeader from '@/components/hub/HubHeader';
import { moduleIcon, TONE_TINT } from '@/components/hub/moduleVisuals';
import { useFeatureStore } from '@/components/FeatureStore';
import { KB_MODULES, plural, releaseNoteGroups } from '@/data/knowledge';

/* ---------------------------------------------------------------------------
   The Overview answers three questions, in the order people arrive with them:

   Search   - one field across features, modules, guides, videos, newsletters.
              It leads because it is the only thing here that is equally
              useful the day after a release and three months later.
   Discover - what shipped most recently. Derived from the newest release that
              actually has published features rather than a fixed "latest
              release" constant, so this panel still says something true in a
              quiet month.
   Navigate - module documentation as the wide anchor, with release notes,
              newsletters and the video library stacked beside it.
   --------------------------------------------------------------------------- */

const Overview = () => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();

  /* Newest first, and only releases the signed-in role can see - so this is
     the most recent real release, not a constant that goes stale. */
  const latest = useMemo(() => releaseNoteGroups(visibleFeatures)[0], [visibleFeatures]);

  /* Four items, always - taken newest-first across releases rather than from
     the latest release alone. A release with only three items in it used to
     leave the panel a row short and the column ragged. */
  const highlights = useMemo(
    () =>
      [...visibleFeatures]
        .sort((a, b) => b.prodEnablementDate.localeCompare(a.prodEnablementDate))
        .slice(0, 4),
    [visibleFeatures],
  );

  /* Modules in that release first, then the rest. Two columns of four comes
     out level with the release list and library stacked beside it. */
  const featured = useMemo(() => {
    const touched = new Set(latest?.features.map((f) => f.productModule) ?? []);
    const inRelease = KB_MODULES.filter((m) => touched.has(m.name));
    const others = KB_MODULES.filter((m) => !touched.has(m.name));
    return [...inRelease, ...others].slice(0, 8);
  }, [latest]);

  const releasedModules = new Set(
    featured
      .filter((m) => latest?.features.some((f) => f.productModule === m.name))
      .map((m) => m.name),
  );
  /* When the release touched four or more modules every card carries the mark
     and it says nothing; it only earns its place on a mixed grid. */
  const markRelease = releasedModules.size > 0 && releasedModules.size < featured.length;

  const toRelease = () =>
    latest && navigate(`/release-hub/releases?month=${encodeURIComponent(latest.month)}`);

  const library = [
    { icon: FileText, label: 'Release notes', sub: 'One document per release', path: '/release-hub/knowledge/release-notes' },
    { icon: Mail, label: 'Newsletters', sub: 'The monthly round-up', path: '/release-hub/knowledge/newsletters' },
    { icon: Play, label: 'Video library', sub: 'Walkthroughs and demos', path: '/release-hub/knowledge/videos' },
  ];

  return (
    <>
      <HubHeader lede="What shipped recently, and the product documentation behind it." />

      {/* No items-start: the columns stretch to the taller of the two, and the
          content inside each one flexes to fill it. Matching their heights by
          tuning padding only ever worked at one viewport - blurbs wrap
          differently as the columns narrow, and the two sides drifted apart. */}
      <div className="grid grid-cols-1 gap-3 min-[901px]:grid-cols-[1.5fr_1fr]">
        <Panel className="flex h-full flex-col">
          {/* No sub-line: the "In this release" marks below already say why
              these modules come first, and saying it twice cost a row. */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <BookOpen size={18} />Product &amp; feature documentation
            </h2>
            <button
              onClick={() => navigate('/release-hub/knowledge')}
              className="inline-flex items-center gap-1 rounded text-13 font-semibold text-brand hover:underline"
            >
              All {KB_MODULES.length} modules <ArrowRight size={13} />
            </button>
          </div>

          {/* auto-rows-fr so the four rows share whatever height the column
              has - the cards grow rather than leaving the panel half empty. */}
          <div className="grid flex-1 grid-cols-1 gap-3 min-[601px]:auto-rows-fr min-[601px]:grid-cols-2">
            {featured.map((m) => {
              const Icon = moduleIcon(m.name);
              return (
                <button
                  key={m.slug}
                  onClick={() => navigate(`/release-hub/knowledge/modules/${m.slug}`)}
                  className="flex flex-col rounded-lg border border-ink-150 bg-ink-25 p-2.5 text-left transition-colors hover:border-brand-border hover:bg-brand-soft"
                >
                  <span className="mb-1.5 flex items-center gap-2.5">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_TINT[m.tone]}`}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 text-sm font-semibold text-ink-900">{m.name}</span>
                  </span>
                  <span className="mb-1.5 line-clamp-2 text-xs text-ink-600">{m.blurb}</span>
                  <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                    <span className="flex items-center gap-1">
                      <FileText size={12} />{plural(m.docs.length, 'guide')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Play size={12} />{plural(m.videos.length, 'video')}
                    </span>
                    {markRelease && releasedModules.has(m.name) && (
                      <span className="ml-auto font-semibold text-purple-900">In this release</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* The release list and the rest of the library, stacked. Together they
            come to about the height of the module grid beside them. */}
        <div className="flex h-full flex-col gap-3">
          {/* Not a Panel: this one carries the purple release treatment the
              dismissable announcement banner used to, so the newest thing on
              the page is the thing that stands out. Built as its own box
              because Panel bakes in the padding this header band has to
              bleed past. */}
          <section className="flex flex-1 flex-col overflow-hidden rounded-xl border border-purple-200 bg-white shadow-elev1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-purple-200 bg-purple-50 px-5 py-3">
              <h2 className="flex items-center gap-2 text-base font-semibold text-purple-900">
                {/* The Release Hub's own icon, so these read as release items. */}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white">
                  <Rocket size={15} />
                </span>
                What&apos;s new
              </h2>
              {latest && (
                <>
                  <span aria-hidden className="text-purple-200">·</span>
                  <span className="text-base font-semibold text-purple-900">
                    {latest.month} Release
                  </span>
                  <button
                    onClick={toRelease}
                    className="ml-auto inline-flex shrink-0 items-center gap-1 rounded text-13 font-semibold text-purple-900 hover:underline"
                  >
                    View the release <ArrowRight size={13} />
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-1 flex-col p-4">
            {latest ? (
              <>
                <div className="grid flex-1 auto-rows-fr gap-2">
                  {highlights.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => navigate(`/release-hub/features/${f.id}`)}
                      className="flex items-center gap-3 rounded-lg border border-ink-150 bg-ink-25 p-2 text-left transition-colors hover:border-brand-border hover:bg-brand-soft"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink-900">{f.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-ink-500">
                          <span
                            className={
                              f.featureTag === 'New Feature'
                                ? 'font-semibold text-purple-900'
                                : 'font-semibold text-ink-600'
                            }
                          >
                            {f.featureTag}
                          </span>
                          {' · '}
                          {f.productModule}
                        </span>
                      </span>
                      <ArrowRight size={16} className="shrink-0 text-ink-400" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* Nothing published at all - a new tenant, or every draft still
                 unpublished. The documentation beside this is still the useful
                 thing, so point at it rather than leaving a dead panel. */
              <>
                <p className="mb-3 text-sm text-ink-600">
                  No releases have been published yet. The product documentation is ready to browse.
                </p>
                <Button variant="secondary" block onClick={() => navigate('/release-hub/knowledge')}>
                  Browse documentation <ArrowRight size={18} />
                </Button>
              </>
            )}
            </div>
          </section>

          {library.map(({ icon: Icon, label, sub, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-3 rounded-xl border border-ink-150 bg-white p-2.5 text-left shadow-elev1 transition-colors hover:border-brand-border hover:bg-brand-soft"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink-900">{label}</span>
                <span className="block text-xs text-ink-500">{sub}</span>
              </span>
              <ArrowRight size={16} className="ml-auto shrink-0 text-ink-400" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Overview;
