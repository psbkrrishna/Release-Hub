import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowCounterClockwise, BookmarkSimple, CaretDown, Check, FloppyDisk, FunnelSimple, Info, MagnifyingGlass, Minus, Trash, X,
} from '@phosphor-icons/react';
import Modal from '@/components/primitives/Modal';
import Button from '@/components/primitives/Button';
import IconButton from '@/components/primitives/IconButton';
import Tooltip from '@/components/primitives/Tooltip';
import { inputStyle } from '@/components/primitives/fieldStyles';
import { useFeatureStore } from '@/components/FeatureStore';
import { loadViews, sameQuery, storeViews, type SavedView } from '@/components/adoption/savedViews';
import {
  customerName, dataWindow, eventLabel, featureTitle, filterOptions, isRelative, isValidPeriod, periodLabel, periodRange,
} from '@/data/usage/query';
import { formatDate } from '@/data/features';
import type { Patch } from '@/hooks/useAdoptionFilters';
import type { AdoptionFilters, Period } from '@/types/Usage';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The filter bar - the guidelines' Insights filter bar, in its order:
     Saved views | quick filters · date · All filters · applied chips ·
     Save as view · Clear
   - Quick filters are 32px chips. A chip with a selection turns brand-soft
     and carries a solid --brand-solid count.
   - Every filter menu ends with the same footer: ghost Clear in --dang-text
     on the left, primary Apply on the right. Committed choices sort to the
     top when a menu opens, never while ticking.
   - The date popover offers "Last [n] days" OR exact dates, bounded to the
     data window, and says what that window is.
   - All filters opens every filter at once, in a centred dialog.
   - Save as view and Clear are labelled, inline, never pushed to the right.
   --------------------------------------------------------------------------- */

type Option = { value: string; label: string; group?: string };
type Key = 'modules' | 'features' | 'customers' | 'events';

const KEY_LABEL: Record<Key, string> = { modules: 'Module', features: 'Feature', customers: 'Customer', events: 'Action' };
const KEY_PLURAL: Record<Key, string> = { modules: 'modules', features: 'features', customers: 'customers', events: 'actions' };

/* ---- Shared pieces -------------------------------------------------------- */

/** Closes a popover on a click outside it or on Escape. */
const useDismiss = (open: boolean, close: () => void) => {
  const ref = useRef<HTMLSpanElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) closeRef.current(); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return ref;
};

/** A 32px chip trigger. `applied` turns it brand-soft. */
const chip = (applied: boolean): CSSProperties => ({
  height: 32,
  padding: '0 12px',
  borderRadius: RADIUS.control,
  border: `1px solid ${applied ? T.brandBorder : T.bd2}`,
  background: applied ? T.brandSoft : T.card,
  color: applied ? T.brand : T.tx2,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: SPACE.x2,
  whiteSpace: 'nowrap',
});

/** The solid count shared by every filter trigger and All filters. */
const Count = ({ n }: { n: number }) => (
  <span
    aria-label={`${n} selected`}
    style={{
      height: 18, minWidth: 18, padding: '0 6px', boxSizing: 'border-box', borderRadius: 999, background: T.brandSolid,
      color: '#FFFFFF', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    {n}
  </span>
);

const popover: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  maxWidth: 'calc(100vw - 32px)',
  background: T.card,
  border: `1px solid ${T.bd}`,
  borderRadius: RADIUS.control,
  boxShadow: T.elev3,
  zIndex: 60,
  display: 'flex',
  flexDirection: 'column',
  animation: 'riseIn 160ms ease',
};

const eyebrow: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.tx4 };

