import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PiBriefcase, PiUsersThree, PiCalendarBlank, PiClockCounterClockwise, PiArrowRight, PiCheck } from "react-icons/pi";
import Button from "@/components/ui/Button";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { PERF } from "@/data/performance";

const initialPriorities = [
  { title: "Approve 3 offer letters", sub: "Recruiting", done: true },
  { title: "Review payroll variance", sub: "Payroll", done: false },
  { title: "Complete manager calibration", sub: "Performance", done: false },
  { title: "Publish onboarding checklist", sub: "Employee Experience", done: false },
];

const StatCard = ({ label, value, sub, icon: Icon, tint }) => (
  <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-card">
    <div>
      <div className="text-sm text-grey-300">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-grey-500">{value}</div>
      <div className="mt-1 text-xs text-grey-100">{sub}</div>
    </div>
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${tint.bg} ${tint.text}`}>
      <Icon size={20} />
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [priorities, setPriorities] = useState(initialPriorities);

  const toggle = (i) => setPriorities((list) => list.map((t, idx) => (idx === i ? { ...t, done: !t.done } : t)));

  return (
    <div className="p-6">
      <PageBreadcrumb items={[{ label: "Dashboard" }]} />

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-blue-600">Wednesday, July 22</div>
          <h1 className="mt-1 text-xl font-semibold text-grey-500">Good afternoon, Ananya</h1>
          <p className="mt-1 text-sm text-grey-300">Here's what's happening across your organization.</p>
        </div>
        <Button variant="primary" onClick={() => navigate("/performance-reviews")}>
          Open performance reviews
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Open positions" value="24" sub="6 closing this month" icon={PiBriefcase} tint={{ bg: "bg-[#E7EEF6]", text: "text-[#0D59A3]" }} />
        <StatCard label="Active candidates" value="186" sub="18 added this week" icon={PiUsersThree} tint={{ bg: "bg-[#E7F7FB]", text: "text-[#0B7B96]" }} />
        <StatCard label="Reviews in progress" value={`${PERF.completion}%`} sub={`${PERF.submitted} of ${PERF.people} completed`} icon={PiCalendarBlank} tint={{ bg: "bg-[#EBF4EC]", text: "text-[#1F4E21]" }} />
        <StatCard label="Tasks due" value="7" sub="2 need attention today" icon={PiClockCounterClockwise} tint={{ bg: "bg-[#FBF6E8]", text: "text-[#99770F]" }} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr] items-start">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-base font-semibold text-grey-500">Performance review cycle</h2>
              <div className="text-sm text-grey-300 mt-0.5">Mid-year review · July 1–31</div>
            </div>
            <span className="inline-flex items-center rounded-lg bg-[#EBF4EC] px-2 py-1 text-xs font-medium text-[#1F4E21] whitespace-nowrap">On track</span>
          </div>
          <div className="flex items-baseline justify-between text-sm mb-1.5">
            <span className="text-grey-400">{PERF.submitted} of {PERF.people} reviews complete</span>
            <span className="font-semibold text-grey-500 tabular-nums">{PERF.completion}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-4">
            <div className="h-full rounded-full bg-blue-600" style={{ width: `${PERF.completion}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              ["Self reviews", PERF.self],
              ["Manager reviews", PERF.manager],
              ["Calibrations", PERF.calib],
            ].map(([label, [a, b]]) => (
              <div key={label} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="text-xs text-grey-300">{label}</div>
                <div className="text-base font-semibold text-grey-500 tabular-nums">{a} / {b}</div>
              </div>
            ))}
          </div>
          <a
            href="/performance-reviews"
            onClick={(e) => { e.preventDefault(); navigate("/performance-reviews"); }}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline rounded"
          >
            View performance reviews <PiArrowRight />
          </a>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold text-grey-500 mb-3">Today's priorities</h2>
          <div className="flex flex-col">
            {priorities.map((t, i) => (
              <button
                key={t.title}
                onClick={() => toggle(i)}
                className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-b-0 text-left w-full"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    t.done ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 text-transparent"
                  }`}
                >
                  <PiCheck size={12} />
                </span>
                <span className="flex flex-col">
                  <span className={`text-sm font-semibold ${t.done ? "text-grey-300 line-through" : "text-grey-500"}`}>{t.title}</span>
                  <span className="text-xs text-grey-300">{t.sub}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
