import * as React from "react";

import { cn } from "@/lib/utils";
import { RichText } from "@/primitives/rich-text";

export interface DrawPath {
  /** SVG path data (the `d` attribute), in `viewBox` coordinates. */
  d: string;
  /** Stroke width in viewBox units. Default: 2. */
  width?: number;
}

export interface DrawLabel {
  x: number;
  y: number;
  text: string;
  /** Horizontal anchor. Default: "start". */
  anchor?: "start" | "middle" | "end";
  /** Font size in viewBox units. Default: 12. */
  size?: number;
}

export interface DrawDiagramProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** e.g. "0 0 240 120" — the coordinate space the paths are drawn in. */
  viewBox: string;
  /** The strokes, drawn in order as the diagram scrolls into view. */
  paths: (string | DrawPath)[];
  /** Static text labels, positioned in `viewBox` coordinates. */
  labels?: DrawLabel[];
  /** Accessible name for the diagram (also its visual meaning). */
  title?: string;
  /** Optional caption below the diagram. */
  caption?: React.ReactNode;
}

/**
 * DrawDiagram — a small line diagram whose strokes draw themselves in as it
 * scrolls into view. Each path is normalized with `pathLength="1"` and drawn by
 * animating `stroke-dashoffset` on a scroll-driven timeline (see
 * `[data-slot="draw-diagram"]` in theme.css), staggered by path order. Pure CSS,
 * zero deps; browsers without scroll-driven animations and readers with reduced
 * motion see the finished diagram immediately (the strokes are drawn at rest and
 * only the animation is gated). Strokes inherit the accent via `currentColor`;
 * labels are SVG `<text>` (no markdown — SVG can't render HTML).
 */
export function DrawDiagram({
  viewBox,
  paths,
  labels,
  title,
  caption,
  className,
  ...props
}: DrawDiagramProps) {
  const strokes = paths.map((p) => (typeof p === "string" ? { d: p } : p));
  return (
    <div
      data-slot="draw-diagram"
      className={cn("@container text-primary", className)}
      {...props}
    >
      <svg
        viewBox={viewBox}
        className="h-auto w-full"
        role="img"
        aria-label={title}
        aria-hidden={title ? undefined : true}
        fill="none"
      >
        {title ? <title>{title}</title> : null}
        {strokes.map((stroke, i) => (
          <path
            key={i}
            d={stroke.d}
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke.width ?? 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ "--i": i } as React.CSSProperties}
          />
        ))}
        {labels?.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={label.y}
            textAnchor={label.anchor ?? "start"}
            fontSize={label.size ?? 12}
            className="fill-muted-foreground font-sans"
          >
            {label.text}
          </text>
        ))}
      </svg>
      {caption ? (
        <p className="mt-2 text-sm text-muted-foreground">
          <RichText>{caption}</RichText>
        </p>
      ) : null}
    </div>
  );
}

DrawDiagram.displayName = "DrawDiagram";