/** Clear left (ghost, --dang-text), Apply right (primary). */
const MenuFooter = ({ onClear, onApply, clearLabel = 'Clear', canClear = true }: {
  onClear: () => void; onApply: () => void; clearLabel?: string; canClear?: boolean;
}) => (
  <div style={{ borderTop: `1px solid ${T.bd}`, padding: SPACE.x2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: SPACE.x2 }}>
    <button
      type="button"
      onClick={onClear}
      disabled={!canClear}
      onMouseEnter={(e) => { if (canClear) e.currentTarget.style.background = 'var(--dang-soft)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      style={{
        height: 32, padding: '0 12px', borderRadius: RADIUS.control, border: 'none', background: 'transparent', color: T.dangText,
        fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: canClear ? 'pointer' : 'not-allowed', opacity: canClear ? 1 : 0.42,
      }}
    >
      {clearLabel}
    </button>
    <button
      type="button"
      onClick={onApply}
      style={{
        height: 32, padding: '0 16px', borderRadius: RADIUS.control, border: '1px solid transparent', background: T.brandSolid,
        color: '#FFFFFF', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
      }}
    >
      Apply
    </button>
  </div>
);

/** An 18px checkbox, radius 5 - ticked, empty or part-ticked. */
const Box = ({ state }: { state: 'on' | 'off' | 'some' }) => (
  <span
    aria-hidden="true"
    style={{
      width: 18, height: 18, boxSizing: 'border-box', flex: 'none', borderRadius: 5,
      border: `1.5px solid ${state === 'off' ? T.bd2 : T.brandSolid}`, background: state === 'off' ? T.card : T.brandSolid,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF',
    }}
  >
    {state === 'on' && <Check size={12} weight="bold" />}
    {state === 'some' && <Minus size={12} weight="bold" />}
  </span>
);

const CheckRow = ({ label, state, onToggle, strong }: { label: string; state: 'on' | 'off' | 'some'; onToggle: () => void; strong?: boolean }) => (
  <div
    role="checkbox"
    aria-checked={state === 'some' ? 'mixed' : state === 'on'}
    tabIndex={0}
    onClick={onToggle}
    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(); } }}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--su2)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    style={{
      minHeight: 36, padding: '0 8px', borderRadius: RADIUS.control, display: 'flex', alignItems: 'center', gap: 10,
      cursor: 'pointer', fontSize: 14, color: strong ? T.tx : T.tx2, fontWeight: strong ? 600 : 400,
    }}
  >
    <Box state={state} />
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
  </div>
);

const Search = ({ value, onChange, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; placeholder: string; autoFocus?: boolean }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <MagnifyingGlass size={14} aria-hidden="true" style={{ position: 'absolute', left: 12, top: 11, color: T.tx4 }} />
      <input
        autoFocus={autoFocus}
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={inputStyle({ leadingIcon: true, focused })}
      />
    </div>
  );
};

/** A checklist with an optional search and a "Select all" row, grouped
 *  under eyebrow headings. Shared by quick filters and All filters. */
