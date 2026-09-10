import { Outlet } from 'react-router-dom';
import DocsNav from '@/components/hub/DocsNav';

/* ---------------------------------------------------------------------------
   The Product & Feature Documentation tab's own shell: a persistent left nav
   pane and the page beside it.

   A layout route rather than something each page renders, so the pane does not
   remount - and so it cannot fall out of one page while staying in another.

   The pane is above the content below 1181px rather than a cramped column;
   at that width the nav is the first thing you want anyway.
   --------------------------------------------------------------------------- */

const KnowledgeLayout = () => (
  <div className="grid grid-cols-1 items-start gap-4 min-[1181px]:grid-cols-[248px_minmax(0,1fr)]">
    <DocsNav />
    <div className="min-w-0">
      <Outlet />
    </div>
  </div>
);

export default KnowledgeLayout;
