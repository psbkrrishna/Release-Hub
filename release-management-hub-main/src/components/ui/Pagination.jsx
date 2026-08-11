import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { PiCaretLeft, PiCaretRight, PiDotsThree } from "react-icons/pi";
import Menu from "@/components/ui/Menu";

/** Pagination. Vendored verbatim from production, including its
 *  hide-under-10-items behavior (MIN_ITEMS_TO_SHOW_PAGINATION). */

const calculateItemRange = (currentPage, perPage, totalItems) => ({
  start: (currentPage - 1) * perPage + 1,
  end: Math.min(currentPage * perPage, totalItems),
});

const isValidPageChange = (newPage, totalPages) => newPage >= 1 && newPage <= totalPages;

const generatePageNumbers = (currentPage, totalPages, maxVisible = 4, sidePages = 2) => {
  if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = [];
  const leftSide = Math.max(1, currentPage - sidePages);
  const rightSide = Math.min(totalPages, currentPage + sidePages);
  if (leftSide > 1) {
    pages.push(1);
    if (leftSide > 2) pages.push("...");
  }
  for (let i = leftSide; i <= rightSide; i++) pages.push(i);
  if (rightSide < totalPages) {
    if (rightSide < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }
  return pages;
};

const hasNextPage = (currentPage, totalPages) => currentPage < totalPages;
const hasPrevPage = (currentPage) => currentPage > 1;
const parsePerPage = (value) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 10 : parsed;
};
const cancelDebounce = (timeoutRef) => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }
};

const DEFAULT_PER_PAGE_OPTIONS = ["10", "25", "50"];
const DEFAULT_MAX_VISIBLE_PAGES = 4;
const DEFAULT_SIDE_PAGES = 2;
const MIN_ITEMS_TO_SHOW_PAGINATION = 10;

const KEYBOARD_KEYS = { ARROW_LEFT: "ArrowLeft", ARROW_RIGHT: "ArrowRight", HOME: "Home", END: "End" };

const useKeyboardNavigation = ({ enabled, currentPage, totalPages, loading, onPageChange }) => {
  const debounceTimeoutRef = useRef(null);
  const DEBOUNCE_DELAY = 300;

  const debouncedPageChange = useCallback(
    (newPage) => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        if (!loading) onPageChange(newPage);
      }, DEBOUNCE_DELAY);
    },
    [loading, onPageChange],
  );

  useEffect(() => {
    if (!enabled) return;
    const hasNext = hasNextPage(currentPage, totalPages);
    const hasPrev = hasPrevPage(currentPage);
    const pressedKeys = new Set();

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if ([KEYBOARD_KEYS.ARROW_LEFT, KEYBOARD_KEYS.ARROW_RIGHT, KEYBOARD_KEYS.HOME, KEYBOARD_KEYS.END].includes(e.key)) {
        e.preventDefault();
        pressedKeys.add(e.key);
      }
    };

    const handleKeyUp = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (!pressedKeys.has(e.key)) return;
      pressedKeys.delete(e.key);
      switch (e.key) {
        case KEYBOARD_KEYS.ARROW_LEFT:
          if (hasPrev && !loading) debouncedPageChange(currentPage - 1);
          break;
        case KEYBOARD_KEYS.ARROW_RIGHT:
          if (hasNext && !loading) debouncedPageChange(currentPage + 1);
          break;
        case KEYBOARD_KEYS.HOME:
          if (currentPage !== 1 && !loading) debouncedPageChange(1);
          break;
        case KEYBOARD_KEYS.END:
          if (currentPage !== totalPages && !loading) debouncedPageChange(totalPages);
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      cancelDebounce(debounceTimeoutRef);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, currentPage, totalPages, loading, debouncedPageChange]);
};

const ResultsCount = ({ startItem, endItem, totalCount }) => (
  <div>
    <p className="text-sm text-grey-700">
      Showing <span className="font-medium">{startItem}-{endItem}</span> of <span className="font-medium">{totalCount}</span> results
    </p>
  </div>
);

const PerPageSelector = ({ perPage, perPageOptions, onPerPageChange }) => {
  const handlePerPageChange = useCallback(
    (option) => {
      const newPerPage = parsePerPage(option);
      if (newPerPage !== null && onPerPageChange) onPerPageChange(newPerPage);
    },
    [onPerPageChange],
  );

  const menuItems = useMemo(
    () => perPageOptions.map((option) => ({ label: option, selected: option === perPage.toString(), onClick: () => handlePerPageChange(option) })),
    [perPageOptions, perPage, handlePerPageChange],
  );

  return (
    <div className="flex items-center space-x-2 mx-2 sm:my-2">
      <span className="text-sm text-gray-700">Result per page</span>
      <Menu buttonText={perPage.toString()} variant="base" dropdownWidth="w-20" className="w-16 h-8 px-2 py-1 text-sm border border-gray-300 rounded hover:border-gray-400" items={menuItems} />
    </div>
  );
};

