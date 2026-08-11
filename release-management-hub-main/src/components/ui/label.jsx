import React from "react";

/** Label - Simple HTML label wrapper. Vendored verbatim from production. */
export const Label = ({ className = "", children, ...props }) => (
  <label className={className} {...props}>
    {children}
  </label>
);

export default Label;
