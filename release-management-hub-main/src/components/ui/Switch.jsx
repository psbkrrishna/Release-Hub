import React from "react";
import PropTypes from "prop-types";
import { Switch as HeadlessSwitch } from "@headlessui/react";
import { PiCheck, PiMinusBold } from "react-icons/pi";

/**
 * Switch Component. Vendored verbatim from
 * zm-manage-new-setting-development/src/components/ui/Switch.jsx.
 */
const Switch = ({
  checked = false,
  onChange,
  variant = "default",
  color = "blue",
  disabled = false,
  className = "",
  label = "",
  description = "",
  ...props
}) => {
  const baseClasses = [
    "group", "relative", "inline-flex", "flex-shrink-0", "rounded-full", "p-0",
    "transition-colors", "duration-200", "ease-in-out", "outline-none", "items-center",
    disabled ? "cursor-not-allowed" : "cursor-pointer",
  ];

  const variantClasses = {
    small: ["h-4", "w-8"],
    default: ["h-5", "w-10"],
    large: ["h-6", "w-12"],
  };

  const colorClasses = {
    blue: [checked ? "bg-blue-200" : "bg-gray-200"],
    green: [checked ? "bg-green-200" : "bg-gray-200"],
    purple: [checked ? "bg-purple-200" : "bg-gray-200"],
    teal: [checked ? "bg-teal-200" : "bg-gray-200"],
  };

  const stateClasses = [disabled && "opacity-50"].filter(Boolean);

  const thumbVariantClasses = {
    small: ["h-4", "w-4", "absolute", "left-0", "top-1/2", "-translate-y-1/2", checked ? "translate-x-4" : "translate-x-0"],
    default: ["h-5", "w-5", "absolute", "left-0", "top-1/2", "-translate-y-1/2", checked ? "translate-x-5" : "translate-x-0"],
    large: ["h-6", "w-6", "absolute", "left-0", "top-1/2", "-translate-y-1/2", checked ? "translate-x-6" : "translate-x-0"],
  };

  const thumbBaseClasses = [
    "pointer-events-none", "inline-block", "transform", "rounded-full", "shadow-lg", "ring-0",
    "transition-transform", "duration-200", "ease-in-out", "flex", "items-center", "justify-center",
  ];

  const thumbColorClasses = {
    blue: checked ? "bg-blue-500" : "bg-black",
    green: checked ? "bg-green-500" : "bg-black",
    purple: checked ? "bg-purple-500" : "bg-black",
    teal: checked ? "bg-teal-500" : "bg-black",
  };

  const iconVariantClasses = {
    small: ["w-2.5", "h-2.5"],
    default: ["w-3", "h-3"],
    large: ["w-4", "h-4"],
  };

  const iconColorClasses = {
    blue: "text-white font-black drop-shadow-sm scale-110 brightness-125 contrast-150",
    green: "text-white font-black drop-shadow-sm scale-110 brightness-125 contrast-150",
    purple: "text-white font-black drop-shadow-sm scale-110 brightness-125 contrast-150",
    teal: "text-white font-black drop-shadow-sm scale-110 brightness-125 contrast-150",
  };

  const combinedClasses = [...baseClasses, ...variantClasses[variant], ...colorClasses[color], ...stateClasses, className]
    .filter(Boolean).join(" ");
  const thumbClasses = [...thumbBaseClasses, ...thumbVariantClasses[variant], thumbColorClasses[color]]
    .filter(Boolean).join(" ");
  const iconClasses = [...iconVariantClasses[variant], iconColorClasses[color], "transition-colors", "duration-200"]
    .filter(Boolean).join(" ");

  const SwitchComponent = (
    <HeadlessSwitch checked={checked} onChange={onChange} disabled={disabled} className={combinedClasses} {...props}>
      <span aria-hidden="true" className={thumbClasses}>
        {checked ? <PiCheck className={iconClasses} /> : <PiMinusBold className={iconClasses} />}
      </span>
    </HeadlessSwitch>
  );

  if (!label && !description) return SwitchComponent;

  return (
    <div className="flex items-start">
      {SwitchComponent}
      <div className="ml-3">
        {label && <label className="text-sm font-medium text-grey-500">{label}</label>}
        {description && <p className="text-sm text-grey-300">{description}</p>}
      </div>
    </div>
  );
};

Switch.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(["small", "default", "large"]),
  color: PropTypes.oneOf(["blue", "green", "purple", "teal"]),
  disabled: PropTypes.bool,
  className: PropTypes.string,
  label: PropTypes.string,
  description: PropTypes.string,
};

export default Switch;
