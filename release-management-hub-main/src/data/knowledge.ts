import { MODULES, MONTH_NAMES, sortReleaseMonths } from '@/data/features';
import type { Feature } from '@/types/Feature';
import type { KbGroup, KbModule, Newsletter, ReleaseNoteGroup } from '@/types/Knowledge';

/* ---------------------------------------------------------------------------
   Knowledge Hub content.

   The module list is keyed to MODULES - the same taxonomy the feature table
   and the create form use - so "documentation for this feature's module" is a
   name lookup rather than a mapping table anyone has to maintain.

   Release notes and feature videos are NOT declared here. They are derived
   from the feature list further down, because the Release Management tab is
   already their source of truth.
   --------------------------------------------------------------------------- */

/** "1 document" / "2 documents". Counts appear beside a noun all over the hub,
 *  several of them legitimately reach 1. */
export const plural = (n: number, word: string, suffix = 's'): string =>
  `${n} ${word}${n === 1 ? '' : suffix}`;

export const slugify = (name: string): string =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Evergreen documents per module, keyed by module name. A module with no
 *  entry still gets a page - it leads with its features instead. */
const DOCS: Record<string, { blurb: string; tagline: string; docs: Array<[string, string, number]>; videos: Array<[string, string]> }> = {
  'Performance Management': {
    tagline: 'Reviews, goals and calibration',
    blurb: 'Review cycles, goals and calibration - how the appraisal process is set up and run end to end.',
    docs: [
      ['Setting up a review cycle', 'Cycle dates, participants, and the forms each audience sees.', 8],
      ['Goal frameworks and cascading', 'How objectives travel from company level down to an individual.', 12],
      ['Calibration sessions', 'Running a calibration, and what managers can and cannot change afterwards.', 6],
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
      ['Requisition approval chains', 'Approval routing by department, seniority and cost centre.', 9],
      ['Interview scheduling and panels', 'Panel setup, availability rules and candidate-facing booking.', 11],
      ['Offer templates and approvals', 'Building offer letters and the approvals that gate them.', 7],
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
      ['Open enrolment setup', 'Windows, eligibility rules and the employee enrolment experience.', 10],
      ['Life event processing', 'Qualifying events, evidence requirements and effective dates.', 6],
    ],
    videos: [['Run an open enrolment', '8:05']],
  },
  Analytics: {
    tagline: 'Dashboards and report building',
    blurb: 'Dashboards, report building and the data model behind every metric in the platform.',
    docs: [
      ['Report builder basics', 'Fields, filters, groupings and how to share what you build.', 8],
      ['Understanding the data model', 'Which objects join to which, and where each metric comes from.', 14],
      ['Scheduling and distributing reports', 'Recurring delivery, formats and access control.', 5],
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
      ['Employee record fields', 'Standard and custom fields, and who can see or edit each one.', 9],
      ['Org structure and reporting lines', 'Departments, cost centres, and handling matrix reporting.', 11],
      ['Document management and retention', 'Document types, retention policies and legal holds.', 7],
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
      ['Onboarding checklists', 'Task templates by role, location and start date.', 7],
      ['Pre-boarding and document collection', 'What new joiners complete before their first day.', 6],
    ],
    videos: [['Design an onboarding journey', '6:25']],
  },
  Payroll: {
    tagline: 'Pay runs, tax and reconciliation',
    blurb: 'Pay runs, tax compliance, timesheet inputs and post-payroll reporting.',
    docs: [
      ['Running a pay cycle', 'Inputs, validation, approvals and the point of no return.', 12],
      ['Tax compliance configuration', 'Jurisdictions, rates and how compliance updates are applied.', 10],
      ['Payroll reconciliation', 'Variance reports and the checks worth running every cycle.', 8],
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
      ['Building a learning path', 'Sequencing, prerequisites and completion criteria.', 8],
      ['Compliance training and renewals', 'Mandatory courses, deadlines and escalation.', 6],
    ],
    videos: [['Assign and track a learning path', '5:55']],
  },
  'Time Tracking': {
    tagline: 'Clocking, timesheets and shifts',
    blurb: 'Clocking, timesheets, shifts and the approval flow that feeds payroll.',
    docs: [
      ['Timesheet approval workflows', 'Approver hierarchies, deadlines and escalation rules.', 7],
      ['Shift patterns and rotas', 'Building patterns, coverage minimums and overtime limits.', 9],
    ],
    videos: [['Set up time capture', '6:40']],
  },
  'Employee Experience': {
    tagline: 'Self-service, surveys, wellness',
    blurb: 'Self-service, surveys, wellness and the everyday employee-facing surfaces.',
    docs: [
      ['Self-service portal configuration', 'What employees can see, request and change themselves.', 8],
      ['Running pulse surveys', 'Cadence, anonymity thresholds and acting on the results.', 7],
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
    docs: (doc?.docs ?? []).map(([title, blurb, minutes], d) => ({
      id: `${slug}-doc-${d + 1}`,
      title,
      blurb,
      minutes,
      url: `https://docs.zwayam.com/${slug}/${slugify(title)}`,
    })),
    videos: (doc?.videos ?? []).map(([title, duration], v) => ({
      id: `${slug}-vid-${v + 1}`,
      title,
      duration,
      url: `https://learn.zwayam.com/${slug}/${slugify(title)}`,
    })),
  };
});

