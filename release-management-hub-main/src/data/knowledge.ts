import {
  MODULES, MONTH_NAMES, WHATS_NEW_MAX, isInWhatsNew, sortReleaseMonths,
} from '@/data/features';
import type { Feature } from '@/types/Feature';
import type { KbModule, Newsletter, ReleaseNoteGroup } from '@/types/Knowledge';

/* ---------------------------------------------------------------------------
   Knowledge Hub content.

   The module list is keyed to MODULES - the same taxonomy the feature table
   and the create form use - so "documentation for this feature's module" is a
   name lookup rather than a mapping table anyone has to maintain.

   Release notes and feature videos are NOT declared here. They are derived
   from the feature list further down, because the Releases tab is
   already their source of truth.
   --------------------------------------------------------------------------- */

/** "1 document" / "2 documents". Counts appear beside a noun all over the hub,
 *  several of them legitimately reach 1. */
export const plural = (n: number, word: string, suffix = 's'): string =>
  `${n} ${word}${n === 1 ? '' : suffix}`;

export const slugify = (name: string): string =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** "July 2026" -> "2026-07-01", for sorting a month against an ISO date. */
export const monthToIso = (month: string): string => {
  const [name, year] = month.split(' ');
  const i = MONTH_NAMES.indexOf(name);
  return i < 0 ? '' : `${year}-${String(i + 1).padStart(2, '0')}-01`;
};

/** "July 2026" -> "2026-07": the URL-safe address a release's document lives
 *  at. Used both to build that route and, on the document page, to find the
 *  release it names - one function, so the two can never compute it
 *  differently. */
export const releaseNoteSlug = (month: string): string => monthToIso(month).slice(0, 7);

/** Evergreen documents per module, keyed by module name. A module with no
 *  entry still gets a page - it leads with its features instead. */
const DOCS: Record<
  string,
  {
    blurb: string;
    tagline: string;
    docs: Array<{ title: string; blurb: string; minutes: number; content: string[] }>;
    videos: Array<[string, string]>;
  }
