import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Tooltip from '@/components/primitives/Tooltip';
import { adoptionUrl } from '@/lib/routes';
import type { Feature } from '@/types/Feature';

/* ---------------------------------------------------------------------------
   A usage number that opens the feature adoption report, already filtered to
   its feature. Styled as the guidelines' clickable count: --brand with a
   subtle --brand-border underline at a 3px offset, --brand-soft on hover, a
   tooltip naming what opens and an aria-label naming the value. Only the
   number is the target.

   The report gets the page it was opened from as its breadcrumb trail. An
   unpublished feature has no usage, so its value stays plain text.
   --------------------------------------------------------------------------- */

export type Crumb = { label: string; path: string };

const UsageLink = ({
  feature,
  metric,
  trail,
  params = {},
  children,
}: {
  feature: Feature;
  /** What the number is, e.g. "Enabled customers" - for the tooltip and label. */
  metric: string;
  /** Where the report's breadcrumb leads back to. */
  trail?: Crumb[];
  params?: Record<string, string>;
  children: ReactNode;
}) => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [hover, setHover] = useState(false);
  if (!feature.published) return <>{children}</>;
  const back = trail ?? [{ label: 'Get help', path: '/product-hub/overview' }, { label: 'Releases', path: `${pathname}${search}` }];
  return (
    <Tooltip label={`Open adoption for ${feature.title}`}>
      <button
        type="button"
        aria-label={`${metric}: ${String(children)}. Open adoption report`}
        onClick={(e) => { e.stopPropagation(); navigate(adoptionUrl({ feature: feature.id, ...params }), { state: { trail: back } }); }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          border: 'none',
          borderRadius: 4,
          background: hover ? 'var(--brand-soft)' : 'none',
          padding: '0 2px',
          margin: '0 -2px',
          cursor: 'pointer',
          font: 'inherit',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--brand)',
          textDecoration: 'underline',
          textDecorationColor: 'var(--brand-border)',
          textUnderlineOffset: 3,
          transition: 'background 120ms ease',
        }}
      >
        {children}
      </button>
    </Tooltip>
  );
};

export default UsageLink;
