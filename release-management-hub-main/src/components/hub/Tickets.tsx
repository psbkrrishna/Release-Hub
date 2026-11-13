import { useEffect, useState, type CSSProperties } from 'react';
import { CaretRight, X } from '@phosphor-icons/react';
import Modal from '@/components/primitives/Modal';
import Button from '@/components/primitives/Button';
import IconButton from '@/components/primitives/IconButton';
import Hoverable from '@/components/primitives/Hoverable';
import { inputStyle, selectStyle, textareaStyle } from '@/components/primitives/fieldStyles';
import { useTickets } from '@/components/TicketStore';
import { MODULES } from '@/data/features';
import {
  TICKET_STATUS, fmtTicketDate, groupOf, type Ticket,
} from '@/data/tickets';
import { GAP, RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   Ticket pieces shared by the Overview's "Active tickets" and the tickets page:
   the status pill, the table, and the "Create ticket" dialog.
   --------------------------------------------------------------------------- */

export const TicketPill = ({ ticket }: { ticket: Ticket }) => {
  const st = TICKET_STATUS[groupOf(ticket.raw)];
  return (
    <span
      title={st.tip}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 20,
        padding: '0 8px',
        borderRadius: RADIUS.pill,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        background: st.bg,
        color: st.fg,
        border: `1px solid ${st.bd}`,
      }}
    >
      {ticket.raw}
    </span>
  );
};

const TH: CSSProperties = {
  display: 'table-cell',
  textAlign: 'left',
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: T.tx4,
  fontWeight: 700,
  padding: '8px 16px',
  borderBottom: `1px solid ${T.bd}`,
  whiteSpace: 'nowrap',
};

const TD: CSSProperties = {
  display: 'table-cell',
  padding: '12px 16px',
  verticalAlign: 'middle',
  borderTop: `1px solid ${T.bd}`,
};

/** The Home C ticket table: ID, title, status, last updated, open. */
export const TicketsTable = ({
  rows,
  onOpen,
  selectedId,
  label = 'Active tickets',
}: {
  rows: Ticket[];
  onOpen: (t: Ticket) => void;
  selectedId?: string;
  label?: string;
}) => (
  <div style={{ border: `1px solid ${T.bd}`, borderRadius: RADIUS.panel, background: T.card, overflow: 'hidden', boxShadow: T.elev1 }}>
    <div role="table" aria-label={label} style={{ width: '100%', display: 'table', borderCollapse: 'collapse' }}>
      <div role="rowgroup" style={{ display: 'table-header-group' }}>
        <div role="row" style={{ display: 'table-row', background: T.su1 }}>
          <div role="columnheader" style={TH}>Ticket ID</div>
          <div role="columnheader" style={{ ...TH, width: '100%' }}>Ticket</div>
          <div role="columnheader" style={TH}>Status</div>
          <div role="columnheader" style={TH}>Last updated</div>
          <div role="columnheader" style={{ ...TH, padding: '8px 8px 8px 0', width: '1%' }}>
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Open</span>
          </div>
        </div>
      </div>
      <div role="rowgroup" style={{ display: 'table-row-group' }}>
        {rows.map((r) => {
          const sel = r.id === selectedId;
          return (
            <Hoverable
              key={r.id}
              role="row"
              tabIndex={0}
              onClick={() => onOpen(r)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(r); }
              }}
              style={{ display: 'table-row', cursor: 'pointer', background: sel ? T.brandSoft : T.card, transition: 'background 120ms ease' }}
              hoverStyle={sel ? undefined : { background: T.su1 }}
            >
              {(h: boolean) => (
                <>
                  <div role="cell" style={{ ...TD, ...TYPE.cellSecondary, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>#{r.id}</div>
                  <div role="cell" style={TD}>
                    <span style={{ ...TYPE.cellPrimary, color: h ? T.brand : T.tx }}>{r.title}</span>
                  </div>
                  <div role="cell" style={{ ...TD, whiteSpace: 'nowrap' }}><TicketPill ticket={r} /></div>
                  <div role="cell" style={{ ...TD, ...TYPE.cellSecondary, whiteSpace: 'nowrap' }}>{fmtTicketDate(r.updated)}</div>
                  <div role="cell" style={{ ...TD, padding: '4px 8px 4px 0', width: '1%' }}>
                    <IconButton
                      size="compact"
                      style={{ width: 32, height: 32 }}
                      aria-label={`Open ticket #${r.id}`}
                      title="Open ticket"
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpen(r); }}
                    >
                      <CaretRight size={14} weight="bold" />
                    </IconButton>
                  </div>
                </>
              )}
            </Hoverable>
          );
        })}
      </div>
    </div>
  </div>
);
