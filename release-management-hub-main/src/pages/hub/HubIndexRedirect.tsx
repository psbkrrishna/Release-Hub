import { Navigate, useLocation } from 'react-router-dom';

/* /release-hub used to BE the Release Management table, and links to it are
   still in the wild - the release banner, What's New, and the "View this
   release" button on a feature all pointed here, some of them carrying a
   ?month= filter.

   A bare /release-hub now means "take me to the hub", which is Home. One
   carrying ?month= means "show me that release", which is Release Management
   with its filter intact - so the query is forwarded rather than dropped. */
const HubIndexRedirect = () => {
  const { search } = useLocation();
  const wantsRelease = new URLSearchParams(search).has('month');

  return <Navigate replace to={wantsRelease ? `/release-hub/releases${search}` : '/release-hub/home'} />;
};

export default HubIndexRedirect;