const Checklist = ({
  options, draft, setDraft, allLabel, searchable, autoFocus,
}: {
  options: Option[]; draft: string[]; setDraft: (fn: (d: string[]) => string[]) => void; allLabel: string; searchable: boolean; autoFocus?: boolean;
}) => {
  const [q, setQ] = useState('');
  const shown = useMemo(
    () => (q ? options.filter((o) => `${o.label} ${o.group ?? ''}`.toLowerCase().includes(q.toLowerCase())) : options),
    [options, q],
  );
  const chosen = new Set(draft);
  const allState = shown.length && shown.every((o) => chosen.has(o.value)) ? 'on' : shown.some((o) => chosen.has(o.value)) ? 'some' : 'off';
  const toggleAll = () =>
    setDraft((d) => (allState === 'on' ? d.filter((v) => !shown.some((o) => o.value === v)) : [...new Set([...d, ...shown.map((o) => o.value)])]));
  let lastGroup: string | undefined;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x2, minHeight: 0 }}>
      {searchable && <Search value={q} onChange={setQ} placeholder={`Search ${allLabel.toLowerCase().replace(/^all /, '')}`} autoFocus={autoFocus} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {shown.length === 0 ? (
          <div style={{ padding: '24px 8px', textAlign: 'center', ...TYPE.helper }}>No options match "{q}"</div>
        ) : (
          <>
            <CheckRow label={q ? `Select all ${shown.length} shown` : allLabel} state={allState} onToggle={toggleAll} strong />
            <div style={{ height: 1, background: T.bd, margin: '2px 8px' }} />
            {shown.map((o) => {
              const header = !q && o.group && o.group !== lastGroup ? o.group : null;
              lastGroup = o.group;
              return (
                <div key={o.value}>
                  {header && <div style={{ ...eyebrow, fontSize: 10, padding: '8px 8px 4px' }}>{header}</div>}
                  <CheckRow
                    label={o.label}
                    state={chosen.has(o.value) ? 'on' : 'off'}
                    onToggle={() => setDraft((d) => (d.includes(o.value) ? d.filter((x) => x !== o.value) : [...d, o.value]))}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

/** Committed choices first, sorted once when a list opens. */
const committedFirst = (options: Option[], values: string[]) => {
  const set = new Set(values);
  return [...options.filter((o) => set.has(o.value)), ...options.filter((o) => !set.has(o.value))];
};

/* ---- Quick filter --------------------------------------------------------- */

const QuickFilter = ({
  label, values, options, allLabel, onApply,
}: {
  label: string; values: string[]; options: Option[]; allLabel: string; onApply: (v: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(values);
  const [order, setOrder] = useState<Option[]>(options);
  const ref = useDismiss(open, () => setOpen(false));
  const openMenu = () => { setDraft(values); setOrder(committedFirst(options, values)); setOpen(true); };

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => (open ? setOpen(false) : openMenu())} style={chip(values.length > 0)}>
        {label}
        {values.length > 0 && <Count n={values.length} />}
        <CaretDown size={12} weight="bold" />
      </button>
      {open && (
        <div role="dialog" aria-label={`${label} filter`} style={{ ...popover, width: 280 }}>
          <div style={{ ...eyebrow, padding: '10px 12px 6px' }}>{label}</div>
          <div style={{ maxHeight: 300, overflowY: 'auto', padding: '0 4px 4px' }}>
            <Checklist options={order} draft={draft} setDraft={setDraft} allLabel={allLabel} searchable={options.length > 8} autoFocus />
          </div>
          <MenuFooter canClear={draft.length > 0} onClear={() => setDraft([])} onApply={() => { onApply(draft); setOpen(false); }} />
        </div>
      )}
    </span>
  );
};

/* ---- Date range ----------------------------------------------------------- */

const Radio = ({ on }: { on: boolean }) => (
  <span
    aria-hidden="true"
    style={{
      width: 18, height: 18, boxSizing: 'border-box', flex: 'none', borderRadius: 999,
      border: `1.5px solid ${on ? T.brandSolid : T.bd2}`, background: T.card, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    {on && <span style={{ width: 8, height: 8, borderRadius: 999, background: T.brandSolid }} />}
  </span>
);

const dateInput: CSSProperties = {
  height: 36, boxSizing: 'border-box', borderRadius: RADIUS.control, border: `1px solid ${T.bd2}`, padding: '0 12px',
  fontFamily: 'inherit', fontSize: 14, color: T.tx, background: T.card,
};

const DateRange = ({ value, onApply }: { value: Period; onApply: (p: Period) => void }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'rel' | 'abs'>('rel');
  const [days, setDays] = useState('30');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const ref = useDismiss(open, () => setOpen(false));
  const win = dataWindow();

  const openMenu = () => {
    const r = periodRange(value);
    setMode(isRelative(value) ? 'rel' : 'abs');
    setDays(String(r.n));
    const [a, b] = value.includes('~') ? value.split('~') : ['', ''];
    setFrom(a || '');
    setTo(b || '');
    setOpen(true);
  };

  const draft = mode === 'rel' ? `${Number(days)}d` : `${from}~${to}`;
  const valid = isValidPeriod(draft);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => (open ? setOpen(false) : openMenu())} style={chip(value !== '30d')}>
        <span>Period:</span>
        <span style={{ fontWeight: 400, marginLeft: -4 }}>{periodLabel(value)}</span>
        <CaretDown size={12} weight="bold" />
      </button>
      {open && (
        <div role="dialog" aria-label="Date range" style={{ ...popover, width: 440 }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.bd}`, background: T.su1, borderRadius: '8px 8px 0 0', fontSize: 16, fontWeight: 700, color: T.tx }}>
            Date range
          </div>
          <div role="note" style={{ display: 'flex', gap: SPACE.x2, alignItems: 'flex-start', padding: '8px 16px', background: T.su2, borderBottom: `1px solid ${T.bd}`, fontSize: 14, lineHeight: 1.5, color: T.tx2 }}>
            <Info size={16} color="var(--tx3)" style={{ flex: 'none', marginTop: 2 }} />
            <span><b style={{ fontWeight: 600, color: T.tx }}>Usage date:</b> actions people took in these days. Changes compare with the same number of days just before.</span>
          </div>
          <div role="radiogroup" aria-label="Date range" style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
            <div
              role="radio"
              aria-checked={mode === 'rel'}
              tabIndex={0}
              onClick={() => setMode('rel')}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setMode('rel'); } }}
              style={{
                display: 'flex', flexDirection: 'column', gap: SPACE.x2, padding: 12, borderRadius: RADIUS.control, cursor: 'pointer',
                border: `1px solid ${mode === 'rel' ? T.brandBorder : T.bd2}`, background: mode === 'rel' ? T.brandSoft : T.card,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: SPACE.x2, fontSize: 14, fontWeight: 600, color: T.tx }}>
                <Radio on={mode === 'rel'} />Relative range
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: SPACE.x2, fontSize: 14, color: T.tx }}>
                Last
                <input
                  type="number"
                  min={1}
                  max={365}
                  inputMode="numeric"
                  aria-label="Number of days"
                  value={days}
                  onFocus={() => setMode('rel')}
                  onChange={(e) => setDays(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  style={{ ...dateInput, width: 72, padding: '0 10px', fontWeight: 600 }}
                />
                days
              </span>
            </div>
            <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <span style={{ flex: 1, height: 1, background: T.bd2 }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: T.tx3 }}>OR</span>
              <span style={{ flex: 1, height: 1, background: T.bd2 }} />
            </div>
            <div
              role="radio"
              aria-checked={mode === 'abs'}
              tabIndex={0}
              onClick={() => setMode('abs')}
              onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setMode('abs'); } }}
              style={{
                display: 'flex', flexDirection: 'column', gap: SPACE.x2, padding: 12, borderRadius: RADIUS.control, cursor: 'pointer',
                border: `1px solid ${mode === 'abs' ? T.brandBorder : T.bd2}`, background: mode === 'abs' ? T.brandSoft : T.card,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: SPACE.x2, fontSize: 14, fontWeight: 600, color: T.tx }}>
                <Radio on={mode === 'abs'} />Exact dates
              </span>
              <span style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
                {([['From', from, setFrom], ['To', to, setTo]] as const).map(([lbl, v, set]) => (
                  <label key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x1, fontSize: 12, fontWeight: 600, color: T.tx3 }}>
                    {lbl}
                    <input
                      type="date"
                      min={win.first}
                      max={win.last}
                      value={v}
                      onFocus={() => setMode('abs')}
                      onChange={(e) => set(e.target.value)}
                      style={dateInput}
                    />
                  </label>
                ))}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: SPACE.x3, fontSize: 12, lineHeight: 1.4, color: T.tx3 }}>
              <Info size={14} style={{ flex: 'none', marginTop: 1 }} />
              <span>Data is available for the past 12 months only, to {formatDate(win.last)}.</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACE.x2, padding: SPACE.x2, borderTop: `1px solid ${T.bd}` }}>
            <button
              type="button"
              onClick={() => { onApply('30d'); setOpen(false); }}
              style={{
                height: 36, padding: '0 16px', borderRadius: RADIUS.control, border: `1px solid ${T.bd2}`, background: T.card,
                color: T.dangText, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Reset
            </button>
            <Button disabled={!valid} onClick={() => { if (valid) { onApply(draft); setOpen(false); } }}>Apply</Button>
          </div>
        </div>
      )}
    </span>
  );
};

/* ---- All filters ---------------------------------------------------------- */

const AllFilters = ({
  filters, onApply,
}: {
  filters: AdoptionFilters; onApply: (patch: Patch) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<Key>('modules');
  const [draft, setDraft] = useState<Record<Key, string[]>>({ modules: [], features: [], customers: [], events: [] });
  const [order, setOrder] = useState<Record<Key, Option[]>>({ modules: [], features: [], customers: [], events: [] });
  const active = (['modules', 'features', 'customers', 'events'] as Key[]).reduce((n, k) => n + (filters[k]?.length ? 1 : 0), 0);

  /* Options follow the draft: features narrow to the modules ticked here,
     actions to the features. */
  const opts = filterOptions({
    period: filters.period,
    modules: draft.modules.length ? draft.modules : undefined,
    features: draft.features.length ? draft.features : undefined,
  });
  const optionsFor = (k: Key): Option[] => (k === 'modules' ? opts.modules : k === 'features' ? opts.features : k === 'customers' ? opts.customers : opts.events);

  const openDialog = () => {
    const d = { modules: filters.modules ?? [], features: filters.features ?? [], customers: filters.customers ?? [], events: filters.events ?? [] };
    const all = filterOptions(filters);
    setDraft(d);
    setOrder({
      modules: committedFirst(all.modules, d.modules),
      features: committedFirst(all.features, d.features),
      customers: committedFirst(all.customers, d.customers),
      events: committedFirst(all.events, d.events),
    });
    setOpen(true);
  };

  // Keep the sorted order but only offer what the draft still allows.
  const listFor = (k: Key) => {
    const allowed = new Set(optionsFor(k).map((o) => o.value));
    return order[k].filter((o) => allowed.has(o.value));
  };

  return (
    <>
      <button type="button" onClick={openDialog} style={chip(active > 0)}>
        <FunnelSimple size={14} />
        All filters
        {active > 0 && <Count n={active} />}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy="all-filters-title" align="center" width={760} animate>
        <div style={{ display: 'flex', flexDirection: 'column', height: 'min(80vh, 600px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${T.bd2}` }}>
            <FunnelSimple size={20} color="var(--brand)" />
            <span id="all-filters-title" style={{ flex: 1, fontSize: 18, fontWeight: 700, color: T.tx }}>All filters</span>
            <IconButton size="compact" onClick={() => setOpen(false)} title="Close" aria-label="Close"><X size={16} /></IconButton>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            <div role="tablist" aria-orientation="vertical" style={{ width: 200, flex: 'none', background: T.su1, borderRight: `1px solid ${T.bd2}`, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(['modules', 'features', 'customers', 'events'] as Key[]).map((k) => {
                const on = cat === k;
                return (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setCat(k)}
                    style={{
                      height: 36, padding: '0 12px', borderRadius: RADIUS.control, border: `1px solid ${on ? T.bd2 : 'transparent'}`,
                      background: on ? T.card : 'transparent', color: on ? T.tx : T.tx2, fontWeight: on ? 600 : 400, fontSize: 14,
                      fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.x2, textAlign: 'left',
                    }}
                  >
                    {KEY_LABEL[k]}
                    {draft[k].length > 0 && <Count n={draft[k].length} />}
                  </button>
                );
              })}
            </div>
            <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.x2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.tx }}>{KEY_LABEL[cat]}</span>
                {draft[cat].length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, [cat]: [] }))}
                    style={{ border: 'none', background: 'none', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: T.dangText, cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <Checklist
                key={cat}
                options={listFor(cat)}
                draft={draft[cat]}
                setDraft={(fn) => setDraft((d) => ({ ...d, [cat]: fn(d[cat]) }))}
                allLabel={cat === 'modules' ? 'All modules · the platform' : `All ${KEY_PLURAL[cat]}`}
                searchable
                autoFocus
              />
            </div>
          </div>
          <MenuFooter
            clearLabel="Clear all"
            canClear={Object.values(draft).some((v) => v.length > 0)}
            onClear={() => setDraft({ modules: [], features: [], customers: [], events: [] })}
            onApply={() => {
              onApply({ modules: draft.modules, features: draft.features, customers: draft.customers, events: draft.events });
              setOpen(false);
            }}
          />
        </div>
      </Modal>
    </>
  );
};

/* ---- Applied chips -------------------------------------------------------- */

const Applied = ({ k, names, onRemove }: { k: string; names: string[]; onRemove: () => void }) => (
  <span
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 4px 0 8px', borderRadius: RADIUS.tag,
      // Capped so one applied filter, Save as view and Clear fit the bar's line.
      background: T.brandSoft, border: `1px solid ${T.brandBorder}`, fontSize: 13, color: T.brand, maxWidth: 180,
    }}
  >
    <span aria-label={`${k}: ${names.join(', ')}`} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      <span style={{ fontWeight: 500 }}>{k}: </span>
      <span style={{ fontWeight: 600 }}>{names.slice(0, 2).join(', ')}</span>
      {names.length > 2 && <span style={{ fontWeight: 600 }}> +{names.length - 2}</span>}
    </span>
    <Tooltip label={`Remove ${k.toLowerCase()} filter`}>
      <button
        type="button"
        aria-label={`Remove ${k.toLowerCase()} filter`}
        onClick={onRemove}
        style={{ display: 'inline-flex', width: 16, height: 16, alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: T.brand, cursor: 'pointer', borderRadius: 999 }}
      >
        <X size={11} weight="bold" />
      </button>
    </Tooltip>
  </span>
);

const namesOf = (k: Key, ids: string[]) =>
  ids.map((id) => (k === 'features' ? featureTitle(id) : k === 'customers' ? customerName(id) : k === 'events' ? eventLabel(id) : id) ?? id);

/* ---- Saved views ---------------------------------------------------------- */

/** "Module: Recruiting" style chips describing a saved query. */
const viewChips = (query: string) => {
  const p = new URLSearchParams(query);
  const out: Array<{ k: string; v: string }> = [];
  const add = (param: string, k: Key) => {
    const raw = p.get(param);
    if (raw) out.push({ k: KEY_LABEL[k], v: namesOf(k, raw.split(',')).join(', ') });
  };
  add('modules', 'modules');
  add('features', 'features');
  add('customers', 'customers');
  add('actions', 'events');
  if (p.get('period')) out.push({ k: 'Period', v: periodLabel(p.get('period')!) });
  if (p.get('by')) out.push({ k: 'Group', v: p.get('by')! });
  if (p.get('list')) out.push({ k: 'List', v: p.get('list')! });
  return out;
};

const AlertCard = ({ open, onClose, title, children, actions }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; actions: ReactNode;
}) => (
  <Modal open={open} onClose={onClose} labelledBy="alert-title" align="center" width={440} animate>
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: SPACE.x3 }}>
      <h2 id="alert-title" style={{ margin: 0, ...TYPE.sectionTitle }}>{title}</h2>
      {children}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACE.x2, marginTop: SPACE.x2 }}>{actions}</div>
    </div>
  </Modal>
);

