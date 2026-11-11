import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CaretDown, CaretRight, Check, MagnifyingGlass } from '@phosphor-icons/react';
import Hoverable from '@/components/primitives/Hoverable';
import Drawer from '@/components/adoption/Drawer';
import DesignPager from '@/components/hub/DesignPager';
import { TicketPill } from '@/components/hub/Tickets';
import { useTickets } from '@/components/TicketStore';
import { TICKET_STATUS, fmtTicketDate, fmtTicketDateTime, groupOf, type Ticket, type TicketGroup } from '@/data/tickets';

/* ---------------------------------------------------------------------------
   My tickets, from the Release Hub V2 design: search, a status dropdown with
   counts, the ticket table and its pager. A ticket opens its conversation in
   a 560px drawer. "Raise a ticket" lives in the page header.
   --------------------------------------------------------------------------- */

const OPTS: Array<{ key: 'all' | TicketGroup; label: string; tip?: string }> = [
  { key: 'all', label: 'All tickets' },
  { key: 'waiting', label: 'Waiting on you', tip: TICKET_STATUS.waiting.tip },
  { key: 'progress', label: 'In progress', tip: TICKET_STATUS.progress.tip },
  { key: 'resolved', label: 'Resolved', tip: TICKET_STATUS.resolved.tip },
];

const TH = { display: 'table-cell', textAlign: 'left' as const, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'var(--tx4)', fontWeight: 700, padding: '8px 16px', borderBottom: '1px solid var(--bd)', whiteSpace: 'nowrap' as const };

