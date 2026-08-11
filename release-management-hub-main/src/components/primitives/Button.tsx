import type { ButtonHTMLAttributes, ReactNode } from 'react';

/* Replaces the .btn / .btn-primary / .btn-ghost rules from zerra.css, including
   the production-alignment overrides that landed on top of them: 16px text,
   8px radius, always bordered, and a `secondary` variant that is an outlined
   blue inverting on hover (production has no grey ghost button). */

type Variant = 'primary' | 'secondary' | 'danger';
type Size = 'md' | 'lg';

const VARIANT: Record<Variant, string> = {
  primary: 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700',
  secondary: 'bg-transparent border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
  danger: 'bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700',
};

const SIZE: Record<Size, string> = {
  md: 'h-9 px-4',
  lg: 'h-10 px-5',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Stretch to the container and centre the label (the old .btn-full). */
  block?: boolean;
  children?: ReactNode;
}

const Button = ({
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
  children,
  ...rest
}: Props) => (
  <button
    className={[
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border',
      'text-base font-medium leading-none transition-colors',
      'active:scale-[.97] motion-reduce:active:scale-100',
      /* Disabled is a flat grey rather than a dimmed brand colour, matching
         production's Button - a faded primary still reads as pressable. */
      'disabled:pointer-events-none disabled:border-transparent disabled:bg-[#E9E9E9] disabled:text-ink-600 disabled:shadow-none',
      VARIANT[variant],
      SIZE[size],
      block ? 'w-full' : '',
      className,
    ].join(' ')}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
