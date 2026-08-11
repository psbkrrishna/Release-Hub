import type { ReactNode } from 'react';

/* Replaces .panel (and stands in for the shadcn Card the Knowledge Base
   pages used). One card treatment, used by every page. */

interface Props {
  className?: string;
  children: ReactNode;
  /** Renders as a button-like clickable card (the AI Review Insights tile). */
  onClick?: () => void;
}

const Panel = ({ className = '', children, onClick }: Props) => {
  const base = 'rounded-xl border border-ink-150 bg-white p-5 shadow-elev1';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} group w-full cursor-pointer text-left ${className}`}
      >
        {children}
      </button>
    );
  }

  return <div className={`${base} ${className}`}>{children}</div>;
};

export default Panel;
