import { useNavigate } from "react-router-dom";
import { PiGlobe } from "react-icons/pi";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Select from "@/components/ui/Select";
import WhatsNewButton from "@/components/WhatsNewButton";
import { useUserRole, ROLE_OPTIONS } from "@/components/UserRoleProvider";

/* Structure matches production's TopNavigation.jsx: fixed 56px bar,
   bg-[#0d59a3], brand mark on the left, a right-side action cluster.
   Production's cluster is NotificationCenter + a disabled language icon +
   a profile/logout menu, all backed by real auth and notifications this app
   doesn't have. Rather than fabricate those, this cluster keeps only what's
   real: the (also genuinely inert, same as production) language tooltip,
   the app's own What's New button, and the Demo Role switcher this whole
   prototype has used from the start to preview each persona's view. */
export function TopNavigation() {
  const navigate = useNavigate();
  const { userRole, setUserRole } = useUserRole();

  return (
    <div className="bg-[#0d59a3] h-[56px] fixed top-0 left-0 right-0 shrink-0 w-full z-50">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex h-[56px] items-center justify-center px-[16px] py-[10px] relative w-full">
          <div className="basis-0 content-stretch flex grow items-center justify-between min-h-px min-w-px relative shrink-0">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-white/15 text-sm font-bold text-white">Z</div>
              <span className="font-semibold text-white">Zwayam</span>
            </button>

            <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
              <WhatsNewButton />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      aria-disabled="true"
                      className="content-stretch flex items-center justify-center relative rounded-[30px] shrink-0 size-[32px] transition-opacity opacity-40 cursor-not-allowed"
                    >
                      <PiGlobe className="block text-white" size={24} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="!max-w-[160px] text-center">
                    <p>Functionality currently unavailable on this page.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex items-center gap-2">
                <label htmlFor="demo-role" className="text-xs font-medium text-white/85 whitespace-nowrap">
                  Demo Role:
                </label>
                <Select
                  name="demoRole"
                  id="demo-role"
                  className="!w-[180px] !p-2 !text-sm"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  options={ROLE_OPTIONS}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopNavigation;
