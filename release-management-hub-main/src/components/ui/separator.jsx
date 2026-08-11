import React from "react";

/** Separator - horizontal or vertical divider. Vendored verbatim from production. */
export const Separator = ({ className = "", orientation = "horizontal", ...props }) => {
  const orientationClass = orientation === "vertical" ? "h-full w-px" : "w-full h-px";
  return <div className={`bg-gray-200 ${orientationClass} ${className}`} {...props} />;
};

export default Separator;
