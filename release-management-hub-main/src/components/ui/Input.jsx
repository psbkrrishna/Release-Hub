import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Input as HeadlessInput } from "@headlessui/react";

/**
 * Unified Input component with icon support and optional debouncing.
 * Vendored verbatim from zm-manage-new-setting-development/src/components/ui/Input.jsx.
 *
 * NOTE this is genuinely uncontrolled: it seeds internal state from
 * `defaultValue` at mount and ignores any `value` prop thereafter (this
 * matches how production itself uses it). Callers that need the field to
 * reset per record (e.g. an edit form reused across different rows) must
 * remount the field - e.g. `key={feature?.id ?? 'new'}` on the parent -
 * rather than expect `defaultValue` to update reactively.
 */
const Input = ({
  placeholder = "",
  defaultValue = "",
  onChange,
  onDebouncedChange,
  debounceDelay = 300,
  disabled = false,
  className = "",
  variant = "default",
  size = "default",
  leftIcon = null,
  rightIcon = null,
  error = false,
  ...props
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (!onDebouncedChange) return;
    const timer = setTimeout(() => onDebouncedChange(value), debounceDelay);
    return () => clearTimeout(timer);
  }, [value, debounceDelay, onDebouncedChange]);

  const handleInputChange = useCallback(
    (event) => {
      setValue(event.target.value);
      if (onChange) onChange(event);
    },
    [onChange],
  );

  const baseClasses = [
    "w-full", "bg-transparent", "text-base", "font-medium", "leading-6",
    "text-zinc-900", "placeholder:text-[#999]", "transition-colors", "duration-200",
    "focus:outline-none",
  ];

  const variantClasses = {
    default: [
      "border", error ? "border-red-500" : "border-zinc-300", "rounded-lg",
      error ? "focus:border-red-500" : "focus:border-zinc-400",
      error ? "hover:border-red-500" : "hover:border-zinc-400",
    ],
    bordered: [
      "border-2", error ? "border-red-500" : "border-zinc-300", "rounded-lg",
      error ? "focus:border-red-500" : "focus:border-blue-500",
      error ? "hover:border-red-500" : "hover:border-zinc-400",
    ],
  };

  const sizeClasses = { default: ["h-10", "px-3", "py-2"] };
  const stateClasses = [disabled && "opacity-50 cursor-not-allowed"].filter(Boolean);

  const combinedClasses = [
    ...baseClasses, ...variantClasses[variant], ...sizeClasses[size || "default"], ...stateClasses, className,
  ].filter(Boolean).join(" ");

  if (leftIcon || rightIcon) {
    const containerClasses = [
      "flex", "items-center", "gap-2", "px-3", "rounded-lg", "border",
      error ? "border-red-500" : "border-zinc-300", "bg-white",
      error ? "focus-within:border-red-500" : "focus-within:border-blue-500",
      "transition-colors", "duration-200",
      ...sizeClasses[size || "default"],
      disabled && "opacity-50 cursor-not-allowed",
      className,
    ].filter(Boolean).join(" ");

    const inputClasses = [...baseClasses, "border-0", "bg-transparent", "focus:ring-0", "p-0", "flex-1"]
      .filter(Boolean).join(" ");

    return (
      <div className={containerClasses}>
        {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <HeadlessInput
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </div>
    );
  }

  return (
    <HeadlessInput
      type="text"
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      disabled={disabled}
      className={combinedClasses}
      {...props}
    />
  );
};

Input.propTypes = {
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  onDebouncedChange: PropTypes.func,
  debounceDelay: PropTypes.number,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "bordered"]),
  size: PropTypes.oneOf(["default", "compact"]),
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  error: PropTypes.bool,
};

export default Input;
