import React from "react";
import PropTypes from "prop-types";
import { Menu as HeadlessMenu, MenuButton, MenuItem, MenuItems, Portal } from "@headlessui/react";
import { PiCaretDownFill, PiCheck } from "react-icons/pi";

/**
 * Menu - labeled dropdown button (used internally by Pagination.jsx's
 * per-page selector). Vendored verbatim from production.
 */
const Menu = ({ buttonText, items = [], variant = "default", disabled = false, className = "", dropdownWidth = "w-56", ...props }) => {
  const baseClasses = [
    "inline-flex", "items-center", "justify-center", "font-medium", "text-base",
    "h-9", "p-1", "rounded", "transition-all", "duration-200", "focus:outline-none",
  ];

  const variantClasses = {
    default: ["bg-white", "text-blue-600", "border", "border-blue-600", "hover:bg-blue-50", "hover:border-blue-700"],
    bordered: ["bg-transparent", "text-blue-600", "border", "border-blue-600", "hover:bg-blue-600", "hover:text-white"],
    base: [],
  };

  const stateClasses = [disabled ? "opacity-50 cursor-not-allowed" : ""];
  const combinedClasses = [...baseClasses, ...variantClasses[variant], ...stateClasses, className].filter(Boolean).join(" ");

  const menuClasses = [dropdownWidth, "bg-white", "border", "border-gray-200", "rounded-md", "shadow-lg", "ring-1", "ring-black", "ring-opacity-5", "z-50", "py-1", "focus:outline-none"]
    .filter(Boolean).join(" ");

  return (
    <HeadlessMenu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className={combinedClasses} disabled={disabled} {...props}>
          <span>{buttonText}</span>
          <PiCaretDownFill className="w-4 h-4 ml-1" />
        </MenuButton>
      </div>

      <Portal>
        <MenuItems anchor="bottom end" className={menuClasses}>
          <div className="py-1">
            {items.map((item, index) => (
              <MenuItem key={index} disabled={item.disabled}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    disabled={item.disabled}
                    className={`${active ? "bg-gray-100 text-grey-300" : "text-gray-700"} group flex w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:outline-none transition-colors duration-150 ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {item.selected ? <PiCheck className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" /> : <span className="w-4 h-4 mr-3 flex-shrink-0" />}
                    {item.icon && <span className="mr-3 flex-shrink-0">{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Portal>
    </HeadlessMenu>
  );
};

Menu.propTypes = {
  buttonText: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string.isRequired, onClick: PropTypes.func.isRequired, disabled: PropTypes.bool, icon: PropTypes.element, selected: PropTypes.bool }),
  ),
  variant: PropTypes.oneOf(["default", "bordered", "base"]),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  dropdownWidth: PropTypes.string,
};

export default Menu;
