import { DAYS, dayOf, isoOfDay, usageData, type UsageData } from '@/data/usage/generate';
import type {
  AdoptionFilters, AdoptionList, Level, Period, TrendMetric, UsageStatus,
} from '@/types/Usage';
import { only } from '@/types/Usage';

/* ---------------------------------------------------------------------------
   Selectors over the usage data - the one interface the adoption page reads.

   Every selector takes the same filters and answers from a single pass over
   the events (`scan`), cached per filter set, so the KPI row, the trend and the
   table always describe exactly the same slice. A real API would implement
   these signatures and nothing on the page would change.
   --------------------------------------------------------------------------- */

/* ---- Periods --------------------------------------------------------------
   A period is either relative - "30d", the last 30 days - or exact -
   "2026-08-01~2026-09-15". Either way it is bounded to the data window (the
   last DAYS days), and compared with the same number of days just before it. */

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** The days a period covers, as day indexes, and how many there are. */
export const periodRange = (p: Period): { start: number; end: number; n: number } => {
  const last = DAYS - 1;
  const rel = /^(\d{1,3})d$/.exec(p);
  if (rel) {
    const n = Math.min(DAYS, Math.max(1, Number(rel[1])));
    return { start: last - n + 1, end: last, n };
  }
  const [a, b] = p.split('~');
  if (ISO.test(a ?? '') && ISO.test(b ?? '')) {
    const start = Math.max(0, dayOf(a));
    const end = Math.min(last, dayOf(b));
    if (start <= end) return { start, end, n: end - start + 1 };
  }
  return { start: last - 29, end: last, n: 30 };
};

/** Whether a period string is one this data can answer. */
export const isValidPeriod = (p: string) => {
  const rel = /^(\d{1,3})d$/.exec(p);
  if (rel) return Number(rel[1]) >= 1 && Number(rel[1]) <= DAYS;
  const [a, b] = p.split('~');
  if (!ISO.test(a ?? '') || !ISO.test(b ?? '')) return false;
  return dayOf(a) >= 0 && dayOf(b) <= DAYS - 1 && dayOf(a) <= dayOf(b);
};

export const isRelative = (p: Period) => /^\d{1,3}d$/.test(p);

/** "Last 30 days", or "Aug 1 to Sep 15". */
export const periodLabel = (p: Period) => {
  const { start, end, n } = periodRange(p);
  return isRelative(p) ? `Last ${n} days` : `${shortDate(isoOfDay(start))} to ${shortDate(isoOfDay(end))}`;
};

/** The length, for "vs previous 30 days". */
export const periodWord = (p: Period) => `${periodRange(p).n} days`;

/** The first and last day there is data for. */
export const dataWindow = () => ({ first: isoOfDay(0), last: isoOfDay(DAYS - 1) });

/** Usage at or above this change, period on period, counts as growing. */
const GROWING = 0.15;
/** Usage at or below this change counts as declining. */
const DECLINING = -0.25;
/** The share of a customer's active users counted as its power users. */
const POWER_SHARE = 0.1;

/* ---- Lookups -------------------------------------------------------------- */

interface Index {
  d: UsageData;
  customer: Map<string, number>;
  feature: Map<string, number>;
  event: Map<string, number>;
  user: Map<string, number>;
  modules: string[];
  featureModule: Uint16Array;
}

let index: Index | null = null;

const ix = (): Index => {
  if (index) return index;
  const d = usageData();
  const toMap = (ids: string[]) => new Map(ids.map((id, i) => [id, i]));
  const modules = [...new Set(d.features.filter((f) => f.published).map((f) => f.module))].sort();
  const featureModule = new Uint16Array(d.features.length);
  d.features.forEach((f, i) => { featureModule[i] = Math.max(0, modules.indexOf(f.module)); });
  index = {
    d,
    customer: toMap(d.customers.map((c) => c.id)),
    feature: toMap(d.features.map((f) => f.id)),
    event: toMap(d.events.map((e) => e.key)),
    user: toMap(d.users.map((u) => u.id)),
    modules,
    featureModule,
  };
  return index;
};

export const asOf = () => isoOfDay(DAYS - 1);

export const customerOf = (id?: string) => (id ? ix().d.customers[ix().customer.get(id) ?? -1] : undefined);
export const customerName = (id?: string) => (id ? ix().d.customers[ix().customer.get(id) ?? -1]?.name : undefined);
export const featureTitle = (id?: string) => (id ? ix().d.features[ix().feature.get(id) ?? -1]?.title : undefined);
export const eventLabel = (key?: string) => (key ? ix().d.events[ix().event.get(key) ?? -1]?.label : undefined);
export const userOf = (id?: string) => (id ? ix().d.users[ix().user.get(id) ?? -1] : undefined);
export const featureModuleOf = (id?: string) => (id ? ix().d.features[ix().feature.get(id) ?? -1]?.module : undefined);
/** A feature's module and release month, for a drawer subtitle. */
export const featureInfo = (id?: string) => {
  const f = id ? ix().d.features[ix().feature.get(id) ?? -1] : undefined;
  return f ? { title: f.title, module: f.module, releaseMonth: f.releaseMonth } : undefined;
};
export const eventFeatureOf = (key?: string) => (key ? ix().d.events[ix().event.get(key) ?? -1]?.featureId : undefined);
/** False only when every feature asked for is unreleased - there is no usage
 *  to show for a draft. */
