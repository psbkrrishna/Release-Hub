import { ArrowRight, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { latestRelease } from '@/data/releases';
import { useReleaseVisibility } from './ReleaseVisibilityProvider';

const DashboardReleaseBanner = () => {
  const navigate = useNavigate();
  const { getAnnouncement, isCustomerAudience } = useReleaseVisibility();
  const announcement = getAnnouncement('dashboard');
  const [dismissedForSession, setDismissedForSession] = useState(false);

  if (!isCustomerAudience || !announcement || dismissedForSession) return null;

  return (
    <div className="border-b border-blue-700 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 px-4 py-2 text-white shadow-sm">
      <div className="mx-auto flex max-w-[1600px] items-center gap-2.5">
        <div className="hidden h-7 w-7 flex-none items-center justify-center rounded-md bg-white/15 sm:flex">
          <Sparkles className="h-4 w-4" />
        </div>
        <button
          type="button"
          onClick={() => navigate(`/release-hub?release=${latestRelease.id}`)}
          className="group min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className="text-sm font-semibold text-white">{announcement.title}</span>
          <span className="ml-2 hidden text-sm text-blue-100 md:inline">{announcement.summary}</span>
          <span className="ml-2 inline-flex items-center text-sm font-semibold text-white">
            Explore <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => setDismissedForSession(true)}
          className="rounded-md p-1 text-blue-100 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Dismiss July release banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default DashboardReleaseBanner;
