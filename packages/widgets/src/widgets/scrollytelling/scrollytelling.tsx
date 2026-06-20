import * as React from "react";

import { cn } from "@/lib/utils";

export interface ScrollStep {
  /** The narrative content for this step (prose, a heading block, any node). */
  content: React.ReactNode;
  /** The sticky graphic shown while this step is active. */
  sticky?: React.ReactNode;
}

export interface ScrollytellingProps
  extends React.HTMLAttributes<HTMLDivElement> {
  steps: ScrollStep[];
  /** Graphic shown when a step provides none (falls back to the first step's). */
  sticky?: React.ReactNode;
}

/**
 * Scrollytelling — the sticky-graphic pattern (NYT / The Pudding / Scrollama):
 * the narrative steps scroll on one side while a graphic stays pinned and
 * updates as each step becomes active. A COMPOSITION: the sticky graphic and
 * the step content are other widgets.
 *
 * Drives the active step with an IntersectionObserver centered on the viewport
 * (no scroll-snap — that fights nested scrollytelling). Responsive: the graphic
 * pins to the top on mobile and to the side column on desktop. Honors
 * prefers-reduced-motion for the graphic crossfade.
 */
export function Scrollytelling({
  steps,
  sticky,
  className,
  ...props
}: ScrollytellingProps) {
  const [active, setActive] = React.useState(0);
  const stepRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.step);
            if (!Number.isNaN(index)) setActive(index);
          }
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    for (const el of stepRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [steps.length]);

  const stickyContent = steps[active]?.sticky ?? sticky ?? steps[0]?.sticky;

  return (
    <div
      data-slot="scrollytelling"
      className={cn("grid gap-x-10 md:grid-cols-2", className)}
      {...props}
    >
      {/* Sticky graphic — pinned to top on mobile, side column on desktop. */}
      <div className="sticky top-0 z-10 mb-6 self-start bg-background py-3 md:top-6 md:order-2 md:mb-0 md:py-0">
        <div key={active} className="motion-safe:animate-wgt-fade-in">
          {stickyContent}
        </div>
      </div>

      {/* Narrative steps. */}
      <div className="md:order-1">
        {steps.map((step, i) => (
          <div
            key={i}
            data-step={i}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            className={cn(
              "flex min-h-[70vh] flex-col justify-center border-l-2 pl-5 transition-all duration-300",
              i === active
                ? "border-primary opacity-100"
                : "border-transparent opacity-40",
            )}
          >
            {step.content}
          </div>
        ))}
      </div>
    </div>
  );
}

Scrollytelling.displayName = "Scrollytelling";