export const isReleased = (featureIds?: string[]) =>
  !featureIds?.length || featureIds.some((id) => Boolean(ix().d.features[ix().feature.get(id) ?? -1]?.published));

const has = (set: string[] | undefined, v: string) => !set?.length || set.includes(v);

/** Event indexes of the Action filter, or null when it is empty. */
const eventSet = (filters: AdoptionFilters) =>
  filters.events?.length ? new Set(filters.events.map((k) => ix().event.get(k) ?? -1)) : null;

/** One customer, and not exactly one feature: the page becomes that
 *  customer's account, listing their features. */
export const isAccountView = (filters: AdoptionFilters) => Boolean(only(filters.customers) && !only(filters.features));

/** What each filter offers. Feature options narrow to the chosen modules,
 *  action options to the chosen features (or modules). */
export const filterOptions = (filters: AdoptionFilters) => {
  const { d, modules } = ix();
  const features = d.features
    .filter((f) => f.published && has(filters.modules, f.module))
    .sort((a, b) => a.module.localeCompare(b.module) || a.title.localeCompare(b.title))
    .map((f) => ({ value: f.id, label: f.title, group: f.module }));
  const customers = [...d.customers]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ value: c.id, label: c.name }));
  const events = d.events
    .filter((e) => {
      const f = d.features[ix().feature.get(e.featureId) ?? -1];
      if (!f?.published) return false;
      return filters.features?.length ? filters.features.includes(e.featureId) : has(filters.modules, f.module);
    })
    .map((e) => ({ value: e.key, label: e.label, group: featureTitle(e.featureId) }));
  return { modules: modules.map((m) => ({ value: m, label: m })), features, customers, events };
};

/* ---- The scan ------------------------------------------------------------- */

interface Bucket {
  start: number;
  end: number;
}

interface Scan {
  n: number;
  curStart: number;
  prevStart: number;
  grain: 'day' | 'week';
  buckets: Bucket[];
  featureIn: Uint8Array;
  customerIn: (c: number) => boolean;

  userCur: Float64Array;
  userPrev: Float64Array;
  userDays: Uint16Array;
  userLast: Int16Array;
  prevUserDays: number;
  curUserDays: number;

  custCur: Float64Array;
  custPrev: Float64Array;
  custUsers: Uint32Array;
  custBefore: Uint8Array;
  custFeatures: Uint16Array;
  custBucket: Float64Array;

  featCur: Float64Array;
  featPrev: Float64Array;
  featUsers: Uint32Array;
  featCusts: Uint32Array;

  evCur: Float64Array;
  evPrev: Float64Array;
  evUsers: Uint32Array;
  evCusts: Uint32Array;

  modCur: Float64Array;
  modPrev: Float64Array;
  modUsers: Uint32Array;
  modCusts: Uint32Array;

  bucketEvents: Float64Array;
  bucketUsers: Uint32Array;
  bucketCusts: Uint32Array;
  bucketUserDays: Uint32Array;

  /** Enablement in scope: day each customer first had a scope feature on, or -1. */
  custEnabledDay: Int16Array;
  custEnabledCount: Uint16Array;
  custEligible: Uint16Array;
  /** Distinct person-days per customer, for its daily average. */
  custUserDays: Uint32Array;
  /** Power users per customer. */
  custPower: Uint32Array;
  featEnabled: Uint32Array;
  featEligible: Uint32Array;
  modEnabled: Uint32Array;
  modFeatures: Uint16Array;

  powerCur: Uint8Array;
  powerPrev: Uint8Array;

  /** One customer's use of one feature - what an action item is about.
   *  Indexed feature * customers + customer. */
  pairCur: Float64Array;
  pairPrev: Float64Array;
  pairUsers: Uint32Array;
  pairBefore: Uint8Array;
  pairLast: Int16Array;
}

const cache = new Map<string, Scan>();
const keyOf = (f: AdoptionFilters) =>
  [f.period, f.modules, f.features, f.customers, f.events, f.user]
    .map((v) => (Array.isArray(v) ? [...v].sort().join(',') : v ?? ''))
    .join('|');

/** Top POWER_SHARE of each customer's active users by event volume - at least
 *  one per active customer, so a small account still has a champion. */
const powerUsers = (d: UsageData, events: Float64Array) => {
  const byCustomer = new Map<number, number[]>();
  events.forEach((v, u) => {
    if (v <= 0) return;
    const c = d.userCustomer[u];
    const list = byCustomer.get(c);
    if (list) list.push(u);
    else byCustomer.set(c, [u]);
  });
  const out = new Uint8Array(events.length);
  byCustomer.forEach((list) => {
    list.sort((a, b) => events[b] - events[a]);
    const take = Math.max(1, Math.ceil(list.length * POWER_SHARE));
    list.slice(0, take).forEach((u) => { out[u] = 1; });
  });
  return out;
};

