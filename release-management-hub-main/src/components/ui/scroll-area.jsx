import React from "react";

/** ScrollArea - a simple scrollable container. Vendored verbatim from production. */
export function ScrollArea({ className = "", children, ...props }) {
  return (
    <div className={`overflow-auto ${className}`} {...props}>
      {children}
    </div>
  );
}

export default ScrollArea;
