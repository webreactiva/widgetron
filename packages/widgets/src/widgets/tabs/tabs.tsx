import * as React from "react";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText } from "@/primitives/rich-text";

export interface TabItem {
  /** Tab button text. */
  label: React.ReactNode;
  /** Optional icon shown before the label. */
  icon?: React.ReactNode;
  /** What the panel shows — text, or any nested widget. */
  content: React.ReactNode;
}

export interface TabsLabels {
  /** Accessible name for the tab strip. */
  tablist: string;
}

export const DEFAULT_TABS_LABELS: TabsLabels = {
  tablist: "Variants",
};

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The tabs, in display order. */
  items: TabItem[];
  /** Which tab opens first (0-based). Default: 0. */
  defaultIndex?: number;
  /** Customizable / translatable strings. */
  labels?: Partial<TabsLabels>;
}

/**
 * Tabs — one slot, several equivalent versions of the same content: npm /
 * pnpm / yarn, JavaScript / TypeScript, the three ways to solve it. The reader
 * picks the one that applies to them instead of scrolling past two thirds of
 * irrelevant material.
 *
 * Panels hold anything, including other widgets, so a tab can be a whole
 * code-translation or quiz. Follows the WAI-ARIA tabs pattern: arrow keys move
 * between tabs, Home/End jump to the ends, and only the active tab is tabbable.
 * Inactive panels stay mounted but hidden, so state inside them survives a
 * switch.
 */
export function Tabs({
  items,
  defaultIndex = 0,
  labels,
  className,
  ...props
}: TabsProps) {
  const l = useLabels("tabs", DEFAULT_TABS_LABELS, labels);
  const { ref, emit } = useWidgetEvents("tabs");
  const baseId = React.useId();
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const [active, setActive] = React.useState(() =>
    Math.min(Math.max(defaultIndex, 0), Math.max(items.length - 1, 0)),
  );

  function select(index: number, focus = false) {
    setActive(index);
    emit("tab_changed", { index });
    if (focus) tabRefs.current[index]?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const last = items.length - 1;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = active === last ? 0 : active + 1;
    else if (event.key === "ArrowLeft") next = active === 0 ? last : active - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next == null) return;
    event.preventDefault();
    select(next, true);
  }

  return (
    <div
      ref={ref}
      data-slot="tabs"
      className={cn(
        "@container/tabs overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <div
        role="tablist"
        aria-label={l.tablist}
        className="flex overflow-x-auto border-b bg-muted/40"
      >
        {items.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={index}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(index)}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex min-h-11 shrink-0 cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                selected
                  ? "border-primary bg-card text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {item.icon != null && (
                <span aria-hidden className="shrink-0 [&_svg]:size-4">
                  {item.icon}
                </span>
              )}
              <RichText>{item.label}</RichText>
            </button>
          );
        })}
      </div>

      {items.map((item, index) => (
        <div
          key={index}
          role="tabpanel"
          id={`${baseId}-panel-${index}`}
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={index !== active}
          tabIndex={0}
          className="p-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-6"
        >
          <RichText>{item.content}</RichText>
        </div>
      ))}
    </div>
  );
}

Tabs.displayName = "Tabs";
