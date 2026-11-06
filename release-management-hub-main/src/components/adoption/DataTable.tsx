import { useEffect, useState, type ReactNode } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import IconButton from '@/components/primitives/IconButton';
import type { Column } from '@/components/adoption/columns';
import { RADIUS, SPACE, T, TYPE } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   A dense, paginated table built from role="table" divs, per the guidelines.

   A clickable row drills down, so it carries the whole affordance: pointer,
   --su1 hover, the name turning brand blue, a caret at the end, and Enter to
   activate from the keyboard. The table scrolls sideways inside its own box on
   a narrow screen; the page never does.
   --------------------------------------------------------------------------- */

const cell = (width?: number) => ({
  display: 'table-cell',
  verticalAlign: 'middle' as const,
  padding: `${SPACE.x2}px ${SPACE.x3}px`,
  borderBottom: `1px solid ${T.bd}`,
  width,
  minWidth: width,
  maxWidth: width ? Math.max(width, 120) : undefined,
});

function Row<R>({
  row,
  columns,
  onOpen,
  openLabel,
}: {
  row: R;
  columns: Column<R>[];
  onOpen?: (row: R) => void;
  openLabel?: (row: R) => string;
}) {
  const [hover, setHover] = useState(false);
  const clickable = Boolean(onOpen);
  return (
    <div
      role="row"
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable && openLabel ? openLabel(row) : undefined}
      onClick={clickable ? () => onOpen!(row) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onOpen!(row); } : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'table-row',
        background: hover ? T.su1 : T.card,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'background 120ms ease',
      }}
    >
      {columns.map((c, i) => (
        <div
          key={c.key}
          role="cell"
          style={{
            ...cell(c.width),
            ...TYPE.cellSecondary,
            color: i === 0 && hover && clickable ? T.brand : i === 0 ? T.tx : T.tx2,
            whiteSpace: 'nowrap',
          }}
        >
          {/* The first column's name inherits this cell's colour, which is how
              it turns brand blue on hover. */}
          {c.render(row)}
        </div>
      ))}
      <div role="cell" style={{ ...cell(40), color: T.tx4, paddingLeft: 0 }}>
        {clickable && <CaretRight size={14} weight="bold" style={{ color: hover ? T.brand : T.tx4 }} />}
      </div>
    </div>
  );
}

function DataTable<R extends { id: string }>({
  rows,
  columns,
  onOpen,
  openLabel,
  empty,
  resetKey,
  perPage = 10,
}: {
  rows: R[];
  columns: Column<R>[];
  onOpen?: (row: R) => void;
  openLabel?: (row: R) => string;
  empty: ReactNode;
  /** Changes whenever the rows mean something different, to go back to page 1. */
  resetKey: string;
  /** Ten by default: enough to act on, few enough to read. */
  perPage?: number;
}) {
  const visible = columns;
  const PER_PAGE = perPage;
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState('1');
  useEffect(() => setPage(1), [resetKey]);

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page, pages);
  useEffect(() => setDraft(String(current)), [current]);
  const from = (current - 1) * PER_PAGE;
  const slice = rows.slice(from, from + PER_PAGE);

  const commit = () => {
    const n = Number(draft);
    if (!draft || Number.isNaN(n)) setDraft(String(current));
    else setPage(Math.min(Math.max(1, n), pages));
  };

  if (!rows.length) return <>{empty}</>;

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <div role="table" style={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
          <div role="rowgroup" style={{ display: 'table-header-group' }}>
            <div role="row" style={{ display: 'table-row', background: T.su1 }}>
              {visible.map((c) => (
                <div
                  key={c.key}
                  role="columnheader"
                  style={{ ...cell(c.width), ...TYPE.eyebrow, whiteSpace: 'nowrap', textAlign: 'left' }}
                >
                  {c.header}
                </div>
              ))}
              <div role="columnheader" aria-label="Open" style={{ ...cell(40), paddingLeft: 0 }} />
            </div>
          </div>
          <div role="rowgroup" style={{ display: 'table-row-group' }}>
            {slice.map((r) => (
              <Row key={r.id} row={r} columns={visible} onOpen={onOpen} openLabel={openLabel} />
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: SPACE.x4,
          padding: `${SPACE.x2}px ${SPACE.x4}px`,
          ...TYPE.cellSecondary,
        }}
      >
        <span>
          Showing <b style={{ color: T.tx }}>{from + 1}-{from + slice.length}</b> of{' '}
          <b style={{ color: T.tx }}>{rows.length.toLocaleString()}</b>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.x2, marginLeft: 'auto' }}>
          <IconButton
            bordered
            size="compact"
            style={{ height: 32, width: 32 }}
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
            title={current <= 1 ? 'Already on the first page' : 'Previous page'}
            aria-label="Previous page"
          >
            <CaretLeft size={16} />
          </IconButton>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Page number"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            style={{
              height: 32,
              width: 32,
              textAlign: 'center',
              borderRadius: RADIUS.control,
              border: `1px solid ${T.bd2}`,
              background: T.card,
              color: T.tx,
              outline: 'none',
              fontVariantNumeric: 'tabular-nums',
              ...TYPE.input,
            }}
          />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>of {pages}</span>
          <IconButton
            bordered
            size="compact"
            style={{ height: 32, width: 32 }}
            disabled={current >= pages}
            onClick={() => setPage(current + 1)}
            title={current >= pages ? 'Already on the last page' : 'Next page'}
            aria-label="Next page"
          >
            <CaretRight size={16} />
          </IconButton>
        </div>
      </div>
    </>
  );
}

export default DataTable;