const SavedViews = ({
  views, selectedId, onSelect, onDelete,
}: {
  views: SavedView[]; selectedId: string | null; onSelect: (v: SavedView) => void; onDelete: (v: SavedView) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const selected = views.find((v) => v.id === selectedId);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={chip(Boolean(selected))}>
        <BookmarkSimple size={14} weight={selected ? 'fill' : 'regular'} />
        <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected ? selected.name : 'Saved views'}</span>
        <CaretDown size={12} weight="bold" />
      </button>
      {open && (
        <div role="dialog" aria-label="Saved views" style={{ ...popover, width: 560, maxHeight: 'min(70vh, 520px)', overflowY: 'auto', padding: 4 }}>
          <div style={{ ...eyebrow, padding: '8px 8px 4px' }}>Saved views</div>
          {views.length === 0 ? (
            <div style={{ margin: 4, padding: 16, borderRadius: RADIUS.control, background: T.su3, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, lineHeight: 1.5, color: T.tx2 }}>
              <div>Save one or more filters as a view. Reapply them later in one click.</div>
              <div style={{ fontWeight: 700, color: T.tx }}>How to save a view</div>
              {['Apply one or more filters', 'Select Save as view'].map((s, i) => (
                <div key={s} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ flex: 'none', width: 18, height: 18, borderRadius: '50%', background: T.card, border: `1px solid ${T.bd2}`, fontSize: 11, fontWeight: 700, color: T.tx3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                  <span>{s}</span>
                </div>
              ))}
              <div>Find it later under <b style={{ color: T.tx }}>Saved views</b>.</div>
            </div>
          ) : (
            views.map((v) => {
              const on = v.id === selectedId;
              const chips = viewChips(v.query);
              return (
                <div
                  key={v.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { onSelect(v); setOpen(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(v); setOpen(false); } }}
                  onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--su2)'; }}
                  onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
                  style={{
                    padding: '6px 4px 6px 10px', borderRadius: RADIUS.control, cursor: 'pointer', display: 'grid',
                    gridTemplateColumns: 'minmax(120px,180px) minmax(0,1fr) 28px', alignItems: 'start', gap: 8,
                    background: on ? T.brandSoft : 'transparent',
                  }}
                >
                  <span style={{ minHeight: 28, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 600, color: on ? T.brand : T.tx, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.name}
                  </span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, minHeight: 28, minWidth: 0 }}>
                    {chips.length === 0 && <span style={{ ...TYPE.helper, fontSize: 13 }}>The platform, all customers</span>}
                    {chips.slice(0, 3).map((c) => (
                      <span key={c.k} style={{ height: 24, maxWidth: '100%', boxSizing: 'border-box', padding: '0 8px', borderRadius: RADIUS.tag, background: T.card, border: `1px solid ${T.bd2}`, fontSize: 13, lineHeight: '22px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 500, color: T.tx3 }}>{c.k}: </span><span style={{ fontWeight: 600, color: T.tx }}>{c.v}</span>
                      </span>
                    ))}
                    {chips.length > 3 && <span style={{ fontSize: 13, fontWeight: 600, color: T.brand }}>+ {chips.length - 3} more</span>}
                  </span>
                  <Tooltip label="Delete view">
                    <IconButton
                      size="compact"
                      title="Delete view"
                      aria-label={`Delete view ${v.name}`}
                      onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(v); }}
                    >
                      <Trash size={14} />
                    </IconButton>
                  </Tooltip>
                </div>
              );
            })
          )}
        </div>
      )}
    </span>
  );
};

