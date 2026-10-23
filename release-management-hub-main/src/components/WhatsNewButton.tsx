import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ChevronRight, History, Video, ArrowUpRight } from 'lucide-react';
import Spotlight from '@/components/primitives/Spotlight';
import IconButton from '@/components/primitives/IconButton';
import { announcedIn } from '@/data/features';
import { formatWebinarWhen, webinarCountdown } from '@/data/releases';
import { useLatestRelease, useUpcomingWebinar } from '@/components/ReleaseStore';
import { announceHeadline, announceSummary } from '@/data/knowledge';
import { useFeatureStore } from '@/components/FeatureStore';
import type { Feature } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   Two surfaces, one source. On a first visit the release arrives as a popup
   the reader can't miss; after that it lives in the top bar as a floater they
   open on their own terms. The button keeps its pulse until they open the
   floater at least once, so the handoff between the two is guided.
   --------------------------------------------------------------------------- */

const SEEN_KEY = 'wnSpotSeen';
const OPENED_KEY = 'wnOpened';

/* One release item. `flat` is the variant used inside the first-run popup,
   where the rows are separated by rules rather than sitting as loose cards. */
const ReleaseItem = ({
  feature,
  flat = false,
  onSelect,
}: {
  feature: Feature;
  flat?: boolean;
  onSelect: () => void;
}) => (
  <button
    onClick={onSelect}
    className={[
      'flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-ink-50',
      flat ? 'rounded-none border-b border-ink-150 last:border-b-0' : 'rounded-md',
    ].join(' ')}
  >
    <span>
      {/* Title over subtitle - these were inline once, so the two ran together
          on a single line and the subtitle's offset had nothing to act on. */}
      <span className="block text-sm font-semibold text-ink-900">{feature.title}</span>
      <span className="mt-px block text-xs text-ink-500">
        {flat ? `${feature.productModule} · ${feature.featureTag}` : feature.productModule}
      </span>
    </span>
    <ChevronRight size={14} className="ml-auto shrink-0 text-ink-500" />
  </button>
);

/* The webinar as an offer: a solid card, the same blue as the band in the hub,
   so it reads as one campaign wherever it turns up. Title, when, how soon, and
   a register button that is a real button rather than a link-coloured word. It
   opens in a new tab, so the popup and floater stay put for a reader who comes
   back. */
const WebinarOffer = ({
  webinar,
  onOpen,
  flat = false,
}: {
  webinar: { title: string; url: string; startsAt: string };
  onOpen: () => void;
  flat?: boolean;
}) => (
  <div
    className={[
      'flex items-center gap-3 bg-brand p-3 text-white',
      flat ? 'mb-4 rounded-lg' : 'm-2 rounded-md',
    ].join(' ')}
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[.16]">
      <Video size={18} />
    </span>
    <span className="min-w-0">
      <span className="block text-[11px] font-bold uppercase tracking-[.08em] opacity-85">
        Live webinar
      </span>
      <span className="block truncate text-sm font-semibold">{webinar.title}</span>
      <span className="block text-xs tabular-nums">
        {formatWebinarWhen(webinar.startsAt)} · <b>{webinarCountdown(webinar.startsAt)}</b>
      </span>
    </span>
    <a
      href={webinar.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen}
      className="ml-auto inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-white px-4 text-sm font-semibold text-brand no-underline transition-colors hover:bg-brand-soft"
    >
      Register now <ArrowUpRight size={14} />
    </a>
  </div>
);

