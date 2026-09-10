import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, ArrowRight, BookOpen, FileText, Mail, Play, BarChart3, Users, SlidersHorizontal,
} from 'lucide-react';
import type { ComponentType } from 'react';
import Button from '@/components/primitives/Button';
import HubSearch from '@/components/hub/HubSearch';
import { SearchHeroArt, ReleaseGiftArt } from '@/components/hub/illustrations';
import { useFeatureStore } from '@/components/FeatureStore';
import { releaseNoteGroups, releasePitch, type PitchIcon } from '@/data/knowledge';

/* ---------------------------------------------------------------------------
   The Overview: search, the latest release, then the way into everything else.

   Spacing here is set to the reference design's own measurements rather than
   to the nearest step on the spacing scale - hence the handful of arbitrary
   values. The comment beside each says what it is matching, so a later change
   knows what it is departing from.

   Search leads because it is the one thing equally useful the day after a
   release and three months later. The release band is derived from the newest
   release that actually has published features, so it still reads correctly in
   a quiet month and disappears rather than sitting empty when nothing has
   shipped.
   --------------------------------------------------------------------------- */

type Icon = ComponentType<{ size?: number | string; className?: string }>;

const PITCH_ICON: Record<PitchIcon, { icon: Icon; tint: string }> = {
  insight: { icon: BarChart3, tint: 'bg-purple-50 text-purple-500' },
  people: { icon: Users, tint: 'bg-brand-soft text-brand' },
  controls: { icon: SlidersHorizontal, tint: 'bg-green-50 text-green-600' },
};

const QUICK_LINKS = [
  {
    icon: BookOpen,
    tint: 'bg-brand-soft text-brand',
    title: 'Product & Feature Documentation',
    sub: 'Step-by-step guides and how-tos.',
    path: '/release-hub/knowledge',
  },
  {
    icon: FileText,
    tint: 'bg-purple-50 text-purple-500',
    title: 'Release Notes',
    sub: "See what's new and why it matters.",
    path: '/release-hub/knowledge/release-notes',
  },
  {
    icon: Mail,
    tint: 'bg-green-50 text-green-600',
    title: 'Newsletters',
    sub: 'Catch up on the latest updates.',
    path: '/release-hub/knowledge/newsletters',
  },
  {
    icon: Play,
    tint: 'bg-amber-50 text-amber-700',
    title: 'Video Library',
    sub: 'Watch walkthroughs and demos.',
    path: '/release-hub/knowledge/videos',
  },
];