const scan = (filters: AdoptionFilters): Scan => {
  const key = keyOf(filters);
  const hit = cache.get(key);
  if (hit) return hit;

  const { d, customer, feature, event, user, modules, featureModule } = ix();
  const NU = d.users.length;
  const NC = d.customers.length;
  const NF = d.features.length;
  const NE = d.events.length;
  const NM = modules.length;
  /* The period, and the same number of days just before it. END is the
     period's last day - the data's last day for a relative period. */
  const { start: curStart, end: END, n } = periodRange(filters.period);
  const prevStart = curStart - n;
  const lo = Math.max(0, prevStart);

  /* Daily points for a month; weekly beyond that, counted back from the last
     day so the newest bucket is always a full week. */
  const grain = n <= 31 ? 'day' : 'week';
  const step = grain === 'day' ? 1 : 7;
  const buckets: Bucket[] = [];
  for (let end = END; end >= curStart; end -= step) {
    buckets.unshift({ start: Math.max(curStart, end - step + 1), end });
  }
  const B = buckets.length;
  const bucketOf = (day: number) => B - 1 - Math.floor((END - day) / step);

  const featureIn = new Uint8Array(NF);
  d.features.forEach((f, i) => {
    if (!f.published) return;
    if (!has(filters.modules, f.module)) return;
    if (!has(filters.features, f.id)) return;
    featureIn[i] = 1;
  });
  /** A membership mask for a filter set, or null when the set is empty. */
  const mask = (ids: string[] | undefined, map: Map<string, number>, size: number) => {
    if (!ids?.length) return null;
    const m = new Uint8Array(size);
    ids.forEach((id) => { const i = map.get(id); if (i !== undefined) m[i] = 1; });
    return m;
  };
  const custSel = mask(filters.customers, customer, NC);
  const evSel = mask(filters.events, event, NE);
  const us = filters.user ? user.get(filters.user) ?? -2 : -1;
  const customerIn = (c: number) => (!custSel || custSel[c] === 1) && (us < 0 || d.userCustomer[us] === c);

  const s: Scan = {
    n, curStart, prevStart, grain, buckets, featureIn, customerIn,
    userCur: new Float64Array(NU),
    userPrev: new Float64Array(NU),
    userDays: new Uint16Array(NU),
    userLast: new Int16Array(NU).fill(-1),
    prevUserDays: 0,
    curUserDays: 0,
    custCur: new Float64Array(NC),
    custPrev: new Float64Array(NC),
    custUsers: new Uint32Array(NC),
    custBefore: new Uint8Array(NC),
    custFeatures: new Uint16Array(NC),
    custBucket: new Float64Array(NC * B),
    featCur: new Float64Array(NF),
    featPrev: new Float64Array(NF),
    featUsers: new Uint32Array(NF),
    featCusts: new Uint32Array(NF),
    evCur: new Float64Array(NE),
    evPrev: new Float64Array(NE),
    evUsers: new Uint32Array(NE),
    evCusts: new Uint32Array(NE),
    modCur: new Float64Array(NM),
    modPrev: new Float64Array(NM),
    modUsers: new Uint32Array(NM),
    modCusts: new Uint32Array(NM),
    bucketEvents: new Float64Array(B),
    bucketUsers: new Uint32Array(B),
    bucketCusts: new Uint32Array(B),
    bucketUserDays: new Uint32Array(B),
    custEnabledDay: new Int16Array(NC).fill(-1),
    custEnabledCount: new Uint16Array(NC),
    custEligible: new Uint16Array(NC),
    custUserDays: new Uint32Array(NC),
    custPower: new Uint32Array(NC),
    featEnabled: new Uint32Array(NF),
    featEligible: new Uint32Array(NF),
    modEnabled: new Uint32Array(NM),
    modFeatures: new Uint16Array(NM),
    powerCur: new Uint8Array(0),
    powerPrev: new Uint8Array(0),
    pairCur: new Float64Array(NF * NC),
    pairPrev: new Float64Array(NF * NC),
    pairUsers: new Uint32Array(NF * NC),
    pairBefore: new Uint8Array(NF * NC),
    pairLast: new Int16Array(NF * NC).fill(-1),
  };

  /* "Seen" bitmaps, so distinct counts stay distinct when one person does
     several things on one day, or uses two features. */
  const span = END - lo + 1;
  const userDaySeen = new Uint8Array(NU * span);
  const bucketUserSeen = new Uint8Array(B * NU);
  const bucketCustSeen = new Uint8Array(B * NC);
  const featUserSeen = new Uint8Array(NF * NU);
  const featCustSeen = new Uint8Array(NF * NC);
  const evUserSeen = new Uint8Array(NE * NU);
  const evCustSeen = new Uint8Array(NE * NC);
  const modUserSeen = new Uint8Array(NM * NU);
  const modCustSeen = new Uint8Array(NM * NC);
  const custFeatSeen = new Uint8Array(NC * NF);

  for (let i = 0; i < d.count; i++) {
    const day = d.factDay[i];
    // Nothing after an exact period's last day counts.
    if (day > END) continue;
    const e = d.factEvent[i];
    const f = d.eventFeature[e];
    if (!featureIn[f]) continue;
    if (evSel && !evSel[e]) continue;
    const u = d.factUser[i];
    if (us !== -1 && u !== us) continue;
    const c = d.userCustomer[u];
    if (custSel && !custSel[c]) continue;
    const cnt = d.factCount[i];
    const m = featureModule[f];
    const p = f * NC + c;
    if (day > s.pairLast[p]) s.pairLast[p] = day;

    if (day < curStart) {
      s.custBefore[c] = 1;
      s.pairBefore[p] = 1;
      if (day < lo) continue;
      s.pairPrev[p] += cnt;
      s.userPrev[u] += cnt;
      s.custPrev[c] += cnt;
      s.featPrev[f] += cnt;
      s.evPrev[e] += cnt;
      s.modPrev[m] += cnt;
      const k = u * span + (day - lo);
      if (!userDaySeen[k]) { userDaySeen[k] = 1; s.prevUserDays += 1; }
      continue;
    }

    if (s.userCur[u] === 0) s.custUsers[c] += 1;
    s.pairCur[p] += cnt;
    s.userCur[u] += cnt;
    s.custCur[c] += cnt;
    s.featCur[f] += cnt;
    s.evCur[e] += cnt;
    s.modCur[m] += cnt;
    if (day > s.userLast[u]) s.userLast[u] = day;

    const b = bucketOf(day);
    s.bucketEvents[b] += cnt;
    s.custBucket[c * B + b] += cnt;

    const k = u * span + (day - lo);
    if (!userDaySeen[k]) {
      userDaySeen[k] = 1;
      s.userDays[u] += 1;
      s.curUserDays += 1;
      s.custUserDays[c] += 1;
      s.bucketUserDays[b] += 1;
    }
    if (!bucketUserSeen[b * NU + u]) { bucketUserSeen[b * NU + u] = 1; s.bucketUsers[b] += 1; }
    if (!bucketCustSeen[b * NC + c]) { bucketCustSeen[b * NC + c] = 1; s.bucketCusts[b] += 1; }
    // A user belongs to one customer, so a new (feature, user) is also a new
    // user for that customer's use of the feature.
    if (!featUserSeen[f * NU + u]) { featUserSeen[f * NU + u] = 1; s.featUsers[f] += 1; s.pairUsers[p] += 1; }
    if (!featCustSeen[f * NC + c]) { featCustSeen[f * NC + c] = 1; s.featCusts[f] += 1; }
    if (!evUserSeen[e * NU + u]) { evUserSeen[e * NU + u] = 1; s.evUsers[e] += 1; }
    if (!evCustSeen[e * NC + c]) { evCustSeen[e * NC + c] = 1; s.evCusts[e] += 1; }
    if (!modUserSeen[m * NU + u]) { modUserSeen[m * NU + u] = 1; s.modUsers[m] += 1; }
    if (!modCustSeen[m * NC + c]) { modCustSeen[m * NC + c] = 1; s.modCusts[m] += 1; }
    if (!custFeatSeen[c * NF + f]) { custFeatSeen[c * NF + f] = 1; s.custFeatures[c] += 1; }
  }

  /* Enablement and eligibility within scope. A user filter narrows to that
     user's customer (customerIn does both). */
  const modEnabledSeen = new Uint8Array(NM * NC);
  for (let f = 0; f < NF; f++) {
    if (!featureIn[f]) continue;
    const m = featureModule[f];
    s.modFeatures[m] += 1;
    for (let c = 0; c < NC; c++) {
      if (!customerIn(c)) continue;
      // Switched on by the period's last day; later enablements don't count yet.
      const day = d.enabledDay[f * NC + c];
      if (day >= 0 && day <= END) {
        s.featEnabled[f] += 1;
        s.custEnabledCount[c] += 1;
        if (s.custEnabledDay[c] < 0 || day < s.custEnabledDay[c]) s.custEnabledDay[c] = day;
        if (!modEnabledSeen[m * NC + c]) { modEnabledSeen[m * NC + c] = 1; s.modEnabled[m] += 1; }
      } else if (d.eligible[f * NC + c]) {
        s.featEligible[f] += 1;
        s.custEligible[c] += 1;
      }
    }
  }

  s.powerCur = powerUsers(d, s.userCur);
  s.powerPrev = powerUsers(d, s.userPrev);
  s.powerCur.forEach((on, u) => { if (on) s.custPower[d.userCustomer[u]] += 1; });

  if (cache.size > 12) cache.delete(cache.keys().next().value as string);
  cache.set(key, s);
  return s;
};

