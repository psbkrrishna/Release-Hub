import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERF, PERF_DEPTS as DEPTS } from '@/data/performance';
import { LATEST_RELEASE } from '@/data/features';

const SPOT_KEY = 'perfSpotSeen';

const PerformanceReviews = () => {
  const navigate = useNavigate();
  const [spotOpen, setSpotOpen] = useState(false);

  // The spotlight fires the first time this session that the page is opened.
  // If the release popup is still up it waits for the next visit rather than
  // stacking two announcements on top of each other.
  useEffect(() => {
    if (sessionStorage.getItem(SPOT_KEY) === '1') return;
    const releasePopupOpen = document.querySelector('.spot-card.rel')?.closest('.spot-overlay')?.classList.contains('open');
    if (releasePopupOpen) return;
    const t = window.setTimeout(() => {
      setSpotOpen(true);
      sessionStorage.setItem(SPOT_KEY, '1');
    }, 500);
    return () => window.clearTimeout(t);
  }, []);

  const close = useCallback(() => setSpotOpen(false), []);

  useEffect(() => {
    if (!spotOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [spotOpen, close]);

  return (
    <>
      <nav className="crumb">
        <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Dashboard</a>
        <i className="ph ph-caret-right" />
        <b>Performance Reviews</b>
      </nav>

      <div className="page-head">
        <div>
          <h1>Performance reviews</h1>
          <p className="lede">Track progress, understand themes, and support better manager conversations.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost">Export</button>
          <button className="btn btn-primary">Review settings</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div>
            <div className="stat-label">Completion</div>
            <div className="stat-value tnum">{PERF.completion}%</div>
            <div className="stat-sub up">+12% this week</div>
          </div>
          <div className="stat-icon2"><i className="ph ph-trend-up" /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Reviews submitted</div>
            <div className="stat-value tnum">{PERF.submitted}</div>
            <div className="stat-sub">{PERF.remaining} remaining</div>
          </div>
          <div className="stat-icon2"><i className="ph ph-check-circle" /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">People in cycle</div>
            <div className="stat-value tnum">{PERF.people}</div>
            <div className="stat-sub">{PERF.depts} departments</div>
          </div>
          <div className="stat-icon2"><i className="ph ph-users-three" /></div>
        </div>
      </div>

      <div className="main-grid">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Team review progress</h2>
              <p className="panel-sub">Completion by department</p>
            </div>
            <button className="icon-btn" title="More options"><i className="ph ph-dots-three-vertical" /></button>
          </div>
          {DEPTS.map(([name, done, total]) => (
            <div className="dept" key={name}>
              <div className="dept-row">
                <span className="dept-name">{name}</span>
                <span className="dept-ct tnum">{done} of {total}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.round((100 * done) / total)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="ai-panel">
          <div className="panel ai-card" onClick={() => setSpotOpen(true)}>
            <div className="ai-head">
              <div className="ai-icon"><i className="ph ph-sparkle" /></div>
              <div>
                <div className="ai-title">
                  AI Review Insights
                  {/* The badge is the control that reopens the announcement,
                      so it's a real button, not decoration on a heading. */}
                  <button
                    className="new-badge"
                    title="What's new in AI Review Insights"
                    onClick={(e) => { e.stopPropagation(); setSpotOpen(true); }}
                  >
                    <i className="ph ph-sparkle" />New
                  </button>
                </div>
                <div className="ai-sub">Themes from submitted reviews</div>
              </div>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-ovl">Strongest theme</div>
            <div className="insight-val">Cross-team collaboration</div>
            <div className="insight-sub">Mentioned in 31 reviews</div>
          </div>
          <div className="insight-card">
            <div className="insight-ovl">Growth opportunity</div>
            <div className="insight-val">Delegation and coaching</div>
            <div className="insight-sub">Mentioned in 18 reviews</div>
          </div>
          <div className="insight-card">
            <div className="insight-ovl">Sentiment</div>
            <div className="insight-val">84% positive</div>
            <div className="insight-sub">Up 6 points from last cycle</div>
          </div>
          <button className="btn btn-ghost btn-full">View full analysis <i className="ph ph-chart-bar" /></button>
        </div>
      </div>

      <div className={`spot-overlay${spotOpen ? ' open' : ''}`} onClick={(e) => e.target === e.currentTarget && close()}>
        <div className="spot-card">
          <div className="spot-hero">
            <button className="spot-close" onClick={close} aria-label="Close"><i className="ph ph-x" /></button>
            <div className="spot-icon"><i className="ph ph-sparkle" /></div>
            <span className="spot-tag">New feature</span>
            <h3>New: AI Review Insights</h3>
            <p>Turn review responses into clear patterns and practical coaching recommendations.</p>
          </div>
          <div className="spot-body">
            <div className="spot-bullets">
              <div className="spot-bullet"><i className="ph ph-check-circle" /><span>Surface review themes automatically</span></div>
              <div className="spot-bullet"><i className="ph ph-check-circle" /><span>Generate practical coaching recommendations</span></div>
              <div className="spot-bullet"><i className="ph ph-check-circle" /><span>Reduce manual analysis time by up to 75%</span></div>
            </div>
            <button className="spot-cta" onClick={() => { close(); navigate(`/release-hub?month=${encodeURIComponent(LATEST_RELEASE)}`); }}>
              See what's new <i className="ph ph-arrow-right" />
            </button>
            <button className="spot-dismiss" onClick={close}>Got it, close tour</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PerformanceReviews;
