import { useEffect, useState } from 'react';
import { CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react';

/* The table footer from the Release Hub V2 design: "Showing a-b of n", rows
   per page, and the page-number input between two chevrons. Controls that
   cannot act stay visible at 0.42 with a tooltip saying why. */

const PER = [10, 20, 50];

const DesignPager = ({
  total, page, per, onPage, onPer, borderTop = '1px solid var(--bd)', perOptions = PER,
}: {
  total: number;
  page: number;
  per: number;
  onPage: (n: number) => void;
  onPer: (n: number) => void;
  borderTop?: string;
  perOptions?: number[];
}) => {
  const pages = Math.max(1, Math.ceil(total / per));
  const cur = Math.min(page, pages);
  const [draft, setDraft] = useState(String(cur));
  useEffect(() => setDraft(String(cur)), [cur]);
  const commit = () => { const v = parseInt(draft, 10); const n = Number.isNaN(v) ? cur : Math.min(Math.max(1, v), pages); onPage(n); setDraft(String(n)); };
  const from = (cur - 1) * per;
  const perDis = total <= perOptions[0];
  const btn = (dis: boolean) => ({
    width: 32, height: 32, borderRadius: 8, border: '1px solid var(--bd2)', background: 'var(--card)', color: 'var(--tx2)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: dis ? 'not-allowed' : 'pointer', opacity: dis ? 0.42 : 1,
  });
  return (
    <div style={{ borderTop, padding: '8px 8px 8px 12px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--tx3)' }}>
      <span style={{ whiteSpace: 'nowrap' }}>
        Showing <b style={{ color: 'var(--tx)' }}>{total ? `${from + 1}-${Math.min(from + per, total)}` : '0'}</b> of <b style={{ color: 'var(--tx)' }}>{total}</b>
      </span>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--tx3)', whiteSpace: 'nowrap' }}>
        Rows per page
        <span style={{ position: 'relative', display: 'inline-flex' }} title={perDis ? 'Every row already fits on one page' : undefined}>
          <select
            value={per}
            disabled={perDis}
            onChange={(e) => onPer(parseInt(e.target.value, 10))}
            style={{ height: 32, borderRadius: 8, border: '1px solid var(--bd2)', background: 'var(--card)', padding: '0 28px 0 10px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--tx)', appearance: 'none', WebkitAppearance: 'none', cursor: perDis ? 'not-allowed' : 'pointer', opacity: perDis ? 0.42 : 1 }}
          >
            {perOptions.map((v, i) => <option key={v} value={v} disabled={i > 0 && perOptions[i - 1] >= total}>{v}</option>)}
          </select>
          <CaretDown size={11} weight="bold" color="var(--tx3)" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </span>
      </label>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span title={cur <= 1 ? 'Already on the first page' : undefined} style={{ display: 'inline-flex' }}>
          <button type="button" aria-label="Previous page" disabled={cur <= 1} onClick={() => onPage(cur - 1)} style={btn(cur <= 1)}><CaretLeft size={16} /></button>
        </span>
        <input
          aria-label="Page number"
          value={draft}
          disabled={pages <= 1}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
          style={{ width: 32, height: 32, boxSizing: 'border-box', textAlign: 'center', borderRadius: 8, border: '1px solid var(--bd2)', background: 'var(--card)', color: 'var(--tx)', fontFamily: 'inherit', fontSize: 14, padding: 0, opacity: pages <= 1 ? 0.42 : 1 }}
        />
        <span style={{ whiteSpace: 'nowrap' }}>of {pages}</span>
        <span title={cur >= pages ? 'Already on the last page' : undefined} style={{ display: 'inline-flex' }}>
          <button type="button" aria-label="Next page" disabled={cur >= pages} onClick={() => onPage(cur + 1)} style={btn(cur >= pages)}><CaretRight size={16} /></button>
        </span>
      </div>
    </div>
  );
};

export default DesignPager;
