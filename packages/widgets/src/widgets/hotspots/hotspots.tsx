import * as React from "react";

import { cn } from "@/lib/utils";

export interface Hotspot {
  /** Horizontal position as a percentage (0–100) of the figure box. */
  x: number;
  /** Vertical position as a percentage (0–100) of the figure box. */
  y: number;
  title: React.ReactNode;
  description: React.ReactNode;
}

export interface HotspotsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The figure to annotate — an `<img>`, an SVG, or any node. When omitted and
   * `src` is given, a convenience `<img>` is rendered instead.
   */
  children?: React.ReactNode;
  /** Convenience image source, used only when no `children` are provided. */
  src?: string;
  /** Alt text for the convenience image. */
  alt?: string;
  /** Clickable points overlaid on the figure, positioned by `x`/`y` percent. */
  hotspots: Hotspot[];
  /** Pre-select a hotspot index. */
  defaultSelected?: number;
  /** Shown in the detail panel while nothing is selected. */
  emptyHint?: React.ReactNode;
}

/**
 * Hotspots — an annotated figure. Clickable points overlaid on an image or
 * diagram reveal an explanation in a detail panel below. Each dot is a button
 * (tab/enter); arrow keys move the selection between points. The panel is an
 * aria-live region so reveals are announced. Aseptic, mobile-first, accessible.
 */
export function Hotspots({
  children,
  src,
  alt,
  hotspots,
  defaultSelected,
  emptyHint = "Select a point to learn more.",
  className,
  ...props
}: HotspotsProps) {
  const [selected, setSelected] = React.useState<number | null>(
    defaultSelected ?? null,
  );
  const btnRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    if (hotspots.length === 0) return;
    e.preventDefault();
    const next =
      e.key === "ArrowRight"
        ? (index + 1) % hotspots.length
        : (index - 1 + hotspots.length) % hotspots.length;
    btnRefs.current[next]?.focus();
    setSelected(next);
  }

  const figure =
    children != null
      ? children
      : src
        ? <img src={src} alt={alt ?? ""} className="block w-full h-auto" />
        : null;

  const selectedHotspot = selected !== null ? hotspots[selected] : null;

  return (
    <div
      data-slot="hotspots"
      className={cn(
        "flex flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <div className="relative">
        {figure}
        {hotspots.map((hotspot, index) => {
          const isSelected = selected === index;
          return (
            <button
              key={index}
              type="button"
              ref={(el) => {
                btnRefs.current[index] = el;
              }}
              aria-label={
                typeof hotspot.title === "string" ? hotspot.title : undefined
              }
              aria-pressed={isSelected}
              aria-expanded={isSelected}
              onClick={() => setSelected((s) => (s === index ? null : index))}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              className={cn(
                "absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs font-semibold shadow-wgt outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-ring motion-safe:animate-wgt-pop"
                  : "border-border bg-card text-foreground hover:border-primary",
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {selectedHotspot ? (
          <div className="rounded-lg border bg-card p-4 text-card-foreground">
            <p className="font-display font-semibold leading-tight">
              {selectedHotspot.title}
            </p>
            <div className="mt-1 text-sm text-muted-foreground">
              {selectedHotspot.description}
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {emptyHint}
          </p>
        )}
      </div>
    </div>
  );
}

Hotspots.displayName = "Hotspots";
