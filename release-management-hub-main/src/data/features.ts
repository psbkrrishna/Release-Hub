import { sampleFeatures } from '@/data/sampleFeatures';
import type { Feature, FeatureType, SeedFeature } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   The canonical feature list, matching release-management-hub-zerra.html.

   sampleFeatures still holds the original twelve July rows in their original
   shape, so the components that read them directly keep working. Everything
   the redesign added - the new Feature Type vocabulary, publication state,
   the release a feature belongs to, and the May/June/August rows - is applied
   here, in one place, the same way the prototype does it at boot.
   --------------------------------------------------------------------------- */

/** The old vocabulary mapped onto the new one. "Contact CSM" is a status, not
 *  a type, so support-required rows keep their status and become Default Off. */
const TYPE_MAP: Record<string, FeatureType> = {
  'Direct Enablement': 'Default On',
  'Self Configurable': 'Default Off',
  'Support Required': 'Default Off',
  'Non Deferrable': 'Non Deferrable',
};

/** The seed rows spell one module two ways. Normalised here, next to TYPE_MAP,
 *  rather than in sampleFeatures.ts - that file is kept as originally authored.
 *  Without this, `Learning` rows answer to no entry in MODULES and so can never
 *  be isolated by the module filter or matched to their documentation. */
const MODULE_MAP: Record<string, string> = {
  Learning: 'Learning & Development',
};

export const moduleOf = (name: string): string => MODULE_MAP[name] ?? name;

/* Long-form descriptions for the seed rows. They live here rather than in
   sampleFeatures.ts for the same reason the type and module mappings do: that
   file is kept as originally authored, and everything the redesign added is
   applied on the way through. */
const DESCRIPTIONS: Record<string, string> = {
  'FEAT-001':
    'Review responses are read as a set rather than one at a time, so recurring themes across a team surface without anyone reading every form. Each theme is shown with the responses behind it, and the coaching suggestions are drafts a manager edits before sharing - nothing reaches an employee automatically.',
  'FEAT-002':
    'Sourcing pulls candidate profiles directly from LinkedIn and parses them into structured records, so a recruiter is not retyping work history. Matching runs against the requisition rather than a keyword list, and duplicates against your existing candidate pool are flagged before anyone is contacted twice.',
  'FEAT-003':
    'Tax rules are evaluated as the pay run is assembled rather than after it, so a rate change or a jurisdiction the employee moved to is caught before approval. Every calculation keeps the rule version it used, which is what makes a later audit answerable.',
  'FEAT-004':
    'Employees compare plans side by side with the real cost to them, rather than reading a benefits PDF and guessing. Cost calculators take household details into account, and recommendations explain which inputs drove them.',
  'FEAT-005':
    'Clock-in is confirmed by facial match on the device, which removes buddy punching without a card or fob to issue and replace. Matching happens on-device and only the result is transmitted, so no facial image leaves the terminal.',
  'FEAT-006':
    'A learning path is assembled per employee from their role, their current skills and the gaps their manager has flagged, rather than from a fixed curriculum. Paths adjust as courses are completed and as the role changes.',
  'FEAT-007':
    'Turnover risk is modelled from the signals already in the platform - tenure, movement, review history, manager changes - and shown by team rather than by individual, so the conversation stays about conditions rather than about a person. Each score can be opened to see which factors moved it.',
  'FEAT-008':
    'Short recurring surveys track how teams are doing between engagement cycles, so a decline shows up in weeks rather than at the annual survey. Results are withheld below the team size you set, which keeps small teams genuinely anonymous.',
  'FEAT-009':
    'The self-service tasks employees actually do on a phone - payslips, leave, personal details, documents - are built for the phone first rather than shrunk from the desktop layout. Requests keep working offline and sync when the connection returns.',
  'FEAT-010':
    'Compliance documents are generated from the employee record and the applicable policy, so the details cannot drift from what the record says. Each document keeps the policy version it was generated under, and regeneration is a new version rather than an overwrite.',
  'FEAT-011':
    'Reports are built by dragging fields onto a canvas, with joins handled underneath, so an analyst is not writing queries to answer a recurring question. A saved report can be scheduled and shared with the access rules of whoever opens it.',
  'FEAT-012':
    'Onboarding tasks are raised automatically from the offer - equipment, access, introductions, paperwork - and routed to whoever owns each one. Progress is visible to the new joiner and their manager, so a blocked task is obvious before day one.',
};

