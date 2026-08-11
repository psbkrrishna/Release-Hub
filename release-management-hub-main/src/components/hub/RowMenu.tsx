import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import IconButton from '@/components/primitives/IconButton';

/* ---------------------------------------------------------------------------
   The actions menu is portalled to the body and fixed-positioned. Rendered
   inside the frozen cell it shared that cell's stacking context, so the rows
   below painted over it, and the table's own overflow container clipped it on
   the bottom rows. Placed by hand against the button, flipped above when
   there isn't room below, and closed on scroll.

   Only the styling changed in this pass - the positioning logic is the same,
   because it is the part that was hard to get right.
   --------------------------------------------------------------------------- */

export interface RowMenuItem {
  label: string;
  /** A lucide icon component, not a name string. */
  icon: ComponentType<{ size?: number | string; className?: string }>;
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
    <div className="relative">
      <IconButton
        ref={btnRef}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Actions for ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreVertical size={16} />
      </IconButton>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-rowmenu min-w-[216px] rounded-xl border border-ink-150 bg-white p-2 text-left shadow-elev3"
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              visibility: pos ? 'visible' : 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map(({ label: itemLabel, icon: Icon, onSelect, danger, separatorBefore }) => (
              <div key={itemLabel}>
                {separatorBefore && <div className="my-2 h-px bg-ink-150" />}
                <button
                  role="menuitem"
                  className={[
                    'flex w-full min-h-9 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    danger ? 'text-red-600 hover:bg-red-50' : 'text-ink-900 hover:bg-ink-50',
                  ].join(' ')}
                  onClick={() => {
                    setOpen(false);
                    onSelect();
                  }}
                >
                  <Icon size={16} className={danger ? 'text-red-600' : 'text-ink-600'} />
                  {itemLabel}
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
