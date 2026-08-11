import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/* Two lines, then Show more - so every row is the same height on first read.
   The control only appears where two lines actually cut something off, so a
   short summary doesn't offer to expand into nothing.

   The clamp is line-clamp-2 rather than the hand-rolled -webkit-box stack the
   stylesheet used; Tailwind's utility emits the same three properties. */
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
      <div
        ref={ref}
        className={`max-w-cell text-ink-700 ${open ? '' : 'line-clamp-2'}`}
      >
        {text}
      </div>
      {(overflows || open) && (
        <button
          className="mt-1 inline-flex items-center gap-1 rounded text-13 font-medium text-brand hover:underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Show less' : 'Show more'}
          <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    </>
  );
};

export default SummaryCell;