/* ---- KPIs ----------------------------------------------------------------- */

export type KpiFormat = 'number' | 'percent';

export interface Kpi {
  key: string;
  label: string;
  value: number;
  /** Shown instead of the formatted value, for a tile that isn't a count. */
  display?: string;
  /** False for a tile with no period-on-period reading at all. */
  compare?: boolean;
  /** The same measure over the previous period; null when there is none. */
  previous: number | null;
  format: KpiFormat;
  /** A smaller line under the value, such as the activation rate. */
  note?: string;
  /** One-line definition, for the tooltip. */
  hint: string;
  spark?: number[];
}

const countWhere = (arr: ArrayLike<number>, test: (v: number) => boolean) => {
  let n = 0;
  for (let i = 0; i < arr.length; i++) if (test(arr[i])) n += 1;
  return n;
};

export const getKpis = (filters: AdoptionFilters): Kpi[] => {
  const s = scan(filters);
  const enabled = countWhere(s.custEnabledDay, (v) => v >= 0);
  const enabledPrev = countWhere(s.custEnabledDay, (v) => v >= 0 && v < s.curStart);
  const active = countWhere(s.custCur, (v) => v > 0);
  const activePrev = countWhere(s.custPrev, (v) => v > 0);
  const users = countWhere(s.userCur, (v) => v > 0);
  const usersPrev = countWhere(s.userPrev, (v) => v > 0);
  const daily = s.curUserDays / s.n;
  const dailyPrev = s.prevUserDays / s.n;
  const sticky = users ? daily / users : 0;
  const stickyPrev = usersPrev ? dailyPrev / usersPrev : 0;
  const power = countWhere(s.powerCur, (v) => v > 0);
  const powerPrev = countWhere(s.powerPrev, (v) => v > 0);

  /* Nothing before the first day of history to compare a 12-month view with. */
  const hasPrev = s.prevStart >= 0;
  const prev = (v: number) => (hasPrev ? v : null);
  const month = filters.period === '30d';

  const enabledSpark = s.buckets.map((b) => countWhere(s.custEnabledDay, (v) => v >= 0 && v <= b.end));

  return [
    {
      key: 'enabled',
      label: 'Enabled customers',
      value: enabled,
      previous: prev(enabledPrev),
      format: 'number',
      hint: 'Customers who have the feature switched on',
      spark: enabledSpark,
    },
    {
      key: 'active',
      label: 'Active customers',
      value: active,
      previous: prev(activePrev),
      format: 'number',
      note: enabled ? `${Math.round((100 * active) / enabled)}% of enabled` : undefined,
      hint: 'Enabled customers with at least one person using it in the period',
      spark: Array.from(s.bucketCusts),
    },
    {
      key: 'users',
      label: month ? 'Monthly active users' : 'Active users',
      value: users,
      previous: prev(usersPrev),
      format: 'number',
      hint: 'People who used the feature at least once in the period',
      spark: Array.from(s.bucketUsers),
    },
    {
      key: 'daily',
      label: 'Daily active users',
      value: Math.round(daily),
      previous: hasPrev ? Math.round(dailyPrev) : null,
      format: 'number',
      note: 'Average per day',
      hint: 'How many people use it on a typical day, averaged over the period',
      spark: s.buckets.map((b, i) => s.bucketUserDays[i] / (b.end - b.start + 1)),
    },
    {
      key: 'stickiness',
      label: 'Stickiness',
      value: sticky,
      previous: hasPrev ? stickyPrev : null,
      format: 'percent',
      note: 'Daily ÷ active users',
      hint: 'Share of active users who use it on a typical day - higher means habit',
    },
    {
      key: 'power',
      label: 'Power users',
      value: power,
      previous: prev(powerPrev),
      format: 'number',
      note: 'Top 10% per customer',
      hint: "The busiest 10% of each customer's active users, by number of actions",
    },
    {
      key: 'actions',
      label: 'Actions',
      value: s.custCur.reduce((a, b) => a + b, 0),
      previous: hasPrev ? s.custPrev.reduce((a, b) => a + b, 0) : null,
      format: 'number',
      hint: 'Things people did in the feature. Growing and declining are judged on this',
    },
  ];
};

