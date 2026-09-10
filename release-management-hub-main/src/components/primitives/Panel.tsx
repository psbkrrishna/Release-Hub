import { useState, type CSSProperties, type ReactNode } from 'react';
import { RADIUS, SPACE, T, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Zerra card: --card on a 1px --bd2 border, 8px radius, 20px padding.

   Radius is 8, not 12: the guidelines reserve 12 for a large feature panel,
   and a card is not one. Hover on an interactive card is the --brand-border
   plus soft blue fill the interaction rules specify - no lift, no scale.
   --------------------------------------------------------------------------- */

interface Props {
  children: ReactNode;
  style?: CSSProperties;
  /** Renders as a pressable card. */
  onClick?: () => void;
  /** 12px radius, for a genuinely large feature surface. */
  feature?: boolean;
}

const Panel = ({ children, style, onClick, feature = false }: Props) => {
  const [hover, setHover] = useState(false);

  /* Longhand border properties, not the `border` shorthand: hover changes
     only borderColor, and React warns when a shorthand and its longhand are
     both set across a rerender. */
  const base: CSSProperties = {
    background: T.card,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: T.bd2,
    borderRadius: feature ? RADIUS.panel : RADIUS.control,
    padding: SPACE.x5,
    boxShadow: T.elev1,
  };

  if (!onClick) return <div style={sx(base, style)}>{children}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={sx(
        base,
        {
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'background 120ms ease, border-color 120ms ease',
        },
        hover && { borderColor: T.brandBorder, background: T.brandSoft },
        style,
      )}
    >
      {children}
    </button>
  );
};

export default Panel;
