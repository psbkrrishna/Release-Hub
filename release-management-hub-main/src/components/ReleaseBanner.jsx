import { useNavigate } from "react-router-dom";
import { PiSparkle, PiArrowRight, PiX } from "react-icons/pi";
import { LATEST_RELEASE } from "@/data/features";

/* No equivalent in production's own shell, but this predates the rebuild and
   AGENTS.md's rule is "don't remove existing features unless asked," so it's
   kept and restyled. Fixed just below the top bar, starting where the
   (collapsed-width) rail ends, so it reads as a banner over the page rather
   than a second global chrome layer; z-30 sits below the rail (z-40) so an
   expanded hover-rail still overlays its left edge, same as it does the
   canvas. Pastel purple, matching this app's other release-news surfaces. */
const ReleaseBanner = ({ onDismiss }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed top-[56px] left-[72px] right-0 h-12 z-30 flex items-center gap-3 border-b border-[#EDC7F4] bg-[#FCEBFF] px-4">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#BC3AD2] text-white">
        <PiSparkle size={15} />
      </span>
      <span className="text-sm text-[#3A0143] truncate">
        <b className="font-semibold mr-1.5">Four new ways to move work forward</b>
        <span className="hidden sm:inline">Two new features and two enhancements in the {LATEST_RELEASE} release.</span>
      </span>
      <button
        onClick={() => navigate("/release-hub")}
        className="ml-auto flex-shrink-0 flex items-center gap-1 text-sm font-semibold text-[#3A0143] hover:underline"
      >
        Explore <PiArrowRight size={14} />
      </button>
      <button onClick={onDismiss} aria-label="Dismiss" className="flex-shrink-0 p-1.5 rounded text-[#3A0143]/70 hover:bg-black/5 hover:text-[#3A0143]">
        <PiX size={16} />
      </button>
    </div>
  );
};

export default ReleaseBanner;