> = {
  'Performance Management': {
    tagline: 'Reviews, goals and calibration',
    blurb: 'Review cycles, goals and calibration - how the appraisal process is set up and run end to end.',
    docs: [
      {
        title: 'Setting up a review cycle',
        blurb: 'Cycle dates, participants, and the forms each audience sees.',
        minutes: 8,
        content: [
          'A review cycle needs a name, a window, and the set of participants it applies to before anything else. Start dates, submission deadlines and the review window itself are set independently, so a mid-year cycle can run a shorter window than the annual one without extra configuration.',
          'Each audience in the cycle - the reviewee, their manager, and any peers added for 360 feedback - sees its own form. Self-review and manager-review forms can ask different questions entirely, and a question that should not apply to a given role or level can be scoped out rather than shown and ignored.',
        ],
      },
      {
        title: 'Goal frameworks and cascading',
        blurb: 'How objectives travel from company level down to an individual.',
        minutes: 12,
        content: [
          'A company-level objective becomes a departmental one, then a team one, then an individual one, each level narrowing the scope without breaking the link back to the goal above it. That link is what a coverage report reads to show how far a goal actually travelled.',
          'Cascading is optional at every level - a team can adopt a company objective as written, adapt it, or set its own goal alongside it. Templates capture a cascade pattern once so the next cycle does not start from a blank page.',
        ],
      },
      {
        title: 'Calibration sessions',
        blurb: 'Running a calibration, and what managers can and cannot change afterwards.',
        minutes: 6,
        content: [
          "A calibration session brings a group of managers together to align ratings before they are released, using the distribution the cycle expects as the reference point rather than each manager's own scale.",
          'Ratings can move during the session; comments and the pre-calibration score are both kept, so nothing is silently overwritten. Once a session closes, only an admin can reopen it - a manager who wants to revisit a rating afterwards has to ask for that reopening rather than editing it directly.',
        ],
      },
    ],
    videos: [
      ['Configure your first review cycle', '7:20'],
      ['Calibration in practice', '5:45'],
    ],
  },
  Recruiting: {
    tagline: 'Requisitions through to offers',
    blurb: 'Requisitions, sourcing, interviews and offers - the full hiring pipeline and its configuration.',
    docs: [
      {
        title: 'Requisition approval chains',
        blurb: 'Approval routing by department, seniority and cost centre.',
        minutes: 9,
        content: [
          'An approval chain is built from department, seniority and cost centre rather than named individuals, so a requisition for a Senior Engineer in Platform routes the same way regardless of who happens to hold the hiring manager role that quarter.',
          'Each step can require a single approver or all approvers in the group, and a step can be skipped entirely under conditions set on the chain - a backfill under a set budget, for instance. Every approval and rejection is timestamped on the requisition’s own history.',
        ],
      },
      {
        title: 'Interview scheduling and panels',
        blurb: 'Panel setup, availability rules and candidate-facing booking.',
        minutes: 11,
        content: [
          'A panel is a named group of interviewers with a role each - technical, hiring manager, culture - and a panel definition can be reused across every requisition for that role rather than assembled from scratch each time.',
          "Availability is read from each panellist's calendar before a slot is proposed, and working hours are respected per region. Candidate-facing booking then offers only the slots the whole panel can actually attend, rather than a slot the recruiter has to double-check by hand.",
        ],
      },
      {
        title: 'Offer templates and approvals',
        blurb: 'Building offer letters and the approvals that gate them.',
        minutes: 7,
        content: [
          "An offer template fixes the letter's structure - compensation, start date, contingencies - while leaving the numbers themselves to be filled in per candidate, so the wording a legal team has signed off on cannot drift between offers.",
          'The approval gate on an offer template can require compensation sign-off above a threshold, a second approver for exception terms, or both. An offer cannot be sent to a candidate until every required approval on it is recorded.',
        ],
      },
    ],
    videos: [
      ['Build a hiring pipeline', '9:10'],
      ['Scheduling a panel interview', '4:35'],
    ],
  },
  Benefits: {
    tagline: 'Plans, enrolment and life events',
    blurb: 'Plan design, enrolment windows and life events across the benefits programme.',
    docs: [
      {
        title: 'Open enrolment setup',
        blurb: 'Windows, eligibility rules and the employee enrolment experience.',
        minutes: 10,
        content: [
          'An enrolment window has a start and close date, the plans available within it, and the eligibility rules that decide who sees which plan - by employment type, tenure, or location, most commonly.',
          'The employee-facing experience walks through plan comparison and cost calculation before confirmation, and nothing is submitted until the employee reaches the final review step. Anyone who has not completed enrolment by the close date can be defaulted to a plan or left unenrolled, depending on how the window is configured.',
        ],
      },
      {
        title: 'Life event processing',
        blurb: 'Qualifying events, evidence requirements and effective dates.',
        minutes: 6,
        content: [
          'A life event - marriage, a birth, a change in employment status for a dependant - opens its own short enrolment window outside the annual one, scoped to the plans that event is allowed to change.',
          'Each event type has its own evidence requirements and its own effective date rule; a birth typically takes effect on the date of the event itself, while other events take effect on the next pay period. Evidence is attached to the event record and reviewed before the change takes effect.',
        ],
      },
    ],
    videos: [['Run an open enrolment', '8:05']],
  },
  Analytics: {
    tagline: 'Dashboards and report building',
    blurb: 'Dashboards, report building and the data model behind every metric in the platform.',
    docs: [
      {
        title: 'Report builder basics',
        blurb: 'Fields, filters, groupings and how to share what you build.',
        minutes: 8,
        content: [
          "A report starts from a dataset, then adds fields, filters and groupings on top of it - nothing is written by hand, so the report stays valid if the underlying data model changes shape later.",
          'Sharing a report can mean handing over edit access, view-only access, or just the exported file; the three are set independently. A report someone else shared with you appears in your own library rather than only in theirs, so it survives if their access changes.',
        ],
      },
      {
        title: 'Understanding the data model',
        blurb: 'Which objects join to which, and where each metric comes from.',
        minutes: 14,
        content: [
          "Every report ultimately joins back to one of a small number of core objects - the employee record, the requisition, the pay run - and most confusion about a wrong-looking number traces back to a join across two of these that does not mean what it looks like it means.",
          "A metric's definition - what counts as an ‘active candidate’, say - is fixed once at the object level rather than redefined per report, so the same word means the same thing wherever it appears.",
        ],
      },
      {
        title: 'Scheduling and distributing reports',
        blurb: 'Recurring delivery, formats and access control.',
        minutes: 5,
        content: [
          'A report can be set to run on a schedule - daily, weekly, on the first of the month - and delivered by email, as a shared link, or dropped into a folder another system can read.',
          "Access control on a scheduled delivery is the same as the report's own sharing settings; scheduling a report does not widen who can see it. A failed delivery is retried once and then reported to whoever owns the schedule, not silently dropped.",
        ],
      },
    ],
    videos: [
      ['Build a report from scratch', '6:50'],
      ['Dashboard design principles', '5:15'],
    ],
  },
  'Core HR': {
    tagline: 'Records, org structure, documents',
    blurb: 'The employee record, org structure, documents and everything that hangs off them.',
    docs: [
      {
        title: 'Employee record fields',
        blurb: 'Standard and custom fields, and who can see or edit each one.',
        minutes: 9,
        content: [
          'The employee record ships with the standard fields most organisations need - name, role, manager, compensation, employment type - plus room for custom fields specific to how a given company tracks its people.',
          'Field-level visibility is set independently of the record itself: a compensation field can be hidden from a manager who can otherwise see everything else on their report’s record. A custom field can be marked required, which blocks the record from being marked complete until it is filled in.',
        ],
      },
      {
        title: 'Org structure and reporting lines',
        blurb: 'Departments, cost centres, and handling matrix reporting.',
        minutes: 11,
        content: [
          "The org chart is built from each employee's manager field, department and cost centre, so it updates automatically as those change rather than needing to be redrawn by hand.",
          'Matrix reporting - a second, dotted-line manager alongside the primary one - is supported per record, and each manager sees the parts of the review and approval flow that role is meant to see, not a duplicate of the other’s.',
        ],
      },
      {
        title: 'Document management and retention',
        blurb: 'Document types, retention policies and legal holds.',
        minutes: 7,
        content: [
          'Every document type - offer letter, ID verification, signed policy acknowledgement - carries its own retention policy, so a document that must be kept for seven years and one that expires after one do not have to share a rule.',
          "A legal hold on an employee's record suspends every retention timer attached to it until the hold is lifted, even for documents that would otherwise have been deleted in the meantime. Deletions run as a scheduled job and are logged, not immediate on the policy's expiry date.",
        ],
      },
    ],
    videos: [
      ['Configure the employee record', '7:40'],
      ['Managing org changes', '6:00'],
    ],
  },
  Onboarding: {
    tagline: 'Pre-boarding to day ninety',
    blurb: 'Pre-boarding, day one and the first ninety days - checklists, tasks and provisioning.',
    docs: [
      {
        title: 'Onboarding checklists',
        blurb: 'Task templates by role, location and start date.',
        minutes: 7,
        content: [
          'A checklist template is built once per role, location or start date pattern, and assigns tasks to the new hire, their manager, IT and HR - each of them working from their own view of only what is theirs to do.',
          'A task can depend on another finishing first, so equipment provisioning does not fire before the offer is actually accepted. Completion is tracked per task, and a checklist that is still open past its target date surfaces on the assignee’s own dashboard.',
        ],
      },
      {
        title: 'Pre-boarding and document collection',
        blurb: 'What new joiners complete before their first day.',
        minutes: 6,
        content: [
          'Pre-boarding covers everything a new joiner does before day one - identity verification, tax forms, direct deposit details - collected through the same portal they will use once they start.',
          'Documents collected during pre-boarding land directly on the employee record once submitted, so nothing has to be re-entered on day one. A required document that is still missing close to the start date is flagged to whoever owns onboarding for that hire.',
        ],
      },
    ],
    videos: [['Design an onboarding journey', '6:25']],
  },
  Payroll: {
    tagline: 'Pay runs, tax and reconciliation',
    blurb: 'Pay runs, tax compliance, timesheet inputs and post-payroll reporting.',
    docs: [
      {
        title: 'Running a pay cycle',
        blurb: 'Inputs, validation, approvals and the point of no return.',
        minutes: 12,
        content: [
          'A pay cycle moves through defined stages - inputs, validation, approval, and the point of no return where the run is submitted for payment - and each stage has to close before the next opens.',
          'Validation checks for the errors that would otherwise only surface after payment - a missing bank detail, a negative net pay, an unapproved change landing after the cutoff. Anything flagged has to be resolved or explicitly overridden by someone with the authority to do so before the run can proceed.',
        ],
      },
      {
        title: 'Tax compliance configuration',
        blurb: 'Jurisdictions, rates and how compliance updates are applied.',
        minutes: 10,
        content: [
          'Tax rules are scoped by jurisdiction, so a multi-state or multi-country payroll applies the correct rates and filing requirements to each employee based on their own work location, not the company’s.',
          "When a jurisdiction changes its rates or its rules, the update is applied at the jurisdiction level and takes effect on its stated date, rather than needing to be re-entered against every affected employee individually.",
        ],
      },
      {
        title: 'Payroll reconciliation',
        blurb: 'Variance reports and the checks worth running every cycle.',
        minutes: 8,
        content: [
          "A variance report compares this cycle's totals against the last one, flagged by the size of the change - a department whose total payroll moved 20% in one cycle is worth a look before the run is finalised, even if every individual line is technically correct.",
          'The checks worth running every cycle are the same short list regardless of company size: headcount versus last cycle, unexpected zero-pay records, and any manual adjustment entered outside the normal input flow.',
        ],
      },
    ],
    videos: [
      ['Your first pay run', '11:30'],
      ['Reading the variance report', '4:50'],
    ],
  },
  'Learning & Development': {
    tagline: 'Courses, paths and compliance',
    blurb: 'Courses, learning paths, certifications and compliance training.',
    docs: [
      {
        title: 'Building a learning path',
        blurb: 'Sequencing, prerequisites and completion criteria.',
        minutes: 8,
        content: [
          'A learning path is a sequence of courses with prerequisites between them, so a course that assumes prior knowledge is not offered to someone who has not completed the one before it.',
          'Completion criteria - a passing score, a manager sign-off, both - are set per course rather than per path, so a path can mix a self-paced quiz with a course that needs to be verified by someone else before it counts as done.',
        ],
      },
      {
        title: 'Compliance training and renewals',
        blurb: 'Mandatory courses, deadlines and escalation.',
        minutes: 6,
        content: [
          "A mandatory course carries its own renewal interval, and the system tracks each employee's due date independently rather than resetting everyone on the same calendar date.",
          'An employee approaching their renewal deadline is reminded on an escalating schedule; someone who lapses past the deadline is flagged to their manager and to whoever owns compliance for that course, not just to the employee themselves.',
        ],
      },
    ],
    videos: [['Assign and track a learning path', '5:55']],
  },
  'Time Tracking': {
    tagline: 'Clocking, timesheets and shifts',
    blurb: 'Clocking, timesheets, shifts and the approval flow that feeds payroll.',
    docs: [
      {
        title: 'Timesheet approval workflows',
        blurb: 'Approver hierarchies, deadlines and escalation rules.',
        minutes: 7,
        content: [
          'An approver hierarchy for timesheets mirrors the reporting line by default, but can be overridden per team where the person who approves time is not the same as the person who manages performance.',
          'A timesheet not submitted by its deadline is escalated up the hierarchy on a schedule set at the company level, and payroll can be configured to either wait on that approval or estimate hours and true them up the following cycle.',
        ],
      },
      {
        title: 'Shift patterns and rotas',
        blurb: 'Building patterns, coverage minimums and overtime limits.',
        minutes: 9,
        content: [
          'A shift pattern defines the rotation - which days, which hours, how it repeats - once, and is then applied to however many employees or teams need it, rather than built per person.',
          'Coverage minimums are set per shift, and the system flags a rota that would leave a shift under-covered before it is published, rather than after. Overtime limits are enforced against the pattern’s own definition of a full shift, not a flat daily hour count.',
        ],
      },
    ],
    videos: [['Set up time capture', '6:40']],
  },
  'Employee Experience': {
    tagline: 'Self-service, surveys, wellness',
    blurb: 'Self-service, surveys, wellness and the everyday employee-facing surfaces.',
    docs: [
      {
        title: 'Self-service portal configuration',
        blurb: 'What employees can see, request and change themselves.',
        minutes: 8,
        content: [
          'What an employee can see and change themselves - contact details, tax withholding, direct deposit - is set per field, so a company can allow self-service address changes while still routing compensation-adjacent changes through HR.',
          'A change made through self-service can be applied immediately or held for approval, depending on how sensitive that field is configured to be; either way, the employee sees the same confirmation and the record keeps a full history of who changed what.',
        ],
      },
      {
        title: 'Running pulse surveys',
        blurb: 'Cadence, anonymity thresholds and acting on the results.',
        minutes: 7,
        content: [
          'A pulse survey is short by design - a handful of questions, sent on a cadence rather than as one long annual instrument - and the cadence itself is configurable per team or per company.',
          'Responses are anonymous once a minimum group size is met; below that threshold, results are held back rather than shown in a way that could identify who said what. Acting on the results is a separate step: a survey does not auto-generate action items, but its results can be attached to one.',
        ],
      },
    ],
    videos: [
      ['Configure self-service', '5:30'],
      ['Designing a pulse survey', '4:20'],
    ],
  },
};

