import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { filterOptions, isAccountView, isValidPeriod } from '@/data/usage/query';
import type { AdoptionFilters, AdoptionList, Breakdown, Period, TrendMetric } from '@/types/Usage';

/* ---------------------------------------------------------------------------
   The adoption page's state, held in the query string.

   One set of filters, all multi-select: modules, features, customers and
   actions, plus the period. An empty filter means everything - so no modules,
   or every module, is the platform. The breakdown is what the table lists,
   and the list narrows the table to a funnel step or a next step.

   Sets are written comma-separated (`modules=Recruiting,Payroll`). The old
   single-value links (`feature=FEAT-001` from the Releases table) still read.
   --------------------------------------------------------------------------- */

export interface AdoptionView {
  filters: AdoptionFilters;
  by: Breakdown;
  list: AdoptionList;
  metric: TrendMetric;
}

export type Patch = Partial<Pick<AdoptionFilters, 'period' | 'modules' | 'features' | 'customers' | 'events'>> & {
  by?: Breakdown;
  list?: AdoptionList;
  metric?: TrendMetric;
};

/** Any relative or exact period inside the data window; the old "12m" link
 *  reads as the last 365 days. */
const readPeriod = (raw: string | null): Period => {
  if (raw === '12m') return '365d';
  return raw && isValidPeriod(raw) ? raw : '30d';
};
const LISTS: AdoptionList[] = ['all', 'can-use', 'on', 'using', 'start', 'declining', 'offer', 'references'];
const METRICS: TrendMetric[] = ['users', 'customers', 'events'];

const oneOf = <T extends string>(value: string | null, allowed: T[], fallback: T): T =>
  value && (allowed as string[]).includes(value) ? (value as T) : fallback;

/** The groupings the table offers - always all four, in this order. */
export const BREAKDOWNS: Breakdown[] = ['customers', 'modules', 'features', 'actions'];

/** The grouping a scope opens on: one customer's features in their account
 *  view, customers everywhere else. */
export const defaultBreakdown = (f: AdoptionFilters): Breakdown => (isAccountView(f) ? 'features' : 'customers');

/** Funnel steps and next-step lists filter rows of customers - or, in one
 *  customer's account, rows of their features. */
export const listsApply = (f: AdoptionFilters, by: Breakdown) => (isAccountView(f) ? by === 'features' : by === 'customers');

const readSet = (params: URLSearchParams, key: string, legacy: string) => {
  const raw = params.get(key) ?? params.get(legacy);
  const out = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  return out.length ? out : undefined;
};

/** Drops values no longer on offer once a wider filter changes - a feature
 *  outside the chosen modules, an action outside the chosen features - and
 *  treats "every module" as no module filter at all. */
const tidy = (f: AdoptionFilters): AdoptionFilters => {
  const all = filterOptions({ period: f.period });
  const modules = f.modules?.length && f.modules.length < all.modules.length ? f.modules : undefined;
  const featureIds = new Set(filterOptions({ period: f.period, modules }).features.map((o) => o.value));
  const features = f.features?.filter((id) => featureIds.has(id));
  const eventIds = new Set(filterOptions({ period: f.period, modules, features }).events.map((o) => o.value));
  const events = f.events?.filter((k) => eventIds.has(k));
  return {
    period: f.period,
    modules,
    features: features?.length ? features : undefined,
    customers: f.customers?.length ? f.customers : undefined,
    events: events?.length ? events : undefined,
  };
};

const read = (params: URLSearchParams): AdoptionView => {
  const filters = tidy({
    period: readPeriod(params.get('period')),
    modules: readSet(params, 'modules', 'module'),
    features: readSet(params, 'features', 'feature'),
    customers: readSet(params, 'customers', 'customer'),
    events: readSet(params, 'actions', 'event'),
  });
  const by = oneOf(params.get('by'), BREAKDOWNS, defaultBreakdown(filters));
  return {
    filters,
    by,
    list: listsApply(filters, by) ? oneOf(params.get('list'), LISTS, 'all') : 'all',
    metric: oneOf(params.get('metric'), METRICS, 'users'),
  };
};

const write = (v: AdoptionView) => {
  const p = new URLSearchParams();
  const f = v.filters;
  if (f.modules) p.set('modules', f.modules.join(','));
  if (f.features) p.set('features', f.features.join(','));
  if (f.customers) p.set('customers', f.customers.join(','));
  if (f.events) p.set('actions', f.events.join(','));
  if (f.period !== '30d') p.set('period', f.period);
  if (v.by !== defaultBreakdown(f)) p.set('by', v.by);
  if (v.list !== 'all') p.set('list', v.list);
  if (v.metric !== 'users') p.set('metric', v.metric);
  return p;
};

const same = (a?: string[], b?: string[]) => (a ?? []).slice().sort().join(',') === (b ?? []).slice().sort().join(',');

export const useAdoptionFilters = () => {
  const [params, setParams] = useSearchParams();
  const view = useMemo(() => read(params), [params]);

  /** Any change of modules, features or customers adds a history entry, so
   *  Back undoes it; the breakdown and list go back to their defaults unless
   *  the change sets them. Period, actions, breakdown, list and measure only
   *  adjust the view. */
  const update = useCallback(
    (patch: Patch) => {
      const cur = read(params);
      const f = tidy({ ...cur.filters, ...patch });
      const rescoped =
        !same(f.modules, cur.filters.modules) || !same(f.features, cur.filters.features) || !same(f.customers, cur.filters.customers);
      // A new scope keeps the chosen grouping, except that entering or leaving
      // one customer's account switches between their features and customers.
      const accountChanged = isAccountView(f) !== isAccountView(cur.filters);
      const by = patch.by ?? (accountChanged ? defaultBreakdown(f) : cur.by);
      const list = listsApply(f, by) ? patch.list ?? (rescoped ? 'all' : cur.list) : 'all';
      setParams(write({ filters: f, by, list, metric: patch.metric ?? cur.metric }), { replace: !rescoped });
    },
    [params, setParams],
  );

  return { ...view, update };
};
