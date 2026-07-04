import * as React from "react";

import { cn } from "@/lib/utils";
import { RichText } from "@/primitives/rich-text";

export interface FigureProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** Image URL. There is no asset pipeline — reference the image by URL. */
  src: string;
  /**
   * Alt text describing the image for screen readers. Use an empty string only
   * for purely decorative images that add nothing beyond the caption.
   */
  alt: string;
  /** Caption shown under the image. */
  caption?: React.ReactNode;
  /** Source / attribution line, shown muted under the caption. */
  credit?: React.ReactNode;
  /** Link to the image's source; the image opens it in a new tab. */
  href?: string;
  /** CSS aspect ratio to crop the frame to, e.g. "16/9". Omit to size to the image. */
  aspect?: string;
  /** How the image fills the frame when `aspect` is set. Default: "cover". */
  fit?: "contain" | "cover";
}

/**
 * Figure — a standalone image with an optional caption and source credit. It
 * references the image by URL (there is no asset upload), lazy-loads it, and
 * renders a real <figure>/<figcaption>. With `aspect` it crops to a fixed ratio
 * (object-cover / -contain); without it the image keeps its natural ratio. Give
 * `href` to link the image back to where it came from. Aseptic: the frame uses
 * card/border tokens so it picks up the active theme.
 */
export function Figure({
  src,
  alt,
  caption,
  credit,
  href,
  aspect,
  fit = "cover",
  className,
  ...props
}: FigureProps) {
  const hasCaption = caption != null || credit != null;
  const imgClass = aspect
    ? cn("absolute inset-0 size-full", fit === "contain" ? "object-contain" : "object-cover")
    : "block h-auto w-full";

  const media = (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={imgClass}
    />
  );

  return (
    <figure
      data-slot="figure"
      className={cn(
        "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <div
        className="relative w-full overflow-hidden bg-muted"
        style={aspect ? { aspectRatio: aspect } : undefined}
      >
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              aspect && "absolute inset-0 size-full",
            )}
          >
            {media}
          </a>
        ) : (
          media
        )}
      </div>

      {hasCaption && (
        <figcaption className="px-4 py-3 text-sm">
          {caption != null && (
            <div className="text-card-foreground/90 [&_a]:font-medium [&_a]:text-primary [&_a]:underline">
              <RichText>{caption}</RichText>
            </div>
          )}
          {credit != null && (
            <div className="mt-1 text-xs text-muted-foreground [&_a]:underline">
              <RichText>{credit}</RichText>
            </div>
          )}
        </figcaption>
      )}
    </figure>
  );
}

Figure.displayName = "Figure";
