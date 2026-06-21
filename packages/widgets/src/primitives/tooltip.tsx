import * as React from "react";

import { cn } from "@/lib/utils";

export interface TooltipProps {
  /** The popover content. */
  content: React.ReactNode;
  /** The trigger (should be focusable for keyboard users — e.g. a button). */
  children: React.ReactNode;
  /** Extra classes for the inline wrapper. */
  className?: string;
}

/**
 * Tooltip — a small accessible popover shown on hover, focus, or tap. Inline and
 * composable: wrap any focusable trigger. Closes on Escape / blur / pointer
 * leave. Uses the popover theme tokens.
 *
 * Positioning: the tooltip is centered on the trigger by default, but on small
 * viewports it shifts so it never overflows the window horizontally — measured
 * with a layout effect while open.
 */
export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [shift, setShift] = React.useState(0);
  const id = React.useId();
  const wrapperRef = React.useRef<HTMLSpanElement>(null);
  const tipRef = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    if (!open) return;
    const wrapper = wrapperRef.current;
    const tip = tipRef.current;
    if (!wrapper || !tip) return;
    const win = wrapper.ownerDocument.defaultView;
    if (!win) return;
    const margin = 8;
    const wRect = wrapper.getBoundingClientRect();
    const tRect = tip.getBoundingClientRect();
    const vw = win.innerWidth;
    const tipLeft = wRect.left + wRect.width / 2 - tRect.width / 2;
    const tipRight = tipLeft + tRect.width;
    let nextShift = 0;
    if (tipLeft < margin) nextShift = margin - tipLeft;
    else if (tipRight > vw - margin) nextShift = vw - margin - tipRight;
    setShift(nextShift);
  }, [open]);

  return (
    <span
      ref={wrapperRef}
      className={cn("relative inline-block", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && (
        <span
          ref={tipRef}
          role="tooltip"
          id={id}
          style={{ transform: `translate(calc(-50% + ${shift}px), 0)` }}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs rounded-md border bg-popover px-3 py-2 text-left text-sm font-normal leading-snug text-popover-foreground shadow-wgt motion-safe:animate-wgt-fade-in"
        >
          {content}
        </span>
      )}
    </span>
  );
}

Tooltip.displayName = "Tooltip";
