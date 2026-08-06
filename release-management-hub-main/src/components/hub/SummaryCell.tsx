import { useEffect, useRef, useState } from 'react';

/* Two lines, then Show more - so every row is the same height on first read.
   The control only appears where two lines actually cut something off, so a
   short summary doesn't offer to expand into nothing. */
const SummaryCell = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      if (open) return;
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, open]);

  return (
    <>
      <div ref={ref} className={`summary clamp2${open ? ' open' : ''}`}>
        {text}
      </div>
      {(overflows || open) && (
        <button className={`showmore${open ? ' open' : ''}`} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show less' : 'Show more'} <i className="ph ph-caret-down" />
        </button>
      )}
    </>
  );
};

export default SummaryCell;