export const KB_MODULES: KbModule[] = MODULES.map((name, i) => {
  const doc = DOCS[name];
  const slug = slugify(name);
  return {
    name,
    slug,
    blurb: doc?.blurb ?? `Documentation and training material for the ${name} module.`,
    tagline: doc?.tagline ?? 'Documents and videos',
    docs: (doc?.docs ?? []).map(({ title, blurb, minutes, content }, d) => ({
      id: `${slug}-doc-${d + 1}`,
      title,
      blurb,
      minutes,
      content,
    })),
    videos: (doc?.videos ?? []).map(([title, duration], v) => ({
      id: `${slug}-vid-${v + 1}`,
      title,
      duration,
      url: `https://learn.zwayam.com/${slug}/${slugify(title)}`,
    })),
  };
});

export const moduleBySlug = (slug?: string): KbModule | undefined =>
  KB_MODULES.find((m) => m.slug === slug);

export const moduleByName = (name?: string): KbModule | undefined =>
  KB_MODULES.find((m) => m.name === name);

/** A document within a module, or undefined if either half of the pair does
 *  not exist. */
export const docById = (moduleSlug?: string, docId?: string) =>
  moduleBySlug(moduleSlug)?.docs.find((d) => d.id === docId);

/* --------------------------------------------------------------------------- */

