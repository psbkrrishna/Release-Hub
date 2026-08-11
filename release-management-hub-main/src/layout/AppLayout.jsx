import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import {
  PiSquaresFour, PiBriefcase, PiFileText, PiGear, PiUserCircle, PiClipboardText,
  PiBuildings, PiUsersThree, PiSparkle, PiChartBar, PiRocketLaunch, PiBookOpen,
  PiGearSix, PiQuestion, PiCaretLeft, PiCaretRight, PiChatCircleDots,
} from "react-icons/pi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TopNavigation } from "@/components/TopNavigation";
import PoweredByFooter from "@/components/branding/PoweredByFooter";
import Chatbot from "@/components/Chatbot";
import ReleaseBanner from "@/components/ReleaseBanner";

const ANN_KEY = "annDismissed";

/* Structure matches zm-manage-new-setting-development/src/layout/AppLayout.jsx:
   fixed 56px top bar, a left rail fixed at top:56px that overlays the canvas
   and expands 72px -> 220px on hover (main content's left margin stays at the
   collapsed width, it does not reflow), PoweredByFooter after children.
   Nav items are ours - Dashboard/Performance/Release Hub/Knowledge base are
   real routes, the rest are present for shell fidelity but inert, same as
   the original Zerra prototype's placeholder rail buttons. */

const topRailItems = [
  { id: "dashboard", icon: PiSquaresFour, label: "Dashboard", path: "/dashboard" },
  { id: "jobs", icon: PiBriefcase, label: "Jobs" },
  { id: "documents", icon: PiFileText, label: "Documents" },
  { id: "configuration", icon: PiGear, label: "Configuration" },
  { id: "candidates", icon: PiUserCircle, label: "Candidates" },
  { id: "performance", icon: PiClipboardText, label: "Performance", path: "/performance-reviews", isNew: true },
  { id: "organisation", icon: PiBuildings, label: "Organisation" },
  { id: "people", icon: PiUsersThree, label: "People" },
  { id: "ai-tools", icon: PiSparkle, label: "AI tools" },
];

const lowerRailItems = [
  { id: "analytics", icon: PiChartBar, label: "Analytics", path: "/insights" },
  { id: "release-hub", icon: PiRocketLaunch, label: "Release Hub", path: "/release-hub" },
  { id: "knowledge-base", icon: PiBookOpen, label: "Knowledge base", path: "/knowledge-base" },
];

const footerRailItems = [
  { id: "settings", icon: PiGearSix, label: "Settings" },
  { id: "help", icon: PiQuestion, label: "Help" },
];

export function AppLayout({ children }) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Not part of production's own AppLayout - this app's Knowledge Assistant
  // predates the rebuild and AGENTS.md's own rule is "don't remove existing
  // features unless asked," so it's kept and restyled rather than dropped.
  const [chatOpen, setChatOpen] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(() => localStorage.getItem(ANN_KEY) === "1");
  const location = useLocation();
  const navigate = useNavigate();

  // Also not part of production's own shell - no equivalent exists there -
  // but it's an existing feature of this app kept from before the rebuild.
  // Reserves space below the top bar so the rail and canvas both start under
  // it rather than behind it; the rail is a fixed-width overlay so this stays
  // pinned to the collapsed width regardless of hover expansion.
  const topOffset = bannerDismissed ? 56 : 104;
  const dismissBanner = () => {
    localStorage.setItem(ANN_KEY, "1");
    setBannerDismissed(true);
  };

  const isActive = (path) => {
    if (!path) return false;
    if (path === "/release-hub") return location.pathname.startsWith("/release-hub");
    return location.pathname === path;
  };

  const railButton = ({ id, icon: Icon, label, path, isNew }) => {
    const active = isActive(path);
    const button = (
      <button
        key={id}
        type="button"
        onClick={() => path && navigate(path)}
        className={`mx-[12px] box-border content-stretch flex gap-[12px] items-center p-[10px] relative rounded-[8px] shrink-0 transition-all ${
          active ? "bg-[#0d59a3] text-white" : "bg-white text-grey-400 hover:bg-gray-50"
        } ${isExpanded ? "justify-start" : "justify-center"} ${path ? "cursor-pointer" : "cursor-default"}`}
      >
        <span className="relative shrink-0 size-[24px] flex items-center justify-center">
          <Icon className={active ? "text-white" : "text-grey-400"} size={22} />
        </span>
        {isExpanded && (
          <span className={`text-sm whitespace-nowrap ${active ? "text-white" : "text-grey-500"}`}>{label}</span>
        )}
        {isNew && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#BC3AD2] px-1 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm ring-2 ring-white">
            New
          </span>
        )}
      </button>
    );

    if (isExpanded) return button;

    return (
      <Tooltip key={id} delayDuration={300}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <Toaster richColors position="top-right" closeButton />
      <div className="bg-gray-50 content-stretch flex gap-[10px] items-start relative min-h-screen w-full">
        <TopNavigation />

        {!bannerDismissed && <ReleaseBanner onDismiss={dismissBanner} />}

        <div
          className="fixed bg-white box-border content-stretch flex flex-col gap-[8px] items-stretch left-0 py-[12px] z-40 transition-all duration-300 ease-in-out overflow-hidden shadow-md"
          style={{ width: isExpanded ? "220px" : "72px", top: `${topOffset}px`, height: `calc(100vh - ${topOffset}px)` }}
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          <div aria-hidden="true" className="absolute border-[#dadada] border-[0px_1px_0px_0px] border-solid inset-0 pointer-events-none" />
          {topRailItems.map(railButton)}
          <div className="my-2 h-px bg-gray-200 mx-[20px]" />
          {lowerRailItems.map(railButton)}
          <div className="mt-auto flex flex-col gap-[8px]">{footerRailItems.map(railButton)}</div>
        </div>

        <div className="relative flex min-w-0 flex-1 ml-[72px]" style={{ marginTop: `${topOffset}px` }}>
          <div className="flex min-w-0 flex-1 flex-col" style={{ minHeight: `calc(100vh - ${topOffset}px)` }}>
            <div className="min-h-0 flex-1">{children}</div>
            <PoweredByFooter />
          </div>

          <button
            onClick={() => setChatOpen((v) => !v)}
            className="absolute top-4 z-20 hidden rounded-l-md border border-r-0 border-gray-200 bg-white p-1.5 shadow-sm transition-colors hover:bg-gray-50 xl:block"
            style={{ right: chatOpen ? "24rem" : "0" }}
            title={chatOpen ? "Collapse assistant" : "Open assistant"}
            aria-label={chatOpen ? "Collapse assistant" : "Open assistant"}
          >
            {chatOpen ? <PiCaretRight className="text-grey-400" size={16} /> : <PiCaretLeft className="text-grey-400" size={16} />}
          </button>

          {chatOpen && (
            <aside className="hidden w-96 flex-shrink-0 flex-col border-l border-gray-200 bg-white shadow-lg xl:flex">
              <div className="flex flex-shrink-0 items-center gap-2 bg-blue-600 p-4">
                <PiChatCircleDots className="text-white" size={20} />
                <h3 className="text-base font-semibold text-white">Knowledge Assistant</h3>
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                <Chatbot />
              </div>
            </aside>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default AppLayout;
