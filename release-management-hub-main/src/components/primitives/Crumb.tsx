import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* Replaces .crumb. Every level but the last is a link; the current page is
   bold and never a link. Lives on the canvas below the top bar, per this
   app's own brief - not inside the bar. */

export interface CrumbLevel {
  label: string;
  /** Omit on the last level. */
  path?: string;
}

const Crumb = ({ levels }: { levels: CrumbLevel[] }) => {
  const navigate = useNavigate();

  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-sm">
      {levels.map((level, i) => {
        const isLast = i === levels.length - 1;
        if (isLast || !level.path) {
          return (
            <b key={level.label} className="font-semibold text-ink-900">
              {level.label}
            </b>
          );
        }
        return (
          <span key={level.label} className="flex items-center gap-2">
            <a
              href={level.path}
              onClick={(e) => {
                e.preventDefault();
                navigate(level.path!);
              }}
              className="rounded font-medium text-ink-600 no-underline hover:text-brand"
            >
              {level.label}
            </a>
            <ChevronRight size={13} className="text-ink-300" />
          </span>
        );
      })}
    </nav>
  );
};

export default Crumb;
