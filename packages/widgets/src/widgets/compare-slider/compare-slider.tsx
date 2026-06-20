import * as React from "react";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";

export interface CompareSliderLabels {
  /** Badge text for the clipped (top / "before") layer. */
  before: React.ReactNode;
  /** Badge text for the underneath ("after") layer. */
  after: React.ReactNode;
  /** Accessible name for the draggable divider handle. */
  label: string;
}

export const DEFAULT_COMPARE_SLIDER_LABELS: CompareSliderLabels = {
  before: "Before",
  after: "After",
  label: "Comparison slider",
};

export interface CompareSliderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content for the clipped ("before") layer. Use this OR `beforeSrc`. */
  before?: React.ReactNode;
  /** Content for the underneath ("after") layer. Use this OR `afterSrc`. */
  after?: React.ReactNode;
  /** Image URL for the "before" layer (convenience; rendered as object-cover). */
  beforeSrc?: string;
  /** Image URL for the "after" layer. */
  afterSrc?: string;
  /** Alt text applied to the convenience images. */
  alt?: string;
  /** Initial divider position as a percentage (0–100). Defaults to 50. */
  defaultPosition?: number;
  labels?: Partial<CompareSliderLabels>;
}

const clamp = (n: number) => Math.min(100, Math.max(0, n));

/**
 * CompareSlider — a before/after comparison with a draggable divider the reader
 * sweeps to reveal each side. Drag the handle with a pointer/finger, click
 * anywhere to move the divider there, or focus the handle and use the arrow keys.
 *
 * Both layers are absolutely positioned, so the container needs an explicit
 * height. It defaults to `min-h-[16rem]`; pass `className` to set an aspect ratio
 * or a fixed height (e.g. `className="aspect-video"` or `className="h-80"`).
 */
export function CompareSlider({
  before,
  after,
  beforeSrc,
  afterSrc,
  alt = "",
  defaultPosition = 50,
  labels,
  className,
  ...props
}: CompareSliderProps) {
  const l = useLabels("compareSlider", DEFAULT_COMPARE_SLIDER_LABELS, labels);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);
  const [pos, setPos] = React.useState(() => clamp(defaultPosition));

  const beforeContent =
    before ?? (beforeSrc ? <img src={beforeSrc} alt={alt} /> : null);
  const afterContent =
    after ?? (afterSrc ? <img src={afterSrc} alt={alt} /> : null);

  const moveTo = React.useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    setPos(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  return (
    <div
      ref={containerRef}
      data-slot="compare-slider"
      className={cn(
        "relative min-h-[16rem] overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      onPointerDown={(e) => {
        // Clicking anywhere on the container moves the divider there.
        moveTo(e.clientX);
      }}
      {...props}
    >
      {/* after — underneath, full */}
      <div
        data-slot="compare-slider-after"
        className="absolute inset-0 grid h-full w-full place-items-stretch [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
      >
        {afterContent}
      </div>

      {/* before — on top, clipped to the divider position */}
      <div
        data-slot="compare-slider-before"
        className="absolute inset-0 grid h-full w-full place-items-stretch [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        {beforeContent}
      </div>

      {/* corner badges */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-2 top-2 rounded bg-card/80 px-1.5 py-0.5 text-xs text-muted-foreground backdrop-blur-sm"
      >
        {l.before}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute right-2 top-2 rounded bg-card/80 px-1.5 py-0.5 text-xs text-muted-foreground backdrop-blur-sm"
      >
        {l.after}
      </span>

      {/* divider + handle */}
      <div
        data-slot="compare-slider-divider"
        className="pointer-events-none absolute inset-y-0 w-px touch-none select-none bg-border"
        style={{ left: `${pos}%` }}
      >
        <span
          role="slider"
          tabIndex={0}
          aria-label={l.label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          aria-orientation="horizontal"
          data-slot="compare-slider-handle"
          className="pointer-events-auto absolute top-1/2 left-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none select-none place-items-center rounded-full border bg-card text-muted-foreground shadow-wgt outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            dragging.current = true;
          }}
          onPointerMove={(e) => {
            if (!dragging.current) return;
            moveTo(e.clientX);
          }}
          onPointerUp={(e) => {
            dragging.current = false;
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
              /* capture may already be released */
            }
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              setPos((p) => clamp(p + 2));
            } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              setPos((p) => clamp(p - 2));
            }
          }}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      </div>
    </div>
  );
}

CompareSlider.displayName = "CompareSlider";
