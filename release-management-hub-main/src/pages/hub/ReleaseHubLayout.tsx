import { Outlet, useLocation } from 'react-router-dom';
import HubHeaderV2, { HubActionSlotContext, useActionSlotState } from '@/components/hub/HubHeaderV2';

/* ---------------------------------------------------------------------------
   Get help (formerly the Product Hub), as the Release Hub V2 design lays it
   out: the sticky page header over whichever page is open. The Overview is
   its own hero, so it renders without the header - the design hides it there.
   The webinar now lives in the shell's banner, not on the page.
   --------------------------------------------------------------------------- */

const ReleaseHubLayout = () => {
  const [slot, setSlot] = useActionSlotState();
  const { pathname } = useLocation();
  const isOverview = pathname.replace(/\/+$/, '').endsWith('/overview');

  return (
    <HubActionSlotContext.Provider value={slot}>
      {!isOverview && <HubHeaderV2 setSlot={setSlot} />}
      <Outlet />
    </HubActionSlotContext.Provider>
  );
};

export default ReleaseHubLayout;
