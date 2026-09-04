import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, FileText, Play, Mail, Calendar, Rocket, BookOpen,
} from 'lucide-react';
import Panel from '@/components/primitives/Panel';
import Badge from '@/components/primitives/Badge';
import Button from '@/components/primitives/Button';
import { moduleIcon, TONE_TINT } from '@/components/hub/moduleVisuals';
import { useFeatureStore } from '@/components/FeatureStore';
import { KB_MODULES, plural } from '@/data/knowledge';
import { LATEST_RELEASE, formatDate } from '@/data/features';

/* The hub's front door, sized to be read without scrolling.

   It makes one argument rather than listing two unrelated things: this is what
   shipped, and this is the documentation for the parts of the product it
   touched. So the four module cards are the modules in the latest release -
   not the first four alphabetically - which is also what keeps this page
   current as releases move. Documentation takes the wide column because
   finding it is why most people open the hub; the release list is the
   narrower companion.

   No page heading: the breadcrumb and tab strip directly above already say
   where you are, and a third label would cost space the content needs. */

const HubHome = () => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();

  const inLatest = useMemo(
    () => visibleFeatures.filter((f) => f.releaseMonth === LATEST_RELEASE),
    [visibleFeatures],
  );
  const highlights = inLatest.slice(0, 4);
  const releaseDate = inLatest[0]?.prodEnablementDate;
  const newCount = inLatest.filter((f) => f.featureTag === 'New Feature').length;

  /* Modules this release touched first, then the rest. Eight rather than four:
     two columns of four balances the height of the release list and the
     library stacked beside it, so neither column ends in an empty tail. */
  const featured = useMemo(() => {
    const touched = new Set(inLatest.map((f) => f.productModule));
    const inRelease = KB_MODULES.filter((m) => touched.has(m.name));
    const others = KB_MODULES.filter((m) => !touched.has(m.name));
    return [...inRelease, ...others].slice(0, 8);
  }, [inLatest]);

  /* When the release touched four or more modules, every card is "in this
     release" and marking them all says nothing. The mark only earns its place
     on a mixed grid, where some cards are backfill. */
  const releasedModules = new Set(
    featured.filter((m) => inLatest.some((f) => f.productModule === m.name)).map((m) => m.name),
  );
  const markRelease = releasedModules.size > 0 && releasedModules.size < featured.length;

  const toRelease = () =>
    navigate(`/release-hub/releases?month=${encodeURIComponent(LATEST_RELEASE)}`);

  const library = [
    { icon: FileText, label: 'Release notes', sub: 'One document per release', path: '/release-hub/knowledge/release-notes' },
    { icon: Mail, label: 'Newsletters', sub: 'The monthly round-up', path: '/release-hub/knowledge/newsletters' },
    { icon: Play, label: 'Video library', sub: 'Walkthroughs and demos', path: '/release-hub/knowledge/videos' },
  ];

  return (
    <>
      {/* Release news is purple everywhere in this app, and this is the newest
          thing on the page, so the hero follows that rather than the brand. */}
      <div className="mb-3 rounded-xl border border-purple-200 bg-purple-50 px-5 py-3">
        <div className="flex flex-col gap-4 min-[901px]:flex-row min-[901px]:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white">
            <Sparkles size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-22 font-semibold leading-tight text-purple-900">
                {LATEST_RELEASE} Release
              </h1>
              {releaseDate && (
                <span className="flex items-center gap-1 text-13 text-ink-600">
                  <Calendar size={13} />{formatDate(releaseDate)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-ink-700">
              {inLatest.length} {inLatest.length === 1 ? 'item' : 'items'} in this release
              {newCount > 0 && `, ${newCount} of them new`}.
            </p>
          </div>
          <Button className="shrink-0" onClick={toRelease}>
            View the release <ArrowRight size={18} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 min-[901px]:grid-cols-[1.5fr_1fr]">
        <Panel>
          {/* No sub-line: the "In this release" marks below already say why
              these modules come first, and saying it twice cost a row. */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <BookOpen size={18} />Module documentation
            </h2>
            <button
              onClick={() => navigate('/release-hub/knowledge')}
              className="inline-flex items-center gap-1 rounded text-13 font-semibold text-brand hover:underline"
            >
              All {KB_MODULES.length} modules <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 min-[601px]:grid-cols-2">
            {featured.map((m) => {
              const Icon = moduleIcon(m.name);
              return (
                <button
                  key={m.slug}
                  onClick={() => navigate(`/release-hub/knowledge/modules/${m.slug}`)}
                  className="flex flex-col rounded-lg border border-ink-150 bg-ink-25 p-3 text-left transition-colors hover:border-brand-border hover:bg-brand-soft"
                >
                  <span className="mb-1.5 flex items-center gap-2.5">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONE_TINT[m.tone]}`}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 text-sm font-semibold leading-tight text-ink-900">
                      {m.name}
                    </span>
                  </span>
                  {/* The tagline, not the blurb: these cards are narrow enough
                      that the full sentence truncated mid-clause. */}
                  <span className="mb-2 text-xs text-ink-600">{m.tagline}</span>
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
        <div className="flex flex-col gap-3">
        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Rocket size={18} />In this release
            </h2>
            {inLatest.length > highlights.length && (
              <button
                onClick={toRelease}
                className="inline-flex items-center gap-1 rounded text-13 font-semibold text-brand hover:underline"
              >
                See all {inLatest.length} <ArrowRight size={13} />
              </button>
            )}
          </div>

          {highlights.length ? (
            <div className="flex flex-col gap-2">
              {highlights.map((f) => (
                <button
                  key={f.id}
                  onClick={() => navigate(`/release-hub/features/${f.id}`)}
                  className="flex items-center gap-3 rounded-lg border border-ink-150 bg-ink-25 p-2 text-left transition-colors hover:border-brand-border hover:bg-brand-soft"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink-900">{f.title}</span>
                    {/* One meta line rather than two pills: this is the quiet
                        column now, and two bordered chips in a narrow card
                        competed with the module cards for attention. */}
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
          ) : (
            <p className="text-sm text-ink-600">
              Nothing has been published for {LATEST_RELEASE} yet.
            </p>
          )}
        </Panel>

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

export default HubHome;
