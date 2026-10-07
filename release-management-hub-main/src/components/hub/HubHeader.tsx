import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import HubSearch from '@/components/hub/HubSearch';
import { useHubActionSlot } from '@/components/hub/HubHeaderV2';
import { useHubVersion } from '@/components/HubVersionProvider';
import { SPACE } from '@/styles/zerra';

/* Every tab opens the same way: the hub search and the tab's primary action
   beside it. Composed here rather than repeated in three pages, so the three
   cannot drift apart.

   The line of supporting copy that used to sit under the field is gone. It
   restated what the tab strip directly above it already said, and it pushed
   the actual content of every tab a line further down.

   In V2 the action leaves this row: the page still renders it (it owns the
   state behind it), but it is portalled into the page header's top right, and
   the search is left to fill the row. */

const HubHeader = ({ action }: { action?: ReactNode }) => {
  const { version } = useHubVersion();
  const slot = useHubActionSlot();
  const inHeader = version === 'v2' && slot;

  return (
    <div
      className="flex flex-col gap-3 min-[861px]:flex-row min-[861px]:items-center"
      style={{ marginBottom: SPACE.x4 }}
    >
      <HubSearch className="min-[861px]:flex-1" />
      {action && (inHeader ? createPortal(action, slot) : <div className="shrink-0">{action}</div>)}
    </div>
  );
};

export default HubHeader;
