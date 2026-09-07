import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Filter, Search, X } from 'lucide-react';

/* ---------------------------------------------------------------------------
   A filter that lives in the column header it acts on.

   The header carries a funnel button, filled and brand-coloured while the
   column is filtered; clicking it opens a menu with the actual control. The
   controls used to sit in a second header row as bare inputs, which read as a
   stray first data row and gave no indication of which columns could be
   filtered at all.

   The menu is portalled to the body and fixed-positioned, for the same reason
   RowMenu is: rendered inside a frozen cell it would inherit that cell's
   stacking context, and the table's own overflow container would clip it.
   Positioning follows RowMenu exactly - flipped above when there is no room
   below, and closed on scroll.
   --------------------------------------------------------------------------- */

type Props = {
  /** Spoken form, used in the menu title and the button's label. */
  label: string;
  value: string;
  onChange: (next: string) => void;
} & (
  | { kind: 'text'; placeholder?: string }
  | { kind: 'select'; options: string[] }
);

/** 'all' is the select's unfiltered value; text filters use ''. */
const isActive = (p: Props) => (p.kind === 'text' ? p.value.trim() !== '' : p.value !== 'all');

const ColumnFilter = (props: Props) => {
  const { label, value, onChange } = props;
  const active = isActive(props);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [optionQuery, setOptionQuery] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current || !menuRef.current) return;
    const b = btnRef.current.getBoundingClientRect();
    const m = menuRef.current.getBoundingClientRect();
    const gap = 4;
    const below = window.innerHeight - b.bottom;
    const top =
      below < m.height + gap && b.top > m.height + gap ? b.top - m.height - gap : b.bottom + gap;
    // Right-aligned to the button, then kept inside the viewport.
    const left = Math.max(8, Math.min(b.right - m.width, window.innerWidth - m.width - 8));
    setPos({ top: Math.round(top), left: Math.round(left) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setOptionQuery('');
  }, [open]);

  const options = useMemo(() => {
    if (props.kind !== 'select') return [];
    const q = optionQuery.trim().toLowerCase();
    return q ? props.options.filter((o) => o.toLowerCase().includes(q)) : props.options;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.kind, props.kind === 'select' ? props.options : null, optionQuery]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={active ? `Filter by ${label} (active)` : `Filter by ${label}`}
        title={active ? `${label}: ${value}` : `Filter by ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={[
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors',
          active
            ? 'border-brand-border bg-brand-soft text-brand'
            : 'border-transparent text-ink-500 hover:border-ink-200 hover:bg-white hover:text-ink-700',
        ].join(' ')}
      >
        <Filter size={12} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label={`Filter by ${label}`}
            className="fixed z-rowmenu w-[248px] overflow-hidden rounded-xl border border-ink-150 bg-white text-left shadow-elev3"
            style={{
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              visibility: pos ? 'visible' : 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-ink-150 px-3 py-2">
              <span className="text-xs font-semibold uppercase tracking-[.04em] text-ink-500">
                {label}
              </span>
              {active && (
                <button
                  type="button"
                  onClick={() => {
                    onChange(props.kind === 'text' ? '' : 'all');
                    setOpen(false);
                  }}
                  className="ml-auto inline-flex items-center gap-1 rounded text-xs font-semibold text-brand hover:underline"
                >
                  <X size={11} />Clear
                </button>
              )}
            </div>

            {props.kind === 'text' ? (
              <div className="p-2">
                <div className="relative">
                  <input
                    ref={firstFieldRef}
                    className="h-9 w-full rounded-md border border-[#D4D4D8] bg-white pl-8 pr-2 text-sm text-ink-900 outline-none placeholder:text-ink-500 focus:border-brand-border"
                    placeholder={props.placeholder ?? 'Contains…'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setOpen(false)}
                  />
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* A search inside the list once there are enough options to
                    make scanning them work. */}
                {props.options.length > 6 && (
                  <div className="border-b border-ink-150 p-2">
                    <div className="relative">
                      <input
                        ref={firstFieldRef}
                        className="h-8 w-full rounded-md border border-[#D4D4D8] bg-white pl-8 pr-2 text-13 text-ink-900 outline-none placeholder:text-ink-500 focus:border-brand-border"
                        placeholder="Find…"
                        value={optionQuery}
                        onChange={(e) => setOptionQuery(e.target.value)}
                      />
                      <Search
                        size={13}
                        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500"
                      />
                    </div>
                  </div>
                )}

                <div className="max-h-[240px] overflow-y-auto p-1">
                  {[{ v: 'all', l: 'All' }, ...options.map((o) => ({ v: o, l: o }))].map(({ v, l }) => {
                    const on = v === value;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          onChange(v);
                          setOpen(false);
                        }}
                        className={[
                          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                          on ? 'bg-brand-soft font-medium text-brand-text' : 'text-ink-900 hover:bg-ink-50',
                        ].join(' ')}
                      >
                        <Check
                          size={14}
                          className={on ? 'shrink-0 text-brand' : 'shrink-0 text-transparent'}
                        />
                        <span className="truncate">{l}</span>
                      </button>
                    );
                  })}
                  {options.length === 0 && (
                    <p className="px-2 py-3 text-13 text-ink-600">No match.</p>
                  )}
                </div>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

export default ColumnFilter;
