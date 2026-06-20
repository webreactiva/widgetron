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
 */
export function Tooltip({ content, children, className }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  return (
    <span
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
          role="tooltip"
          id={id}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-left text-sm font-normal leading-snug text-popover-foreground shadow-wgt motion-safe:animate-wgt-fade-in"
        >
          {content}
        </span>
      )}
    </span>
  );
}

Tooltip.displayName = "Tooltip";
