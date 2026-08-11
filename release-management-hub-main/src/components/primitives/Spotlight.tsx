import { useId, type ReactNode } from 'react';
import { X, ArrowRight } from 'lucide-react';
import Modal from './Modal';

/* Replaces .spot-overlay / .spot-card and its `.rel` variant. Both
   announcements in the app are this component with one colour difference,
   which is exactly what the stylesheet expressed as `.spot-card` plus
   `.spot-card.rel`.

   `news` uses purple-600 rather than the lighter purple-500 used on chips and
   the NEW dot: this hero carries 14px body copy on a solid fill, and
   white-at-88% over #BC3AD2 is only 3.75:1, which fails WCAG AA for normal
   text, while #A32EB8 reaches 4.8:1. The lighter step stays on decoration,
   which only needs 3:1. */

type Tone = 'brand' | 'news';

const HERO: Record<Tone, string> = {
  brand: 'bg-brand',
  news: 'bg-purple-600',
};

const CTA: Record<Tone, string> = {
  brand: 'bg-brand hover:bg-brand-hover',
  news: 'bg-purple-600 hover:bg-purple-900',
};

interface Props {
  open: boolean;
  onClose: () => void;
  tone?: Tone;
  /** Small uppercase eyebrow above the title. */
  tag: string;
  title: string;
  intro: string;
  /** Icon shown in the hero's tinted square. */
  icon: ReactNode;
  /** Body content between the hero and the call to action. */
  children: ReactNode;
  ctaLabel: string;
  onCta: () => void;
  dismissLabel: string;
  /** Marks this as the release announcement, so the Performance Reviews
   *  spotlight can tell one is already showing and defer to it. Presence in
   *  the DOM is a reliable signal here because a closed Modal renders
   *  nothing at all. */
  isRelease?: boolean;
}

const Spotlight = ({
  open, onClose, tone = 'brand', tag, title, intro, icon,
  children, ctaLabel, onCta, dismissLabel, isRelease = false,
}: Props) => {
  const titleId = useId();

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      align="center"
      width={520}
      layer="z-spotlight"
      animate
    >
      <div {...(isRelease ? { 'data-release-popup': 'true' } : {})}>
        <div className={`relative px-6 pb-5 pt-6 text-white ${HERO[tone]}`}>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border-none bg-white/[.16] text-white transition-colors hover:bg-white/[.28]"
          >
            <X size={16} />
          </button>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[.18]">
            {icon}
          </div>
          <span className="mb-3 inline-block rounded-lg bg-white/20 px-2 py-1 text-xs font-medium uppercase tracking-[.02em] text-white">
            {tag}
          </span>
          <h3 id={titleId} className="mb-2 text-22 font-bold leading-[1.25]">{title}</h3>
          <p className="text-sm leading-[1.55] text-white/[.88]">{intro}</p>
        </div>

        <div className="p-5">
          {children}
          <button
            onClick={onCta}
            className={`flex h-10 w-full items-center justify-center gap-2 rounded-lg border-none text-sm font-semibold text-white transition-colors ${CTA[tone]}`}
          >
            {ctaLabel} <ArrowRight size={16} />
          </button>
          <button
            onClick={onClose}
            className="mt-3 w-full rounded-md py-2 text-center text-13 text-ink-600 transition-colors hover:text-ink-900"
          >
            {dismissLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Spotlight;