/** The headline numbers for one person. Account-level counts - enabled
 *  customers, monthly active users - are all 1 or 0 at this level, so a
 *  person gets their own: how much, how often, how recently. */
export const getPersonKpis = (filters: AdoptionFilters): Kpi[] => {
  const s = scan(filters);
  const u = filters.user ? ix().user.get(filters.user) : undefined;
  if (u === undefined) return [];
  const hasPrev = s.prevStart >= 0;
  const last = s.userLast[u];
  const features = new Set<number>();
  const { d } = ix();
  const evs = eventSet(filters);
  for (let i = 0; i < d.count; i++) {
    if (d.factUser[i] !== u || d.factDay[i] < s.curStart) continue;
    if (evs && !evs.has(d.factEvent[i])) continue;
    const f = d.eventFeature[d.factEvent[i]];
    if (s.featureIn[f]) features.add(f);
  }
  const ago = DAYS - 1 - last;
  return [
    {
      key: 'actions',
      label: 'Actions',
      value: s.userCur[u],
      previous: hasPrev ? s.userPrev[u] : null,
      format: 'number',
      hint: 'Things this person did in the features in scope',
    },
    {
      key: 'days',
      label: 'Active days',
      value: s.userDays[u],
      previous: null,
      compare: false,
      format: 'number',
      note: `Of ${s.n} days`,
      hint: 'Days this person used the features in scope at least once',
    },
    {
      key: 'last',
      label: 'Last active',
      value: last,
      display: last >= 0 ? shortDate(isoOfDay(last)) : 'Not in period',
      previous: null,
      compare: false,
      format: 'number',
      note: last < 0 ? undefined : ago === 0 ? 'Today' : ago === 1 ? 'Yesterday' : `${ago} days ago`,
      hint: 'The most recent day this person used it',
    },
    {
      key: 'features',
      label: 'Features used',
      value: features.size,
      previous: null,
      compare: false,
      format: 'number',
      hint: 'How many of the features in scope this person used',
    },
    {
      key: 'power',
      label: 'Power user',
      value: s.powerCur[u],
      display: s.powerCur[u] ? 'Yes' : 'No',
      previous: null,
      compare: false,
      format: 'number',
      note: 'Top 10% at their company',
      hint: "Whether they are in the busiest 10% of their company's active users",
    },
  ];
};

/* ---- Trend ---------------------------------------------------------------- */

export interface TrendPoint {
  label: string;
  /** First day the point covers. */
  iso: string;
  value: number;
}

