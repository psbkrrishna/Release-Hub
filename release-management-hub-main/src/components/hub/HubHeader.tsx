import type { ReactNode } from 'react';
import HubSearch from '@/components/hub/HubSearch';

/* Every tab opens the same way: the hub search, the tab's primary action
   beside it, and one line saying what the tab is for. Composed here rather
   than repeated in three pages, so the three cannot drift apart. */

const HubHeader = ({ lede, action }: { lede: string; action?: ReactNode }) => (
  <>
    <div className="mb-2 flex flex-col gap-3 min-[861px]:flex-row min-[861px]:items-center">
      <HubSearch className="min-[861px]:flex-1" />
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {/* No max-width: these are single sentences and are meant to stay on one
        line. A prose measure was wrapping them for no reason. */}
    <p className="mb-4 text-sm text-ink-600">{lede}</p>
  </>
);

export default HubHeader;
