import * as React from "react";

import { cn } from "@/lib/utils";

export interface Step {
  title: string;
  description?: React.ReactNode;
}

export interface StepCardsProps extends React.HTMLAttributes<HTMLOListElement> {
  steps: Step[];
  /** Start the visible numbering at this value. Default: 1. */
  start?: number;
}

/**
 * StepCards — an ordered sequence of numbered steps. Renders as a semantic
 * `<ol>`; the connector line and number badges are purely decorative.
 */
export function StepCards({
  steps,
  start = 1,
  className,
  ...props
}: StepCardsProps) {
  return (
    <ol
      data-slot="step-cards"
      className={cn("flex flex-col", className)}
      {...props}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li
            key={index}
            className="flex gap-4 motion-safe:animate-wgt-fade-up"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            {/* Number + connector */}
            <div className="flex flex-col items-center">
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-wgt"
              >
                {start + index}
              </span>
              {!isLast && <span className="w-px flex-1 bg-border" />}
            </div>
            {/* Content */}
            <div className={cn("pt-1", isLast ? "pb-0" : "pb-6")}>
              <p className="font-display font-semibold leading-tight">
                {step.title}
              </p>
              {step.description != null && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

StepCards.displayName = "StepCards";
