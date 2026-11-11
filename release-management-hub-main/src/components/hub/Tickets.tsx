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

/* ---- Create ticket ------------------------------------------------------ */

const label: CSSProperties = { ...TYPE.fieldLabel, display: 'block', marginBottom: GAP.label };

export const CreateTicketModal = ({ onCreated }: { onCreated?: (t: Ticket) => void }) => {
  const { createOpen, closeCreate, create } = useTickets();
  const [title, setTitle] = useState('');
  const [module, setModule] = useState(MODULES[0]);
  const [detail, setDetail] = useState('');
  const [err, setErr] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    if (createOpen) { setTitle(''); setDetail(''); setModule(MODULES[0]); setErr(false); }
  }, [createOpen]);

  const submit = () => {
    if (!title.trim()) { setErr(true); return; }
    const t = create({ title: title.trim(), module, detail: detail.trim() });
    closeCreate();
    onCreated?.(t);
  };

  return (
    <Modal open={createOpen} onClose={closeCreate} labelledBy="create-ticket-title" align="center" width={520} animate>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.x3, padding: `${SPACE.x4}px`, borderBottom: `1px solid ${T.bd2}` }}>
        <h2 id="create-ticket-title" style={{ margin: 0, flex: 1, ...TYPE.sectionTitle }}>Create ticket</h2>
        <IconButton size="compact" onClick={closeCreate} title="Close" aria-label="Close"><X size={16} /></IconButton>
      </div>
      <div style={{ padding: SPACE.x4, display: 'flex', flexDirection: 'column', gap: GAP.field }}>
        <div>
          <label htmlFor="tk-title" style={label}>Subject</label>
          <input
            id="tk-title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); if (e.target.value.trim()) setErr(false); }}
            onFocus={() => setFocus('title')}
            onBlur={() => setFocus(null)}
            placeholder="e.g. Interview invites not reaching panelists"
            style={inputStyle({ invalid: err, focused: focus === 'title' })}
          />
          {err && <div style={{ marginTop: SPACE.x1, fontSize: 12, color: T.dangText }}>Add a subject</div>}
        </div>
        <div>
          <label htmlFor="tk-module" style={label}>Product module</label>
          <select
            id="tk-module"
            value={module}
            onChange={(e) => setModule(e.target.value)}
            onFocus={() => setFocus('module')}
            onBlur={() => setFocus(null)}
            style={selectStyle({ focused: focus === 'module' })}
          >
            {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="tk-detail" style={label}>What happened</label>
          <textarea
            id="tk-detail"
            rows={4}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            onFocus={() => setFocus('detail')}
            onBlur={() => setFocus(null)}
            placeholder="Steps, the record ID, and what you expected to see."
            style={textareaStyle({ focused: focus === 'detail' })}
          />
          <div style={{ marginTop: SPACE.x1, ...TYPE.helper, fontSize: 12 }}>Support replies here and by email.</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: SPACE.x2, padding: `${SPACE.x3}px ${SPACE.x4}px`, borderTop: `1px solid ${T.bd2}` }}>
        <Button variant="secondary" onClick={closeCreate}>Cancel</Button>
        <Button onClick={submit}>Create ticket</Button>
      </div>
    </Modal>
  );
};
