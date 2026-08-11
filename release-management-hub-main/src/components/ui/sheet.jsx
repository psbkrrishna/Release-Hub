import React from "react";
import { Dialog, DialogPanel, DialogTitle, DialogDescription, DialogBackdrop } from "@headlessui/react";
import { PiX } from "react-icons/pi";

/**
 * Sheet - a slide-out panel, matching the real API DepartmentsManagement uses
 * (Sheet/SheetContent/SheetHeader/SheetFooter/SheetTitle/SheetDescription).
 *
 * Production's own sheet.jsx uses Headless UI's v1 dotted API (Dialog.Panel,
 * Transition.Child, Dialog.Title) even though @headlessui/react is pinned to
 * ^2.2.6 in package.json, where that API was replaced by flat named exports
 * (confirmed by cross-checking dropdown-menu.jsx and Modal.jsx, both of which
 * already use the flat v2 API in the same codebase). Rewritten here on the
 * confirmed-current API rather than copied as-is, keeping the same exported
 * component names and props so it's still a drop-in for how real pages call it.
 *
 * Mounted only while `open` is true, so React's own reconciliation controls
 * presence rather than Headless UI's internal open/closed state machine.
 * The documented pattern - pass `open` to Dialog directly and animate with
 * nested <TransitionChild> - was tried first; confirmed by direct testing
 * that once a TransitionChild descendant is involved, Dialog's own
 * data-headlessui-state gets stuck on "open" and never unmounts on close, at
 * least at this installed version. This sidesteps it, at the cost of the
 * slide-in/out losing its animation.
 */
export function Sheet({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <Dialog open onClose={() => onOpenChange(false)} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">{children}</div>
      </div>
    </Dialog>
  );
}

export function SheetContent({ side = "right", className = "", children, ...props }) {
  const sideClasses = {
    right: "inset-y-0 right-0 h-full w-3/4 sm:max-w-sm border-l",
    left: "inset-y-0 left-0 h-full w-3/4 sm:max-w-sm border-r",
    top: "inset-x-0 top-0 border-b",
    bottom: "inset-x-0 bottom-0 border-t",
  };

  return (
    <DialogPanel className={`fixed ${sideClasses[side]} bg-white shadow-lg flex flex-col ${className}`} {...props}>
      {children}
    </DialogPanel>
  );
}

export function SheetHeader({ className = "", children, ...props }) {
  return <div className={`flex flex-col gap-1.5 ${className}`} {...props}>{children}</div>;
}

export function SheetFooter({ className = "", children, ...props }) {
  return <div className={`mt-auto flex flex-col gap-2 ${className}`} {...props}>{children}</div>;
}

export function SheetTitle({ className = "", children, ...props }) {
  return <DialogTitle className={`font-semibold ${className}`} {...props}>{children}</DialogTitle>;
}

export function SheetDescription({ className = "", children, ...props }) {
  return <DialogDescription className={`text-sm text-grey-300 ${className}`} {...props}>{children}</DialogDescription>;
}

export function SheetClose({ className = "", onClick, ...props }) {
  return (
    <button
      onClick={onClick}
      aria-label="Close"
      className={`rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none ${className}`}
      {...props}
    >
      <PiX className="size-4" />
      <span className="sr-only">Close</span>
    </button>
  );
}