const Overview = () => {
  const navigate = useNavigate();
  const { visibleFeatures } = useFeatureStore();

  const latest = useMemo(() => releaseNoteGroups(visibleFeatures)[0], [visibleFeatures]);
  const pitch = latest ? releasePitch(latest) : null;

  /* A pitch names features by id, and those ids are written down rather than
     derived - so check each one against what this role can actually open. */
  const visibleIds = useMemo(() => new Set(visibleFeatures.map((f) => f.id)), [visibleFeatures]);

  return (
    <>
      {/* ---- Search hero ------------------------------------------------
          A fill, not a card: no border, so it reads as ground the content
          sits on. Padding matches the design at 53 / 44 / 50. */}
      <section className="mb-4 overflow-hidden rounded-xl bg-warm-50">
        <div className="flex">
          <div className="min-w-0 flex-1 px-6 py-8 min-[861px]:pb-[50px] min-[861px]:pl-[53px] min-[861px]:pr-6 min-[861px]:pt-11">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-[.1em] text-ink-600">
              Explore. Learn. Get more from Zwayam.
            </p>
            {/* mb-6, not mb-8: the design's 31px gap is measured from the
                glyph baseline, and a 44px line box already carries ~5px of
                that below the descender. */}
            <h2 className="mb-6 text-32 font-bold leading-tight tracking-[-0.02em] text-blue-900 min-[861px]:text-44">
              How can we help you today?
            </h2>
            {/* The hero field and the toolbar field are the same component, so
                a result behaves identically wherever it is found. */}
            <div className="max-w-[845px]">
              <HubSearch
                variant="hero"
                suggestions={['Performance review', 'Onboarding checklist', 'Reports', 'Integrations']}
              />
            </div>
          </div>

          {/* Decorative, and the first thing to go when the column narrows.
              Bleeds to the panel's bottom edge, as in the design.
              540x264 is the asset's own 1792/877, so contain neither crops it
              nor leaves a cream band above and below it. */}
          <SearchHeroArt className="mr-5 hidden h-[264px] w-[540px] shrink-0 self-end min-[1181px]:block" />
        </div>
      </section>

      {/* ---- Latest release --------------------------------------------- */}
      {latest && pitch && (
        <section className="mb-7 overflow-hidden rounded-xl bg-lilac-50">
          {/* The vertical padding is on the text grid, not this row, so the
              band's height is set by the copy (170 + 25 + 30 = 225) and the
              taller illustration overflows that padding instead of inflating
              the band - which is how the design has it. */}
          {/* Uniform 24px on every side, and the illustration is inside that
              padding rather than bleeding past it. */}
          <div className="flex items-center gap-8 p-6">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-y-6 min-[901px]:grid-cols-[minmax(0,1.72fr)_1px_minmax(0,1fr)] min-[901px]:gap-x-6">
              {/* No rocket: the band is already the release's own surface, and
                  the eyebrow says what it is. */}
              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[.1em] text-ink-600">
                  Latest release
                </p>
                <h2 className="mb-2 text-22 font-bold leading-tight tracking-[-0.01em] text-ink-900">
                  {latest.month} Release
                </h2>
                <p className="mb-4 max-w-[460px] text-sm text-ink-700">{pitch.headline}</p>
                <Button onClick={() => navigate(`/release-hub/releases?month=${encodeURIComponent(latest.month)}`)}>
                  Explore what&apos;s new <ArrowRight size={16} />
                </Button>
              </div>

              {/* Hairline between the pitch and what it delivers. */}
              <div className="hidden w-px bg-lilac-200 min-[901px]:block" />

              {/* Each benefit opens the feature that delivers it. One whose
                  feature this role cannot see stays plain text rather than
                  offering a link to a page that would turn it away. */}
              <ul className="m-0 flex list-none flex-col justify-center gap-5 p-0">
                {pitch.highlights.map((h) => {
                  const { icon: Icon, tint } = PITCH_ICON[h.icon];
                  const openable = visibleIds.has(h.featureId);

                  const body = (
                    <>
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={[
                            'block text-sm font-semibold text-ink-900',
                            openable ? 'group-hover/hl:text-brand group-hover/hl:underline' : '',
                          ].join(' ')}
                        >
                          {h.title}
                        </span>
                        <span className="mt-0.5 block text-13 text-ink-600">{h.sub}</span>
                      </span>
                    </>
                  );

                  return (
                    <li key={h.title}>
                      {openable ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/release-hub/features/${h.featureId}`)}
                          className="group/hl -m-1 flex w-full items-center gap-4 rounded-lg p-1 text-left transition-colors"
                        >
                          {body}
                          <ArrowRight
                            size={16}
                            className="ml-auto shrink-0 text-lilac-200 transition-colors group-hover/hl:text-brand"
                          />
                        </button>
                      ) : (
                        <span className="flex items-center gap-4">{body}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* 240x150 is the asset's own 1586/992, for the same reason. */}
            <ReleaseGiftArt className="hidden h-[150px] w-[240px] shrink-0 min-[1181px]:block" />
          </div>
        </section>
      )}

      {/* ---- Quick links ------------------------------------------------ */}
      <h2 className="mb-2 text-22 font-semibold text-ink-900">Quick links</h2>
      <p className="mb-4 text-sm text-ink-600">
        Jump to the most popular resources and stay up to date.
      </p>

      <div className="grid grid-cols-1 gap-[18px] min-[601px]:grid-cols-2 min-[1181px]:grid-cols-4">
        {QUICK_LINKS.map(({ icon: Icon, tint, title, sub, path }) => (
          /* 12px on every side, and both lines truncate rather than wrap - a
             quick link that grows to three lines stops being quick. */
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className="group flex items-center gap-3 rounded-lg border border-ink-150 bg-white p-3 text-left shadow-elev1 transition-colors hover:border-brand-border hover:bg-brand-soft"
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint}`}>
              <Icon size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink-900 group-hover:text-brand-text">
                {title}
              </span>
              <span className="block truncate text-13 text-ink-600">{sub}</span>
            </span>
            <ArrowRight
              size={16}
              className="shrink-0 text-ink-400 transition-colors group-hover:text-brand"
            />
          </button>
        ))}
      </div>
    </>
  );
};

export default Overview;
