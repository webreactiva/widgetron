import * as React from "react";

import { cn } from "@/lib/utils";
import { RichText } from "@/primitives/rich-text";

export interface TimelineItem {
  /** Optional timestamp/label shown muted before the title. */
  time?: React.ReactNode;
  title: React.ReactNode;
  /** When present, the item becomes a toggle that reveals this content. */
  description?: React.ReactNode;
  /** Optional icon rendered inside the marker dot. */
  icon?: React.ReactNode;
}

export interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  items: TimelineItem[];
  /** Indices to open initially. Default: none open. */
  defaultOpen?: number | number[];
  /** Allow more than one item open at a time. Default: true. */
  multiple?: boolean;
}

function toSet(defaultOpen: number | number[] | undefined): Set<number> {
  if (defaultOpen == null) return new Set<number>();
  return new Set<number>(
    Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen],
  );
}

/**
 * Timeline — a vertical sequence of milestones on a connector line. Each item
 * carries a marker dot; items with a `description` become a toggle button that
 * expands details on click (`aria-expanded`). Renders as a semantic `<ol>`; the
 * connector line and marker dots are purely decorative.
 */
export function Timeline({
  items,
  defaultOpen,
  multiple = true,
  className,
  ...props
}: TimelineProps) {
  const [open, setOpen] = React.useState<Set<number>>(() =>
    toSet(defaultOpen),
  );

  function toggle(index: number) {
    setOpen((prev) => {
      const next = multiple ? new Set(prev) : new Set<number>();
      if (prev.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <ol
      data-slot="timeline"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isOpen = open.has(index);
        const hasDescription = item.description != null;

        const marker = (
          <div aria-hidden className="flex flex-col items-center">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full border text-sm transition-colors",
                isOpen && hasDescription
                  ? "border-primary bg-primary text-primary-foreground shadow-wgt"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {item.icon}
            </span>
            {!isLast && <span className="w-px flex-1 bg-border" />}
          </div>
        );

        const header = (
          <p className="font-display font-semibold leading-tight">
            {item.time != null && (
              <span className="mr-2 text-xs font-normal tabular-nums text-muted-foreground">
                <RichText>{item.time}</RichText>
              </span>
            )}
            <RichText>{item.title}</RichText>
          </p>
        );

        return (
          <li
            key={index}
            className="flex gap-4 motion-safe:animate-wgt-fade-up"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            {marker}
            <div className={cn("min-w-0 pt-1", isLast ? "pb-0" : "pb-6")}>
              {hasDescription ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggle(index)}
                  className="w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {header}
                </button>
              ) : (
                header
              )}
              {hasDescription && isOpen && (
                <div className="mt-1 text-sm text-muted-foreground motion-safe:animate-wgt-fade-up">
                  <RichText>{item.description}</RichText>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

Timeline.displayName = "Timeline";
