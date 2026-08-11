import React from "react";
import { Dialog, DialogPanel, DialogTitle, DialogDescription, DialogBackdrop } from "@headlessui/react";

/**
 * AlertDialog - confirmation dialog. Same rewrite rationale as sheet.jsx:
 * production's alert-dialog.jsx uses the stale Headless UI v1 dotted API
 * (HeadlessDialog.Panel/.Title/.Description); rewritten on the confirmed-
 * current flat v2 API, same exported names/props.
 *
 * Mounted only while `open` is true - see sheet.jsx for why: `open` on
 * Dialog plus a nested TransitionChild (the documented pattern) left
 * Headless UI's own state stuck "open" and the dialog never unmounted,
 * confirmed by direct testing at this installed version.
 */
export function AlertDialog({ open, onOpenChange, children }) {
  if (!open) return null;
  return (
    <Dialog open onClose={() => onOpenChange(false)} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">{children}</div>
    </Dialog>
  );
}

export function AlertDialogContent({ className = "", children, ...props }) {
  return (
    <DialogPanel className={`relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 ${className}`} {...props}>
      {children}
    </DialogPanel>
  );
}

export function AlertDialogHeader({ className = "", children, ...props }) {
  return <div className={`flex flex-col gap-2 mb-4 ${className}`} {...props}>{children}</div>;
}

export function AlertDialogFooter({ className = "", children, ...props }) {
  return <div className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6 ${className}`} {...props}>{children}</div>;
}

export function AlertDialogTitle({ className = "", children, ...props }) {
  return <DialogTitle className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>{children}</DialogTitle>;
}

export function AlertDialogDescription({ className = "", children, ...props }) {
  return <DialogDescription className={`text-sm text-gray-600 ${className}`} {...props}>{children}</DialogDescription>;
}

export function AlertDialogAction({ className = "", children, onClick, ...props }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ className = "", children, onClick, ...props }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold bg-white text-grey-500 border border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
