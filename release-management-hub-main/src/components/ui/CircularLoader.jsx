import React from "react";
import PropTypes from "prop-types";

/** CircularLoader - reusable spinner. Vendored verbatim from production. */
const CircularLoader = ({ className = "", size = "md", title = "Loading..." }) => {
  const sizeClasses = { sm: "w-5 h-5 border-2", md: "w-8 h-8 border-4", lg: "w-12 h-12 border-4" };
  const resolvedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={title}
      className={["inline-block rounded-full animate-spin", "border-blue-100 border-b-blue-500", resolvedSize, className]
        .filter(Boolean).join(" ")}
    />
  );
};

CircularLoader.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  title: PropTypes.string,
};

export default CircularLoader;