export interface TrendMarker {
  /** Point index the release falls in. */
  index: number;
  label: string;
}

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const getTrend = (filters: AdoptionFilters, metric: TrendMetric) => {
  const s = scan(filters);
  const { d } = ix();
  const series = metric === 'users' ? s.bucketUsers : metric === 'customers' ? s.bucketCusts : s.bucketEvents;
  const points: TrendPoint[] = s.buckets.map((b, i) => ({
    label: shortDate(isoOfDay(b.start)),
    iso: isoOfDay(b.start),
    value: series[i],
  }));

  /* One marker per release month that lands inside the period. */
  const firstDay = new Map<string, number>();
  d.features.forEach((f, i) => {
    if (!s.featureIn[i] || f.releaseDay < s.curStart) return;
    const seen = firstDay.get(f.releaseMonth);
    if (seen === undefined || f.releaseDay < seen) firstDay.set(f.releaseMonth, f.releaseDay);
  });
  const markers: TrendMarker[] = [...firstDay.entries()].map(([month, day]) => ({
    index: s.buckets.findIndex((b) => day >= b.start && day <= b.end),
    label: `${month.split(' ')[0]} release`,
  }));

  const unit = s.grain === 'day' ? 'Daily' : 'Weekly';
  const name =
    metric === 'users' ? `${unit} active users` : metric === 'customers' ? `${unit} active customers` : `Actions per ${s.grain}`;
  return { points, markers, grain: s.grain, name };
};

/* ---- Breakdown rows ------------------------------------------------------- */

export interface BreakdownRow {
  /** What a click on the row filters by. */
  id: string;
  level: Level;
  name: string;
  sub?: string;
  events: number;
  /** Events this period against the previous one; null when there is no
   *  previous usage to compare with. */
  change: number | null;
  activeUsers?: number;
  activeCustomers?: number;
  enabledCustomers?: number;
  eligibleCustomers?: number;
  activation?: number | null;
  features?: number;
  featuresEnabled?: number;
  featuresUsed?: number;
  featuresEligible?: number;
  enabledOn?: string;
  csm?: string;
  tier?: string;
  status?: UsageStatus;
  spark?: number[];
  customerId?: string;
  customerName?: string;
  role?: string;
  activeDays?: number;
  lastActive?: string;
  power?: boolean;
  /** What a customer-facing team should do about this row. */
  nextStep?: string;
  /** The company's point of contact, on customer rows. */
  spocName?: string;
  spocRole?: string;
  spocEmail?: string;
  /** Average people per day, on customer rows. */
  dailyAvg?: number;
  /** Power users, on customer rows. */
  powerUsers?: number;
  /** Customers of this feature needing a nudge: unused or declining. */
  followUps?: number;
  /** Which funnel steps and next-step lists the row belongs to. */
  lists?: AdoptionList[];
}

/** The one thing to do for a customer in each state, said as an instruction.
 *  Healthy states need nothing, and say so, so the column is never blank. */
export const NEXT_STEP: Record<UsageStatus, string> = {
  'not-started': 'Book an enablement session',
  stopped: 'Ask why they stopped',
  declining: 'Check in on the drop',
  eligible: 'Offer to switch it on',
  growing: 'No action needed',
  steady: 'No action needed',
  none: 'No action needed',
};

const changeOf = (cur: number, prev: number, hasPrev: boolean) =>
  hasPrev && prev > 0 ? (cur - prev) / prev : null;

export const statusOf = (cur: number, prev: number, everUsed: boolean): UsageStatus => {
  if (cur <= 0) return everUsed ? 'stopped' : 'not-started';
  if (prev <= 0) return 'growing';
  const change = (cur - prev) / prev;
  if (change >= GROWING) return 'growing';
  if (change <= DECLINING) return 'declining';
  return 'steady';
};

const customerRows = (s: Scan, hasPrev: boolean): BreakdownRow[] => {
  const { d } = ix();
  const B = s.buckets.length;
  const rows: BreakdownRow[] = [];
  /* Every customer, not only the ones who switched something on: the funnel
     starts from the whole base, and the table has to be able to show it. */
  d.customers.forEach((c, ci) => {
    if (!s.customerIn(ci)) return;
    const cur = s.custCur[ci];
    const prev = hasPrev ? s.custPrev[ci] : 0;
    const status: UsageStatus =
      s.custEnabledCount[ci] > 0 || cur > 0
        ? statusOf(cur, prev, s.custBefore[ci] > 0)
        : s.custEligible[ci] > 0 ? 'eligible' : 'none';
    rows.push({
      id: c.id,
      level: 'customer',
      name: c.name,
      sub: `${c.industry} · ${c.tier}`,
      csm: c.csm,
      tier: c.tier,
      spocName: c.spoc.name,
      spocRole: c.spoc.role,
      spocEmail: c.spoc.email,
      dailyAvg: s.custUserDays[ci] / s.n,
      powerUsers: s.custPower[ci],
      lists: listsFor(s, ci, hasPrev),
      events: cur,
      change: changeOf(cur, prev, hasPrev),
      activeUsers: s.custUsers[ci],
      featuresEnabled: s.custEnabledCount[ci],
      featuresUsed: s.custFeatures[ci],
      enabledOn: s.custEnabledDay[ci] >= 0 ? isoOfDay(s.custEnabledDay[ci]) : undefined,
      status,
      nextStep: NEXT_STEP[status],
      spark: Array.from(s.custBucket.subarray(ci * B, ci * B + B)),
    });
  });
  /* The ones with a next step first, so the table reads as a to-do list
     before it reads as a leaderboard. */
  return rows.sort(
    (a, b) => ATTENTION.indexOf(a.status!) - ATTENTION.indexOf(b.status!) || b.events - a.events || a.name.localeCompare(b.name),
  );
};

/** Status order for any list meant to be acted on, most urgent first. */
const ATTENTION: UsageStatus[] = ['not-started', 'stopped', 'declining', 'eligible', 'growing', 'steady', 'none'];

