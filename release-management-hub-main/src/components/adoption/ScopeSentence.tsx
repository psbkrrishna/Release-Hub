import { customerName, featureTitle } from '@/data/usage/query';
import type { AdoptionFilters } from '@/types/Usage';
import { T } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The report's subject, read back from the filter bar in words - "Adoption of
   the Recruiting and Payroll modules at Kaveri Logistics". Nothing here is a
   control: filters and grouping all live in the one bar below, so there is a
   single place to change what the page shows.
   --------------------------------------------------------------------------- */

/** "A and B", "A, B and C", or "4 features" past three. */
const listOf = (names: string[], noun: string) =>
  names.length > 3 ? `${names.length} ${noun}` : names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

/** The filters, read back in words. */
export const scopeText = (f: AdoptionFilters) => {
  const what = f.features?.length
    ? listOf(f.features.map((id) => featureTitle(id) ?? id), 'features')
    : f.modules?.length
      ? f.modules.length === 1 ? `the ${f.modules[0]} module` : `the ${listOf(f.modules, 'modules')}${f.modules.length > 3 ? '' : ' modules'}`
      : 'the platform';
  const who = f.customers?.length ? ` at ${listOf(f.customers.map((id) => customerName(id) ?? id), 'customers')}` : '';
  return `${what}${who}`;
};

const ScopeSentence = ({ filters }: { filters: AdoptionFilters }) => (
  <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: T.tx2 }}>
    Adoption of <span style={{ fontWeight: 600, color: T.tx }}>{scopeText(filters)}</span>
  </p>
);

export default ScopeSentence;
