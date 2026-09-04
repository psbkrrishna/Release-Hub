import { MODULES, MONTH_NAMES, sortReleaseMonths } from '@/data/features';
import type { Feature } from '@/types/Feature';
import type { KbModule, Newsletter, ReleaseNoteGroup } from '@/types/Knowledge';

/* ---------------------------------------------------------------------------
   Knowledge Hub content.

   The module list is keyed to MODULES - the same taxonomy the feature table
   and the create form use - so "documentation for this feature's module" is a
   name lookup rather than a mapping table anyone has to maintain.

   Release notes and feature videos are NOT declared here. They are derived
   from the feature list further down, because the Release Management tab is
   already their source of truth.
   --------------------------------------------------------------------------- */

/** "1 guide" / "2 guides". Counts appear beside a noun all over the hub, and
 *  several of them legitimately reach 1. */
export const plural = (n: number, word: string, suffix = 's'): string =>
  `${n} ${word}${n === 1 ? '' : suffix}`;

export const slugify = (name: string): string =>
  name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Five badge tones across ten modules. Assigned by position so a new module
   picks up a tone without anyone choosing one. */
const TONES = ['brand', 'green', 'purple', 'amber', 'neutral'] as const;

/** Evergreen guides per module, keyed by module name. A module with no entry
 *  still gets a page - it just leads with its features instead of its guides. */
const GUIDES: Record<string, { blurb: string; tagline: string; docs: Array<[string, string, number]>; videos: Array<[string, string]> }> = {
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
  const guide = GUIDES[name];
  const slug = slugify(name);
  return {
    name,
    slug,
    tone: TONES[i % TONES.length],
    blurb: guide?.blurb ?? `Documentation and training material for the ${name} module.`,
    tagline: guide?.tagline ?? 'Guides and videos',
    docs: (guide?.docs ?? []).map(([title, blurb, minutes], d) => ({
      id: `${slug}-doc-${d + 1}`,
      title,
      blurb,
      minutes,
      url: `https://docs.zwayam.com/${slug}/${slugify(title)}`,
    })),
    videos: (guide?.videos ?? []).map(([title, duration], v) => ({
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

/** "July 2026" -> "2026-07-01", for sorting a month against an ISO date. */
export const monthToIso = (month: string): string => {
  const [name, year] = month.split(' ');
  const i = MONTH_NAMES.indexOf(name);
  return i < 0 ? '' : `${year}-${String(i + 1).padStart(2, '0')}-01`;
};
