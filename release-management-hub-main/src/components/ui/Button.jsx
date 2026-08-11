import React from "react";
import PropTypes from "prop-types";
import { Button as HeadlessButton } from "@headlessui/react";

/**
 * Button Component
 * Unified button with variants, icons, and configurable positioning
 * Vendored verbatim from zm-manage-new-setting-development/src/components/ui/Button.jsx
 */
const Button = ({
  variant = "primary",
  icon = null,
  iconPosition = "left",
  iconOnly = false,
  disabled = false,
  className = "",
  onClick,
  children,
  ...props
}) => {
  const baseClasses = ["inline-flex", "font-medium", "text-base", "transition-all", "duration-200", "focus:outline-none"];

  const variantClasses = {
    base: [],
    primary: [
      "bg-blue-600", "text-white", "border", "border-blue-600", "hover:bg-blue-700",
      "rounded-lg", "items-center", "justify-center", "gap-2",
      ...(iconOnly ? ["p-1"] : ["px-4", "py-2"]),
    ],
    secondary: [
      "bg-transparent", "text-blue-600", "border", "border-blue-600",
      "hover:bg-blue-600", "hover:text-white", "rounded-lg", "items-center", "justify-center", "gap-2",
      ...(iconOnly ? ["p-1"] : ["px-4", "py-2"]),
    ],
    gradient: [
      "bg-gradient-to-r", "from-blue-500", "to-green-500", "text-white",
      "hover:from-blue-600", "hover:to-green-600", "rounded-lg", "items-center", "justify-center", "gap-2",
      ...(iconOnly ? ["p-1"] : ["px-4", "py-2"]),
    ],
  };

  const stateClasses = [
    disabled && "bg-[#e9e9e9] text-grey-300 cursor-not-allowed border-none shadow-none",
  ].filter(Boolean);

  const combinedClasses = [...baseClasses, ...variantClasses[variant], ...stateClasses, className]
    .filter(Boolean)
    .join(" ");

  return (
    <HeadlessButton className={combinedClasses} disabled={disabled} onClick={onClick} {...props}>
      {icon && iconPosition === "left" && <span className="inline-flex">{icon}</span>}
      {!iconOnly && children}
      {icon && iconPosition === "right" && <span className="inline-flex ml-2">{icon}</span>}
    </HeadlessButton>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(["base", "primary", "secondary", "gradient"]),
  icon: PropTypes.element,
  iconPosition: PropTypes.oneOf(["left", "right"]),
  iconOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
};

export default Button;