/* ---- The bar -------------------------------------------------------------- */

const FilterBar = ({ filters, onChange }: { filters: AdoptionFilters; onChange: (patch: Patch) => void }) => {
  const { toast } = useFeatureStore();
  const [params, setParams] = useSearchParams();
  const [views, setViews] = useState<SavedView[]>(() => loadViews());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [nameFocus, setNameFocus] = useState(false);
  const [deleting, setDeleting] = useState<SavedView | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const opts = filterOptions(filters);
  const query = params.toString();
  const selected = views.find((v) => v.id === selectedId) ?? null;
  // A view stays selected until the page is changed away from it.
  const modified = Boolean(selected && !sameQuery(selected.query, query));
  const hasActive = Boolean(filters.modules || filters.features || filters.customers || filters.events || filters.period !== '30d');
  const showSave = hasActive && (!selected || modified);

  const applied: Array<{ k: Key; ids: string[] }> = (['modules', 'features', 'customers', 'events'] as Key[])
    .filter((k) => filters[k]?.length)
    .map((k) => ({ k, ids: filters[k]! }));

  const persist = (next: SavedView[]) => { setViews(next); storeViews(next); };
  const save = () => {
    const n = name.trim();
    if (!n) return;
    const view = { id: `v${Date.now()}`, name: n, query };
    persist([...views, view]);
    setSelectedId(view.id);
    setSaving(false);
    toast(`Saved view "${n}"`);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.x2, minHeight: 32 }}>
      <SavedViews
        views={views}
        selectedId={modified ? null : selectedId}
        onSelect={(v) => { setSelectedId(v.id); setParams(new URLSearchParams(v.query)); }}
        onDelete={(v) => { setConfirmText(''); setDeleting(v); }}
      />
      <span aria-hidden="true" style={{ width: 1, height: 20, background: T.bd2, margin: '0 4px' }} />

      <QuickFilter label="Module" values={filters.modules ?? []} options={opts.modules} allLabel="All modules · the platform" onApply={(v) => onChange({ modules: v })} />
      <QuickFilter label="Feature" values={filters.features ?? []} options={opts.features} allLabel="All features" onApply={(v) => onChange({ features: v })} />
      <QuickFilter label="Customer" values={filters.customers ?? []} options={opts.customers} allLabel="All customers" onApply={(v) => onChange({ customers: v })} />
      <DateRange value={filters.period} onApply={(p) => onChange({ period: p })} />
      <AllFilters filters={filters} onApply={onChange} />

      {applied.map((a) => (
        <Applied key={a.k} k={KEY_LABEL[a.k]} names={namesOf(a.k, a.ids)} onRemove={() => onChange({ [a.k]: undefined })} />
      ))}

      {(showSave || hasActive) && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: SPACE.x1, animation: 'riseIn 200ms ease' }}>
          {showSave && (
            <button
              type="button"
              onClick={() => { setName(''); setSaving(true); }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--brand-soft)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              style={{ height: 32, padding: '0 10px', borderRadius: RADIUS.control, border: 'none', background: 'transparent', color: T.brand, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <FloppyDisk size={16} />Save as view
            </button>
          )}
          {hasActive && (
            <button
              type="button"
              onClick={() => { setSelectedId(null); onChange({ modules: undefined, features: undefined, customers: undefined, events: undefined, period: '30d' }); }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--dang-soft)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              style={{ height: 32, padding: '0 10px', borderRadius: RADIUS.control, border: 'none', background: 'transparent', color: T.dangText, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
            >
              <ArrowCounterClockwise size={16} />Clear
            </button>
          )}
        </span>
      )}

      {/* Save confirms in the centred alert card. */}
      <AlertCard
        open={saving}
        onClose={() => setSaving(false)}
        title="Save as view"
        actions={
          <>
            <Button variant="secondary" onClick={() => setSaving(false)}>Cancel</Button>
            <Button disabled={!name.trim()} onClick={save}>Save view</Button>
          </>
        }
      >
        <p style={{ margin: 0, ...TYPE.body }}>Saves these filters, the period and the grouping, so you can reopen them in one click.</p>
        <label style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x1 }}>
          <span style={TYPE.fieldLabel}>View name</span>
          <input
            autoFocus
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
            onFocus={() => setNameFocus(true)}
            onBlur={() => setNameFocus(false)}
            placeholder="e.g. Recruiting · my enterprise accounts"
            style={inputStyle({ focused: nameFocus })}
          />
        </label>
      </AlertCard>

      {/* A saved object: deleting it asks for DELETE to be typed. */}
      <AlertCard
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this view?"
        actions={
          <>
            <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={confirmText !== 'DELETE'}
              onClick={() => {
                if (!deleting) return;
                persist(views.filter((v) => v.id !== deleting.id));
                if (selectedId === deleting.id) setSelectedId(null);
                toast(`Deleted view "${deleting.name}"`);
                setDeleting(null);
              }}
            >
              Delete view
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, ...TYPE.body }}>
          <b style={{ color: T.tx }}>{deleting?.name}</b> is removed from Saved views. The filters on this page stay as they are.
        </p>
        <label style={{ display: 'flex', flexDirection: 'column', gap: SPACE.x1 }}>
          <span style={TYPE.fieldLabel}>Type DELETE to confirm</span>
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} style={inputStyle({})} aria-label="Type DELETE to confirm" />
        </label>
      </AlertCard>
    </div>
  );
};

export default FilterBar;
