import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CaretDown, CaretRight, Check } from '@phosphor-icons/react';
import { formatDate } from '@/data/features';
import { asOf } from '@/data/usage/query';
import type { Breakdown } from '@/types/Usage';
import { RADIUS, SPACE, T } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The report header and its filter bar, as one sticky block - the guidelines'
   Hiring Funnel Reports pattern:
     breadcrumb (12px)
     <Report> for [Group ▾]                              Data to · About
     ───────────────────────────────────────────────────────────────────
     Saved views | quick filters · date · All filters · chips · Save · Clear
   Both run the full width of the page with a --bd2 rule under each, and
   stick under whatever is fixed above them (the top bar, and the release
   banner when it shows), measured rather than assumed. Their content lines
   up with the page's centred column.
   --------------------------------------------------------------------------- */

const GROUPS: Array<{ value: Breakdown; label: string }> = [
  { value: 'customers', label: 'Customers' },
  { value: 'modules', label: 'Modules' },
  { value: 'features', label: 'Features' },
  { value: 'actions', label: 'Actions' },
];

/* The shell publishes its own height as --shell-top: 56px, or 100px while the
   webinar banner shows. Reading it keeps the report header flush under
   whichever is fixed above, with nothing to measure. */
const useStickyTop = () => 'var(--shell-top, 56px)';

/** The header's selector: 36px, --su1 fill, 18px/700 value, caret. Its menu
 *  is a plain menu - 32px rows, the current one brand with a check. */
const GroupBy = ({ value, onChange }: { value: Breakdown; onChange: (v: Breakdown) => void }) => {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Break down by ${GROUPS.find((g) => g.value === value)?.label.toLowerCase()}`}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          height: 36,
          padding: '0 12px',
          borderRadius: RADIUS.control,
          border: `1px solid ${hover || open ? T.brandBorder : T.bd2}`,
          background: T.su1,
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: SPACE.x2,
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 700, color: T.tx, whiteSpace: 'nowrap' }}>
          {GROUPS.find((g) => g.value === value)?.label}
        </span>
        <CaretDown size={14} weight="bold" color="var(--tx4)" />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 200, background: T.card,
            border: `1px solid ${T.bd}`, borderRadius: RADIUS.control, boxShadow: T.elev3, padding: 4, zIndex: 60,
            display: 'flex', flexDirection: 'column', animation: 'riseIn 160ms ease',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tx4, padding: '8px 8px 4px' }}>
            Break down by
          </div>
          {GROUPS.map((g) => {
            const on = g.value === value;
            return (
              <button
                key={g.value}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => { onChange(g.value); setOpen(false); }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--su2)'; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
                style={{
                  height: 32, padding: '0 8px', borderRadius: RADIUS.control, border: 'none',
                  background: on ? T.brandSoft : 'transparent', color: on ? T.brand : T.tx2, fontWeight: on ? 600 : 400,
                  fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: SPACE.x2, textAlign: 'left',
                }}
              >
                {g.label}
                {on && <Check size={14} weight="bold" />}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
};

const ReportHeader = ({
  by,
  onBy,
  onAbout,
  children,
}: {
  by: Breakdown;
  onBy: (b: Breakdown) => void;
  onAbout: () => void;
  /** The filter bar, stuck directly under the header. */
  children: ReactNode;
}) => {
  const top = useStickyTop();
  const navigate = useNavigate();
  /* Kept from the first render: filter changes rewrite the query string, and
     router state does not survive those. */
  const state = useLocation().state as { trail?: Array<{ label: string; path: string }> } | null;
  const [trail] = useState(() => state?.trail ?? []);
  const column = { maxWidth: 1200, margin: '0 auto' };

  return (
    <div style={{ position: 'sticky', top, zIndex: 40, margin: '-16px -16px 0' }}>
      <div style={{ background: T.card, borderBottom: `1px solid ${T.bd2}`, padding: '8px 16px 12px' }}>
        <div style={{ ...column, display: 'flex', flexDirection: 'column', gap: SPACE.x1 }}>
          {/* A trail only when the report was opened from Get help (a usage
              number, or "View adoption"); from the rail it is a top-level page
              and the guidelines give it no breadcrumb. */}
          {trail.length > 0 && (
            <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: SPACE.x1, fontSize: 12, fontWeight: 500, lineHeight: '16px', color: T.tx3 }}>
              {trail.map((c) => (
                <span key={c.path} style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE.x1 }}>
                  <a href={c.path} onClick={(e) => { e.preventDefault(); navigate(c.path); }} style={{ color: T.brand, textDecoration: 'none' }}>{c.label}</a>
                  <CaretRight size={10} weight="bold" color="var(--tx4)" />
                </span>
              ))}
              <span>Feature adoption</span>
            </nav>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.x4, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.x2, minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.tx, whiteSpace: 'nowrap' }}>Feature adoption</h1>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.tx4, padding: '0 4px' }}>for</span>
              <GroupBy value={by} onChange={onBy} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.x3, fontSize: 13 }}>
              <span style={{ color: T.tx3 }}>Data to {formatDate(asOf())}</span>
              <button
                type="button"
                onClick={onAbout}
                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: T.brand, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}
              >
                About these numbers
              </button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: T.card, borderBottom: `1px solid ${T.bd2}`, padding: '10px 16px' }}>
        <div style={column}>{children}</div>
      </div>
    </div>
  );
};

export default ReportHeader;