export const NEWSLETTERS: Newsletter[] = [
  {
    id: 'NL-2026-07',
    title: 'Four new ways to move work forward',
    month: 'July 2026',
    date: '2026-07-02',
    summary:
      'AI-assisted review analysis, LinkedIn sourcing, a flexible benefits marketplace and a drag-and-drop report builder.',
    featureIds: ['FEAT-001', 'FEAT-002', 'FEAT-004', 'FEAT-011'],
  },
  {
    id: 'NL-2026-06',
    title: 'Scheduling that respects everyone’s calendar',
    month: 'June 2026',
    date: '2026-06-02',
    summary:
      'Panel availability sync, document retention policies, goal cascade templates and real-time payroll tax compliance.',
    featureIds: ['FEAT-013', 'FEAT-014', 'FEAT-015', 'FEAT-003'],
  },
  {
    id: 'NL-2026-05',
    title: 'Fewer surprises at the payroll cut-off',
    month: 'May 2026',
    date: '2026-05-05',
    summary:
      'Timesheet approval reminders, candidate feedback digests, learning path prerequisites and predictive turnover analytics.',
    featureIds: ['FEAT-016', 'FEAT-017', 'FEAT-018', 'FEAT-007'],
  },
  {
    id: 'NL-2026-04',
    title: 'Compliance, automated',
    month: 'April 2026',
    date: '2026-04-02',
    summary:
      'Automated compliance document generation and biometric time capture arrive across Core HR and Time Tracking.',
    featureIds: ['FEAT-010', 'FEAT-005'],
  },
];

