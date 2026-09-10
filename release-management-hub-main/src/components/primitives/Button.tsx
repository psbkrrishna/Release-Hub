import { useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { CONTROL, RADIUS, SPACE, T, TYPE, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Zerra button. Height 36px, radius 8px, 14px/600, 8px gap to its icon.

   `size` is gone: the guidelines give one button height, so a second one was
   only ever a way to break the control rhythm. Callers that asked for the
   large size now get the 36px control, and `compact` gives the 28px in-row
   variant the guidelines do define.

   Hover is state rather than a CSS pseudo-class, because inline styles cannot
   express :hover and the ruleset allows no stylesheet to hold it.
   --------------------------------------------------------------------------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const REST: Record<Variant, CSSProperties> = {
  primary: { background: T.brandSolid, color: '#FFFFFF', borderColor: 'transparent' },
  secondary: { background: T.card, color: T.tx2, borderColor: T.bd2 },
  ghost: { background: 'transparent', color: T.tx2, borderColor: 'transparent' },
  danger: { background: T.dangSolid, color: '#FFFFFF', borderColor: 'transparent' },
};

const HOVER: Record<Variant, CSSProperties> = {
  primary: { background: T.brandSolidHover },
  secondary: { background: T.su2 },
  ghost: { background: T.su2 },
  danger: { background: T.dangText },
};

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: Variant;
  /** The 28px in-row button. */
  compact?: boolean;
  /** Stretch to the container and centre the label. */
  block?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}

const Button = ({
  variant = 'primary',
  compact = false,
  block = false,
  disabled,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: Props) => {
  const [hover, setHover] = useState(false);

  return (
    <button
      disabled={disabled}
      onMouseEnter={(e) => { setHover(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHover(false); onMouseLeave?.(e); }}
      style={sx(
        {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACE.x2,
          height: compact ? CONTROL.compact : CONTROL.default,
          padding: `0 ${variant === 'primary' ? SPACE.x5 : SPACE.x4}px`,
          borderRadius: RADIUS.control,
          /* Longhand, not the `border` shorthand - the variants below set
             borderColor, and React warns if both are set across a rerender. */
          borderWidth: 1,
          borderStyle: 'solid',
          whiteSpace: 'nowrap',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 120ms ease, color 120ms ease',
          width: block ? '100%' : undefined,
          ...TYPE.button,
        },
        REST[variant],
        hover && !disabled && HOVER[variant],
        /* Disabled is a flat grey, not a dimmed brand colour - a faded primary
           still reads as pressable. Kept visible at 0.4 rather than hidden. */
        disabled && {
          background: T.su2,
          color: T.tx4,
          borderColor: 'transparent',
          opacity: 0.4,
        },
        style,
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
