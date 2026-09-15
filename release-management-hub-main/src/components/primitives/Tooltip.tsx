import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { RADIUS, T } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The Zerra tooltip: --neutral-strong, white, 12px, radius 6, 6px 8px padding,
   120ms fade.

   The guidelines make this mandatory on every icon-only control and every
   disabled control, where it has to explain *why* the control is disabled. A
   native `title` cannot do the second job: browsers fire no mouse events on a
   disabled form control, so its tooltip never appears. `inert` below is for
   exactly that case - it drops pointer events on the wrapped control so the
   hover lands on this wrapper instead.

   Portalled and fixed-positioned, the same way RowMenu and ColumnFilter are.
   The feature table scrolls horizontally, and anything positioned inside it is
   clipped at the container's edge - which is where the controls that most need
   a tooltip happen to sit.
   --------------------------------------------------------------------------- */

/** Keeps the bubble this far off the viewport edge. */
const EDGE = 8;

const Tooltip = ({
  label,
  side = 'top',
  inert = false,
  children,
}: {
  /** One line. If it needs two, the copy is wrong. */
  label: string;
  side?: 'top' | 'bottom';
  /** Set when wrapping a disabled control, which swallows its own hover. */
  inert?: boolean;
  children: ReactNode;
}) => {
  const trigger = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = () => {
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    setPos({
      top: side === 'top' ? r.top - 6 : r.bottom + 6,
      left: r.left + r.width / 2,
    });
  };

  /* Centred on the trigger, then nudged back inside the viewport if that put
     it over an edge. One pass: once it fits, the overflow is zero and this
     stops setting state. */
  useLayoutEffect(() => {
    if (!pos || !bubble.current) return;
    const b = bubble.current.getBoundingClientRect();
    const overRight = b.right - (window.innerWidth - EDGE);
    const overLeft = EDGE - b.left;
    if (overRight > 0 && overLeft <= 0) setPos((p) => p && { ...p, left: p.left - overRight });
    else if (overLeft > 0 && overRight <= 0) setPos((p) => p && { ...p, left: p.left + overLeft });
  }, [pos]);

  return (
    <>
      <span
        ref={trigger}
        style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        onFocus={show}
        onBlur={() => setPos(null)}
      >
        <span style={{ display: 'inline-flex', pointerEvents: inert ? 'none' : undefined }}>
          {children}
        </span>
      </span>

      {pos &&
        createPortal(
          <span
            ref={bubble}
            role="tooltip"
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              transform: `translate(-50%, ${side === 'top' ? '-100%' : '0'})`,
              zIndex: 130,
              pointerEvents: 'none',
              /* One line, and sized to it. Without this a bubble whose
                 trigger sits off the right of a scrolled container has no
                 room to lay out in and collapses to its longest word before
                 the clamp below ever runs. */
              whiteSpace: 'nowrap',
              background: T.neutralStrong,
              color: '#FFFFFF',
              borderRadius: RADIUS.tag,
              padding: '6px 8px',
              fontSize: 12,
              fontWeight: 400,
              lineHeight: 1.3,
              animation: 'scrimIn 120ms ease',
            }}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  );
};

export default Tooltip;
