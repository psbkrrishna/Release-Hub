import { useNavigate } from 'react-router-dom';
import { LATEST_RELEASE } from '@/data/features';

/* Sits under the top bar and begins where the rail ends, so it reads as a
   banner over the page content rather than a second global chrome layer. */
const ReleaseBanner = ({
  railCollapsed,
  onDismiss,
}: {
  railCollapsed: boolean;
  onDismiss: () => void;
}) => {
  const navigate = useNavigate();

  return (
    <div className={`announce${railCollapsed ? ' rail-collapsed' : ''}`}>
      <span className="ic">
        <i className="ph ph-sparkle" />
      </span>
      <span className="txt">
        <b>Four new ways to move work forward</b>
        <span className="det">
          Two new features and two enhancements in the {LATEST_RELEASE} release.
        </span>
      </span>
      <a
        className="explore"
        href="/release-hub"
        onClick={(e) => {
          e.preventDefault();
          navigate('/release-hub');
        }}
      >
        Explore <i className="ph ph-arrow-right" />
      </a>
      <button className="close" onClick={onDismiss} aria-label="Dismiss">
        <i className="ph ph-x" />
      </button>
    </div>
  );
};

export default ReleaseBanner;