const PageNavigation = ({ currentPage, totalPages, loading, onPageChange }) => {
  const pageNumbers = useMemo(() => generatePageNumbers(currentPage, totalPages, DEFAULT_MAX_VISIBLE_PAGES, DEFAULT_SIDE_PAGES), [currentPage, totalPages]);
  const hasNext = useMemo(() => hasNextPage(currentPage, totalPages), [currentPage, totalPages]);
  const hasPrev = useMemo(() => hasPrevPage(currentPage), [currentPage]);

  const handlePageChange = useCallback(
    (page) => {
      if (!loading) onPageChange(page);
    },
    [loading, onPageChange],
  );

  const buttonBaseClasses = "relative inline-flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200";
  const buttonDisabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonDefaultClasses = "text-grey-500 bg-white hover:bg-blue-600 hover:text-white";

  return (
    <nav className="relative z-0 inline-flex space-x-1 rounded-md sm:my-2 sm:mx-0" aria-label="Pagination">
      <button onClick={() => handlePageChange(1)} disabled={currentPage === 1 || loading} className={`${buttonBaseClasses} ${buttonDefaultClasses} ${buttonDisabledClasses}`} title="First page" aria-label="Go to first page">
        <span className="sr-only">First</span>
        <PiCaretLeft className="w-3 h-3" />
      </button>
      <button onClick={() => handlePageChange(currentPage - 1)} disabled={!hasPrev || loading} className={`${buttonBaseClasses} ${buttonDefaultClasses} ${buttonDisabledClasses}`} title="Previous page" aria-label="Go to previous page">
        <span className="text-sm">Previous</span>
      </button>
      {pageNumbers.map((page, index) => (
        <React.Fragment key={page === "..." ? `ellipsis-${index}` : page}>
          {page === "..." ? (
            <span className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-grey-700 bg-white rounded-md cursor-default">
              <PiDotsThree className="w-3 h-3" />
            </span>
          ) : (
            <button
              onClick={() => handlePageChange(page)}
              disabled={loading}
              className={`${buttonBaseClasses} ${currentPage === page ? "z-10 bg-blue-500 text-white font-semibold" : buttonDefaultClasses} ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              title={`Go to page ${page}`}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      <button onClick={() => handlePageChange(currentPage + 1)} disabled={!hasNext || loading} className={`${buttonBaseClasses} ${buttonDefaultClasses} ${buttonDisabledClasses}`} title="Next page" aria-label="Go to next page">
        <span>Next</span>
      </button>
      <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages || loading} className={`${buttonBaseClasses} ${buttonDefaultClasses} ${buttonDisabledClasses}`} title="Last page" aria-label="Go to last page">
        <span className="sr-only">Last</span>
        <PiCaretRight className="w-3 h-3" />
      </button>
    </nav>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  perPage,
  loading = false,
  keyboardNavigationEnabled = false,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  onPerPageChange,
}) => {
  const { start: startItem, end: endItem } = useMemo(() => calculateItemRange(currentPage, perPage, totalCount), [currentPage, perPage, totalCount]);

  const handlePageChange = useCallback(
    (page) => {
      if (isValidPageChange(page, totalPages)) onPageChange(page);
    },
    [totalPages, onPageChange],
  );

  useKeyboardNavigation({ enabled: keyboardNavigationEnabled, currentPage, totalPages, loading, onPageChange: handlePageChange });

  if (!totalCount || totalCount < MIN_ITEMS_TO_SHOW_PAGINATION) return null;

  return (
    <div className="flex flex-1 items-center justify-between w-full sm:flex sm:flex-col sm:items-start">
      <ResultsCount startItem={startItem} endItem={endItem} totalCount={totalCount} />
      <div className="flex items-center sm:flex sm:flex-col sm:items-start">
        <PerPageSelector perPage={perPage} perPageOptions={perPageOptions} onPerPageChange={onPerPageChange} />
        <PageNavigation currentPage={currentPage} totalPages={totalPages} loading={loading} onPageChange={handlePageChange} />
      </div>
    </div>
  );
};

export default Pagination;