const userRows = (s: Scan, hasPrev: boolean): BreakdownRow[] => {
  const { d } = ix();
  const rows: BreakdownRow[] = [];
  s.userCur.forEach((cur, ui) => {
    if (cur <= 0) return;
    const u = d.users[ui];
    const c = d.customers[d.userCustomer[ui]];
    rows.push({
      id: u.id,
      level: 'user',
      name: u.name,
      sub: u.role,
      role: u.role,
      customerId: c.id,
      customerName: c.name,
      events: cur,
      change: changeOf(cur, s.userPrev[ui], hasPrev),
      activeDays: s.userDays[ui],
      lastActive: s.userLast[ui] >= 0 ? isoOfDay(s.userLast[ui]) : undefined,
      power: s.powerCur[ui] > 0,
    });
  });
  return rows.sort((a, b) => b.events - a.events);
};

export const getBreakdown = (filters: AdoptionFilters, level: Level): BreakdownRow[] => {
  const s = scan(filters);
  const { d, modules } = ix();
  const hasPrev = s.prevStart >= 0;

  if (level === 'customer') return customerRows(s, hasPrev);

  if (level === 'user') return userRows(s, hasPrev);

  if (level === 'module') {
    return modules
      .map((m, mi) => ({
        id: m,
        level: 'module' as const,
        name: m,
        sub: `${s.modFeatures[mi]} released ${s.modFeatures[mi] === 1 ? 'feature' : 'features'}`,
        features: s.modFeatures[mi],
        events: s.modCur[mi],
        change: changeOf(s.modCur[mi], s.modPrev[mi], hasPrev),
        enabledCustomers: s.modEnabled[mi],
        activeCustomers: s.modCusts[mi],
        activation: s.modEnabled[mi] ? s.modCusts[mi] / s.modEnabled[mi] : null,
        activeUsers: s.modUsers[mi],
      }))
      .filter((r) => (r.features ?? 0) > 0)
      .sort((a, b) => (b.activeUsers ?? 0) - (a.activeUsers ?? 0));
  }

  if (level === 'feature') {
    return d.features
      .map((f, fi) => ({ f, fi }))
      .filter(({ fi }) => s.featureIn[fi])
      .map(({ f, fi }) => ({
        id: f.id,
        level: 'feature' as const,
        name: f.title,
        sub: `${f.module} · ${f.releaseMonth}`,
        events: s.featCur[fi],
        change: changeOf(s.featCur[fi], s.featPrev[fi], hasPrev),
        enabledCustomers: s.featEnabled[fi],
        eligibleCustomers: s.featEligible[fi],
        activeCustomers: s.featCusts[fi],
        activation: s.featEnabled[fi] ? s.featCusts[fi] / s.featEnabled[fi] : null,
        activeUsers: s.featUsers[fi],
        followUps: followUpsFor(s, fi, hasPrev),
      }))
      // Most follow-ups first, like every other list here.
      .sort((a, b) => b.followUps - a.followUps || (b.activeUsers ?? 0) - (a.activeUsers ?? 0));
  }

  // event
  return d.events
    .map((e, ei) => ({ e, ei }))
    .filter(({ ei }) => s.featureIn[d.eventFeature[ei]] && has(filters.events, d.events[ei].key))
    .map(({ e, ei }) => ({
      id: e.key,
      level: 'event' as const,
      name: e.label,
      sub: d.features[d.eventFeature[ei]].title,
      events: s.evCur[ei],
      change: changeOf(s.evCur[ei], s.evPrev[ei], hasPrev),
      activeUsers: s.evUsers[ei],
      activeCustomers: s.evCusts[ei],
    }))
    .sort((a, b) => b.events - a.events);
};

/* ---- Next steps ----------------------------------------------------------- */

/** Where one customer stands with one feature, or null when it is neither
 *  switched on nor available to them. */
const pairStatus = (s: Scan, f: number, c: number, hasPrev: boolean): UsageStatus | null => {
  const { d } = ix();
  const p = f * d.customers.length + c;
  if (d.enabledDay[p] < 0) return d.eligible[p] ? 'eligible' : null;
  return statusOf(s.pairCur[p], hasPrev ? s.pairPrev[p] : 0, s.pairBefore[p] > 0);
};

const needsNudge = (st: UsageStatus | null) => st === 'not-started' || st === 'stopped' || st === 'declining';

/** Customers of one feature who have it on but need a nudge. */
const followUpsFor = (s: Scan, f: number, hasPrev: boolean) => {
  const { d } = ix();
  let n = 0;
  for (let c = 0; c < d.customers.length; c++) {
    if (s.customerIn(c) && needsNudge(pairStatus(s, f, c, hasPrev))) n += 1;
  }
  return n;
};

/** A company is worth asking for a reference when it uses the feature well
 *  and has people who can vouch for it: usage steady or growing, and at least
 *  this many power users. */
const REFERENCE_MIN_POWER = 3;

/** Power users in one customer's use of one feature - the same top-10% rule
 *  as everywhere else, at least one when anyone used it. */
const powerOf = (activeUsers: number) => (activeUsers > 0 ? Math.max(1, Math.ceil(activeUsers * POWER_SHARE)) : 0);

/** The funnel steps and next-step lists one customer's use of one feature
 *  falls into. */
