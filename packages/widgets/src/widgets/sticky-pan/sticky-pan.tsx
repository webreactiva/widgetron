import * as React from "react";

import { cn } from "@/lib/utils";
import { RichText } from "@/primitives/rich-text";

export interface StickyPanPanel {
  /** Real image URL for the panel background (optional). */
  image?: string;
  alt?: string;
  /** object-position for the image, e.g. "50% 30%". */
  focal?: string;
  /** Text laid over / inside the panel. */
  content?: React.ReactNode;
}

export interface StickyPanProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** The panels laid out left-to-right; 3–6 is the sweet spot. */
  panels: StickyPanPanel[];
}

/**
 * StickyPan — a horizontal filmstrip that pans sideways as the reader scrolls
 * down. The section pins to the viewport and its track translates on a
 * scroll-driven timeline (see `[data-slot="sticky-pan"]` in theme.css); pure
 * CSS, zero deps. Where scroll-driven animations aren't available (or under
 * reduced motion) it degrades to a normal swipeable horizontal strip — the
 * panels stay fully reachable, just without the pin-and-pan. Inside a storyline
 * it pins against the reading pane (a size container); standalone it falls back
 * to the viewport.
 */
export function StickyPan({ panels, className, ...props }: StickyPanProps) {
  return (
    <section
      data-slot="sticky-pan"
      className={cn(className)}
      style={{ "--wgt-pan-count": panels.length } as React.CSSProperties}
      {...props}
    >
      <div className="wgt-pan-view @container">
        <div className="wgt-pan-track flex h-full">
          {panels.map((panel, i) => (
            <div
              key={i}
              className={cn(
                "wgt-pan-panel relative flex h-full w-[86cqw] shrink-0 snap-center overflow-hidden rounded-lg border bg-card",
                // Image panels: caption overlaid at the bottom. Text-only panels:
                // centered, so a single beat reads as a deliberate statement card
                // instead of a line stranded at the bottom of an empty box.
                panel.image ? "items-end" : "items-center justify-center",
              )}
            >
              {panel.image ? (
                <img
                  src={panel.image}
                  alt={panel.alt ?? ""}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={panel.focal ? { objectPosition: panel.focal } : undefined}
                />
              ) : null}
              {panel.content ? (
                <div
                  className={cn(
                    "relative z-10 max-w-prose leading-relaxed",
                    panel.image
                      ? "m-4 rounded-md bg-card/85 p-4 text-base text-card-foreground backdrop-blur"
                      : "p-8 text-center text-lg text-card-foreground @md:text-xl",
                  )}
                >
                  <RichText>{panel.content}</RichText>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

StickyPan.displayName = "StickyPan";