/** Newest first. */
export const sortedNewsletters = (): Newsletter[] =>
  [...NEWSLETTERS].sort((a, b) => b.date.localeCompare(a.date));

export const newsletterById = (id?: string): Newsletter | undefined =>
  NEWSLETTERS.find((n) => n.id === id);

/** The newsletter issue for a release month, if one was sent - so a release
 *  note page can link back to it the same way the newsletter links forward. */
export const newsletterByMonth = (month: string): Newsletter | undefined =>
  NEWSLETTERS.find((n) => n.month === month);

/* --------------------------------------------------------------------------- */

/** Release notes, grouped by month and built from whatever the caller can see.
 *  Always pass `visibleFeatures`, never the raw list, or a draft leaks into a
 *  customer-facing surface. */
export const releaseNoteGroups = (features: Feature[]): ReleaseNoteGroup[] => {
  const byMonth = new Map<string, Feature[]>();
  features.forEach((f) => {
    if (!f.releaseMonth) return;
    const bucket = byMonth.get(f.releaseMonth);
    if (bucket) bucket.push(f);
    else byMonth.set(f.releaseMonth, [f]);
  });

  return sortReleaseMonths([...byMonth.keys()]).map((month) => {
    const rows = byMonth.get(month)!;
    // Every feature in a month shares its release date, so the earliest is it.
    const date = rows.map((f) => f.prodEnablementDate).sort()[0] ?? '';
    return {
      month,
      date,
      slug: releaseNoteSlug(month),
      features: rows,
      newCount: rows.filter((f) => f.featureTag === 'New Feature').length,
      enhancementCount: rows.filter((f) => f.featureTag !== 'New Feature').length,
      modules: [...new Set(rows.map((f) => f.productModule))].sort(),
    };
  });
};

