import { useEffect, useRef, useState } from 'react';
import { CaretDown, MagnifyingGlass, X } from '@phosphor-icons/react';
import { PERIOD_LABEL, customerName, eventLabel, filterOptions } from '@/data/usage/query';
import type { AdoptionFilters, Period } from '@/types/Usage';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The sticky filter bar, per the guidelines' Insights filter bars: quick
   filters as 32px chip menus, then the date, then the applied-filter chips
   and a Clear in --dang-text. Every menu ends with the same footer - Clear
   left, Apply right - and a chip with a value set turns brand-soft.

   It sticks just under whatever is fixed above it (the top bar, and the
   release banner when that is showing), measured rather than assumed.
   --------------------------------------------------------------------------- */

type Option = { value: string; label: string; group?: string };

const useStickyTop = () => {
  const [top, setTop] = useState(56);
  useEffect(() => {
    const measure = () => {
      const banner = document.querySelector('.z-banner') as HTMLElement | null;
      setTop(banner ? Math.round(banner.getBoundingClientRect().bottom) : 56);
    };
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);
  return top;
};

const ChipMenu = ({
  label,
  value,
  display,
  options,
  searchable,
  changed,
  onApply,
}: {
  label: string;
  value?: string;
  /** What the chip says when a value is set. */
  display?: string;
  options: Option[];
  searchable?: boolean;
  /** Whether the chip shows as applied; defaults to having a value. A chip
   *  that always has one (the period) is only applied off its default. */
  changed?: boolean;
  onApply: (v: string | undefined) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | undefined>(value);
  const [q, setQ] = useState('');
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => { if (open) { setDraft(value); setQ(''); } }, [open, value]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const set = changed ?? Boolean(value);
  const shown = options.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()));
  // The committed choice sorts to the top when the menu opens.
  const ordered = value ? [...shown.filter((o) => o.value === value), ...shown.filter((o) => o.value !== value)] : shown;
  let lastGroup: string | undefined;

  return (
    <span ref={wrap} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          height: 32,
          padding: '0 12px',
          borderRadius: RADIUS.control,
          border: `1px solid ${set ? T.brandBorder : T.bd2}`,
          background: set ? T.brandSoft : T.card,
          color: set ? T.brand : T.tx2,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: SPACE.x2,
          whiteSpace: 'nowrap',
          maxWidth: 280,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
          {value && display ? <span style={{ fontWeight: 400 }}>: {display}</span> : null}
        </span>
        <CaretDown size={12} weight="bold" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: 300,
            maxWidth: 'calc(100vw - 32px)',
            background: T.card,
            border: `1px solid ${T.bd}`,
            borderRadius: RADIUS.control,
            boxShadow: T.elev3,
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            animation: 'riseIn 160ms ease',
          }}
        >
          <div style={{ ...TYPE.eyebrow, padding: '10px 12px 6px' }}>{label}</div>
          {searchable && (
            <div style={{ position: 'relative', padding: '0 8px 4px' }}>
              <MagnifyingGlass size={14} aria-hidden="true" style={{ position: 'absolute', left: 18, top: 9, color: T.tx4 }} />
              <input
                autoFocus
                type="search"
                aria-label={`Search ${label.toLowerCase()}`}
                placeholder="Search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{
                  width: '100%', height: 32, borderRadius: RADIUS.control, border: `1px solid ${T.bd2}`,
                  padding: '0 8px 0 28px', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: T.tx,
                }}
              />
            </div>
          )}
          <div role="radiogroup" style={{ maxHeight: 280, overflowY: 'auto', padding: '0 4px 4px' }}>
            {ordered.length === 0 && <div style={{ padding: SPACE.x3, ...TYPE.helper }}>Nothing matches</div>}
            {ordered.map((o) => {
              const header = o.group && o.group !== lastGroup && !q ? o.group : null;
              lastGroup = o.group;
              const checked = draft === o.value;
              return (
                <div key={o.value}>
                  {header && <div style={{ ...TYPE.eyebrow, fontSize: 10, padding: '8px 8px 4px' }}>{header}</div>}
                  <div
                    role="radio"
                    aria-checked={checked}
                    tabIndex={0}
                    onClick={() => setDraft(o.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDraft(o.value); } }}
                    style={{
                      minHeight: 36, padding: '0 8px', borderRadius: RADIUS.control, display: 'flex', alignItems: 'center',
                      gap: 10, cursor: 'pointer', fontSize: 14, color: T.tx2, background: checked ? T.su2 : 'transparent',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 16, height: 16, borderRadius: 999, flex: 'none',
                        border: `1.5px solid ${checked ? T.brandSolid : T.bd2}`,
                        boxShadow: checked ? `inset 0 0 0 3px ${T.card}` : 'none',
                        background: checked ? T.brandSolid : T.card,
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: `1px solid ${T.bd}`, padding: SPACE.x2, display: 'flex', justifyContent: 'space-between', gap: SPACE.x2 }}>
            <button
              type="button"
              onClick={() => { onApply(undefined); setOpen(false); }}
              style={{ height: 32, padding: '0 12px', borderRadius: RADIUS.control, border: 'none', background: 'transparent', color: T.dangText, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => { onApply(draft); setOpen(false); }}
              style={{ height: 32, padding: '0 16px', borderRadius: RADIUS.control, border: '1px solid transparent', background: T.brandSolid, color: '#FFFFFF', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </span>
  );
};

const AppliedChip = ({ k, v, onRemove }: { k: string; v: string; onRemove: () => void }) => (
  <span
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 4px 0 8px', borderRadius: RADIUS.tag,
      background: T.brandSoft, border: `1px solid ${T.brandBorder}`, fontSize: 13, color: T.brand, maxWidth: 260,
    }}
  >
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      <span style={{ fontWeight: 500 }}>{k}: </span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </span>
    <button
      type="button"
      aria-label={`Remove ${k.toLowerCase()} filter`}
      onClick={onRemove}
      style={{ display: 'inline-flex', width: 16, height: 16, alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: T.brand, cursor: 'pointer', borderRadius: 999 }}
    >
      <X size={11} weight="bold" />
    </button>
  </span>
);

const FilterBar = ({
  filters,
  onChange,
}: {
  filters: AdoptionFilters;
  onChange: (patch: { customer?: string; event?: string; period?: Period }) => void;
}) => {
  const top = useStickyTop();
  const opts = filterOptions({ period: filters.period, feature: filters.feature, module: filters.module });
  const periods = (Object.keys(PERIOD_LABEL) as Period[]).map((p) => ({ value: p, label: PERIOD_LABEL[p] }));
  const anyApplied = Boolean(filters.customer || filters.event);

  return (
    <div
      style={{
        position: 'sticky',
        top,
        zIndex: 40,
        minHeight: 52,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: SPACE.x2,
        padding: '10px 16px',
        background: T.card,
        border: `1px solid ${T.bd2}`,
        borderRadius: RADIUS.control,
      }}
    >
      <ChipMenu
        label="Customer"
        value={filters.customer}
        display={customerName(filters.customer)}
        options={opts.customers}
        searchable
        onApply={(v) => onChange({ customer: v })}
      />
      <ChipMenu
        label="Action"
        value={filters.event}
        display={eventLabel(filters.event)}
        options={opts.events}
        searchable
        onApply={(v) => onChange({ event: v })}
      />
      <span aria-hidden="true" style={{ width: 1, height: 20, background: T.bd2, margin: '0 4px' }} />
      <ChipMenu
        label="Period"
        value={filters.period}
        display={PERIOD_LABEL[filters.period]}
        changed={filters.period !== '30d'}
        options={periods}
        onApply={(v) => onChange({ period: (v as Period) ?? '30d' })}
      />
      {anyApplied && (
        <>
          <span aria-hidden="true" style={{ width: 1, height: 20, background: T.bd2, margin: '0 4px' }} />
          {filters.customer && <AppliedChip k="Customer" v={customerName(filters.customer) ?? ''} onRemove={() => onChange({ customer: undefined })} />}
          {filters.event && <AppliedChip k="Action" v={eventLabel(filters.event) ?? ''} onRemove={() => onChange({ event: undefined })} />}
          <button
            type="button"
            onClick={() => onChange({ customer: undefined, event: undefined })}
            style={{ height: 32, padding: '0 8px', border: 'none', background: 'transparent', color: T.dangText, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', borderRadius: RADIUS.control }}
          >
            Clear
          </button>
        </>
      )}
    </div>
  );
};

export default FilterBar;
