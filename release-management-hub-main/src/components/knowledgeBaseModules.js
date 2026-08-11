import { PiUsersThree, PiChartBar, PiCurrencyDollar, PiBookOpen, PiFileText, PiPlay, PiClock } from "react-icons/pi";
import { MODULES } from "@/data/features";

/* Shared between KnowledgeBaseHome and KnowledgeBase so a module's icon,
   tint and Badge variant agree everywhere it appears. */
const ICONS = [PiUsersThree, PiChartBar, PiCurrencyDollar, PiBookOpen, PiFileText, PiPlay, PiClock, PiUsersThree];
const TINTS = [
  { bg: "bg-[#E7EEF6]", text: "text-[#07315A]", badge: "blue" },
  { bg: "bg-[#EBF4EC]", text: "text-[#1F4E21]", badge: "green" },
  { bg: "bg-[#FCEBFF]", text: "text-[#3A0143]", badge: "purple" },
  { bg: "bg-[#FBF6E8]", text: "text-[#99770F]", badge: "yellow" },
];

export const knowledgeBaseModules = MODULES.map((name, i) => ({
  name,
  icon: ICONS[i % ICONS.length],
  tint: TINTS[i % TINTS.length],
  description: `Documentation, configuration guides and tutorials for ${name}.`,
  features: 3 + (i % 3),
  videos: 2 + (i % 4),
}));