const WhatsNewButton = () => {
  const navigate = useNavigate();
  const { features, resetDemo } = useFeatureStore();
  const [floaterOpen, setFloaterOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [pulse, setPulse] = useState(() => localStorage.getItem(OPENED_KEY) !== '1');

  /* Published only, and announced only: What's New is customer-facing news
     whoever is signed in, so a draft has no business appearing in it, and nor
     does a released feature the creator did not flag as news. Both rules live
     in announcedIn, which the Overview's release band reads too - so the two
     surfaces cannot disagree about what shipped. */
  const releaseMonth = useLatestRelease();
  const latest = announcedIn(features, releaseMonth);
  const webinar = useUpcomingWebinar(releaseMonth);

  /* The key holds the month whose popup was seen, so each new release - and its
     webinar - gets its own first-run popup instead of staying silent behind a
     flag set months ago. */
  useEffect(() => {
    if (!releaseMonth || localStorage.getItem(SEEN_KEY) === releaseMonth) return;
    const t = window.setTimeout(() => setPopupOpen(true), 600);
    return () => window.clearTimeout(t);
  }, [releaseMonth]);

  const closePopup = useCallback(() => {
    setPopupOpen(false);
    if (releaseMonth) localStorage.setItem(SEEN_KEY, releaseMonth);
  }, [releaseMonth]);

  const closeFloater = useCallback(() => setFloaterOpen(false), []);

  const toggleFloater = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFloaterOpen((open) => {
      if (!open) {
        localStorage.setItem(OPENED_KEY, '1');
        setPulse(false);
      }
      return !open;
    });
  };

  // Click-away and Escape both close the floater. The popup gets both from
  // Modal, so it needs no listener of its own.
  useEffect(() => {
    if (!floaterOpen) return;
    const onClick = () => closeFloater();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeFloater();
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [floaterOpen, closeFloater]);

  const goToFeature = (id: string) => {
    closeFloater();
    closePopup();
    navigate(`/product-hub/features/${id}`);
  };

  const goToRelease = () => {
    closeFloater();
    closePopup();
    navigate(`/product-hub/releases?month=${encodeURIComponent(releaseMonth)}`);
  };

  const handleReset = () => {
    localStorage.removeItem('annDismissed');
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(OPENED_KEY);
    sessionStorage.removeItem('perfSpotSeen');
    setPulse(true);
    closeFloater();
    resetDemo();
    // Reset means reset: the banner, the popup and the pulse all come back.
    window.setTimeout(() => window.location.reload(), 600);
  };

  return (
    <>
      {/* Unseen release news: the button carries a ring pulse until the reader
          opens the panel once, then settles to the quiet default. The pulse is
          an attention cue, not information, so with reduced motion the
          brighter resting state carries the same signal without moving.

          A solid purple-500 fill made this pop, but two saturated colours -
          that magenta and the brand blue behind it - sitting flush against
          each other read as loud rather than inviting. Solid white plus
          purple text and icon keeps the same amount of contrast against the
          bar (white is the strongest possible lift off brand blue) while
          losing the colour clash, and the purple label still carries the
          release-news identity used everywhere else in the app. */}
      <button
        onClick={toggleFloater}
        className={[
          'inline-flex h-8 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-purple-600 transition-colors',
          pulse
            ? 'animate-wn-pulse motion-reduce:animate-none motion-reduce:shadow-[0_0_0_2px_rgba(255,255,255,.5)]'
            : 'hover:bg-purple-50',
        ].join(' ')}
      >
        <Sparkles size={16} className={pulse ? 'animate-wn-nudge motion-reduce:animate-none' : ''} />
        What's New
      </button>

      {/* The floater. Deliberately heavier than any card - it sits above the
          canvas rather than in it - with the purple top edge this system uses
          for anything new. */}
      {floaterOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="What's new"
          className="fixed right-4 top-[calc(theme(spacing.topbar)+8px)] z-floater w-[min(380px,calc(100vw-64px))] animate-wn-in overflow-hidden rounded-lg border border-ink-200 border-t-[3px] border-t-purple-500 bg-white shadow-floater"
        >
          <div className="flex items-start gap-3 border-b border-ink-150 bg-purple-50 p-4">
            <div>
              <div className="flex items-center gap-2 text-base font-semibold text-purple-900">
                <Sparkles size={16} />
                {releaseMonth} Release
              </div>
              <p className="mt-0.5 text-13 text-ink-600">
                {announceSummary(latest)} are live.
              </p>
            </div>
            <IconButton
              onClick={closeFloater}
              title="Close What's New"
              aria-label="Close What's New"
              className="ml-auto text-ink-500 hover:!bg-[rgba(188,58,210,.10)] hover:!text-purple-900"
            >
              <X size={16} />
            </IconButton>
          </div>

          <div className="max-h-[280px] overflow-y-auto p-2">
            {latest.map((f) => (
              <ReleaseItem key={f.id} feature={f} onSelect={() => goToFeature(f.id)} />
            ))}
          </div>

          {webinar && (
            <div className="border-t border-ink-150">
              <WebinarOffer webinar={webinar} onOpen={closeFloater} />
            </div>
          )}

          <div className="flex items-center gap-3 border-t border-ink-150 bg-ink-50 px-4 py-3">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded text-13 text-ink-500 transition-colors hover:text-ink-900"
            >
              <History size={14} />
              Reset demo
            </button>
            <button
              onClick={goToRelease}
              className="ml-auto inline-flex items-center gap-2 rounded text-13 font-semibold text-brand hover:underline"
            >
              View release <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Release news is purple everywhere in this app, so its popup is too.
          Product feature spotlights stay brand blue. */}
      <Spotlight
        open={popupOpen}
        onClose={closePopup}
        tone="news"
        isRelease
        tag={`${releaseMonth} release`}
        title={announceHeadline(latest)}
        intro={`${announceSummary(latest)} are live. Open any one to see what changed.`}
        icon={<Sparkles size={20} />}
        ctaLabel="View the full release"
        onCta={goToRelease}
        dismissLabel="Got it - find this under What's New"
        extra={webinar && <WebinarOffer flat webinar={webinar} onOpen={closePopup} />}
      >
        <div className="mb-5">
          {latest.map((f) => (
            <ReleaseItem key={f.id} feature={f} flat onSelect={() => goToFeature(f.id)} />
          ))}
        </div>
      </Spotlight>
    </>
  );
};

export default WhatsNewButton;
