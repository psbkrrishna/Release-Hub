import React, { useMemo, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from "@headlessui/react";
import { PiCaretDown, PiCheck } from "react-icons/pi";

/**
 * Select - Headless UI Listbox-based select with unified API.
 * Vendored verbatim from zm-manage-new-setting-development/src/components/ui/Select.jsx
 * (the flat `options=[{value,label}]` barrel Select - NOT select-headless.jsx's
 * compound Radix-style API, which is a different, incompatible component
 * that happens to share the same name elsewhere in that codebase).
 * - Emits synthetic event compatible with form handlers: onChange({ target: { name, value } })
 * - Fully controlled via `value`, unlike Input.jsx.
 */
const Select = ({
  name,
  id,
  value = "",
  onChange,
  options = [],
  placeholder = "Select",
  disabled = false,
  required = false,
  className = "",
  error = false,
}) => {
  const buttonRef = useRef(null);

  const handleArrowMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (buttonRef.current) buttonRef.current.click();
  }, []);

  const baseClasses = [
    "w-full", "bg-white", "text-base", "font-medium", "text-zinc-900",
    "transition-colors", "duration-200", "focus:outline-none", "placeholder:text-grey-2000",
  ];

  const variantClasses = {
    default: [
      "border", error ? "border-red-500" : "border-zinc-300", "rounded-md",
      error ? "hover:border-red-500" : "hover:border-zinc-400",
      error ? "focus:border-red-500" : "focus:border-zinc-400",
      "bg-white",
    ],
  };

  const sizeClasses = { default: ["p-3"] };
  const stateClasses = [disabled && "opacity-50 cursor-not-allowed"].filter(Boolean);

  const combinedButtonClasses = [
    ...baseClasses, ...variantClasses.default, ...sizeClasses.default, ...stateClasses, className,
  ].filter(Boolean).join(" ");

  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found?.label ?? "";
  }, [options, value]);

  const handleChange = (val) => {
    if (onChange) onChange({ target: { name, value: val } });
  };

  return (
    <div className="relative">
      <input type="hidden" name={name} id={id} value={value} required={required} readOnly />

      <Listbox value={value} onChange={handleChange} disabled={disabled}>
        <div className="relative">
          <ListboxButton className={combinedButtonClasses} id={id} ref={buttonRef} aria-required={required}>
            <span className={`block truncate text-left ${selectedLabel ? "text-zinc-900" : "text-grey-2000"}`}>
              {selectedLabel || placeholder}
            </span>
            <span
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onMouseDown={handleArrowMouseDown}
              aria-hidden="true"
            >
              <PiCaretDown className="h-5 w-5 text-grey-300 font-semibold" />
            </span>
          </ListboxButton>

          <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-gray-200 shadow-sm focus:outline-none">
            {options.map((opt) => (
              <ListboxOption
                key={opt.value}
                value={opt.value}
                className={({ active }) =>
                  ["px-4 py-2 cursor-pointer select-none flex items-center justify-between", active ? "bg-blue-50" : ""]
                    .filter(Boolean).join(" ")
                }
              >
                {({ selected }) => (
                  <>
                    <span className="text-sm text-zinc-900">{opt.label}</span>
                    {selected ? <PiCheck className="h-4 w-4 text-blue-600" /> : null}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
};

Select.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  error: PropTypes.bool,
};

export default Select;