/* ---------------------------------------------------------------------------
   Product groups.

   Ten module cards in one flat grid gave the reader no way in; grouping them
   by the part of the product they belong to does. Declared as names rather
   than as a field on each module so the grouping - and its order - is
   readable in one place.
   --------------------------------------------------------------------------- */

const GROUPS: Array<{ name: string; modules: string[] }> = [
  { name: 'Hiring', modules: ['Recruiting', 'Onboarding'] },
  { name: 'People', modules: ['Core HR', 'Employee Experience'] },
  {
    name: 'Performance & Learning',
    modules: ['Performance Management', 'Learning & Development'],
  },
  { name: 'Pay & Time', modules: ['Payroll', 'Time Tracking', 'Benefits'] },
  { name: 'Insights', modules: ['Analytics'] },
];

export const KB_GROUPS: KbGroup[] = (() => {
  const grouped = GROUPS.map(({ name, modules }) => ({
    name,
    modules: modules
      .map((n) => KB_MODULES.find((m) => m.name === n))
      .filter((m): m is KbModule => Boolean(m)),
  })).filter((g) => g.modules.length > 0);

  /* Anything added to MODULES but not named above still gets a home, so a new
     module can never quietly vanish from this page. */
  const placed = new Set(GROUPS.flatMap((g) => g.modules));
  const rest = KB_MODULES.filter((m) => !placed.has(m.name));
  return rest.length ? [...grouped, { name: 'More', modules: rest }] : grouped;
})();

export const moduleBySlug = (slug?: string): KbModule | undefined =>
  KB_MODULES.find((m) => m.slug === slug);

export const moduleByName = (name?: string): KbModule | undefined =>
  KB_MODULES.find((m) => m.name === name);

/* --------------------------------------------------------------------------- */

export const NEWSLETTERS: Newsletter[] = [
  {
    id: 'NL-2026-07',
    title: 'Four new ways to move work forward',
    month: 'July 2026',
    date: '2026-07-02',
    summary:
      'AI-assisted review analysis, LinkedIn sourcing, a flexible benefits marketplace and a drag-and-drop report builder.',
    url: 'https://news.zwayam.com/2026-07',
    featureIds: ['FEAT-001', 'FEAT-002', 'FEAT-004', 'FEAT-011'],
  },
  {
    id: 'NL-2026-06',
    title: 'Scheduling that respects everyone’s calendar',
    month: 'June 2026',
    date: '2026-06-02',
    summary:
      'Panel availability sync, document retention policies, goal cascade templates and real-time payroll tax compliance.',
    url: 'https://news.zwayam.com/2026-06',
    featureIds: ['FEAT-013', 'FEAT-014', 'FEAT-015', 'FEAT-003'],
  },
  {
    id: 'NL-2026-05',
    title: 'Fewer surprises at the payroll cut-off',
    month: 'May 2026',
    date: '2026-05-05',
    summary:
      'Timesheet approval reminders, candidate feedback digests, learning path prerequisites and predictive turnover analytics.',
    url: 'https://news.zwayam.com/2026-05',
    featureIds: ['FEAT-016', 'FEAT-017', 'FEAT-018', 'FEAT-007'],
  },
  {
    id: 'NL-2026-04',
    title: 'Compliance, automated',
    month: 'April 2026',
    date: '2026-04-02',
    summary:
      'Automated compliance document generation and biometric time capture arrive across Core HR and Time Tracking.',
    url: 'https://news.zwayam.com/2026-04',
    featureIds: ['FEAT-010', 'FEAT-005'],
  },
];

/** Newest first. */
export const sortedNewsletters = (): Newsletter[] =>
  [...NEWSLETTERS].sort((a, b) => b.date.localeCompare(a.date));

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
      url: `https://docs.zwayam.com/releases/${date.slice(0, 7)}/release-notes`,
      features: rows,
      newCount: rows.filter((f) => f.featureTag === 'New Feature').length,
      enhancementCount: rows.filter((f) => f.featureTag !== 'New Feature').length,
      modules: [...new Set(rows.map((f) => f.productModule))].sort(),
    };
  });
};

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

/** The pitch for a release, or one built from its own features. */
export const releasePitch = (group: ReleaseNoteGroup): ReleasePitch => {
  const written = PITCHES[group.month];
  if (written) return written;

  const parts: string[] = [];
  if (group.newCount) parts.push(plural(group.newCount, 'new feature'));
  if (group.enhancementCount) parts.push(plural(group.enhancementCount, 'enhancement'));
  const icons: PitchIcon[] = ['insight', 'people', 'controls'];

  return {
    headline: `${parts.join(' and ')} across ${group.modules.slice(0, 3).join(', ')}.`,
    highlights: group.features.slice(0, 3).map((f, i) => ({
      title: f.title,
      sub: `${f.featureTag} · ${f.productModule}`,
      icon: icons[i % icons.length],
      featureId: f.id,
    })),
  };
};

/** "July 2026" -> "2026-07-01", for sorting a month against an ISO date. */
export const monthToIso = (month: string): string => {
  const [name, year] = month.split(' ');
  const i = MONTH_NAMES.indexOf(name);
  return i < 0 ? '' : `${year}-${String(i + 1).padStart(2, '0')}-01`;
};
