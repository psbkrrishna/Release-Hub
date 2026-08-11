import type { ReactNode } from 'react';

/* Replaces .empty / .empty .ico. Used by the Insights placeholder, the hub's
   no-results state and the feature-not-found state. */

const EmptyState = ({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="px-5 py-12 text-center">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-50 text-ink-500">
      {icon}
    </div>
    <h4 className="mb-1 text-lg font-semibold text-ink-900">{title}</h4>
    {children && <p className="mx-auto mb-4 max-w-empty text-ink-600">{children}</p>}
    {action}
  </div>
);

export default EmptyState;
