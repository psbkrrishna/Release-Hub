import { T } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Support tickets, as the Home C design surfaces them: an "Active tickets"
   table on the Overview, "Track tickets" and "Create ticket" in the hero, and
   a full list behind "View all".

   The raw status is what the support desk reports. Customers read it through
   three groups - waiting on them, being worked on, done - so the colour says
   whose move it is, and the label keeps the desk's own wording.
   --------------------------------------------------------------------------- */

export type TicketRaw = 'Open' | 'In Progress' | 'Pending - Client' | 'Resolved' | 'Closed';
export type TicketGroup = 'waiting' | 'progress' | 'resolved';

export interface Ticket {
  id: string;
  title: string;
  raw: TicketRaw;
  /** ISO date-time. */
  created: string;
  updated: string;
  /** Where it was raised. */
  via: 'Portal' | 'Email' | 'Zēva';
  module: string;
  /** The conversation, oldest first: [who, message]. */
  chat: Array<[string, string]>;
  /** Raised in this session, so it is not one of the tickets waiting on support. */
  fresh?: boolean;
}

export const groupOf = (raw: TicketRaw): TicketGroup =>
  raw === 'Pending - Client' ? 'waiting' : raw === 'Resolved' || raw === 'Closed' ? 'resolved' : 'progress';

/** Sort order: the customer's own move first, then open work, then done. */
const GROUP_ORDER: Record<TicketGroup, number> = { waiting: 0, progress: 1, resolved: 2 };

export const TICKET_STATUS: Record<TicketGroup, { tip: string; bg: string; fg: string; bd: string }> = {
  waiting: { tip: 'Support needs a reply from you', bg: T.warnSoft, fg: T.warnText, bd: T.warnBorder },
  progress: { tip: 'Support is working on it', bg: T.brandSoft, fg: T.brand, bd: T.brandBorder },
  resolved: { tip: 'Answered or fixed', bg: T.succSoft, fg: T.succText, bd: T.succBorder },
};

export const sortTickets = (list: Ticket[]): Ticket[] =>
  [...list].sort(
    (a, b) => GROUP_ORDER[groupOf(a.raw)] - GROUP_ORDER[groupOf(b.raw)] || b.updated.localeCompare(a.updated),
  );

/** "3 Nov 2026" */
export const fmtTicketDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
};

/** "3 Nov 2026, 4:20 PM" */
export const fmtTicketDateTime = (iso: string): string => {
  const d = new Date(iso);
  return `${fmtTicketDate(iso)}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

export const seedTickets = (): Ticket[] => [
  {
    id: '48213',
    title: 'Interview panel invites not reaching external panelists',
    raw: 'Pending - Client',
    created: '2026-11-02T10:12:00',
    updated: '2026-11-09T16:40:00',
    via: 'Portal',
    module: 'Recruiting',
    chat: [
      ['You', 'Panelists outside our domain are not receiving calendar invites for scheduled interviews.'],
      ['Support', 'Thanks for flagging this. Could you share one requisition ID where it happened, and the panelist email domain?'],
    ],
  },
  {
    id: '48190',
    title: 'Offer letter template is not picking up the joining bonus field',
    raw: 'In Progress',
    created: '2026-10-29T09:05:00',
    updated: '2026-11-08T11:15:00',
    via: 'Email',
    module: 'Recruiting',
    chat: [
      ['You', 'The joining bonus placeholder renders blank in the generated offer letter.'],
      ['Support', 'We can reproduce this on templates created before the August release. Engineering is looking at the merge field mapping.'],
    ],
  },
  {
    id: '48177',
    title: 'Bulk upload of candidates fails for files above 5,000 rows',
    raw: 'Open',
    created: '2026-11-06T14:22:00',
    updated: '2026-11-06T14:22:00',
    via: 'Zēva',
    module: 'Recruiting',
    chat: [['You', 'Bulk upload stops at around 5,000 rows with a generic error.']],
  },
  {
    id: '48102',
    title: 'Performance review cycle shows the wrong reviewer for two employees',
    raw: 'In Progress',
    created: '2026-10-21T12:00:00',
    updated: '2026-11-04T09:30:00',
    via: 'Portal',
    module: 'Performance Management',
    chat: [
      ['You', 'Two employees in the Pune office show their previous manager as reviewer.'],
      ['Support', 'The reporting line sync ran before the org change. We are re-running it for your tenant tonight.'],
    ],
  },
  {
    id: '47988',
    title: 'Custom report export times out for the full year',
    raw: 'Resolved',
    created: '2026-10-10T08:45:00',
    updated: '2026-10-18T17:05:00',
    via: 'Portal',
    module: 'Analytics',
    chat: [
      ['You', 'Exporting the hiring funnel report for Jan to Dec times out.'],
      ['Support', 'Exports over 12 months now run in the background and arrive by email. This is live for your account.'],
    ],
  },
  {
    id: '47901',
    title: 'How do I add a new approval level to requisitions?',
    raw: 'Closed',
    created: '2026-09-30T15:10:00',
    updated: '2026-10-02T10:00:00',
    via: 'Zēva',
    module: 'Recruiting',
    chat: [
      ['You', 'We need a finance approval step after the hiring manager.'],
      ['Support', 'You can add it under Configure, Requisition, Approval chains. Here is the guide.'],
    ],
  },
];
