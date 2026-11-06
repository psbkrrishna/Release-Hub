import type { ReactNode } from 'react';
import { Info } from '@phosphor-icons/react';
import { RADIUS, SPACE, T } from '@/styles/zerra';

/* The grey explainer note: always-on context, one line, never a call to
   attention - that is what the badges and next steps are for. */
const Note = ({ children, icon }: { children: ReactNode; icon?: ReactNode }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: SPACE.x2,
      padding: '10px 12px',
      borderRadius: RADIUS.control,
      background: T.su2,
      border: `1px solid ${T.bd2}`,
      fontSize: 13,
      lineHeight: 1.4,
      color: T.tx2,
    }}
  >
    <span style={{ display: 'inline-flex', color: T.tx3, marginTop: 1, flexShrink: 0 }}>{icon ?? <Info size={16} />}</span>
    <span>{children}</span>
  </div>
);

export default Note;
