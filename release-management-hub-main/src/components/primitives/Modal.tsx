import { useEffect, useRef, type ReactNode } from 'react';

/* Replaces .overlay/.modal and .spot-overlay/.spot-card.

   Deliberately plain React rather than a headless library. The previous
   attempt at this app used Headless UI here and hit a bug where a Dialog
   wrapped in a Transition never unmounted on close; this has no such moving
   parts - `open` false means nothing is rendered.

   What it does carry, because a dialog is one of the few places raw markup
   genuinely isn't enough: Escape to close, backdrop-click to close (without
   swallowing clicks inside the panel), aria-modal + a labelled title, focus
   moved into the panel on open and returned to the trigger on close, and a
   body scroll lock. */

interface Props {
  open: boolean;
  onClose: () => void;
  /** Rendered as the dialog's accessible name. */
  labelledBy: string;
  /** 'start' tops-aligns and lets the overlay scroll (long forms);
   *  'center' centres a short card (announcements). */
  align?: 'start' | 'center';
  /** Panel width in px. Always capped to the viewport. */
  width?: number;
  /** Tailwind z-index utility - announcements sit above the form modal. */
  layer?: string;
  /** Entry animation for the panel. */
  animate?: boolean;
  children: ReactNode;
}

const Modal = ({
  open,
  onClose,
  labelledBy,
  align = 'start',
  width = 720,
  layer = 'z-modal',
  animate = false,
  children,
}: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;
    // Captured now rather than read in the cleanup: by the time cleanup runs
    // React may already have detached the node from the ref.
    const panel = panelRef.current;
    panel?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      // Only pull focus back if it is still inside the closing dialog -
      // otherwise a dialog that closed by navigating somewhere would yank
      // focus off whatever the new view just focused.
      if (panel?.contains(document.activeElement)) {
        restoreTo.current?.focus?.();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={[
        'fixed inset-0 flex justify-center bg-black/50',
        layer,
        align === 'start' ? 'items-start overflow-y-auto px-5 py-8' : 'items-center p-5',
      ].join(' ')}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        style={{ width }}
        className={[
          'max-w-full overflow-hidden rounded-lg bg-white shadow-elev3 outline-none',
          animate ? 'animate-spot-in' : '',
        ].join(' ')}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
