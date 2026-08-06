import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERF } from '@/data/performance';

const initialPriorities = [
  { title: 'Approve 3 offer letters', sub: 'Recruiting', done: true },
  { title: 'Review payroll variance', sub: 'Payroll', done: false },
  { title: 'Complete manager calibration', sub: 'Performance', done: false },
  { title: 'Publish onboarding checklist', sub: 'Employee Experience', done: false },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState(initialPriorities);

  const toggle = (i: number) =>
    setPriorities((list) => list.map((t, idx) => (idx === i ? { ...t, done: !t.done } : t)));

  return (
    <>
      <nav className="crumb"><b>Dashboard</b></nav>

      <div className="page-head">
        <div className="dash-head">
          <div className="dash-date">Wednesday, July 22</div>
          <h1>Good afternoon, Ananya</h1>
          <p className="lede">Here's what's happening across your organization.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/performance-reviews')}>
            Open performance reviews
          </button>
        </div>
      </div>

      <div className="dash-stats">
        <div className="stat-card">
          <div>
            <div className="stat-label">Open positions</div>
            <div className="stat-value tnum">24</div>
            <div className="stat-sub">6 closing this month</div>
          </div>
          <div className="dstat-icon t-blue"><i className="ph ph-briefcase" /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Active candidates</div>
            <div className="stat-value tnum">186</div>
            <div className="stat-sub">18 added this week</div>
          </div>
          <div className="dstat-icon t-indigo"><i className="ph ph-users-three" /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Reviews in progress</div>
            <div className="stat-value tnum">{PERF.completion}%</div>
            <div className="stat-sub">{PERF.submitted} of {PERF.people} completed</div>
          </div>
          <div className="dstat-icon t-green"><i className="ph ph-calendar-blank" /></div>
        </div>
        <div className="stat-card">
          <div>
            <div className="stat-label">Tasks due</div>
            <div className="stat-value tnum">7</div>
            <div className="stat-sub">2 need attention today</div>
          </div>
          <div className="dstat-icon t-amber"><i className="ph ph-clock-counter-clockwise" /></div>
        </div>
      </div>

      <div className="main-grid">
        <div className="panel">
          <div className="cycle-head">
            <div>
              <h2>Performance review cycle</h2>
              <div className="sub">Mid-year review · July 1–31</div>
            </div>
            <span className="pill-ontrack">On track</span>
          </div>
          <div className="cycle-progress-row">
            <span>{PERF.submitted} of {PERF.people} reviews complete</span>
            <span className="pct tnum">{PERF.completion}%</span>
          </div>
          <div className="cycle-track"><div className="cycle-fill" style={{ width: `${PERF.completion}%` }} /></div>
          <div className="cycle-mini-row">
            <div className="cycle-mini"><div className="l">Self reviews</div><div className="v tnum">{PERF.self[0]} / {PERF.self[1]}</div></div>
            <div className="cycle-mini"><div className="l">Manager reviews</div><div className="v tnum">{PERF.manager[0]} / {PERF.manager[1]}</div></div>
            <div className="cycle-mini"><div className="l">Calibrations</div><div className="v tnum">{PERF.calib[0]} / {PERF.calib[1]}</div></div>
          </div>
          <a className="cycle-link" href="/performance-reviews" onClick={(e) => { e.preventDefault(); navigate('/performance-reviews'); }}>
            View performance reviews <i className="ph ph-arrow-right" />
          </a>
        </div>

        <div className="panel pri-panel">
          <h2>Today's priorities</h2>
          {priorities.map((t, i) => (
            <button key={t.title} className={`todo-item${t.done ? ' done' : ''}`} onClick={() => toggle(i)}>
              <span className="todo-check"><i className="ph ph-check" /></span>
              <span className="todo-text">
                <span className="todo-title">{t.title}</span>
                <span className="todo-sub">{t.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
