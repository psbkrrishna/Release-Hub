import { Envelope, FileText, MonitorPlay } from '@phosphor-icons/react';

/* ---------------------------------------------------------------------------
   The three destinations in the Documentation tab that are not a module:
   content that spans every module rather than belonging to one.

   Stated once because they render twice - as tiles at the top of the
   documentation landing page, and as the quick links pinned to the foot of the
   module pages' left nav. Written down in both places, a route change would
   need two edits and one of them would eventually be missed.

   `sub` is used by the tiles only; the nav rows are a single line.
   --------------------------------------------------------------------------- */

export const DOC_SECTIONS = [
  {
    label: 'Release notes',
    sub: 'What changed, release by release',
    icon: FileText,
    path: '/release-hub/knowledge/release-notes',
  },
  {
    label: 'Newsletters',
    sub: 'The monthly round-up',
    icon: Envelope,
    path: '/release-hub/knowledge/newsletters',
  },
  {
    label: 'Video library',
    sub: 'Walkthroughs and demos',
    icon: MonitorPlay,
    path: '/release-hub/knowledge/videos',
  },
] as const;
