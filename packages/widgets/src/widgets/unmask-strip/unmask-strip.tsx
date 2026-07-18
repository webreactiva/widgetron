import * as React from "react";

import { cn } from "@/lib/utils";
import { RichText } from "@/primitives/rich-text";

export interface UnmaskStripProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** Real image URL (same rule as figure: no invented assets). */
  src: string;
  /** Describe the image; "" if purely atmospheric. */
  alt?: string;
  /** Which edge the wipe reveals from. Default: "left". */
  direction?: "left" | "right" | "up" | "down";
  /** object-position, e.g. "50% 30%". */
  focal?: string;
  /** CSS aspect-ratio for the strip. Default: "16 / 9". */
  aspectRatio?: string;
  /** Optional caption below the strip. */
  caption?: React.ReactNode;
}

/**
 * UnmaskStrip — an image that wipes into view behind a moving clip-path edge as
 * it scrolls in. Pure CSS scroll-driven animation (a `clip-path: inset()` wipe
 * on a `view-timeline`, see `[data-slot="unmask-strip"]` in theme.css); zero
 * deps. The resting state is the fully revealed image, so browsers without
 * scroll-driven animations and readers with reduced motion just see the picture
 * — only the wipe is gated.
 */
export function UnmaskStrip({
  src,
  alt = "",
  direction = "left",
  focal,
  aspectRatio = "16 / 9",
  caption,
  className,
  ...props
}: UnmaskStripProps) {
  return (
    <figure
      data-slot="unmask-strip"
      data-dir={direction}
      className={cn("@container m-0", className)}
      {...props}
    >
      <div className="overflow-hidden rounded-lg border" style={{ aspectRatio }}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="wgt-unmask-media h-full w-full object-cover"
          style={focal ? { objectPosition: focal } : undefined}
        />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-sm text-muted-foreground">
          <RichText>{caption}</RichText>
        </figcaption>
      ) : null}
    </figure>
  );
}

UnmaskStrip.displayName = "UnmaskStrip";
