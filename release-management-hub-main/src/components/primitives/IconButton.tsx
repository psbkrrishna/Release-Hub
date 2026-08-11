import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

/* Replaces .icon-btn. `tone` covers the places it appeared with a different
   colour: the brand-tinted buttons in a table's Release Content cell, and the
   white ones sitting on the blue top bar.

   Forwards its ref because RowMenu measures the trigger to position a
   fixed-position menu against it. */

type Tone = 'default' | 'brand' | 'onBrand';

const TONE: Record<Tone, string> = {
  default: 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
  brand: 'text-brand hover:bg-brand-soft',
  onBrand: 'text-white/90 hover:bg-white/[.16] hover:text-white',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  /** Adds the 1px border the pagination arrows carry. */
  bordered?: boolean;
  children?: ReactNode;
}

const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({ tone = 'default', bordered = false, className = '', children, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      className={[
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
        'disabled:pointer-events-none disabled:opacity-40',
        TONE[tone],
        bordered ? 'border border-ink-150 bg-white' : 'border-none bg-transparent',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  ),
);

IconButton.displayName = 'IconButton';

export default IconButton;
