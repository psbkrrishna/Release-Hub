import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LATEST_RELEASE } from '@/data/features';
import { useFeatureStore } from '@/components/FeatureStore';

/* ---------------------------------------------------------------------------
   Two surfaces, one source. On a first visit the release arrives as a popup
   the reader can't miss; after that it lives in the top bar as a floater they
   open on their own terms. The button keeps its pulse until they open the
   floater at least once, so the handoff between the two is guided.
   --------------------------------------------------------------------------- */

const SEEN_KEY = 'wnSpotSeen';
const OPENED_KEY = 'wnOpened';

const WhatsNewButton = () => {
  const navigate = useNavigate();
  const { features, resetDemo } = useFeatureStore();
  const [floaterOpen, setFloaterOpen] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [pulse, setPulse] = useState(() => localStorage.getItem(OPENED_KEY) !== '1');

  // Always published only: What's New is customer-facing news whoever is
  // signed in, so a draft has no business appearing in it.
  const latest = features.filter((f) => f.published && f.releaseMonth === LATEST_RELEASE).slice(0, 4);

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY) === '1') return;
    const t = window.setTimeout(() => setPopupOpen(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  const closePopup = useCallback(() => {
    setPopupOpen(false);
    localStorage.setItem(SEEN_KEY, '1');
  }, []);

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

  // Click-away and Escape both close the floater.
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

  useEffect(() => {
    if (!popupOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePopup();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [popupOpen, closePopup]);

  const goToFeature = (id: string) => {
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
      <button className={`whatsnew${pulse ? ' pulse' : ''}`} onClick={toggleFloater}>
        <i className="ph ph-sparkle" />
        What's New
      </button>

      <div
        className={`wn-pop${floaterOpen ? ' open' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="What's new"
      >
        <div className="wn-head">
          <div>
            <div className="t">
              <i className="ph ph-sparkle" />
              {LATEST_RELEASE} Release
            </div>
            <p>Two new features and two enhancements are live.</p>
          </div>
          <button className="icon-btn x" onClick={closeFloater} aria-label="Close What's New">
            <i className="ph ph-x" />
          </button>
        </div>
        <div className="wn-list">
          {latest.map((f) => (
            <button key={f.id} className="wn-item" onClick={() => goToFeature(f.id)}>
              <span>
                <span className="tt">{f.title}</span>
                <span className="ss">{f.productModule}</span>
              </span>
              <i className="ph ph-caret-right go" />
            </button>
          ))}
        </div>
        <div className="wn-foot">
          <button className="reset" onClick={handleReset}>
            <i className="ph ph-clock-counter-clockwise" />
            Reset demo
          </button>
          <button className="lnk" onClick={goToRelease}>
            View release <i className="ph ph-caret-right" />
          </button>
        </div>
      </div>

      {/* Release news is indigo everywhere in this app, so its popup is too.
          Product feature spotlights stay brand blue. */}
      <div
        className={`spot-overlay${popupOpen ? ' open' : ''}`}
        onClick={(e) => e.target === e.currentTarget && closePopup()}
      >
        <div className="spot-card rel">
          <div className="spot-hero">
            <button className="spot-close" onClick={closePopup} aria-label="Close">
              <i className="ph ph-x" />
            </button>
            <div className="spot-icon">
              <i className="ph ph-sparkle" />
            </div>
            <span className="spot-tag">{LATEST_RELEASE} release</span>
            <h3>Four new ways to move work forward</h3>
            <p>Two new features and two enhancements are live. Open any one to see what changed.</p>
          </div>
          <div className="spot-body">
            <div className="wn-list flat">
              {latest.map((f) => (
                <button key={f.id} className="wn-item" onClick={() => goToFeature(f.id)}>
                  <span>
                    <span className="tt">{f.title}</span>
                    <span className="ss">
                      {f.productModule} · {f.featureTag}
                    </span>
                  </span>
                  <i className="ph ph-caret-right go" />
                </button>
              ))}
            </div>
            <button className="spot-cta" onClick={goToRelease}>
              View the full release <i className="ph ph-arrow-right" />
            </button>
            <button className="spot-dismiss" onClick={closePopup}>
              Got it - find this under What's New
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default WhatsNewButton;
