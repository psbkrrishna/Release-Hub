import React from "react";

/** Textarea - Simple HTML textarea wrapper. Vendored verbatim from production. */
export const Textarea = ({ className = "", ...props }) => (
  <textarea
    className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    {...props}
  />
);

export default Textarea;
