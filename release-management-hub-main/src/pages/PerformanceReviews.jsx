import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogPanel, DialogBackdrop } from "@headlessui/react";
import { PiTrendUp, PiCheckCircle, PiUsersThree, PiDotsThreeVertical, PiSparkle, PiChartBar, PiX, PiArrowRight } from "react-icons/pi";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { PERF, PERF_DEPTS as DEPTS } from "@/data/performance";
import { LATEST_RELEASE } from "@/data/features";

const SPOT_KEY = "perfSpotSeen";

const StatTile = ({ label, value, sub, subClassName = "text-grey-300", icon: Icon }) => (
  <div className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-card">
    <div>
      <div className="text-sm text-grey-300">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-grey-500">{value}</div>
      <div className={`mt-1 text-xs ${subClassName}`}>{sub}</div>
    </div>
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#E7EEF6] text-[#0D59A3]">
      <Icon size={20} />
    </div>
  </div>
);

const PerformanceReviews = () => {
  const navigate = useNavigate();
  const [spotOpen, setSpotOpen] = useState(false);

  // The spotlight fires the first time this session that the page is opened.
  // If the release popup is still up it waits for the next visit rather than
  // stacking two announcements on top of each other.
  useEffect(() => {
    if (sessionStorage.getItem(SPOT_KEY) === "1") return;
    // Transition unmounts the release popup's Dialog once it's fully closed,
    // so mere presence in the DOM means it's open or still animating in.
    const releasePopupOpen = !!document.querySelector("[data-release-popup]");
    if (releasePopupOpen) return;
    const t = window.setTimeout(() => {
      setSpotOpen(true);
      sessionStorage.setItem(SPOT_KEY, "1");
    }, 500);
    return () => window.clearTimeout(t);
  }, []);

  const close = useCallback(() => setSpotOpen(false), []);

  return (
    <div className="p-6">
      <PageBreadcrumb items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Performance Reviews" }]} />

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-grey-500">Performance reviews</h1>
          <p className="mt-1 text-sm text-grey-300">Track progress, understand themes, and support better manager conversations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">Export</Button>
          <Button variant="primary">Review settings</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <StatTile label="Completion" value={`${PERF.completion}%`} sub="+12% this week" subClassName="text-[#1F4E21]" icon={PiTrendUp} />
        <StatTile label="Reviews submitted" value={PERF.submitted} sub={`${PERF.remaining} remaining`} icon={PiCheckCircle} />
        <StatTile label="People in cycle" value={PERF.people} sub={`${PERF.depts} departments`} icon={PiUsersThree} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr] items-start">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-card">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-grey-500">Team review progress</h2>
              <p className="text-sm text-grey-300 mt-0.5">Completion by department</p>
            </div>
            <button type="button" title="More options" className="text-grey-300 hover:text-grey-500 p-1 rounded">
              <PiDotsThreeVertical size={18} />
            </button>
          </div>
          {DEPTS.map(([name, done, total]) => (
            <div className="mb-4 last:mb-0" key={name}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm text-grey-500">{name}</span>
                <span className="text-sm text-grey-300 tabular-nums">{done} of {total}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.round((100 * done) / total)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setSpotOpen(true)}
            className="text-left rounded-lg border border-gray-200 bg-white p-4 shadow-card hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#BC3AD2] text-white">
                <PiSparkle size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-base font-semibold text-grey-500">
                  AI Review Insights
                  <span
                    role="button"
                    tabIndex={0}
                    title="What's new in AI Review Insights"
                    onClick={(e) => { e.stopPropagation(); setSpotOpen(true); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setSpotOpen(true); } }}
                  >
                    <Badge variant="purple" className="cursor-pointer"><PiSparkle className="inline mr-1 -mt-0.5" size={11} />New</Badge>
                  </span>
                </div>
                <div className="text-sm text-grey-300">Themes from submitted reviews</div>
              </div>
            </div>
          </button>

          {[
            ["Strongest theme", "Cross-team collaboration", "Mentioned in 31 reviews"],
            ["Growth opportunity", "Delegation and coaching", "Mentioned in 18 reviews"],
            ["Sentiment", "84% positive", "Up 6 points from last cycle"],
          ].map(([overline, value, sub]) => (
            <div key={overline} className="rounded-lg border border-gray-200 bg-white p-4 shadow-card">
              <div className="text-xs font-semibold uppercase tracking-wide text-grey-100">{overline}</div>
              <div className="text-sm font-semibold text-grey-500 mt-1">{value}</div>
              <div className="text-xs text-grey-300 mt-1">{sub}</div>
            </div>
          ))}

          <Button variant="secondary" className="w-full justify-center" icon={<PiChartBar />} iconPosition="right">
            View full analysis
          </Button>
        </div>
      </div>

      {/* Mounted only while spotOpen is true - see WhatsNewButton.jsx for
          why: passing `open` to Dialog and wrapping children in
          TransitionChild (the documented pattern) left Headless UI's own
          state stuck "open" and the dialog never unmounted, confirmed by
          direct testing at this installed version. This sidesteps it, at
          the cost of the close losing its fade-out. */}
      {spotOpen && (
        <Dialog open onClose={close} className="relative z-50">
          <DialogBackdrop className="fixed inset-0 bg-black/50" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-[520px] rounded-lg bg-white shadow-xl overflow-hidden">
              <div className="relative bg-blue-600 px-6 pt-6 pb-5 text-white">
                <button onClick={close} aria-label="Close" className="absolute top-3 right-3 h-9 w-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center">
                  <PiX size={18} />
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 mb-3">
                  <PiSparkle size={20} />
                </div>
                <span className="inline-block text-xs font-semibold uppercase tracking-wide bg-white/20 rounded-full px-2.5 py-1 mb-2">New feature</span>
                <h3 className="text-xl font-bold mb-1.5">New: AI Review Insights</h3>
                <p className="text-sm text-white/90">Turn review responses into clear patterns and practical coaching recommendations.</p>
              </div>
              <div className="p-6">
                <div className="flex flex-col gap-2.5 mb-5">
                  {[
                    "Surface review themes automatically",
                    "Generate practical coaching recommendations",
                    "Reduce manual analysis time by up to 75%",
                  ].map((bullet) => (
                    <div key={bullet} className="flex items-start gap-2.5 text-sm text-grey-500">
                      <PiCheckCircle className="text-[#338137] flex-shrink-0 mt-0.5" size={18} />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="primary"
                  className="w-full justify-center"
                  icon={<PiArrowRight />}
                  iconPosition="right"
                  onClick={() => { close(); navigate(`/release-hub?month=${encodeURIComponent(LATEST_RELEASE)}`); }}
                >
                  See what's new
                </Button>
                <button onClick={close} className="w-full text-center mt-3 text-sm text-grey-300 hover:text-grey-500 py-1">
                  Got it, close tour
                </button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default PerformanceReviews;