/** One release note group by its slug, or undefined if nothing shipped that
 *  month (or the signed-in role cannot see anything that did). Always pass
 *  `visibleFeatures`, for the same reason `releaseNoteGroups` does. */
export const releaseNoteBySlug = (features: Feature[], slug?: string): ReleaseNoteGroup | undefined =>
  releaseNoteGroups(features).find((g) => g.slug === slug);

/* ---------------------------------------------------------------------------
   Release pitches: the customer-facing framing of a release, for the Overview.

   Written per release rather than derived, because "Make faster, data-driven
   decisions" is not something you can compute from a feature title. Any month
   without an entry falls back to its features, so a release nobody has written
   copy for - a draft month a creator is looking at, say - still reads properly
   instead of leaving a gap.
   --------------------------------------------------------------------------- */

export type PitchIcon = 'insight' | 'people' | 'controls';

export interface ReleasePitch {
  /** One sentence under the release name. */
  headline: string;
  /** Each benefit names the feature that delivers it, so the line can be
   *  opened. The Overview drops the link if that feature is not visible to the
   *  signed-in role rather than offering a dead end. */
  highlights: Array<{ title: string; sub: string; icon: PitchIcon; featureId: string }>;
}

const PITCHES: Record<string, ReleasePitch> = {
  'July 2026': {
    headline:
      'Smarter performance insights, easier candidate sourcing, and more flexibility for your teams.',
    highlights: [
      {
        title: 'Make faster, data-driven decisions',
        sub: 'New analytics and reporting capabilities',
        icon: 'insight',
        featureId: 'FEAT-001',
      },
      {
        title: 'Save time in hiring',
        sub: 'Enhanced sourcing with LinkedIn integration',
        icon: 'people',
        featureId: 'FEAT-002',
      },
      {
        title: 'More flexibility for your teams',
        sub: 'Custom reports and workflow improvements',
        icon: 'controls',
        featureId: 'FEAT-011',
      },
      /* July ships four features and all four are announced, so all four are
         written up. Without an entry here FEAT-004 would still appear - the
         highlights come from the flag now - but described by its own title and
         tag, which would read as the odd one out beside three benefit-led
         lines. The icon set has three members and the row has four, so one
         repeats; people is the apt one for benefits. */
      {
        title: 'Help people choose benefits with confidence',
        sub: 'Plan comparisons and cost calculators',
        icon: 'people',
        featureId: 'FEAT-004',
      },
    ],
  },
  'June 2026': {
    headline:
      'Scheduling that respects every calendar, retention you can defend, and goals that survive the cascade.',
    highlights: [
      {
        title: 'Stop interview invites colliding',
        sub: 'Panel availability read before slots are offered',
        icon: 'people',
        featureId: 'FEAT-013',
      },
      {
        title: 'Keep documents only as long as you should',
        sub: 'Retention policies with legal holds and an audit log',
        icon: 'controls',
        featureId: 'FEAT-014',
      },
      {
        title: 'See where a goal stopped travelling',
        sub: 'Cascade templates with org-wide coverage reporting',
        icon: 'insight',
        featureId: 'FEAT-015',
      },
    ],
  },
  'May 2026': {
    headline:
      'Fewer surprises at the payroll cut-off, and feedback that reaches the people who need it.',
    highlights: [
      {
        title: 'Approve timesheets before the deadline',
        sub: 'Reminders timed to the cut-off, with escalation',
        icon: 'controls',
        featureId: 'FEAT-016',
      },
      {
        title: 'Read one digest instead of five scorecards',
        sub: 'Interviewer notes collected, disagreement flagged',
        icon: 'people',
        featureId: 'FEAT-017',
      },
      {
        title: 'Spot turnover risk by team',
        sub: 'Predictive analytics on the signals you already hold',
        icon: 'insight',
        featureId: 'FEAT-007',
      },
    ],
  },
};

