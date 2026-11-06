import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventFeatureOf, featureModuleOf } from '@/data/usage/query';
import type { AdoptionFilters, AdoptionList, Breakdown, Period, TrendMetric } from '@/types/Usage';

/* ---------------------------------------------------------------------------
   The adoption page's state, held in the query string.

   The level is the platform (nothing set), a module or one feature. On top of
   it sit two filters - a customer and an action - and the period. The
   breakdown is what the table lists, and the list narrows the table to a
   funnel step or a next step. People are never a page-level choice: they are
   reached through their company, in a drawer.

   The URL is the state so a link from Releases lands filtered, reload keeps
   it, and Back undoes the last change of level or customer.
   --------------------------------------------------------------------------- */

export interface AdoptionView {
  filters: AdoptionFilters;
  by: Breakdown;
  list: AdoptionList;
  metric: TrendMetric;
}

type Patch = Partial<Pick<AdoptionFilters, 'period' | 'module' | 'feature' | 'customer' | 'event'>> & {
  by?: Breakdown;
  list?: AdoptionList;
  metric?: TrendMetric;
};

const PERIODS: Period[] = ['30d', '90d', '180d', '12m'];
const LISTS: AdoptionList[] = ['all', 'can-use', 'on', 'using', 'start', 'declining', 'offer', 'references'];
const METRICS: TrendMetric[] = ['users', 'customers', 'events'];

const oneOf = <T extends string>(value: string | null, allowed: T[], fallback: T): T =>
  value && (allowed as string[]).includes(value) ? (value as T) : fallback;

/** What the table can list at a given level, the most useful first. */
export const breakdownsFor = (f: Pick<AdoptionFilters, 'module' | 'feature' | 'customer'>): Breakdown[] => {
  if (f.customer) return f.feature ? ['actions'] : ['features', 'actions'];
  if (f.feature) return ['customers', 'actions'];
  if (f.module) return ['customers', 'features', 'actions'];
  return ['customers', 'modules', 'features', 'actions'];
};

/** Funnel steps and next-step lists filter rows of customers - or, for one
 *  customer, rows of their features. */
export const listsApply = (f: Pick<AdoptionFilters, 'customer' | 'feature'>, by: Breakdown) =>
  f.customer && !f.feature ? by === 'features' : by === 'customers';

const read = (params: URLSearchParams): AdoptionView => {
  const feature = params.get('feature') || undefined;
  const filters: AdoptionFilters = {
    period: oneOf(params.get('period'), PERIODS, '30d'),
    feature,
    // A feature fixes its module, so only one of the two is ever kept.
    module: feature ? undefined : params.get('module') || undefined,
    customer: params.get('customer') || undefined,
    event: params.get('event') || undefined,
  };
  if (filters.event && filters.feature && eventFeatureOf(filters.event) !== filters.feature) filters.event = undefined;
  const options = breakdownsFor(filters);
  const by = oneOf(params.get('by'), options, options[0]);
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
  if (f.feature) p.set('feature', f.feature);
  else if (f.module) p.set('module', f.module);
  if (f.customer) p.set('customer', f.customer);
  if (f.event) p.set('event', f.event);
  if (f.period !== '30d') p.set('period', f.period);
  if (v.by !== breakdownsFor(f)[0]) p.set('by', v.by);
  if (v.list !== 'all') p.set('list', v.list);
  if (v.metric !== 'users') p.set('metric', v.metric);
  return p;
};

export const useAdoptionFilters = () => {
  const [params, setParams] = useSearchParams();
  const view = useMemo(() => read(params), [params]);

  /** A new level or customer is a new scope: it adds a history entry, and the
   *  breakdown and list go back to the scope's defaults unless the change
   *  sets them. Period, action, breakdown, list and measure only adjust. */
  const update = useCallback(
    (patch: Patch) => {
      const cur = read(params);
      const has = (k: keyof Patch) => Object.prototype.hasOwnProperty.call(patch, k);
      const f: AdoptionFilters = { ...cur.filters };
      if (patch.period) f.period = patch.period;
      if (has('feature')) f.feature = patch.feature;
      if (has('module')) f.module = patch.module;
      if (has('feature') && patch.feature) f.module = undefined;
      if (has('module') && patch.module) f.feature = undefined;
      if (has('customer')) f.customer = patch.customer;
      if (has('event')) f.event = patch.event;
      // An action belongs to one feature; choosing it from a wider level
      // narrows the level to that feature.
      if (has('event') && f.event) {
        const owner = eventFeatureOf(f.event);
        if (owner && f.feature !== owner) { f.feature = owner; f.module = undefined; }
      }
      if (f.event && f.feature && eventFeatureOf(f.event) !== f.feature) f.event = undefined;
      if (f.event && f.module && featureModuleOf(eventFeatureOf(f.event)) !== f.module) f.event = undefined;

      const rescoped =
        f.feature !== cur.filters.feature || f.module !== cur.filters.module || f.customer !== cur.filters.customer;
      const options = breakdownsFor(f);
      const by = patch.by && options.includes(patch.by) ? patch.by : rescoped ? options[0] : oneOf(cur.by, options, options[0]);
      const list = listsApply(f, by) ? patch.list ?? (rescoped ? 'all' : cur.list) : 'all';
      setParams(write({ filters: f, by, list, metric: patch.metric ?? cur.metric }), { replace: !rescoped });
    },
    [params, setParams],
  );

  return { ...view, update };
};