const pairLists = (s: Scan, f: number, c: number, hasPrev: boolean): AdoptionList[] => {
  const st = pairStatus(s, f, c, hasPrev);
  if (!st) return [];
  const out: AdoptionList[] = ['can-use'];
  if (st === 'eligible') return [...out, 'offer'];
  out.push('on');
  if (st === 'not-started' || st === 'stopped') return [...out, 'start'];
  out.push('using');
  if (st === 'declining') out.push('declining');
  const p = f * ix().d.customers.length + c;
  if ((st === 'growing' || st === 'steady') && powerOf(s.pairUsers[p]) >= REFERENCE_MIN_POWER) out.push('references');
  return out;
};

/** A customer is in a list when any feature in scope puts it there - at
 *  module or platform level, one unused feature is enough to need a start. */
const listsFor = (s: Scan, c: number, hasPrev: boolean): AdoptionList[] => {
  const set = new Set<AdoptionList>(['all']);
  for (let f = 0; f < s.featureIn.length; f++) {
    if (s.featureIn[f]) pairLists(s, f, c, hasPrev).forEach((l) => set.add(l));
  }
  return [...set];
};

export interface FunnelStep {
  key: AdoptionList;
  label: string;
  count: number;
  hint: string;
}

/**
 * From the whole customer base down to the customers who could vouch for it:
 * all customers, can use it, switched on, using it, reference-ready. With one
 * customer in scope, the same steps count that customer's features instead.
 */
export const getFunnel = (filters: AdoptionFilters): { unit: 'customers' | 'features'; steps: FunnelStep[] } => {
  const accountView = isAccountView(filters);
  const rows = accountView ? getCustomerFeatures(filters, true) : getBreakdown(filters, 'customer');
  const n = (k: AdoptionList) => rows.filter((r) => r.lists?.includes(k)).length;
  const what = accountView ? 'Released features' : 'Customers';
  return {
    unit: accountView ? 'features' : 'customers',
    steps: [
      { key: 'all', label: accountView ? 'All features' : 'All customers', count: rows.length, hint: `${what} in scope, whatever their access` },
      { key: 'can-use', label: 'Can use it', count: n('can-use'), hint: 'Switched on, or could switch it on' },
      { key: 'on', label: 'Switched on', count: n('on'), hint: 'Switched on for at least one feature in scope' },
      { key: 'using', label: 'Using it', count: n('using'), hint: 'Someone used it in the period' },
      { key: 'references', label: 'Reference-ready', count: n('references'), hint: 'Steady or growing, with 3 or more power users' },
    ],
  };
};

/** One customer's features: everything switched on or available to them,
 *  the ones needing attention first. */
/** `includeUnavailable` adds the features this customer has no access to, so
 *  the account funnel can start from every released feature. */
export const getCustomerFeatures = (filters: AdoptionFilters, includeUnavailable = false): BreakdownRow[] => {
  const { d, customer } = ix();
  const id = only(filters.customers);
  const c = id ? customer.get(id) : undefined;
  if (c === undefined) return [];
  const s = scan({ ...filters, user: undefined });
  const hasPrev = s.prevStart >= 0;
  const NC = d.customers.length;
  const rows: BreakdownRow[] = [];
  d.features.forEach((f, fi) => {
    if (!s.featureIn[fi]) return;
    const status = pairStatus(s, fi, c, hasPrev) ?? (includeUnavailable ? 'none' : null);
    if (!status) return;
    const p = fi * NC + c;
    rows.push({
      id: f.id,
      level: 'feature',
      name: f.title,
      sub: f.module,
      events: s.pairCur[p],
      change: changeOf(s.pairCur[p], s.pairPrev[p], hasPrev),
      activeUsers: s.pairUsers[p],
      enabledOn: d.enabledDay[p] >= 0 ? isoOfDay(d.enabledDay[p]) : undefined,
      status,
      nextStep: NEXT_STEP[status],
      lists: ['all', ...pairLists(s, fi, c, hasPrev)],
    });
  });
  return rows.sort((a, b) => ATTENTION.indexOf(a.status!) - ATTENTION.indexOf(b.status!) || b.events - a.events);
};

/* ---- One person's activity ------------------------------------------------ */

export interface ActivityRow {
  id: string;
  date: string;
  featureId: string;
  feature: string;
  event: string;
  count: number;
}

/** A single user's actions in the period, newest first. */
export const getUserActivity = (filters: AdoptionFilters): ActivityRow[] => {
  const { d, user, event } = ix();
  const u = filters.user ? user.get(filters.user) : undefined;
  if (u === undefined) return [];
  const s = scan(filters);
  const evs = eventSet(filters);
  const rows: ActivityRow[] = [];
  for (let i = 0; i < d.count; i++) {
    if (d.factUser[i] !== u || d.factDay[i] < s.curStart) continue;
    const e = d.factEvent[i];
    if (evs && !evs.has(e)) continue;
    const f = d.eventFeature[e];
    if (!s.featureIn[f]) continue;
    rows.push({
      id: `${i}`,
      date: isoOfDay(d.factDay[i]),
      featureId: d.features[f].id,
      feature: d.features[f].title,
      event: d.events[e].label,
      count: d.factCount[i],
    });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || a.feature.localeCompare(b.feature));
};

/* ---- CSV ------------------------------------------------------------------ */

const csvCell = (v: unknown) => {
  const text = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Rows to CSV, one column per header, in the order given. */
export const toCsv = <R,>(rows: R[], columns: Array<{ header: string; value: (row: R) => unknown }>) =>
  [columns.map((c) => csvCell(c.header)).join(','), ...rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(','))].join(
    '\n',
  );
