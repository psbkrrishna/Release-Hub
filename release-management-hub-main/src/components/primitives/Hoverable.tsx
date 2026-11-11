import { useState, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   An element with a hover style. Inline styles cannot express :hover and the
   ruleset allows no stylesheet, so hover is state - this keeps that state out
   of every row, tile and link that needs one.

   `hoverStyle` may also be a function of the hover flag's consumers: pass
   `render` to get the flag for styling children (an icon that turns brand when
   its tile is hovered).
   --------------------------------------------------------------------------- */

type Props = {
  as?: ElementType;
  style?: CSSProperties;
  hoverStyle?: CSSProperties;
  children?: ReactNode | ((hover: boolean) => ReactNode);
  [key: string]: unknown;
};

const Hoverable = ({ as: El = 'div', style, hoverStyle, children, onMouseEnter, onMouseLeave, onFocus, onBlur, ...rest }: Props) => {
  const [hover, setHover] = useState(false);
  const call = (fn: unknown, e: unknown) => typeof fn === 'function' && fn(e);
  return (
    <El
      {...rest}
      onMouseEnter={(e: unknown) => { setHover(true); call(onMouseEnter, e); }}
      onMouseLeave={(e: unknown) => { setHover(false); call(onMouseLeave, e); }}
      onFocus={(e: unknown) => { if (El === 'button' || El === 'a') setHover(true); call(onFocus, e); }}
      onBlur={(e: unknown) => { if (El === 'button' || El === 'a') setHover(false); call(onBlur, e); }}
      style={sx(style, hover && hoverStyle)}
    >
      {typeof children === 'function' ? children(hover) : children}
    </El>
  );
};

export default Hoverable;
