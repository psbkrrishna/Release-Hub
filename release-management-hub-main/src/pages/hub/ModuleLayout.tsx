import { Outlet } from 'react-router-dom';
import DocsNav from '@/components/hub/DocsNav';
import { useMediaQuery, WIDE } from '@/hooks/useMediaQuery';
import { SPACE, sx } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   A module page, and the section pages that sit beside it: the left nav and
   whichever page is open.

   This is deliberately not the shape of the documentation landing page. From
   the landing grid a module opens as its own page - a nav rail down the left,
   the module's own header, its content - rather than as another arrangement of
   the same tab. The tab strip stays lit, because you have not left the tab.

   The negative margin cancels the canvas's 16px padding so the nav can be the
   page's left edge and run to the bottom of the viewport; the content column
   takes that padding back for itself.
   --------------------------------------------------------------------------- */

const ModuleLayout = () => {
  const wide = useMediaQuery(WIDE);

  return (
    <div
      style={sx(
        { display: 'flex', margin: -SPACE.x4 },
        wide ? { flexDirection: 'row', alignItems: 'stretch' } : { flexDirection: 'column' },
      )}
    >
      <DocsNav />
      <div style={{ minWidth: 0, flex: 1, padding: SPACE.x4 }}>
        <Outlet />
      </div>
    </div>
  );
};

export default ModuleLayout;
