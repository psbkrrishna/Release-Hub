import type { ReactNode } from 'react';
import { SPACE, T, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Zerra empty state: a 28-32px --tx4 icon, one 14px/600 line, a 13px --tx3
   explanation, and one primary action. No illustration - the guidelines are
   explicit, and the tinted tile this used to sit the icon in was decoration
   doing no work.
   --------------------------------------------------------------------------- */

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
  <div style={{ padding: `${SPACE.x10}px ${SPACE.x5}px`, textAlign: 'center' }}>
    <div style={{ color: T.tx4, marginBottom: SPACE.x3 }}>{icon}</div>
    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.tx }}>{title}</h4>
    {children && (
      <p
        style={sx(
          { margin: `${SPACE.x1}px auto 0`, maxWidth: '44ch', fontSize: 13, lineHeight: 1.4 },
          { color: T.tx3 },
        )}
      >
        {children}
      </p>
    )}
    {action && <div style={{ marginTop: SPACE.x4 }}>{action}</div>}
  </div>
);

export default EmptyState;
