import { useNavigate } from "react-router-dom";
import { PiCaretRight } from "react-icons/pi";
import PropTypes from "prop-types";

/**
 * A small shared breadcrumb, not production's Breadcrumb.jsx - that component
 * is hardcoded to a sibling recruiting app's routes and, per the codebase
 * survey, no real settings page actually uses it; every real page hand-rolls
 * its own "parent > current" row instead. This gives that same look a
 * reusable shape: every item but the last is a link, in text-sm, matching
 * production's grey-300/grey-500 link/current convention.
 */
const PageBreadcrumb = ({ items }) => {
  const navigate = useNavigate();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-3 flex-wrap">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        if (isLast) {
          return (
            <span key={item.label} className="font-medium text-grey-500">
              {item.label}
            </span>
          );
        }
        return (
          <span key={item.label} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate(item.path)}
              className="text-grey-300 hover:text-blue-600 font-medium rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {item.label}
            </button>
            <PiCaretRight className="text-grey-100" size={14} />
          </span>
        );
      })}
    </nav>
  );
};

PageBreadcrumb.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string.isRequired, path: PropTypes.string })).isRequired,
};

export default PageBreadcrumb;