const TicketsPage = () => {
  const { tickets } = useTickets();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<'all' | TicketGroup>('all');
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const [dd, setDd] = useState(false);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const ddRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dd) return;
    const down = (e: MouseEvent) => { if (!ddRef.current?.contains(e.target as Node)) setDd(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setDd(false); };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [dd]);

  const selectedId = params.get('id') ?? undefined;
  const selected = tickets.find((t) => t.id === selectedId);
  const setSelected = (t?: Ticket) => { const n = new URLSearchParams(params); if (t) n.set('id', t.id); else n.delete('id'); setParams(n, { replace: true }); };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tickets.length, waiting: 0, progress: 0, resolved: 0 };
    tickets.forEach((t) => { c[groupOf(t.raw)] += 1; });
    return c;
  }, [tickets]);

  const ql = q.trim().toLowerCase();
  const rows = tickets.filter((t) => (tab === 'all' || groupOf(t.raw) === tab) && (!ql || `${t.id} ${t.title} ${t.chat.map((c) => c[1]).join(' ')}`.toLowerCase().includes(ql)));
  const pages = Math.max(1, Math.ceil(rows.length / per));
  const cur = Math.min(page, pages);
  const slice = rows.slice((cur - 1) * per, cur * per);
  const label = OPTS.find((o) => o.key === tab)!.label;

  return (
    <section data-screen-label="My tickets" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--bd)', borderRadius: 12, boxShadow: 'var(--elev1)', overflow: 'clip' }}>
        <div style={{ minHeight: 52, boxSizing: 'border-box', padding: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--bd)' }}>
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
            <MagnifyingGlass size={14} color="var(--tx4)" style={{ position: 'absolute', left: 12, top: 11, pointerEvents: 'none' }} />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
              placeholder="Search by ticket ID or words in the conversation"
              aria-label="Search tickets"
              style={{ width: '100%', boxSizing: 'border-box', height: 36, borderRadius: 8, border: `1px solid ${focus ? 'var(--brand)' : 'var(--bd2)'}`, boxShadow: focus ? '0 0 0 3px var(--ring)' : 'none', background: 'var(--card)', color: 'var(--tx)', fontFamily: 'inherit', fontSize: 14, padding: '0 12px 0 32px', outline: 'none' }}
            />
          </div>
          <div style={{ flex: 1 }} />
          <div ref={ddRef} style={{ position: 'relative' }}>
            <Hoverable
              as="button"
              type="button"
              onClick={() => setDd((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={dd}
              aria-label="Filter by status"
              style={{ height: 36, minWidth: 200, padding: '0 12px', borderRadius: 8, border: `1px solid ${dd ? 'var(--brand)' : 'var(--bd2)'}`, background: 'var(--card)', fontFamily: 'inherit', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}
              hoverStyle={dd ? undefined : { borderColor: 'var(--bd3)' }}
            >
              <span style={{ color: 'var(--tx)' }}>{label}</span>
              <CaretDown size={12} weight="bold" color="var(--tx3)" style={{ marginLeft: 'auto' }} />
            </Hoverable>
            {dd && (
              <div role="listbox" aria-label="Ticket status" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 41, minWidth: 260, padding: 4, boxSizing: 'border-box', background: 'var(--card)', border: '1px solid var(--bd)', borderRadius: 8, boxShadow: 'var(--elev3)', display: 'flex', flexDirection: 'column' }}>
                {OPTS.map((o, i) => (
                  <div key={o.key}>
                    <Hoverable
                      as="button"
                      type="button"
                      role="option"
                      aria-selected={tab === o.key}
                      title={o.tip}
                      onClick={() => { setTab(o.key); setPage(1); setDd(false); }}
                      style={{ width: '100%', height: 32, padding: '0 8px', borderRadius: 8, border: 'none', background: tab === o.key ? 'var(--su1)' : 'transparent', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: 'var(--tx2)', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', cursor: 'pointer' }}
                      hoverStyle={{ background: 'var(--su2)' }}
                    >
                      <Check size={14} weight="bold" color="var(--brand)" style={{ opacity: tab === o.key ? 1 : 0 }} />
                      <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{o.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--tx4)', fontVariantNumeric: 'tabular-nums' }}>{counts[o.key]}</span>
                    </Hoverable>
                    {i === 0 && <div role="separator" style={{ height: 1, background: 'var(--bd)', margin: '4px 0' }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {rows.length ? (
          <div role="table" aria-label="My tickets" style={{ width: '100%', display: 'table', borderCollapse: 'collapse' }}>
            <div role="rowgroup" style={{ display: 'table-header-group' }}>
              <div role="row" style={{ display: 'table-row', background: 'var(--su1)' }}>
                <div role="columnheader" style={TH}>Ticket ID</div>
                <div role="columnheader" style={{ ...TH, width: '100%' }}>Subject</div>
                <div role="columnheader" style={TH}>Created</div>
                <div role="columnheader" style={TH}>Last updated</div>
                <div role="columnheader" style={TH}>Status</div>
                <div role="columnheader" style={{ ...TH, width: '1%' }}><span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Open</span></div>
              </div>
            </div>
            <div role="rowgroup" style={{ display: 'table-row-group' }}>
              {slice.map((r, i) => {
                const bt = i ? '1px solid var(--bd)' : 'none';
                const cell = { display: 'table-cell', padding: '12px 16px', verticalAlign: 'middle' as const, borderTop: bt };
                return (
                  <Hoverable
                    key={r.id}
                    role="row"
                    onClick={() => setSelected(r)}
                    style={{ display: 'table-row', cursor: 'pointer', background: r.id === selectedId ? 'var(--brand-soft)' : 'var(--card)', transition: 'background 120ms ease' }}
                    hoverStyle={{ background: 'var(--su1)' }}
                  >
                    <div role="cell" style={{ ...cell, fontSize: 13, color: 'var(--tx3)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>#{r.id}</div>
                    <div role="cell" style={{ ...cell, maxWidth: 0 }}>
                      <span title={r.title} style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--tx)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                    </div>
                    <div role="cell" style={{ ...cell, fontSize: 13, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{fmtTicketDate(r.created)}</div>
                    <div role="cell" style={{ ...cell, fontSize: 13, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>{fmtTicketDate(r.updated)}</div>
                    <div role="cell" style={{ ...cell, whiteSpace: 'nowrap' }}><TicketPill ticket={r} /></div>
                    <div role="cell" style={{ ...cell, padding: '4px 8px 4px 0', width: '1%' }}>
                      <Hoverable
                        as="button"
                        type="button"
                        aria-label={`Open ticket #${r.id}`}
                        title="Open ticket"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelected(r); }}
                        style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--tx3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        hoverStyle={{ background: 'var(--su2)' }}
                      >
                        <CaretRight size={14} weight="bold" />
                      </Hoverable>
                    </div>
                  </Hoverable>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ padding: '48px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
            <MagnifyingGlass size={30} color="var(--tx4)" />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--tx)', marginTop: 4 }}>{ql ? `No tickets match “${q.trim()}”` : `No ${label.toLowerCase()}`}</div>
            <div style={{ fontSize: 13, color: 'var(--tx3)' }}>Try another word, or pick a different status.</div>
          </div>
        )}
        {rows.length > 0 && <DesignPager total={rows.length} page={cur} per={per} onPage={setPage} onPer={(v) => { setPer(v); setPage(1); }} perOptions={[10, 25, 50]} />}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(undefined)}
        title={selected ? `Ticket #${selected.id}` : ''}
        subtitle={selected ? selected.title : undefined}
        width={560}
      >
        {selected && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <TicketPill ticket={selected} />
              <span style={{ fontSize: 13, color: 'var(--tx3)' }}>Raised via {selected.via} · Updated {fmtTicketDateTime(selected.updated)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selected.chat.map(([who, text], i) => {
                const mine = who === 'You';
                return (
                  <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--tx4)', marginBottom: 4, textAlign: mine ? 'right' : 'left' }}>{mine ? 'You' : 'Zwayam support'}</div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: mine ? 'var(--brand-soft)' : 'var(--su2)', border: `1px solid ${mine ? 'var(--brand-border)' : 'var(--bd2)'}`, fontSize: 14, lineHeight: 1.5, color: 'var(--tx)' }}>{text}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Drawer>
    </section>
  );
};

export default TicketsPage;
