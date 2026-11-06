import { allFeatures, moduleOf } from '@/data/features';
import type { Feature } from '@/types/Feature';
import type { Customer, FeatureEvent, Tier, UsageUser } from '@/types/Usage';

/* ---------------------------------------------------------------------------
   Mock usage data.

   Deterministic: the same seed produces the same customers, users and events
   on every load, so a number someone quotes in a meeting is still there when
   they open the page again. Nothing here is random at render time.

   Calibrated: for every released feature, the last 30 days reproduce the four
   numbers the Releases table shows - enabled customers, active customers, MAU
   and DAU - exactly. Clicking "45" on the Releases page has to open a page that
   says 45, or neither number is trusted.

   Swappable: the page reads this only through data/usage/query.ts. A real
   events API replaces this file and leaves the selectors' signatures alone.
   --------------------------------------------------------------------------- */

/** The day the data runs up to. Fixed rather than "today" so the calibrated
 *  last-30-days window is the same window on every load. */
export const USAGE_AS_OF = '2026-11-03';

/** How many days of history exist - enough for the 12-month period. */
export const DAYS = 365;

const DAY_MS = 86_400_000;
const utc = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const DAY0 = utc(USAGE_AS_OF) - (DAYS - 1) * DAY_MS;

/** Day index of an ISO date; 0 is the first day of history, DAYS - 1 is
 *  USAGE_AS_OF. UTC throughout, so no daylight-saving day goes missing. */
export const dayOf = (iso: string) => Math.round((utc(iso) - DAY0) / DAY_MS);

export const isoOfDay = (day: number) => {
  const d = new Date(DAY0 + day * DAY_MS);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
};

const isWeekend = (day: number) => {
  const wd = new Date(DAY0 + day * DAY_MS).getUTCDay();
  return wd === 0 || wd === 6;
};

