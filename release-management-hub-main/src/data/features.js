import { sampleFeatures } from "@/data/sampleFeatures";

/* ---------------------------------------------------------------------------
   The canonical feature list, matching release-management-hub-zerra.html.

   sampleFeatures still holds the original twelve July rows in their original
   shape, so anything that reads them directly keeps working. Everything the
   redesign added - the new Feature Type vocabulary, publication state, the
   release a feature belongs to, and the May/June/August rows - is applied
   here, in one place, the same way the prototype does it at boot.

   @typedef {'Default On'|'Default Off'|'Non Deferrable'} FeatureType
   @typedef {Object} Feature
   @property {string} id
   @property {string} title
   @property {string} [summary]
   @property {string} productModule
   @property {string} releaseNotes
   @property {string} [demoVideo]
   @property {string} enablementDate
   @property {string} prodEnablementDate
   @property {string} [deferrableTill]
   @property {boolean} supportNeeded
   @property {boolean} isEnabled
   @property {'Enabled'|'Disabled'|'Deferred'|'Contact CSM'|'Enablement requested'} status
   @property {boolean} published - visible to the Creator role only until true
   @property {string} releaseMonth - e.g. "July 2026", drives the month filter
   @property {string} [productGate] - shown to users as "Feature Flag (Internal)"
   @property {string} [configurationDoc]
   @property {'Enhancement'|'New Feature'} featureTag
   @property {FeatureType} [featureType]
   @property {number} [enabledCustomers]
   @property {number} [activeCustomers]
   @property {number} [mauLast30Days]
   @property {number} [dauLast30DayAvg]
   @property {string} [releaseId]
   @property {string} [productRoute]
   @property {string[]} [announcementBullets]
   --------------------------------------------------------------------------- */

export const FEATURE_TYPES = ["Default On", "Default Off", "Non Deferrable"];

/** The old vocabulary mapped onto the new one. "Contact CSM" is a status, not
 *  a type, so support-required rows keep their status and become Default Off. */
