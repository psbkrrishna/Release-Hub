import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, FileText, Mail, Play, BarChart3, Users, SlidersHorizontal,
} from 'lucide-react';
import type { ComponentType } from 'react';
import Button from '@/components/primitives/Button';
import HubSearch from '@/components/hub/HubSearch';
import { SearchHeroArt, ReleaseGiftArt } from '@/components/hub/illustrations';
import { useFeatureStore } from '@/components/FeatureStore';
import { releaseNoteGroups, releasePitch, type PitchIcon } from '@/data/knowledge';
import { RADIUS, SPACE, T, TYPE, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The Overview: search, the latest release, then the way into everything else.

   Search leads because it is the one thing equally useful the day after a
   release and three months later. The release band is derived from the newest
   release that actually has published features, so it still reads correctly in
   a quiet month and disappears rather than sitting empty when nothing has
   shipped.

   Both bands carry a hairline border now. Without one they were two large
   tinted rectangles floating on a near-white page, and the eye had nothing to
   tell it where either one ended.
   --------------------------------------------------------------------------- */

type Icon = ComponentType<{ size?: number | string; className?: string }>;

const PITCH_ICON: Record<PitchIcon, { icon: Icon; tint: string }> = {
  insight: { icon: BarChart3, tint: 'bg-purple-50 text-purple-500' },
  people: { icon: Users, tint: 'bg-brand-soft text-brand' },
  controls: { icon: SlidersHorizontal, tint: 'bg-green-50 text-green-600' },
};

/* Product & Feature Documentation is gone from here: it has a tab of its own,
   and a quick link to a tab two inches above it is not a shortcut. What is
   left is the three destinations that have no tab - which is what makes this
   row worth keeping. */
const QUICK_LINKS = [
  {
    icon: FileText,
    tint: 'bg-purple-50 text-purple-500',
    title: 'Release notes',
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
    title: 'Video library',
    sub: 'Watch walkthroughs and demos.',
    path: '/release-hub/knowledge/videos',
  },
];

/* ---------------------------------------------------------------------------
   One thing the release delivers, as a card you can obviously press.

   These used to be three rows of icon-and-text sitting straight on the lilac
   band, which is why they disappeared into it: nothing about them said they
   were targets. A white card on the tinted ground, with the interaction
   rules' own hover - --brand-border plus the soft blue fill - says it without
   any extra copy.

   A pointer whose feature this role cannot open renders as a plain card: no
   hover, no caret, no link to a page that would turn the reader away.
   --------------------------------------------------------------------------- */
const PitchCard = ({
  icon: Icon,
  tint,
  title,
  sub,
  onOpen,
}: {
  icon: Icon;
  tint: string;
  title: string;
  sub: string;
  onOpen?: () => void;
}) => {
  const [hover, setHover] = useState(false);

  const base = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: SPACE.x3,
    width: '100%',
    textAlign: 'left' as const,
    background: T.card,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: T.bd2,
    borderRadius: RADIUS.control,
    padding: SPACE.x4,
    transition: 'background 120ms ease, border-color 120ms ease',
  };

  const body = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tint}`}
      >
        <Icon size={18} />
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={sx(
            { display: 'block', ...TYPE.cardTitle, lineHeight: 1.35 },
            hover && !!onOpen && { color: T.brand },
          )}
        >
          {title}
        </span>
        <span style={{ display: 'block', marginTop: 2, ...TYPE.helper }}>{sub}</span>
      </span>
      {onOpen && (
        <ArrowRight
          size={16}
          style={{ flexShrink: 0, marginTop: 2, color: hover ? T.brand : T.tx4 }}
        />
      )}
    </>
  );

  if (!onOpen) return <div style={base}>{body}</div>;

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={sx(base, { cursor: 'pointer' }, hover && {
        borderColor: T.brandBorder,
        background: T.brandSoft,
      })}
    >
      {body}
    </button>
  );
};

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
          20px on every side, and the illustration is absolutely positioned
          against the panel's bottom-right corner rather than being a flex
          child - so the padding is genuinely uniform and the art cannot push
          the copy around. The text column reserves room for it above
          1181px, which is the only width the art appears at. */}
      <section
        className="mb-4 rounded-xl border border-warm-200 bg-warm-50"
        style={{ position: 'relative', overflow: 'hidden', padding: SPACE.x5 }}
      >
        <div className="relative z-[1] min-[1181px]:pr-[470px]">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-[.1em] text-ink-600">
            Explore. Learn. Get more from Zwayam.
          </p>
          <h2 className="mb-6 text-32 font-bold leading-tight tracking-[-0.02em] text-blue-900 min-[861px]:text-44">
            How can we help you today?
          </h2>
          {/* The hero field and the toolbar field are the same component, so
              a result behaves identically wherever it is found. */}
          <div className="max-w-[845px]">
            <HubSearch
              variant="hero"
              suggestions={['Performance review', 'Onboarding checklist', 'Reports']}
            />
          </div>
        </div>

        {/* Decorative, and the first thing to go when the column narrows.
            450x220 is the asset's own 1792/877, so contain neither crops it
            nor leaves a cream band above and below it. */}
        <SearchHeroArt className="pointer-events-none absolute bottom-0 right-0 hidden h-[220px] w-[450px] min-[1181px]:block" />
      </section>

      {/* ---- Latest release ---------------------------------------------
          Laid out as a header row and then a row of three cards, rather than
          two columns with the pitch on one side and a list on the other. The
          old split gave the three pointers a narrow column and no surface of
          their own; across the full width they are three equal targets. */}
      {latest && pitch && (
        <section
          className="mb-6 rounded-xl border border-lilac-200 bg-lilac-50"
          style={{ padding: SPACE.x5 }}
        >
          <div className="flex items-center gap-6">
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[.1em] text-ink-600">
                Latest release
              </p>
              <h2 className="mb-2 text-22 font-bold leading-tight tracking-[-0.01em] text-ink-900">
                {latest.month} Release
              </h2>
              {/* 720px, up from 520. A measure exists so the eye does not lose
                  its place returning across many lines of prose, and a
                  one-sentence lede has no return sweep to protect - the old cap
                  was splitting it into two short lines inside a column two to
                  four times as wide.

                  Raised rather than removed: every written headline measures
                  under 600px so this never binds one, but releasePitch also
                  derives a headline from counts and module names when a release
                  has no written pitch, and nothing bounds that one's length.
                  Uncapped it would run the full 1015px column, which is a real
                  measure violation at ~155 characters a line. */}
              <p className="mb-4 max-w-[720px] text-sm text-ink-700">{pitch.headline}</p>
              <Button
                onClick={() =>
                  navigate(`/release-hub/releases?month=${encodeURIComponent(latest.month)}`)
                }
              >
                Explore what&apos;s new <ArrowRight size={16} />
              </Button>
            </div>

            {/* 240x150 is the asset's own 1586/992, for the same reason. */}
            <ReleaseGiftArt className="hidden h-[150px] w-[240px] shrink-0 min-[1181px]:block" />
          </div>

          {/* 1 / 2 / 4 columns. The row holds four cards now - the announced
              features of the release, however many that is - and a 3-column
              grid left the fourth stranded on its own line. Two-up is balanced
              at every mid width, four-up only once there is room for it.

              Guarded, because the count is editorial now: a release with every
              feature un-flagged has no highlights, and an empty grid would
              still add its top margin to the band. */}
          {pitch.highlights.length > 0 && (
          <div className="mt-5 grid grid-cols-1 items-stretch gap-4 min-[601px]:grid-cols-2 min-[1281px]:grid-cols-4">
            {pitch.highlights.map((h) => {
              const { icon, tint } = PITCH_ICON[h.icon];
              return (
                <PitchCard
                  key={h.title}
                  icon={icon}
                  tint={tint}
                  title={h.title}
                  sub={h.sub}
                  onOpen={
                    visibleIds.has(h.featureId)
                      ? () => navigate(`/release-hub/features/${h.featureId}`)
                      : undefined
                  }
                />
              );
            })}
          </div>
          )}
        </section>
      )}

      {/* ---- Quick links ------------------------------------------------
          Tertiary, and labelled as such: an eyebrow rather than a 22px
          heading with a sentence under it. These are shortcuts at the foot of
          the page, not a third section competing with the release. */}
      <h2 style={{ margin: `0 0 ${SPACE.x3}px`, ...TYPE.eyebrow }}>Quick links</h2>

      <div className="grid grid-cols-1 gap-3 min-[601px]:grid-cols-3">
        {QUICK_LINKS.map(({ icon: Icon, tint, title, sub, path }) => (
          /* 12px on every side, and both lines truncate rather than wrap - a
             quick link that grows to three lines stops being quick. */
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className="group flex items-center gap-3 rounded-lg border border-ink-150 bg-white p-3 text-left transition-colors hover:border-brand-border hover:bg-brand-soft"
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
