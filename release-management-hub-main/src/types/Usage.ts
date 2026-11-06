/* ---------------------------------------------------------------------------
   Feature usage, as the adoption page reads it.

   Everything the page shows is derived from three facts: which customer has a
   feature switched on (an enablement), who uses it (a user, belonging to one
   customer), and what they did on which day (an event). Modules are not their
   own entity - a feature names its module, so a module's usage is the sum of
   its features'.
   --------------------------------------------------------------------------- */

export type Tier = 'Enterprise' | 'Mid-market' | 'Growth';

export interface Customer {
  id: string;
  name: string;
  industry: string;
  tier: Tier;
  /** The customer success manager who owns the account. */
  csm: string;
  region: string;
  /** The customer's own point of contact. A CSM goes through them to reach
   *  anyone else at the company - power users included. */
  spoc: Spoc;
}

export interface Spoc {
  userId: string;
  name: string;
  role: string;
  email: string;
}

export interface UsageUser {
  id: string;
  customerId: string;
  name: string;
  role: string;
}

/** One thing a person can do inside a feature, in the words the feature uses. */
export interface FeatureEvent {
  key: string;
  featureId: string;
  label: string;
}

/** The days the page looks at: "30d" for the last 30 days, or
 *  "2026-08-01~2026-09-15" for exact dates. Each period is compared with the
 *  same number of days just before it. */
export type Period = string;

/** The levels the breakdown table can group by, from broadest to narrowest. */
export type Level = 'customer' | 'module' | 'feature' | 'event' | 'user';

/** What the page's one table lists - the "by" in "Adoption of X, by Y".
 *  People are never an option: they are reached through their company. */
export type Breakdown = 'modules' | 'features' | 'customers' | 'actions';

/** Filters on the table: a funnel step, or a next-step list. */
export type AdoptionList = 'all' | 'can-use' | 'on' | 'using' | 'start' | 'declining' | 'offer' | 'references';

export type TrendMetric = 'users' | 'customers' | 'events';

/** What narrows the data. Each filter is a set, and an empty (or missing)
 *  set means no filter - so no modules, or every module, is the platform. */
export interface AdoptionFilters {
  period: Period;
  modules?: string[];
  features?: string[];
  customers?: string[];
  /** Action keys. */
  events?: string[];
  /** One person, for their drawer. */
  user?: string;
}

/** The single value of a set, when it holds exactly one. */
export const only = (values?: string[]) => (values && values.length === 1 ? values[0] : undefined);

/** Where a customer's usage is heading, period on period. */
export type UsageStatus = 'growing' | 'steady' | 'declining' | 'stopped' | 'not-started' | 'eligible' | 'none';
