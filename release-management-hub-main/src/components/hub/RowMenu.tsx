import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/* ---------------------------------------------------------------------------
   The actions menu is portalled to the body and fixed-positioned. Rendered
   inside the frozen cell it shared that cell's stacking context, so the rows
   below painted over it, and the table's own overflow container clipped it on
   the bottom rows. Placed by hand against the button, flipped above when
   there isn't room below, and closed on scroll.
   --------------------------------------------------------------------------- */

export interface RowMenuItem {
  label: string;
  icon: string;
  onSelect: () => void;
  danger?: boolean;
  separatorBefore?: boolean;
}

const RowMenu = ({ label, items }: { label: string; items: RowMenuItem[] }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current || !menuRef.current) return;
    const b = btnRef.current.getBoundingClientRect();
    const m = menuRef.current.getBoundingClientRect();
    const gap = 4;
    const below = window.innerHeight - b.bottom;
    const top = below < m.height + gap && b.top > m.height + gap ? b.top - m.height - gap : b.bottom + gap;
    const left = Math.max(8, Math.min(b.right - m.width, window.innerWidth - m.width - 8));
    setPos({ top: Math.round(top), left: Math.round(left) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    // A fixed menu would otherwise sit still while the page or table moves.
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <div className="menu-wrap">
      <button
        ref={btnRef}
        className="icon-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Actions for ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <i className="ph ph-dots-three-vertical" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="rowmenu open"
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item) => (
              <div key={item.label}>
                {item.separatorBefore && <div className="mi-sep" />}
                <button
                  className={`mi${item.danger ? ' danger' : ''}`}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  <i className={`ph ph-${item.icon}`} />
                  {item.label}
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default RowMenu;
