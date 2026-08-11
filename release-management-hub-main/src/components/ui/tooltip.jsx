import React, { useState, useRef, useLayoutEffect, createContext, useContext } from "react";
import { createPortal } from "react-dom";

/** Tooltip system. Vendored verbatim from production - self-contained,
 *  no Headless UI dependency, positions itself via a portal + getBoundingClientRect. */
const TooltipContext = createContext({});

export function TooltipProvider({ children }) {
  return <>{children}</>;
}

export function Tooltip({ children }) {
  const [open, setOpen] = useState(false);
  const [triggerRect, setTriggerRect] = useState(null);
  const triggerRef = useRef(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) setTriggerRect(triggerRef.current.getBoundingClientRect());
    setOpen(true);
  };

  return (
    <TooltipContext.Provider value={{ open, triggerRect }}>
      <div ref={triggerRef} className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={() => setOpen(false)}>
        {children}
      </div>
    </TooltipContext.Provider>
  );
}

export function TooltipTrigger({ asChild, children, className = "" }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: `${children.props.className || ""} ${className}`.trim(),
      "data-tooltip-trigger": true,
    });
  }
  return <span className={`inline-block ${className}`} data-tooltip-trigger="true">{children}</span>;
}

export function TooltipContent({ children, className = "", side = "top" }) {
  const { open, triggerRect } = useContext(TooltipContext);
  const viewportMargin = 8;
  const arrowSize = 4;
  const contentRef = useRef(null);
  const [positionState, setPositionState] = useState({
    style: {
      position: "fixed", zIndex: 9999, pointerEvents: "none",
      maxWidth: `calc(100vw - ${viewportMargin * 2}px)`,
      maxHeight: `calc(100vh - ${viewportMargin * 2}px)`,
      top: viewportMargin, left: viewportMargin,
    },
    resolvedSide: side,
  });

  useLayoutEffect(() => {
    if (!open || !triggerRect || !contentRef.current) return;

    const updatePosition = () => {
      if (!contentRef.current) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const { width, height } = contentRef.current.getBoundingClientRect();
      const gap = viewportMargin + arrowSize;

      const fitsTop = triggerRect.top >= height + gap + viewportMargin;
      const fitsBottom = vh - triggerRect.bottom >= height + gap + viewportMargin;
      const fitsLeft = triggerRect.left >= width + gap + viewportMargin;
      const fitsRight = vw - triggerRect.right >= width + gap + viewportMargin;

      let resolvedSide = side;
      if (side === "top" && !fitsTop && fitsBottom) resolvedSide = "bottom";
      if (side === "bottom" && !fitsBottom && fitsTop) resolvedSide = "top";
      if (side === "left" && !fitsLeft && fitsRight) resolvedSide = "right";
      if (side === "right" && !fitsRight && fitsLeft) resolvedSide = "left";

      let top = viewportMargin;
      let left = viewportMargin;

      if (resolvedSide === "top" || resolvedSide === "bottom") {
        left = triggerRect.left + triggerRect.width / 2 - width / 2;
        left = Math.min(Math.max(left, viewportMargin), vw - width - viewportMargin);
      }
      if (resolvedSide === "left" || resolvedSide === "right") {
        top = triggerRect.top + triggerRect.height / 2 - height / 2;
        top = Math.min(Math.max(top, viewportMargin), vh - height - viewportMargin);
      }
      if (resolvedSide === "top") top = Math.max(triggerRect.top - height - gap, viewportMargin);
      else if (resolvedSide === "bottom") top = Math.min(triggerRect.bottom + gap, vh - height - viewportMargin);
      else if (resolvedSide === "left") left = Math.max(triggerRect.left - width - gap, viewportMargin);
      else if (resolvedSide === "right") left = Math.min(triggerRect.right + gap, vw - width - viewportMargin);

      setPositionState({
        style: {
          position: "fixed", zIndex: 9999, pointerEvents: "none",
          maxWidth: `calc(100vw - ${viewportMargin * 2}px)`,
          maxHeight: `calc(100vh - ${viewportMargin * 2}px)`,
          top, left,
        },
        resolvedSide,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, triggerRect, side]);

  const forceNoWrap = className.includes("whitespace-nowrap");
  const whitespaceClass = forceNoWrap ? "whitespace-nowrap" : "whitespace-normal";

  if (!open || !triggerRect) return null;

  return createPortal(
    <div
      className={`px-3 py-1.5 text-sm text-white bg-gray-900 rounded-md shadow-lg ${whitespaceClass} ${className}`}
      style={positionState.style}
      ref={contentRef}
      role="tooltip"
    >
      {children}
      <div
        className={`absolute w-2 h-2 bg-gray-900 rotate-45
          ${positionState.resolvedSide === "top" ? "bottom-[-4px] left-1/2 -translate-x-1/2" : ""}
          ${positionState.resolvedSide === "bottom" ? "top-[-4px] left-1/2 -translate-x-1/2" : ""}
          ${positionState.resolvedSide === "left" ? "right-[-4px] top-1/2 -translate-y-1/2" : ""}
          ${positionState.resolvedSide === "right" ? "left-[-4px] top-1/2 -translate-y-1/2" : ""}`}
      />
    </div>,
    document.body,
  );
}

export function SimpleTooltip({ text, children, side = "top" }) {
  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent side={side}>{text}</TooltipContent>
    </Tooltip>
  );
}

export default Tooltip;
