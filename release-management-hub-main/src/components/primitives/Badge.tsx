import type { ReactNode } from 'react';

/* One component for what used to be six near-identical rules: .tag (solid /
   outline / green / amber), .flabel (is-new / is-enh), .mod-pill, .pill-csm,
   .pill-req and .code. They had already converged on the same production
   Badge shape - 8px radius, px-2 py-1, 12px/500, 16px line-height - so the
   only real difference left is the colour pair. */

type Variant =
  | 'solid'      // .tag.solid        - brand fill, white text
  | 'outline'    // .tag.outline      - white fill, neutral border
  | 'neutral'    // .mod-pill, .flabel.is-enh
  | 'green'      // .tag.green
  | 'amber'      // .pill-csm, .tag.amber
  | 'brand'      // .pill-req
  | 'purple'     // .flabel.is-new
  | 'code';      // .code - the FEAT-0xx chip

const VARIANT: Record<Variant, string> = {
  solid: 'bg-brand text-white border-transparent',
  outline: 'bg-white text-ink-700 border-ink-150',
  neutral: 'bg-ink-50 text-ink-700 border-ink-150',
  green: 'bg-green-50 text-green-700 border-green-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  brand: 'bg-brand-soft text-brand-text border-brand-border',
  purple: 'bg-purple-50 text-purple-900 border-purple-200',
  code: 'bg-ink-50 text-ink-700 border-ink-150 font-semibold tracking-[.02em] tabular-nums',
};

interface Props {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}

const Badge = ({ variant = 'neutral', className = '', children }: Props) => (
  <span
    className={[
      'inline-flex items-center gap-1 whitespace-nowrap rounded-lg border px-2 py-1',
      'text-xs font-medium leading-4',
      VARIANT[variant],
      className,
    ].join(' ')}
  >
    {children}
  </span>
);

export default Badge;