/* ---- Seeded randomness ---------------------------------------------------- */

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** mulberry32 - small, fast, and good enough for mock data. */
const rngFor = (seed: string) => {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type Rng = () => number;
const between = (r: Rng, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T,>(r: Rng, list: readonly T[]) => list[Math.floor(r() * list.length)];
const shuffled = <T,>(r: Rng, list: readonly T[]) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/* ---- Customers and users -------------------------------------------------- */

const CUSTOMER_COUNT = 120;

const INDUSTRIES: Array<[string, string[]]> = [
  ['Retail', ['Retail', 'Stores', 'Mart']],
  ['Logistics', ['Logistics', 'Freight', 'Couriers']],
  ['Healthcare', ['Health', 'Hospitals', 'Clinics']],
  ['Energy', ['Energy', 'Power']],
  ['Technology', ['Technologies', 'Systems', 'Labs', 'Software']],
  ['Manufacturing', ['Industries', 'Manufacturing', 'Motors']],
  ['Financial services', ['Finance', 'Capital', 'Bank']],
  ['Education', ['Learning', 'Academy']],
  ['Hospitality', ['Hotels', 'Hospitality']],
];

const PREFIXES = [
  'Acme', 'Greyline', 'Sundar', 'Lakeshore', 'Vantage', 'Indus', 'Crescent', 'Summit', 'Harbor',
  'Pinnacle', 'Evergreen', 'Silverline', 'Redwood', 'Orion', 'Nimbus', 'Coral', 'Granite', 'Saffron',
  'Monsoon', 'Tidal', 'Aurora', 'Falcon', 'Quartz', 'Banyan', 'Cobalt', 'Horizon', 'Deccan', 'Ember',
  'Amber', 'Apex', 'Arcadia', 'Beacon', 'Birch', 'Cedar', 'Citadel', 'Delta', 'Driftwood', 'Garnet',
  'Glacier', 'Halcyon', 'Ironwood', 'Jasper', 'Juniper', 'Kestrel', 'Lotus', 'Maple', 'Marigold',
  'Meadow', 'Northstar', 'Oakridge', 'Onyx', 'Opal', 'Prism', 'Raven', 'Sapphire', 'Sequoia', 'Sierra',
  'Solstice', 'Spruce', 'Starling', 'Teak', 'Terra', 'Thar', 'Trident', 'Willow', 'Zenith',
];
/** No prefix more than this many times, so the customer list doesn't read as
 *  five branches of one company. */
const PREFIX_MAX = 2;

/** The accounts the implementation queue (supportQueue in data/features)
 *  already names keep their names, so the two pages talk about the same
 *  customers. */
const KNOWN_INDUSTRY: Record<string, string> = {
  GreyOrange: 'Technology',
  'Northwind Retail': 'Retail',
  'Kaveri Logistics': 'Logistics',
  'Meridian Health': 'Healthcare',
  'Bluepeak Energy': 'Energy',
};

const CSMS = [
  'Ananya Rao', 'Rahul Mehta', 'Priya Nair', 'Karthik Iyer',
  'Sneha Kulkarni', 'Vikram Shah', 'Divya Menon', 'Arjun Reddy',
];
/** Stands in until the company's users exist to pick a SPOC from. */
const NO_SPOC: Customer['spoc'] = { userId: '', name: '', role: '', email: '' };
const REGIONS = ['India', 'India', 'India', 'APAC', 'Middle East', 'Europe', 'North America'];

const FIRST = [
  'Aarav', 'Aditi', 'Akash', 'Anjali', 'Arjun', 'Deepa', 'Farhan', 'Gauri', 'Harsh', 'Isha',
  'Jaya', 'Kabir', 'Kavya', 'Lakshmi', 'Manish', 'Meera', 'Neha', 'Nikhil', 'Pooja', 'Rohan',
  'Sanjay', 'Shreya', 'Tara', 'Varun', 'Zoya', 'Daniel', 'Sarah', 'Omar', 'Lina', 'Mei',
  'James', 'Fatima', 'Lucas', 'Elena', 'Ravi', 'Swati', 'Imran', 'Nandini', 'Vivek', 'Asha',
];
const LAST = [
  'Sharma', 'Iyer', 'Patel', 'Reddy', 'Nair', 'Gupta', 'Kumar', 'Singh', 'Das', 'Joshi',
  'Menon', 'Bose', 'Kapoor', 'Rao', 'Chopra', 'Pillai', 'Khan', 'Fernandes', 'Mehta', 'Ghosh',
  'Thomas', 'Wong', 'Haddad', 'Silva', 'Novak', 'Ali', 'Varma', 'Saxena', 'Bhat', 'Desai',
];
const ROLES = [
  'Employee', 'Employee', 'Employee', 'People manager', 'People manager', 'HR admin',
  'HR business partner', 'Recruiter', 'Hiring manager', 'Payroll admin', 'L&D lead', 'HR operations',
];

const USERS_BY_TIER: Record<Tier, [number, number]> = {
  Enterprise: [70, 110],
  'Mid-market': [35, 60],
  Growth: [15, 30],
};

/* ---- Events per feature --------------------------------------------------- */

/** What people do inside each feature, most common first. Plain verbs, because
 *  the people reading this page sell and support the product - they don't
 *  read event schemas. */
const EVENT_LABELS: Record<string, [string, string, string]> = {
  'FEAT-001': ['Generated review summary', 'Opened theme insights', 'Shared coaching suggestion'],
  'FEAT-002': ['Imported LinkedIn profile', 'Ran candidate match', 'Bulk imported candidates'],
  'FEAT-003': ['Ran compliance check', 'Reviewed tax exception', 'Exported audit trail'],
  'FEAT-004': ['Compared plans', 'Used cost calculator', 'Enrolled in a plan'],
  'FEAT-005': ['Clocked in with face match', 'Clocked out with face match', 'Resolved a failed match'],
  'FEAT-006': ['Generated learning path', 'Started recommended course', 'Completed a path step'],
  'FEAT-007': ['Viewed team risk', 'Opened risk factors', 'Exported risk report'],
  'FEAT-008': ['Submitted survey response', 'Launched pulse survey', 'Viewed survey results'],
  'FEAT-009': ['Viewed payslip', 'Applied for leave', 'Updated personal details'],
  'FEAT-010': ['Generated document', 'Regenerated document', 'Downloaded document'],
  'FEAT-011': ['Ran a saved report', 'Built a report', 'Scheduled a report'],
  'FEAT-012': ['Completed onboarding task', 'Started onboarding workflow', 'Reassigned a task'],
  'FEAT-013': ['Proposed interview slots', 'Held a provisional slot', 'Confirmed interview'],
  'FEAT-014': ['Viewed deletion log', 'Applied legal hold', 'Ran retention job'],
  'FEAT-015': ['Adapted a cascaded goal', 'Viewed coverage map', 'Published company goal'],
  'FEAT-016': ['Approved from reminder', 'Sent approval reminder', 'Snoozed a reminder'],
  'FEAT-017': ['Opened feedback digest', 'Nudged an interviewer', 'Shared digest with team'],
  'FEAT-018': ['Enrolled after prerequisites', 'Added a prerequisite', 'Requested a waiver'],
};
const GENERIC_EVENTS: [string, string, string] = ['Opened the feature', 'Completed an action', 'Exported results'];
const EVENT_WEIGHTS = [0.55, 0.3, 0.15];

/* ---- Output shape --------------------------------------------------------- */

export interface UsageFeature {
  id: string;
  title: string;
  module: string;
  releaseDay: number;
  releaseMonth: string;
  published: boolean;
}

export interface UsageData {
  customers: Customer[];
  users: UsageUser[];
  /** Customer index of each user, by user index. */
  userCustomer: Uint16Array;
  features: UsageFeature[];
  events: FeatureEvent[];
  /** Feature index of each event, by event index. */
  eventFeature: Uint16Array;
  /** Day each customer switched each feature on, or -1. Indexed
   *  feature * customers + customer. */
  enabledDay: Int16Array;
  /** 1 where a customer could switch a feature on but hasn't. Same indexing. */
  eligible: Uint8Array;
  /** One row per user, day and event: parallel arrays, `count` long. */
  factDay: Uint16Array;
  factUser: Uint16Array;
  factEvent: Uint16Array;
  factCount: Uint8Array;
  count: number;
}

/* ---- Generation ----------------------------------------------------------- */

type Shape = 'growing' | 'steady' | 'declining';

interface Profile {
  /** Chance of using the feature on a working day, before scaling. */
  p: number;
  /** Extra events on a day they do use it. */
  intensity: number;
}

const profileFor = (r: Rng): Profile => {
  const x = r();
  if (x < 0.1) return { p: 0.35 + r() * 0.25, intensity: 6 + r() * 6 };
  if (x < 0.35) return { p: 0.08 + r() * 0.12, intensity: 2 + r() * 3 };
  return { p: 0.02 + r() * 0.04, intensity: r() * 2 };
};

/** Splits `total` across slots in proportion to weight, at least one each and
 *  never more than a slot's cap. Exact: the parts always sum to `total` when
 *  the caps allow it. */
const allocate = (total: number, weights: number[], caps: number[]) => {
  const out = weights.map(() => 1);
  let left = total - out.length;
  while (left > 0) {
    const open = out.map((v, i) => i).filter((i) => out[i] < caps[i]);
    if (!open.length) break;
    const w = open.reduce((s, i) => s + weights[i], 0);
    let given = 0;
    for (const i of open) {
      const share = Math.min(caps[i] - out[i], Math.floor((left * weights[i]) / w));
      out[i] += share;
      given += share;
    }
    left -= given;
    if (given === 0) {
      // The shares rounded to nothing; hand out the rest one at a time.
      const byWeight = [...open].sort((a, b) => weights[b] - weights[a]);
      for (const i of byWeight) {
        if (left === 0) break;
        out[i] += 1;
        left -= 1;
      }
    }
  }
  return out;
};

const generate = (): UsageData => {
  const r = rngFor('zwayam-usage');
  const END = DAYS - 1;
  const WIN = END - 29; // first day of the calibrated last-30-days window

  /* Customers. */
  const names = new Set<string>(Object.keys(KNOWN_INDUSTRY));
  const customers: Customer[] = [];
  const tierOf = (): Tier => {
    const x = r();
    return x < 0.3 ? 'Enterprise' : x < 0.7 ? 'Mid-market' : 'Growth';
  };
  for (const [name, industry] of Object.entries(KNOWN_INDUSTRY)) {
    customers.push({ id: '', name, industry, tier: tierOf(), csm: pick(r, CSMS), region: pick(r, REGIONS), spoc: NO_SPOC });
  }
  const prefixUses = new Map<string, number>();
  while (customers.length < CUSTOMER_COUNT) {
    const [industry, suffixes] = pick(r, INDUSTRIES);
    const prefix = pick(r, PREFIXES);
    const name = `${prefix} ${pick(r, suffixes)}`;
    if (names.has(name) || (prefixUses.get(prefix) ?? 0) >= PREFIX_MAX) continue;
    names.add(name);
    prefixUses.set(prefix, (prefixUses.get(prefix) ?? 0) + 1);
    customers.push({ id: '', name, industry, tier: tierOf(), csm: pick(r, CSMS), region: pick(r, REGIONS), spoc: NO_SPOC });
  }
  customers.forEach((c, i) => { c.id = `CUS-${String(i + 1).padStart(3, '0')}`; });

  /* Users, grouped by customer so a customer's users are a contiguous run. */
  const users: UsageUser[] = [];
  const customerUsers: number[][] = [];
  customers.forEach((c, ci) => {
    const [lo, hi] = USERS_BY_TIER[c.tier];
    const n = between(r, lo, hi);
    const list: number[] = [];
    for (let k = 0; k < n; k++) {
      list.push(users.length);
      users.push({
        id: `U-${String(users.length + 1).padStart(5, '0')}`,
        customerId: c.id,
        name: `${pick(r, FIRST)} ${pick(r, LAST)}`,
        role: pick(r, ROLES),
      });
    }
    customerUsers.push(list);
  });
  const userCustomer = new Uint16Array(users.length);
  customerUsers.forEach((list, ci) => list.forEach((u) => { userCustomer[u] = ci; }));

  /* Each company's SPOC is one of its own users - the first HR admin, else
     the first in HR operations, else whoever is first. Chosen by rule, not by
     the random stream, so adding it moved none of the calibrated numbers. */
  customers.forEach((c, ci) => {
    const list = customerUsers[ci].map((u) => users[u]);
    const spoc =
      list.find((u) => u.role === 'HR admin') ?? list.find((u) => u.role === 'HR operations') ?? list[0];
    const domain = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
    c.spoc = {
      userId: spoc.id,
      name: spoc.name,
      role: spoc.role,
      email: `${spoc.name.toLowerCase().replace(/\s+/g, '.')}@${domain}.com`,
    };
  });

  /* Features and their events. */
  const source: Feature[] = allFeatures;
  const features: UsageFeature[] = source.map((f) => ({
    id: f.id,
    title: f.title,
    module: moduleOf(f.productModule),
    releaseDay: dayOf(f.prodEnablementDate),
    releaseMonth: f.releaseMonth,
    published: f.published,
  }));
  const events: FeatureEvent[] = [];
  const featureEvents: number[][] = [];
  features.forEach((f) => {
    const labels = EVENT_LABELS[f.id] ?? GENERIC_EVENTS;
    featureEvents.push(labels.map((label, k) => {
      events.push({ key: `${f.id}.${k + 1}`, featureId: f.id, label });
      return events.length - 1;
    }));
  });
  const eventFeature = new Uint16Array(events.length);
  featureEvents.forEach((list, fi) => list.forEach((e) => { eventFeature[e] = fi; }));

  const NC = customers.length;
  const enabledDay = new Int16Array(features.length * NC).fill(-1);
  const eligible = new Uint8Array(features.length * NC);

  const fDay: number[] = [];
  const fUser: number[] = [];
  const fEvent: number[] = [];
  const fCount: number[] = [];

  /** Turns one user-day into one or two event rows. */
  const emit = (fr: Rng, day: number, user: number, evs: number[], prof: Profile) => {
    const pickEvent = () => {
      const x = fr();
      let acc = 0;
      for (let k = 0; k < evs.length; k++) {
        acc += EVENT_WEIGHTS[k] ?? 0;
        if (x < acc) return evs[k];
      }
      return evs[0];
    };
    const first = pickEvent();
    fDay.push(day); fUser.push(user); fEvent.push(first);
    fCount.push(1 + Math.floor(fr() * (prof.intensity + 1)));
    if (fr() < 0.35) {
      const second = pickEvent();
      if (second !== first) {
        fDay.push(day); fUser.push(user); fEvent.push(second);
        fCount.push(1 + Math.floor(fr() * (prof.intensity / 2 + 1)));
      }
    }
  };

  source.forEach((f, fi) => {
    const fr = rngFor(f.id);
    const E = f.published ? f.enabledCustomers ?? 0 : 0;
    const A = Math.min(E, f.activeCustomers ?? 0);
    const M = f.mauLast30Days ?? 0;
    const T = Math.round((f.dauLast30DayAvg ?? 0) * 30); // user-days in the window
    const release = Math.max(0, features[fi].releaseDay);
    const order = shuffled(fr, customers.map((_, i) => i));

    /* Eligibility for everyone who hasn't switched it on yet. */
    if (f.published) {
      order.slice(E).forEach((ci) => { if (fr() < 0.65) eligible[fi * NC + ci] = 1; });
    }
    if (!E) return;

    /* Who switched it on, and when. Most in the first weeks after release,
       a tail later - but always before the window, so "enabled but not used"
       means a month or more of silence. */
    const latest = Math.max(release, WIN - 6);
    const enabled = order.slice(0, E);
    enabled.forEach((ci) => {
      const x = fr();
      enabledDay[fi * NC + ci] = release + Math.floor(x * x * (latest - release));
    });

    const mixed = shuffled(fr, enabled);
    const active = mixed.slice(0, A);
    const inactive = mixed.slice(A);
    const evs = featureEvents[fi];

    /* Monthly active users per active customer, in proportion to size. */
    const caps = active.map((ci) => customerUsers[ci].length);
    const perCustomer = allocate(M, caps.map((cap) => cap * (0.4 + fr())), caps);

    type Member = { user: number; prof: Profile; ci: number; shape: Shape; join: number };
    const members: Member[] = [];
    active.forEach((ci, k) => {
      const x = fr();
      const shape: Shape = x < 0.35 ? 'growing' : x < 0.75 ? 'steady' : 'declining';
      const start = enabledDay[fi * NC + ci];
      const span = Math.max(1, WIN - start);
      const chosen = shuffled(fr, customerUsers[ci]).slice(0, perCustomer[k]);
      const profiles = chosen.map(() => profileFor(fr)).sort((a, b) => b.p - a.p);
      chosen.forEach((user, rank) => {
        const join =
          shape === 'growing'
            ? start + Math.floor(Math.pow((rank + 1) / chosen.length, 0.7) * span * 0.85)
            : start + Math.floor(fr() * Math.min(shape === 'steady' ? 21 : 14, span));
        members.push({ user, prof: profiles[rank], ci, shape, join });
      });
    });

    /* Scale everyone's rate so the window lands near its target before the
       exact correction below - otherwise the correction would distort the
       window against the history behind it. */
    const expected = members.reduce((s, m) => s + m.prof.p * 23.6, 0);
    const scale = expected > 0 ? T / expected : 1;
    const rate = (m: Member) => Math.min(0.9, m.prof.p * scale);

    /* The window: each member's active days, then corrected to exactly T. */
    const windowDays: number[][] = members.map((m) => {
      const days: number[] = [];
      for (let d = WIN; d <= END; d++) {
        const p = rate(m) * (isWeekend(d) ? 0.25 : 1);
        if (fr() < p) days.push(d);
      }
      if (!days.length) days.push(WIN + Math.floor(fr() * 30));
      return days;
    });
    let total = windowDays.reduce((s, d) => s + d.length, 0);
    let guard = 0;
    while (total !== T && guard++ < 200_000) {
      const i = Math.floor(fr() * members.length);
      const days = windowDays[i];
      if (total < T) {
        if (days.length >= 30) continue;
        // Busy people get the extra days.
        if (fr() > rate(members[i]) * 2 + 0.05) continue;
        const d = WIN + Math.floor(fr() * 30);
        if (days.includes(d)) continue;
        days.push(d);
        total += 1;
      } else {
        if (days.length < 2) continue;
        days.splice(Math.floor(fr() * days.length), 1);
        total -= 1;
      }
    }
    members.forEach((m, i) => windowDays[i].forEach((d) => emit(fr, d, m.user, evs, m.prof)));

    /* History before the window, shaped per customer. */
    members.forEach((m) => {
      const start = enabledDay[fi * NC + m.ci];
      const span = Math.max(1, WIN - start);
      for (let d = Math.max(m.join, start); d < WIN; d++) {
        const x = (d - start) / span;
        const ramp =
          m.shape === 'growing'
            ? 0.35 + 0.65 * x
            : m.shape === 'declining'
              ? d - start < 14 ? 0.5 + ((d - start) / 14) * 1.4 : 1.9
              : 1;
        const p = Math.min(0.95, rate(m) * ramp) * (isWeekend(d) ? 0.25 : 1);
        if (fr() < p) emit(fr, d, m.user, evs, m.prof);
      }
    });

    /* Enabled but silent this month: half used it for a while and stopped,
       half never started. */
    inactive.forEach((ci, k) => {
      if (k % 2 === 1) return;
      const start = enabledDay[fi * NC + ci];
      const stop = WIN - 1 - Math.floor(fr() * 60);
      if (stop < start + 7) return;
      const pool = customerUsers[ci];
      const chosen = shuffled(fr, pool).slice(0, Math.max(1, Math.round(pool.length * (0.08 + fr() * 0.15))));
      chosen.forEach((user) => {
        const prof = profileFor(fr);
        const p = Math.min(0.9, prof.p * scale * 0.8);
        for (let d = start + Math.floor(fr() * 10); d <= stop; d++) {
          if (fr() < p * (isWeekend(d) ? 0.25 : 1)) emit(fr, d, user, evs, prof);
        }
      });
    });
  });

  return {
    customers,
    users,
    userCustomer,
    features,
    events,
    eventFeature,
    enabledDay,
    eligible,
    factDay: Uint16Array.from(fDay),
    factUser: Uint16Array.from(fUser),
    factEvent: Uint16Array.from(fEvent),
    factCount: Uint8Array.from(fCount.map((c) => Math.min(255, c))),
    count: fDay.length,
  };
};

let cache: UsageData | null = null;

/** Built on first use and kept - generation takes a moment, and only the
 *  adoption page needs it. */
export const usageData = (): UsageData => (cache ??= generate());
