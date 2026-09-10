import type { CSSProperties } from 'react';
import { CONTROL, FOCUS_RING, RADIUS, SPACE, T, TYPE, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Input, select and textarea styling as style objects.

   Zerra spec: 36px tall, 8px radius, 1px --bd2 border on --card, 14px/400,
   0 12px padding. A left icon takes padding-left to 32; a select takes
   padding-right for its caret. Focus is --brand plus the 3px ring.

   Style objects rather than class strings, since the app styles inline. The
   `focused` and `invalid` flags are passed by the caller because inline styles
   cannot express :focus or :invalid on their own.
   --------------------------------------------------------------------------- */

interface FieldOpts {
  invalid?: boolean;
  focused?: boolean;
  /** Room for a 14-16px leading icon. */
  leadingIcon?: boolean;
}

const base = ({ invalid, focused, leadingIcon }: FieldOpts = {}): CSSProperties =>
  sx(
    {
      width: '100%',
      height: CONTROL.default,
      borderRadius: RADIUS.control,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: invalid ? T.dangBorder : T.bd2,
      background: T.card,
      color: T.tx,
      outline: 'none',
      transition: 'border-color 120ms ease, box-shadow 120ms ease',
      paddingLeft: leadingIcon ? SPACE.x8 : SPACE.x3,
      paddingRight: SPACE.x3,
      ...TYPE.input,
    },
    focused && {
      borderColor: invalid ? T.dang : T.brand,
      boxShadow: invalid ? `0 0 0 3px ${T.dangSoft}` : FOCUS_RING,
    },
    /* A failed field also shakes once - the guidelines pair shakeX with the
       danger border. */
    invalid && { animation: 'shakeX 200ms ease' },
  );

export const inputStyle = base;

/** Read-only: flat, clearly not editable. */
export const readonlyInputStyle: CSSProperties = {
  width: '100%',
  height: CONTROL.default,
  borderRadius: RADIUS.control,
  border: `1px solid ${T.bd2}`,
  background: T.su2,
  color: T.tx4,
  padding: `0 ${SPACE.x3}px`,
  outline: 'none',
  ...TYPE.input,
};

/** Textarea: same treatment, taller, vertical resize only. */
export const textareaStyle = (opts: FieldOpts = {}): CSSProperties =>
  sx(base(opts), {
    height: 'auto',
    minHeight: 88,
    padding: SPACE.x3,
    resize: 'vertical',
    lineHeight: 1.5,
  });

/* A native select needs its own caret drawn in, since a styled-open dropdown
   is the one thing plain markup cannot do. Inlined as a data URI so there is
   no asset to lose. The glyph is Phosphor's caret-down, matching the icon set. */
const caret = (fill: string) =>
  `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 256 256' fill='${fill}'><path d='M213.66 101.66l-80 80a8 8 0 0 1-11.32 0l-80-80A8 8 0 0 1 53.66 90.34L128 164.69l74.34-74.35a8 8 0 0 1 11.32 11.32z'/></svg>")`;

export const caretBackground: CSSProperties = {
  backgroundImage: caret('%235C5C63'),
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
};

/** A caret in white, for the role picker sitting on the brand top bar. */
export const caretBackgroundLight: CSSProperties = {
  backgroundImage: caret('white'),
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
};

/** Select: the field plus room on the right for its caret. */
export const selectStyle = (opts: FieldOpts = {}): CSSProperties =>
  sx(base(opts), caretBackground, {
    appearance: 'none',
    cursor: 'pointer',
    paddingRight: SPACE.x8,
  });
