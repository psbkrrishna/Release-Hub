import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { LATEST_RELEASE } from '@/data/features';

/* Sits under the top bar and begins where the rail ends, so it reads as a
   banner over the page content rather than a second global chrome layer.

   A pale band, not a second dark bar: against the blue top bar the separation
   is by value rather than hue, so the two layers stop competing without the
   band having to shout. Pastel purple also keeps it in the family that marks
   everything new in this app. */
const ReleaseBanner = ({
  railCollapsed,
  onDismiss,
}: {
  railCollapsed: boolean;
  onDismiss: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={[
        'fixed right-0 top-topbar z-banner flex h-annbar items-center gap-3',
        'border-b border-[rgba(188,58,210,.28)] bg-purple-50 pl-4 pr-3 text-purple-900',
        'transition-[left]',
        railCollapsed ? 'left-0' : 'left-rail',
      ].join(' ')}
    >
      {/* One saturated step up from the band - same hue, deeper value - so the
          chip reads as the accent without introducing a second colour. */}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white">
        <Sparkles size={15} />
      </span>

      <span className="overflow-hidden truncate whitespace-nowrap text-sm leading-[1.3]">
        <b className="mr-2 font-semibold">Four new ways to move work forward</b>
        {/* The bar is a fixed height, so the copy truncates rather than
            wrapping out of it. Below the width where this sentence fits whole
            it is dropped rather than clipped mid-word, keeping the headline,
            the action and the dismiss - the three things that have to survive. */}
        <span className="hidden min-[901px]:inline">
          Two new features and two enhancements in the {LATEST_RELEASE} release.
        </span>
      </span>

      <a
        className="ml-1 inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded font-semibold text-purple-900 no-underline hover:underline"
        href="/release-hub"
        onClick={(e) => {
          e.preventDefault();
          navigate('/release-hub');
        }}
      >
        Explore <ArrowRight size={14} />
      </a>

      <button
        className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-none bg-transparent text-[rgba(16,24,40,.62)] transition-colors hover:bg-[rgba(188,58,210,.14)] hover:text-ink-900"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ReleaseBanner;
