import { Outlet } from 'react-router-dom';
import HubTabs from '@/components/hub/HubTabs';
import { SHELL, SPACE, T } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   The Feature Hub shell: the page title and tab strip in one white header
   container, and whichever tab is open below it.

   The header is the platform's standard pattern from the guidelines - title
   and tabs on --card over a --bd2 rule - and it is sticky, so it stays put
   while the page scrolls under it. Sticky rather than fixed: it then inherits
   the rail's 72px offset and the assistant panel's column automatically,
   instead of restating both here and drifting when either changes.

   Negative margins cancel the 16px page padding, so the container and the tab
   rule run the full width of the canvas.

   The breadcrumb is not here. It is in-page navigation, so the pages that have
   somewhere to go back to render their own - and on the module pages it has to
   sit beside the left nav rather than above it.
   --------------------------------------------------------------------------- */

const ReleaseHubLayout = () => (
  <>
    <div
      style={{
        position: 'sticky',
        top: SHELL.topBar,
        zIndex: 50,
        margin: `-${SPACE.x4}px -${SPACE.x4}px ${SPACE.x4}px`,
        padding: `${SPACE.x3}px ${SPACE.x4}px 0`,
        background: T.card,
      }}
    >
      {/* 24px in --tx, not 20px in brand blue: the page title is the page's
          name, and colouring it brand made it compete with the active tab.
          The line height is stated rather than left to the font, because
          SHELL.hubHeader adds it up. */}
      <h1
        style={{
          margin: `0 0 ${SPACE.x2}px`,
          fontSize: 24,
          fontWeight: 700,
          lineHeight: '28px',
          letterSpacing: '-0.01em',
          color: T.tx,
        }}
      >
        Feature Hub
      </h1>
      <HubTabs />
    </div>
    <Outlet />
  </>
);

export default ReleaseHubLayout;
