import type { ReactNode } from 'react';
import HubSearch from '@/components/hub/HubSearch';
import { SPACE } from '@/styles/zerra';

/* Every tab opens the same way: the hub search and the tab's primary action
   beside it. Composed here rather than repeated in three pages, so the three
   cannot drift apart.

   The line of supporting copy that used to sit under the field is gone. It
   restated what the tab strip directly above it already said, and it pushed
   the actual content of every tab a line further down. */

const HubHeader = ({ action }: { action?: ReactNode }) => (
  <div
    className="flex flex-col gap-3 min-[861px]:flex-row min-[861px]:items-center"
    style={{ marginBottom: SPACE.x4 }}
  >
    <HubSearch className="min-[861px]:flex-1" />
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default HubHeader;
