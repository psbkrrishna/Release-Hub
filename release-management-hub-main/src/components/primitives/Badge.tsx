import type { CSSProperties, ReactNode } from 'react';
import { RADIUS, SPACE, T, TYPE, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Zerra pill. Height 22-24px, radius 999px, 12px/600, 0-9..12px padding.

   The brand-versus-neutral split is load-bearing, and the guidelines are
   explicit about it: brand marks a transient or live action, neutral marks a
   static configuration. A static state is never blue. The variant names below
   say which is which so a call site cannot get it the wrong way round.
   --------------------------------------------------------------------------- */

type Variant =
  | 'live' // transient / in-flight - brand
  | 'static' // a fixed configuration value - neutral
  | 'success'
  | 'warning'
  | 'danger'
  | 'new' // anything new - the reserved accent
  | 'code'; // an identifier chip

const VARIANT: Record<Variant, CSSProperties> = {
  live: { background: T.brandSoft, color: T.brand, borderColor: T.brandBorder },
  static: { background: T.su2, color: T.tx3, borderColor: T.bd2 },
  success: { background: T.succSoft, color: T.succText, borderColor: T.succBorder },
  warning: { background: T.warnSoft, color: T.warnText, borderColor: T.warnBorder },
  danger: { background: T.dangSoft, color: T.dangText, borderColor: T.dangBorder },
  new: { background: T.indigoSoft, color: T.indigo, borderColor: T.indigo },
  code: {
    background: T.su2,
    color: T.tx3,
    borderColor: T.bd2,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '0.02em',
  },
};

const Badge = ({
  variant = 'static',
  style,
  children,
}: {
  variant?: Variant;
  style?: CSSProperties;
  children: ReactNode;
}) => (
  <span
    style={sx(
      {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 24,
        padding: `0 ${SPACE.x3}px`,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderStyle: 'solid',
        whiteSpace: 'nowrap',
        ...TYPE.pill,
      },
      VARIANT[variant],
      style,
    )}
  >
    {children}
  </span>
);

export default Badge;
