import React from "react";
import PropTypes from "prop-types";

/**
 * Badge component for displaying status indicators and labels
 * Vendored verbatim from zm-manage-new-setting-development/src/components/ui/Badge.jsx
 */
const Badge = ({
  variant = "base",
  text = "",
  backgroundColor = "bg-gray-100",
  textColor = "text-gray-700",
  className = "",
  children,
  ...props
}) => {
  const baseClasses = [
    "inline-flex", "items-center", "justify-center", "px-2", "py-1",
    "text-xs", "font-medium", "leading-4", "rounded-lg", "whitespace-nowrap",
    "focus:outline-none",
  ];

  const variantClasses = {
    yellow: ["bg-[#FBF6E8]", "text-[#99770F]"],
    mediumYellow: ["bg-[#D8A715]", "text-[#FFFFFF]"],
    lightYellow: ["bg-[#FBF6E8]", "text-[#99770F]"],
    darkyellow: ["bg-[#99770F]", "text-[#FFFFFF]"],
    blue: ["bg-[#E7EEF6]", "text-[#07315A]"],
    green: ["bg-[#EBF4EC]", "text-[#1F4E21]"],
    red: ["bg-[#FCEBEB]", "text-[#7B2020]"],
    purple: ["bg-[#FCEBFF]", "text-[#3A0143]"],
    base: [backgroundColor, textColor],
  };

  const combinedClasses = [...baseClasses, ...(variantClasses[variant] || variantClasses.base), className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={combinedClasses} {...props}>
      {children || text}
    </span>
  );
};

Badge.propTypes = {
  variant: PropTypes.oneOf(["yellow", "lightYellow", "mediumYellow", "darkyellow", "blue", "green", "red", "purple", "base"]),
  text: PropTypes.string,
  backgroundColor: PropTypes.string,
  textColor: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default Badge;
