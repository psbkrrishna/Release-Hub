import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogPanel, DialogBackdrop } from "@headlessui/react";
import { PiSparkle, PiX, PiCaretRight, PiClockCounterClockwise, PiArrowRight } from "react-icons/pi";
import { LATEST_RELEASE } from "@/data/features";
import { useFeatureStore } from "@/components/FeatureStore";

/* ---------------------------------------------------------------------------
   Two surfaces, one source. On a first visit the release arrives as a popup
   the reader can't miss; after that it lives in the top bar as a floater they
   open on their own terms. The button keeps its pulse (production's own
   fade-scale keyframe, from tailwind.config.js) until they open the floater
   at least once, so the handoff between the two is guided.
   --------------------------------------------------------------------------- */

const SEEN_KEY = "wnSpotSeen";
const OPENED_KEY = "wnOpened";

const WnListItem = ({ feature, sub, onSelect }) => (
  <button onClick={onSelect} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-gray-50">
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-grey-500 truncate">{feature.title}</span>
      <span className="block text-xs text-grey-300 truncate">{sub}</span>
    </span>
    <PiCaretRight className="ml-auto flex-shrink-0 text-grey-100" size={16} />
  </button>
);

const WhatsNewButton = () => {
  const navigate = useNavigate();
  const { features, resetDemo } = useFeatureStore();
  const [floaterOpen, setFloaterOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [pulse, setPulse] = useState(() => localStorage.getItem(OPENED_KEY) !== "1");

  // Always published only: What's New is customer-facing news whoever is
  // signed in, so a draft has no business appearing in it.
  const latest = features.filter((f) => f.published && f.releaseMonth === LATEST_RELEASE).slice(0, 4);

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY) === "1") return;
    const t = window.setTimeout(() => setPopupOpen(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  const closePopup = useCallback(() => {
    setPopupOpen(false);
    localStorage.setItem(SEEN_KEY, "1");
  }, []);

  const closeFloater = useCallback(() => setFloaterOpen(false), []);

  const toggleFloater = (e) => {
    e.stopPropagation();
    setFloaterOpen((open) => {
      if (!open) {
        localStorage.setItem(OPENED_KEY, "1");
        setPulse(false);
      }
      return !open;
    });
  };

  // Click-away closes the floater (Escape is handled by Headless UI for the popup).
  useEffect(() => {
    if (!floaterOpen) return;
    const onClick = () => closeFloater();
    const onKey = (e) => e.key === "Escape" && closeFloater();
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [floaterOpen, closeFloater]);

  const goToFeature = (id) => {
    closeFloater();
    closePopup();
    navigate(`/release-hub/features/${id}`);
  };

  const goToRelease = () => {
    closeFloater();
    closePopup();
    navigate(`/release-hub?month=${encodeURIComponent(LATEST_RELEASE)}`);
  };

  const handleReset = () => {
    localStorage.removeItem("annDismissed");
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(OPENED_KEY);
    sessionStorage.removeItem("perfSpotSeen");
    setPulse(true);
    closeFloater();
    resetDemo();
    // Reset means reset: the banner, the popup and the pulse all come back.
    window.setTimeout(() => window.location.reload(), 600);
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={toggleFloater}
          className={`h-9 flex items-center gap-1.5 rounded-lg border px-3 text-sm font-medium text-white transition-colors ${
            pulse ? "border-white/60 bg-white/20" : "border-white/30 bg-white/10 hover:bg-white/20"
          }`}
        >
          <PiSparkle className={pulse ? "animate-fade-scale" : ""} size={16} />
          What's New
        </button>

        {floaterOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="What's new"
            className="absolute right-0 top-[calc(100%+8px)] z-[60] w-[380px] rounded-lg border border-gray-200 border-t-[3px] border-t-[#BC3AD2] bg-white shadow-xl overflow-hidden"
          >
            <div className="flex items-start gap-2 bg-[#FCEBFF] px-4 py-3 border-b border-gray-200">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-base font-semibold text-[#3A0143]">
                  <PiSparkle size={16} /> {LATEST_RELEASE} Release
                </div>
                <p className="text-xs text-grey-400 mt-0.5">Two new features and two enhancements are live.</p>
              </div>
              <button onClick={closeFloater} aria-label="Close What's New" className="ml-auto p-1 rounded text-grey-300 hover:bg-black/5 flex-shrink-0">
                <PiX size={16} />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-1.5">
              {latest.map((f) => (
                <WnListItem key={f.id} feature={f} sub={f.productModule} onSelect={() => goToFeature(f.id)} />
              ))}
            </div>
            <div className="flex items-center gap-3 border-t border-gray-200 bg-gray-50 px-4 py-2.5">
              <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-grey-300 hover:text-grey-500">
                <PiClockCounterClockwise size={14} /> Reset demo
              </button>
              <button onClick={goToRelease} className="ml-auto flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
                View release <PiCaretRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Release news is purple everywhere in this app, so its popup is too.
          Product feature spotlights (Performance Reviews) stay brand blue.
          data-release-popup lets that page's own spotlight defer to this one
          rather than stacking two announcements at once.

          Mounted only while popupOpen is true, so React's own reconciliation
          controls presence rather than Headless UI's internal open/closed
          state machine. Tried the documented "pass `open` to Dialog and let
          it manage its own transition" pattern first (with TransitionChild
          for the backdrop/panel animation): confirmed by direct testing that
          it leaves data-headlessui-state stuck on "open" and the dialog
          never unmounts once closed, at least at this installed version -
          this sidesteps that bug entirely, at the cost of the close losing
          its fade-out (it still fades in on open). */}
      {popupOpen && (
        <Dialog open onClose={closePopup} className="relative z-50" data-release-popup>
          <DialogBackdrop className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-[520px] rounded-lg bg-white shadow-xl overflow-hidden">
              {/* #A32EB8, not the decorative #BC3AD2 used on the chip/dot/
                  floater edge: this fill carries white body text at 14px,
                  which needs 4.5:1 - #BC3AD2 measures 3.75:1 and fails,
                  #A32EB8 measures 4.81:1. */}
              <div className="relative bg-[#A32EB8] px-6 pt-6 pb-5 text-white">
                <button onClick={closePopup} aria-label="Close" className="absolute top-3 right-3 h-9 w-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center">
                  <PiX size={18} />
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 mb-3">
                  <PiSparkle size={20} />
                </div>
                <span className="inline-block text-xs font-semibold uppercase tracking-wide bg-white/20 rounded-full px-2.5 py-1 mb-2">{LATEST_RELEASE} release</span>
                <h3 className="text-xl font-bold mb-1.5">Four new ways to move work forward</h3>
                <p className="text-sm text-white/90">Two new features and two enhancements are live. Open any one to see what changed.</p>
              </div>
              <div className="p-4">
                <div className="flex flex-col mb-4">
                  {latest.map((f) => (
                    <WnListItem key={f.id} feature={f} sub={`${f.productModule} · ${f.featureTag}`} onSelect={() => goToFeature(f.id)} />
                  ))}
                </div>
                <div className="px-2">
                  <button
                    onClick={goToRelease}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-[#A32EB8] text-white text-sm font-semibold hover:bg-[#3A0143]"
                  >
                    View the full release <PiArrowRight size={16} />
                  </button>
                  <button onClick={closePopup} className="w-full text-center mt-2.5 text-sm text-grey-300 hover:text-grey-500 py-1">
                    Got it - find this under What's New
                  </button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </>
  );
};

export default WhatsNewButton;