/** The value bullets to show for a feature. `announcementBullets` is the seed
 *  rows' original field and stands in until a feature is edited. */
export const valueOf = (f: Feature): string[] =>
  f.valueDelivered ?? f.announcementBullets ?? [];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** "2026-07-01" -> "July 2026" */
export const releaseMonthOf = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

/** "2026-07-01" -> "Jul 1, 2026" */
export const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Built from local parts, not toISOString(), which shifts the date back a
 *  day for anyone east of UTC. */
export const addDays = (iso: string, n: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Newest release first. Sorted from the data, so a feature created in a new
 *  month brings its month into the filter with it. */
export const sortReleaseMonths = (months: string[]): string[] =>
  [...months].sort((a, b) => {
    const [ma, ya] = a.split(' ');
    const [mb, yb] = b.split(' ');
    return Number(yb) - Number(ya) || MONTH_NAMES.indexOf(mb) - MONTH_NAMES.indexOf(ma);
  });

const shipped = (f: SeedFeature): Feature => ({
  ...f,
  productModule: moduleOf(f.productModule),
  description: DESCRIPTIONS[f.id],
  valueDelivered: f.announcementBullets,
  featureType: f.featureType ? TYPE_MAP[f.featureType] : 'Default Off',
  status: f.supportNeeded && !f.isEnabled ? 'Contact CSM' : f.status,
  published: true,
  releaseMonth: releaseMonthOf(f.prodEnablementDate),
});

/* Earlier releases. The hub spans more than one release, so the month filter
   has something to filter and the page carries no single-release strapline. */
const earlierReleases: Feature[] = [
  {
    id: 'FEAT-013',
    title: 'Interview Panel Availability Sync',
    summary:
      'Reads panel calendars before proposing slots, so interview invites stop colliding with existing meetings.\nHonours working hours per region and holds a provisional slot until the candidate confirms.',
    description:
      'Availability is read from every panellist’s calendar before a slot is offered, rather than proposing times and discovering the clash afterwards. Working hours are respected per region, so a panel spanning two time zones stops producing 7am invitations, and the slot is held provisionally until the candidate confirms so two candidates cannot take the same one.',
    productModule: 'Recruiting',
    releaseNotes: 'https://docs.zwayam.com/releases/june-2026/feat-013',
    demoVideo: '',
    enablementDate: '2026-06-01',
    prodEnablementDate: '2026-06-01',
    deferrableTill: '2026-08-30',
    supportNeeded: false,
    isEnabled: true,
    status: 'Enabled',
    published: true,
    releaseMonth: 'June 2026',
    productGate: 'recruiting.scheduling.panel_sync',
    featureTag: 'Enhancement',
    featureType: 'Default On',
    releaseId: '2026-06',
    announcementBullets: [
      'Read panel calendars before proposing slots',
      'Respect working hours per region',
      'Hold slots until the candidate confirms',
    ],
    enabledCustomers: 69,
    activeCustomers: 58,
    mauLast30Days: 1710,
    dauLast30DayAvg: 64,
  },
  {
    id: 'FEAT-014',
    title: 'Document Retention Policies',
    summary:
      'Set how long each document type is kept and let the platform retire files on schedule.\nRetention runs are logged, and a legal hold stops deletion for named employees.',
    description:
      'Each document type carries its own retention period, and the platform retires files on that schedule rather than leaving it to an annual clean-up nobody runs. A legal hold overrides the schedule for named employees, and every retention run is logged with what it removed - which is what makes the policy defensible rather than merely stated.',
    productModule: 'Core HR',
    releaseNotes: 'https://docs.zwayam.com/releases/june-2026/feat-014',
    demoVideo: 'https://demo.zwayam.com/feat-014',
    enablementDate: '2026-06-01',
    prodEnablementDate: '2026-06-01',
    supportNeeded: false,
    isEnabled: true,
    status: 'Enabled',
    published: true,
    releaseMonth: 'June 2026',
    productGate: 'corehr.documents.retention',
    configurationDoc: 'https://docs.zwayam.com/config/retention',
    featureTag: 'New Feature',
    featureType: 'Non Deferrable',
    releaseId: '2026-06',
    announcementBullets: [
      'Set retention per document type',
      'Apply a legal hold to named employees',
      'Keep an auditable deletion log',
    ],
    enabledCustomers: 96,
    activeCustomers: 91,
    mauLast30Days: 2380,
    dauLast30DayAvg: 74,
  },
  {
    id: 'FEAT-015',
    title: 'Goal Cascade Templates',
    summary:
      'Publish a goal once and let each team adapt it without losing the link to the company objective.\nShows how far a goal has travelled down the org and where the chain breaks.',
    description:
      'A company objective is published once and adapted by each team in their own words, while the link back to the original is kept - so rewording does not sever the cascade. The coverage view shows how far the objective has travelled down the org and which teams have not picked it up, which is usually the answer to why a goal missed.',
    productModule: 'Performance Management',
    releaseNotes: 'https://docs.zwayam.com/releases/june-2026/feat-015',
    demoVideo: 'https://demo.zwayam.com/feat-015',
    enablementDate: '2026-06-01',
    prodEnablementDate: '2026-06-01',
    deferrableTill: '2026-08-30',
    supportNeeded: false,
    isEnabled: true,
    status: 'Enabled',
    published: true,
    releaseMonth: 'June 2026',
    productGate: 'performance.goals.cascade_templates',
    configurationDoc: 'https://docs.zwayam.com/config/goal-cascades',
    featureTag: 'New Feature',
    featureType: 'Default Off',
    releaseId: '2026-06',
    productRoute: '/performance-reviews',
    announcementBullets: [
      'Publish an objective once',
      'Let teams adapt the wording',
      'See where the chain breaks',
    ],
    enabledCustomers: 34,
    activeCustomers: 27,
    mauLast30Days: 820,
    dauLast30DayAvg: 26,
  },
  {
    id: 'FEAT-016',
    title: 'Timesheet Approval Reminders',
    summary:
      'Nudges approvers before the payroll cut-off instead of after it.\nEscalates to the next approver in line when a timesheet sits untouched for two days.',
    description:
      'Reminders are timed against the payroll cut-off rather than sent on a fixed day, so approvers are prompted while there is still time to act. A timesheet left untouched for two days escalates to the next approver in line, which stops one person’s leave from holding up a pay run, and approver turnaround is reported so the persistent bottlenecks are visible.',
    productModule: 'Payroll',
    releaseNotes: 'https://docs.zwayam.com/releases/may-2026/feat-016',
    demoVideo: '',
    enablementDate: '2026-05-01',
    prodEnablementDate: '2026-05-01',
    deferrableTill: '2026-07-30',
    supportNeeded: false,
    isEnabled: true,
    status: 'Enabled',
    published: true,
    releaseMonth: 'May 2026',
    productGate: 'payroll.timesheets.approval_reminders',
    featureTag: 'Enhancement',
    featureType: 'Default On',
    releaseId: '2026-05',
    announcementBullets: [
      'Remind approvers before cut-off',
      'Escalate after two idle days',
      'Report on approver turnaround',
    ],
    enabledCustomers: 104,
    activeCustomers: 98,
    mauLast30Days: 3410,
    dauLast30DayAvg: 186,
  },
  {
    id: 'FEAT-017',
    title: 'Candidate Feedback Digest',
    summary:
      'Collects every interviewer note into one digest the hiring manager can read in a minute.\nFlags where two interviewers scored the same competency very differently.',
    description:
      'Interviewer notes are collected into a single digest per candidate rather than left across separate scorecards, so a hiring manager reads one page instead of five. Where two interviewers scored the same competency very differently, the disagreement is flagged rather than averaged away - that gap is usually the most useful thing in the loop.',
    productModule: 'Recruiting',
    releaseNotes: 'https://docs.zwayam.com/releases/may-2026/feat-017',
    demoVideo: 'https://demo.zwayam.com/feat-017',
    enablementDate: '2026-05-01',
    prodEnablementDate: '2026-05-01',
    deferrableTill: '2026-07-30',
    supportNeeded: false,
    isEnabled: true,
    status: 'Enabled',
    published: true,
    releaseMonth: 'May 2026',
    productGate: 'recruiting.feedback.digest',
    featureTag: 'Enhancement',
    featureType: 'Default On',
    releaseId: '2026-05',
    announcementBullets: [
      'Collect notes into one digest',
      'Flag scoring disagreement',
      'Share with the hiring manager only',
    ],
    enabledCustomers: 81,
    activeCustomers: 70,
    mauLast30Days: 1930,
    dauLast30DayAvg: 58,
  },
  {
    id: 'FEAT-018',
    title: 'Learning Path Prerequisites',
    summary:
      'Hold a course until its prerequisites are complete, so learners meet material in the right order.\nManagers can waive a prerequisite with a reason that stays on the record.',
    description:
      'A course stays locked until its prerequisites are complete, so learners meet material in the order it was designed to be met rather than starting with the advanced module. A manager can waive a prerequisite where it genuinely does not apply, but the waiver carries a reason and stays on the record, so exceptions remain visible rather than becoming the norm.',
    productModule: 'Learning & Development',
    releaseNotes: 'https://docs.zwayam.com/releases/may-2026/feat-018',
    demoVideo: '',
    enablementDate: '2026-05-01',
    prodEnablementDate: '2026-05-01',
    deferrableTill: '2026-07-30',
    supportNeeded: false,
    isEnabled: true,
    status: 'Enabled',
    published: true,
    releaseMonth: 'May 2026',
    productGate: 'learning.paths.prerequisites',
    configurationDoc: 'https://docs.zwayam.com/config/learning-paths',
    featureTag: 'Enhancement',
    featureType: 'Default Off',
    releaseId: '2026-05',
    announcementBullets: [
      'Gate courses on prerequisites',
      'Waive with a recorded reason',
      'Track order of completion',
    ],
    enabledCustomers: 47,
    activeCustomers: 36,
    mauLast30Days: 1120,
    dauLast30DayAvg: 31,
  },
];

/* The August release being prepared. Only the Creator role can see these. */
const drafts: Feature[] = [
  {
    id: 'FEAT-019',
    title: 'Shift Swap Requests',
    summary:
      'Lets employees offer a shift to their team and hand it over once an approver signs off.\nChecks overtime limits and coverage minimums before a swap can be accepted.',
    description:
      'An employee offers a shift to colleagues who are qualified to cover it, and the handover completes once an approver signs off. Overtime limits and coverage minimums are checked before a swap can be accepted rather than flagged afterwards, so a swap cannot quietly create a compliance breach or leave a shift short.',
    productModule: 'Core HR',
    releaseNotes: 'https://docs.zwayam.com/releases/august-2026/feat-019',
    demoVideo: 'https://demo.zwayam.com/feat-019',
    enablementDate: '2026-08-01',
    prodEnablementDate: '2026-08-01',
    deferrableTill: '2026-10-30',
    supportNeeded: false,
    isEnabled: false,
    status: 'Disabled',
    published: false,
    releaseMonth: 'August 2026',
    productGate: 'corehr.shifts.swap_requests',
    configurationDoc: 'https://docs.zwayam.com/config/shift-swaps',
    featureTag: 'New Feature',
    featureType: 'Default Off',
    announcementBullets: [
      'Offer a shift to the team',
      'Check overtime and coverage before accepting',
      'Route the handover for approval',
    ],
    enabledCustomers: 0,
    activeCustomers: 0,
    mauLast30Days: 0,
    dauLast30DayAvg: 0,
  },
  {
    id: 'FEAT-020',
    title: 'Exit Interview Templates',
    summary:
      'A standard exit questionnaire per exit reason, with results feeding the attrition view.\nResponses stay anonymous below a team size threshold you set.',
    description:
      'Each exit reason gets its own questionnaire, so a resignation and a redundancy are not asked the same questions and the answers stay comparable within a reason. Responses feed the attrition view directly, and are withheld below the team size threshold you set - without which exit feedback from a small team is anonymous in name only.',
    productModule: 'Core HR',
    releaseNotes: 'https://docs.zwayam.com/releases/august-2026/feat-020',
    demoVideo: 'https://demo.zwayam.com/feat-020',
    enablementDate: '2026-08-01',
    prodEnablementDate: '2026-08-01',
    deferrableTill: '2026-10-30',
    supportNeeded: false,
    isEnabled: false,
    status: 'Disabled',
    published: false,
    releaseMonth: 'August 2026',
    productGate: 'corehr.offboarding.exit_templates',
    configurationDoc: 'https://docs.zwayam.com/config/exit-templates',
    featureTag: 'New Feature',
    featureType: 'Default On',
    announcementBullets: [
      'Ask different questions per exit reason',
      'Keep small-team responses anonymous',
      'Feed results into attrition reporting',
    ],
    enabledCustomers: 0,
    activeCustomers: 0,
    mauLast30Days: 0,
    dauLast30DayAvg: 0,
  },
  {
    id: 'FEAT-021',
    title: 'Recruiter Workload Balancing',
    summary:
      'Shows open requisitions per recruiter and suggests reassignment when a queue runs long.\nWeights requisitions by seniority rather than counting them flat.',
    description:
      'Requisitions are weighted by seniority and expected effort rather than counted flat, so a recruiter carrying six executive searches does not read as under-loaded next to one carrying six volume roles. When a queue runs long the platform suggests a reassignment and shows what it would do to both recruiters’ load before anyone commits to it.',
    productModule: 'Recruiting',
    releaseNotes: 'https://docs.zwayam.com/releases/august-2026/feat-021',
    demoVideo: 'https://demo.zwayam.com/feat-021',
    enablementDate: '2026-08-01',
    prodEnablementDate: '2026-08-01',
    deferrableTill: '2026-10-30',
    supportNeeded: false,
    isEnabled: false,
    status: 'Disabled',
    published: false,
    releaseMonth: 'August 2026',
    productGate: 'recruiting.capacity.workload_balance',
    configurationDoc: 'https://docs.zwayam.com/config/workload',
    featureTag: 'Enhancement',
    featureType: 'Default Off',
    announcementBullets: [
      'Weight requisitions by seniority',
      'Flag queues running long',
      'Suggest a reassignment',
    ],
    enabledCustomers: 0,
    activeCustomers: 0,
    mauLast30Days: 0,
    dauLast30DayAvg: 0,
  },
];

export const allFeatures: Feature[] = [
  ...sampleFeatures.map(shipped),
  ...earlierReleases,
  ...drafts,
];

/* The canonical product taxonomy - the one list the feature table, the create
   form and the Knowledge Hub all answer to, so a feature and its documentation
   can be matched by module name alone.

   Time Tracking and Employee Experience are new entries here: features have
   always carried them, but they were missing from this list, which meant the
   module filter offered no way to reach five of the twelve seed features. */
export const MODULES = [
  'Performance Management',
  'Recruiting',
  'Benefits',
  'Analytics',
  'Core HR',
  'Onboarding',
  'Payroll',
  'Learning & Development',
  'Time Tracking',
  'Employee Experience',
];

/** The release What's New speaks for. */
export const LATEST_RELEASE = 'July 2026';

/** The implementation team's queue: customers awaiting enablement support. */
export const supportQueue: Array<{ customer: string; featureId: string; status: 'support' | 'enabled' }> = [
  { customer: 'GreyOrange', featureId: 'FEAT-001', status: 'support' },
  { customer: 'GreyOrange', featureId: 'FEAT-005', status: 'support' },
  { customer: 'Northwind Retail', featureId: 'FEAT-001', status: 'support' },
  { customer: 'Northwind Retail', featureId: 'FEAT-011', status: 'enabled' },
  { customer: 'Kaveri Logistics', featureId: 'FEAT-007', status: 'support' },
  { customer: 'Kaveri Logistics', featureId: 'FEAT-002', status: 'enabled' },
  { customer: 'Meridian Health', featureId: 'FEAT-010', status: 'support' },
  { customer: 'Meridian Health', featureId: 'FEAT-006', status: 'enabled' },
  { customer: 'Bluepeak Energy', featureId: 'FEAT-012', status: 'support' },
  { customer: 'Bluepeak Energy', featureId: 'FEAT-004', status: 'enabled' },
];
