import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import IconButton from '@/components/primitives/IconButton';
import { ROOT, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Right-hand drawer, per the guidelines: full height, --card, --elev3,
   slide-in from the right over a fading scrim. Context lives in the header as
   a subtitle, not as a block in the body.

   Drill-downs stack rather than swap: a drawer opened from inside another one
   is narrower and sits over a lighter scrim, and closing it returns to the
   drawer beneath with nothing lost. Escape closes only the topmost.
   --------------------------------------------------------------------------- */

/* Every open drawer, bottom to top. Escape goes to the last one, and the page
   scroll unlocks when the list empties - checked against the list itself
   rather than a running count, which could drift and leave the page locked
   after the last drawer closed. */
const stack: symbol[] = [];
let unlockedOverflow = '';

const Drawer = ({
  open,
  onClose,
  title,
  subtitle,
  level = 0,
  width: widthProp,
  footer,
  children,
}: {
  /** Panel width; a list of companies needs more room than one company. */
  width?: number;
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  /** 0 for a first drawer; 1 and up for one stacked over it. */
  level?: number;
  footer?: ReactNode;
  children: ReactNode;
}) => {
  const panel = useRef<HTMLDivElement>(null);
  // Held in a ref so a new handler each render doesn't re-run the open effect
  // (which would steal focus back to the panel).
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const me = Symbol('drawer');
    if (!stack.length) unlockedOverflow = document.body.style.overflow;
    stack.push(me);
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      // Only the drawer on top answers Escape.
      if (e.key === 'Escape' && stack[stack.length - 1] === me) {
        e.stopPropagation();
        close.current();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const at = stack.indexOf(me);
      if (at >= 0) stack.splice(at, 1);
      if (!stack.length) document.body.style.overflow = unlockedOverflow;
      restore?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  const width = widthProp ?? (level === 0 ? 520 : 460);

  /* Portalled to <body>; the tokens reach it from <html> (see App.tsx). The
     font does not, so it is restated. */
  return createPortal(
    <div style={{ fontFamily: ROOT.fontFamily, color: T.tx, position: 'fixed', inset: 0, zIndex: 400 + level * 2 }}>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: level === 0 ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',
          animation: 'scrimIn 200ms ease',
        }}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`drawer-title-${level}`}
        tabIndex={-1}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: `min(${width}px, 100vw)`,
          display: 'flex',
          flexDirection: 'column',
          background: T.card,
          boxShadow: T.elev3,
          outline: 'none',
          animation: 'slideInRight 200ms ease',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: SPACE.x3,
            padding: `${SPACE.x4}px ${SPACE.x4}px ${SPACE.x3}px`,
            borderBottom: `1px solid ${T.bd2}`,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 id={`drawer-title-${level}`} style={{ margin: 0, ...TYPE.sectionTitle }}>{title}</h2>
            {subtitle && <div style={{ marginTop: SPACE.x1, ...TYPE.helper }}>{subtitle}</div>}
          </div>
          <IconButton size="compact" onClick={onClose} title="Close" aria-label="Close">
            <X size={16} />
          </IconButton>
        </div>
        {/* Grid rather than a flex column, with both tracks pinned: rows at
            max-content so a block that clips its own corners (overflow
            hidden) isn't squashed to a sliver when the body scrolls, and one
            column no wider than the panel so a wide table scrolls inside its
            own box instead of pushing the whole drawer sideways. */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: SPACE.x4,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gridAutoRows: 'max-content',
            alignContent: 'start',
            gap: SPACE.x4,
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: SPACE.x2,
              padding: `${SPACE.x3}px ${SPACE.x4}px`,
              borderTop: `1px solid ${T.bd2}`,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Drawer;
