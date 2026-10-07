import Crumb, { type CrumbLevel } from '@/components/primitives/Crumb';
import { useHubVersion } from '@/components/HubVersionProvider';

/* The page-level breadcrumb of V1. In V2 the header resolves the trail for
   every page (hubJourney.ts), so a page that also drew one would show it
   twice. */
const HubCrumb = ({ levels }: { levels: CrumbLevel[] }) => {
  const { version } = useHubVersion();
  return version === 'v2' ? null : <Crumb levels={levels} />;
};

export default HubCrumb;