const ICONS: PitchIcon[] = ['insight', 'people', 'controls'];

/** The pitch for a release: a headline, and one highlight per announced
 *  feature.
 *
 *  The highlights are the release's announced features - the ones flagged for
 *  What's New - not a list written down here. PITCHES still supplies the
 *  headline and the curated wording for the features it names, but it no longer
 *  decides which features appear: un-flag one and it leaves the Overview, flag
 *  a fourth and it arrives. Curated entries keep their authored order and the
 *  rest follow, described by their own title and tag. */
export const releasePitch = (group: ReleaseNoteGroup): ReleasePitch => {
  const written = PITCHES[group.month];

  /* The flag and the cap, but not announcedIn's `published` gate. group.features
     is already built from the caller's visibleFeatures, so the role gate has
     been applied once - applying it again emptied the creator's own band, which
     leads with an unpublished release they are the only one who can see. */
  const announced = group.features.filter(isInWhatsNew).slice(0, WHATS_NEW_MAX);
  const announcedIds = new Set(announced.map((f) => f.id));

  /* A curated entry whose feature is no longer announced - or was pulled from
     the release - drops out rather than linking to something the band is not
     claiming to show. */
  const curated = (written?.highlights ?? []).filter((h) => announcedIds.has(h.featureId));
  const curatedIds = new Set(curated.map((h) => h.featureId));

  const highlights = [
    ...curated,
    ...announced
      .filter((f) => !curatedIds.has(f.id))
      .map((f, i) => ({
        title: f.title,
        sub: `${f.featureTag} · ${f.productModule}`,
        icon: ICONS[(curated.length + i) % ICONS.length],
        featureId: f.id,
      })),
  ];

  if (written) return { headline: written.headline, highlights };

  const parts: string[] = [];
  if (group.newCount) parts.push(plural(group.newCount, 'new feature'));
  if (group.enhancementCount) parts.push(plural(group.enhancementCount, 'enhancement'));

  return {
    headline: `${parts.join(' and ')} across ${group.modules.slice(0, 3).join(', ')}.`,
    highlights,
  };
};

/** "2 new features and 2 enhancements", counted from the announced set rather
 *  than written down. The three announcement surfaces used to state these
 *  numbers as literal prose, which the flag would have quietly falsified. */
export const announceSummary = (list: Feature[]): string => {
  const neu = list.filter((f) => f.featureTag === 'New Feature').length;
  const enh = list.length - neu;
  const parts: string[] = [];
  if (neu) parts.push(plural(neu, 'new feature'));
  if (enh) parts.push(plural(enh, 'enhancement'));
  return parts.join(' and ');
};

/** "4 new ways to move work forward". */
export const announceHeadline = (list: Feature[]): string =>
  `${list.length} new ${list.length === 1 ? 'way' : 'ways'} to move work forward`;