const TYPE_MAP = {
  "Direct Enablement": "Default On",
  "Self Configurable": "Default Off",
  "Support Required": "Default Off",
  "Non Deferrable": "Non Deferrable",
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-07-01" -> "July 2026" */
export const releaseMonthOf = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

/** "2026-07-01" -> "Jul 1, 2026" */
export const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

/** Built from local parts, not toISOString(), which shifts the date back a
 *  day for anyone east of UTC. */
export const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Newest release first. Sorted from the data, so a feature created in a new
 *  month brings its month into the filter with it. */
export const sortReleaseMonths = (months) =>
  [...months].sort((a, b) => {
    const [ma, ya] = a.split(" ");
    const [mb, yb] = b.split(" ");
    return Number(yb) - Number(ya) || MONTH_NAMES.indexOf(mb) - MONTH_NAMES.indexOf(ma);
  });

const shipped = (f) => ({
  ...f,
  featureType: f.featureType ? TYPE_MAP[f.featureType] : "Default Off",
  status: f.supportNeeded && !f.isEnabled ? "Contact CSM" : f.status,
  published: true,
  releaseMonth: releaseMonthOf(f.prodEnablementDate),
});

/* Earlier releases. The hub spans more than one release, so the month filter
   has something to filter and the page carries no single-release strapline. */
const earlierReleases = [
  {
    id: "FEAT-013",
    title: "Interview Panel Availability Sync",
    summary:
      "Reads panel calendars before proposing slots, so interview invites stop colliding with existing meetings.\nHonours working hours per region and holds a provisional slot until the candidate confirms.",
    productModule: "Recruiting",
    releaseNotes: "https://docs.zwayam.com/releases/june-2026/feat-013",
    demoVideo: "",
    enablementDate: "2026-06-01",
    prodEnablementDate: "2026-06-01",
    deferrableTill: "2026-08-30",
    supportNeeded: false,
    isEnabled: true,
    status: "Enabled",
    published: true,
    releaseMonth: "June 2026",
    productGate: "recruiting.scheduling.panel_sync",
    featureTag: "Enhancement",
    featureType: "Default On",
    releaseId: "2026-06",
    announcementBullets: [
      "Read panel calendars before proposing slots",
      "Respect working hours per region",
      "Hold slots until the candidate confirms",
    ],
    enabledCustomers: 69,
    activeCustomers: 58,
    mauLast30Days: 1710,
    dauLast30DayAvg: 64,
  },
  {
    id: "FEAT-014",
    title: "Document Retention Policies",
    summary:
      "Set how long each document type is kept and let the platform retire files on schedule.\nRetention runs are logged, and a legal hold stops deletion for named employees.",
    productModule: "Core HR",
    releaseNotes: "https://docs.zwayam.com/releases/june-2026/feat-014",
    demoVideo: "https://demo.zwayam.com/feat-014",
    enablementDate: "2026-06-01",
    prodEnablementDate: "2026-06-01",
    supportNeeded: false,
    isEnabled: true,
    status: "Enabled",
    published: true,
    releaseMonth: "June 2026",
    productGate: "corehr.documents.retention",
    configurationDoc: "https://docs.zwayam.com/config/retention",
    featureTag: "New Feature",
    featureType: "Non Deferrable",
    releaseId: "2026-06",
    announcementBullets: [
      "Set retention per document type",
      "Apply a legal hold to named employees",
      "Keep an auditable deletion log",
    ],
    enabledCustomers: 96,
    activeCustomers: 91,
    mauLast30Days: 2380,
    dauLast30DayAvg: 74,
  },
  {
    id: "FEAT-015",
    title: "Goal Cascade Templates",
    summary:
      "Publish a goal once and let each team adapt it without losing the link to the company objective.\nShows how far a goal has travelled down the org and where the chain breaks.",
    productModule: "Performance Management",
    releaseNotes: "https://docs.zwayam.com/releases/june-2026/feat-015",
    demoVideo: "https://demo.zwayam.com/feat-015",
    enablementDate: "2026-06-01",
    prodEnablementDate: "2026-06-01",
    deferrableTill: "2026-08-30",
    supportNeeded: false,
    isEnabled: true,
    status: "Enabled",
    published: true,
    releaseMonth: "June 2026",
    productGate: "performance.goals.cascade_templates",
    configurationDoc: "https://docs.zwayam.com/config/goal-cascades",
    featureTag: "New Feature",
    featureType: "Default Off",
    releaseId: "2026-06",
    productRoute: "/performance-reviews",
    announcementBullets: ["Publish an objective once", "Let teams adapt the wording", "See where the chain breaks"],
    enabledCustomers: 34,
    activeCustomers: 27,
    mauLast30Days: 820,
    dauLast30DayAvg: 26,
  },
  {
    id: "FEAT-016",
    title: "Timesheet Approval Reminders",
    summary:
      "Nudges approvers before the payroll cut-off instead of after it.\nEscalates to the next approver in line when a timesheet sits untouched for two days.",
    productModule: "Payroll",
    releaseNotes: "https://docs.zwayam.com/releases/may-2026/feat-016",
    demoVideo: "",
    enablementDate: "2026-05-01",
    prodEnablementDate: "2026-05-01",
    deferrableTill: "2026-07-30",
    supportNeeded: false,
    isEnabled: true,
    status: "Enabled",
    published: true,
    releaseMonth: "May 2026",
    productGate: "payroll.timesheets.approval_reminders",
    featureTag: "Enhancement",
    featureType: "Default On",
    releaseId: "2026-05",
    announcementBullets: ["Remind approvers before cut-off", "Escalate after two idle days", "Report on approver turnaround"],
    enabledCustomers: 104,
    activeCustomers: 98,
    mauLast30Days: 3410,
    dauLast30DayAvg: 186,
  },
  {
    id: "FEAT-017",
    title: "Candidate Feedback Digest",
    summary:
      "Collects every interviewer note into one digest the hiring manager can read in a minute.\nFlags where two interviewers scored the same competency very differently.",
    productModule: "Recruiting",
    releaseNotes: "https://docs.zwayam.com/releases/may-2026/feat-017",
    demoVideo: "https://demo.zwayam.com/feat-017",
    enablementDate: "2026-05-01",
    prodEnablementDate: "2026-05-01",
    deferrableTill: "2026-07-30",
    supportNeeded: false,
    isEnabled: true,
    status: "Enabled",
    published: true,
    releaseMonth: "May 2026",
    productGate: "recruiting.feedback.digest",
    featureTag: "Enhancement",
    featureType: "Default On",
    releaseId: "2026-05",
    announcementBullets: ["Collect notes into one digest", "Flag scoring disagreement", "Share with the hiring manager only"],
    enabledCustomers: 81,
    activeCustomers: 70,
    mauLast30Days: 1930,
    dauLast30DayAvg: 58,
  },
  {
    id: "FEAT-018",
    title: "Learning Path Prerequisites",
    summary:
      "Hold a course until its prerequisites are complete, so learners meet material in the right order.\nManagers can waive a prerequisite with a reason that stays on the record.",
    productModule: "Learning & Development",
    releaseNotes: "https://docs.zwayam.com/releases/may-2026/feat-018",
    demoVideo: "",
    enablementDate: "2026-05-01",
    prodEnablementDate: "2026-05-01",
    deferrableTill: "2026-07-30",
    supportNeeded: false,
    isEnabled: true,
    status: "Enabled",
    published: true,
    releaseMonth: "May 2026",
    productGate: "learning.paths.prerequisites",
    configurationDoc: "https://docs.zwayam.com/config/learning-paths",
    featureTag: "Enhancement",
    featureType: "Default Off",
    releaseId: "2026-05",
    announcementBullets: ["Gate courses on prerequisites", "Waive with a recorded reason", "Track order of completion"],
    enabledCustomers: 47,
    activeCustomers: 36,
    mauLast30Days: 1120,
    dauLast30DayAvg: 31,
  },
];

/* The August release being prepared. Only the Creator role can see these. */
const drafts = [
  {
    id: "FEAT-019",
    title: "Shift Swap Requests",
    summary:
      "Lets employees offer a shift to their team and hand it over once an approver signs off.\nChecks overtime limits and coverage minimums before a swap can be accepted.",
    productModule: "Core HR",
    releaseNotes: "https://docs.zwayam.com/releases/august-2026/feat-019",
    demoVideo: "https://demo.zwayam.com/feat-019",
    enablementDate: "2026-08-01",
    prodEnablementDate: "2026-08-01",
    deferrableTill: "2026-10-30",
    supportNeeded: false,
    isEnabled: false,
    status: "Disabled",
    published: false,
    releaseMonth: "August 2026",
    productGate: "corehr.shifts.swap_requests",
    configurationDoc: "https://docs.zwayam.com/config/shift-swaps",
    featureTag: "New Feature",
    featureType: "Default Off",
    announcementBullets: ["Offer a shift to the team", "Check overtime and coverage before accepting", "Route the handover for approval"],
    enabledCustomers: 0,
    activeCustomers: 0,
    mauLast30Days: 0,
    dauLast30DayAvg: 0,
  },
  {
    id: "FEAT-020",
    title: "Exit Interview Templates",
    summary:
      "A standard exit questionnaire per exit reason, with results feeding the attrition view.\nResponses stay anonymous below a team size threshold you set.",
    productModule: "Core HR",
    releaseNotes: "https://docs.zwayam.com/releases/august-2026/feat-020",
    demoVideo: "https://demo.zwayam.com/feat-020",
    enablementDate: "2026-08-01",
    prodEnablementDate: "2026-08-01",
    deferrableTill: "2026-10-30",
    supportNeeded: false,
    isEnabled: false,
    status: "Disabled",
    published: false,
    releaseMonth: "August 2026",
    productGate: "corehr.offboarding.exit_templates",
    configurationDoc: "https://docs.zwayam.com/config/exit-templates",
    featureTag: "New Feature",
    featureType: "Default On",
    announcementBullets: ["Ask different questions per exit reason", "Keep small-team responses anonymous", "Feed results into attrition reporting"],
    enabledCustomers: 0,
    activeCustomers: 0,
    mauLast30Days: 0,
    dauLast30DayAvg: 0,
  },
  {
    id: "FEAT-021",
    title: "Recruiter Workload Balancing",
    summary:
      "Shows open requisitions per recruiter and suggests reassignment when a queue runs long.\nWeights requisitions by seniority rather than counting them flat.",
    productModule: "Recruiting",
    releaseNotes: "https://docs.zwayam.com/releases/august-2026/feat-021",
    demoVideo: "https://demo.zwayam.com/feat-021",
    enablementDate: "2026-08-01",
    prodEnablementDate: "2026-08-01",
    deferrableTill: "2026-10-30",
    supportNeeded: false,
    isEnabled: false,
    status: "Disabled",
    published: false,
    releaseMonth: "August 2026",
    productGate: "recruiting.capacity.workload_balance",
    configurationDoc: "https://docs.zwayam.com/config/workload",
    featureTag: "Enhancement",
    featureType: "Default Off",
    announcementBullets: ["Weight requisitions by seniority", "Flag queues running long", "Suggest a reassignment"],
    enabledCustomers: 0,
    activeCustomers: 0,
    mauLast30Days: 0,
    dauLast30DayAvg: 0,
  },
];

export const allFeatures = [...sampleFeatures.map(shipped), ...earlierReleases, ...drafts];

export const MODULES = [
  "Performance Management",
  "Recruiting",
  "Benefits",
  "Analytics",
  "Core HR",
  "Onboarding",
  "Payroll",
  "Learning & Development",
];

/** The release What's New speaks for. */
export const LATEST_RELEASE = "July 2026";

/** The implementation team's queue: customers awaiting enablement support. */
export const supportQueue = [
  { customer: "GreyOrange", featureId: "FEAT-001", status: "support" },
  { customer: "GreyOrange", featureId: "FEAT-005", status: "support" },
  { customer: "Northwind Retail", featureId: "FEAT-001", status: "support" },
  { customer: "Northwind Retail", featureId: "FEAT-011", status: "enabled" },
  { customer: "Kaveri Logistics", featureId: "FEAT-007", status: "support" },
  { customer: "Kaveri Logistics", featureId: "FEAT-002", status: "enabled" },
  { customer: "Meridian Health", featureId: "FEAT-010", status: "support" },
  { customer: "Meridian Health", featureId: "FEAT-006", status: "enabled" },
  { customer: "Bluepeak Energy", featureId: "FEAT-012", status: "support" },
  { customer: "Bluepeak Energy", featureId: "FEAT-004", status: "enabled" },
];
