import {
  forwardRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode,
} from 'react';
import { CONTROL, RADIUS, T, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Icon-only control. 36x36 by default, 28x28 compact, 48x48 on the icon rail -
   the three sizes the guidelines define, and radius 8 on all of them.

   Every caller must pass an aria-label and a title: the guidelines make a
   tooltip mandatory on every icon-only control, and on every disabled one it
   has to say why. Disabled stays visible at 0.4 rather than hidden.

   Forwards its ref because RowMenu measures the trigger to position a
   fixed-position menu against it.
   --------------------------------------------------------------------------- */

type Tone = 'default' | 'brand' | 'onBrand';
type Size = 'default' | 'compact' | 'rail';

const REST: Record<Tone, CSSProperties> = {
  default: { color: T.tx3 },
  brand: { color: T.brand },
  onBrand: { color: 'rgba(255,255,255,0.9)' },
};

const HOVER: Record<Tone, CSSProperties> = {
  default: { background: T.su2, color: T.tx },
  brand: { background: T.brandSoft },
  onBrand: { background: 'rgba(255,255,255,0.16)', color: '#FFFFFF' },
};

const SIZE: Record<Size, number> = {
  default: CONTROL.default,
  compact: CONTROL.compact,
  rail: CONTROL.rail,
};

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  tone?: Tone;
  size?: Size;
  /** Adds the 1px border the pagination arrows carry. */
  bordered?: boolean;
  /** Required: the guidelines make a tooltip mandatory here. */
  title: string;
  'aria-label': string;
  children?: ReactNode;
  style?: CSSProperties;
}

const IconButton = forwardRef<HTMLButtonElement, Props>(
  (
    { tone = 'default', size = 'default', bordered = false, disabled, children, style,
      onMouseEnter, onMouseLeave, ...rest },
    ref,
  ) => {
    const [hover, setHover] = useState(false);
    const px = SIZE[size];

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onMouseEnter={(e) => { setHover(true); onMouseEnter?.(e); }}
        onMouseLeave={(e) => { setHover(false); onMouseLeave?.(e); }}
        style={sx(
          {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            height: px,
            width: px,
            borderRadius: RADIUS.control,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: bordered ? T.bd2 : 'transparent',
            background: bordered ? T.card : 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background 120ms ease, color 120ms ease',
          },
          REST[tone],
          hover && !disabled && HOVER[tone],
          disabled && { opacity: 0.4 },
          style,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';

export default IconButton;
