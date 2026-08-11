import React, { Fragment } from "react";
import { Menu as HeadlessMenu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

/**
 * DropdownMenu - compound wrapper over Headless UI v2's Menu.
 * Vendored verbatim from zm-manage-new-setting-development. `anchor` on
 * MenuItems makes Headless UI position (and portal) the panel itself, which
 * is what keeps a row-action menu from being clipped by a scrolling ancestor
 * - the exact bug this app's own ag-grid actions column needs to avoid.
 */
export function DropdownMenu({ children }) {
  return <HeadlessMenu as="div" className="relative inline-block text-left">{children}</HeadlessMenu>;
}

export function DropdownMenuTrigger({ asChild, children, className = "" }) {
  if (asChild && React.isValidElement(children)) {
    return <MenuButton as={Fragment}>{children}</MenuButton>;
  }
  return <MenuButton className={className}>{children}</MenuButton>;
}

export function DropdownMenuContent({ align = "end", className = "", children, ...props }) {
  return (
    <MenuItems
      anchor={align === "start" ? "bottom start" : "bottom end"}
      className={`z-50 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200 ${className}`}
      {...props}
    >
      <div className="py-1">{children}</div>
    </MenuItems>
  );
}

export function DropdownMenuItem({ className = "", onSelect, disabled = false, children, ...props }) {
  return (
    <MenuItem disabled={disabled}>
      {({ active }) => (
        <button
          onClick={onSelect}
          className={`
            ${active ? "bg-gray-100 text-grey-500" : "text-gray-700"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            group flex w-full items-center px-4 py-2 text-sm text-left
            ${className}
          `}
          disabled={disabled}
          {...props}
        >
          {children}
        </button>
      )}
    </MenuItem>
  );
}

export function DropdownMenuSeparator({ className = "" }) {
  return <div className={`my-1 h-px bg-gray-200 ${className}`} />;
}

export function DropdownMenuLabel({ className = "", children }) {
  return (
    <div className={`px-4 py-2 text-xs font-semibold text-grey-300 uppercase tracking-wider ${className}`}>
      {children}
    </div>
  );
}

export function DropdownMenuGroup({ children }) {
  return <div>{children}</div>;
}

export default DropdownMenu;
