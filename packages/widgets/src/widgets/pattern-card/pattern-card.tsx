import * as React from "react";

import { cn } from "@/lib/utils";
import { RichText } from "@/primitives/rich-text";

export interface Pattern {
  /** An emoji, a single character, or any React node (e.g. an icon). */
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
}

export interface PatternCardProps extends React.HTMLAttributes<HTMLDivElement> {
  cards: Pattern[];
  /** Minimum column width before wrapping. Default: 220px. */
  minColumn?: number;
}

/**
 * PatternCard — a responsive grid of icon + title + description cards. The grid
 * auto-fits columns, so it collapses to a single column on narrow screens with
 * no breakpoints to tune.
 */
export function PatternCard({
  cards,
  minColumn = 220,
  className,
  style,
  ...props
}: PatternCardProps) {
  return (
    <div
      data-slot="pattern-card-grid"
      className={cn("grid gap-3", className)}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minColumn}px, 100%), 1fr))`,
        ...style,
      }}
      {...props}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          data-slot="pattern-card"
          className="rounded-lg border bg-card p-4 text-card-foreground shadow-wgt transition-transform hover:-translate-y-0.5"
        >
          {card.icon != null && (
            <div className="mb-2 text-2xl leading-none">{card.icon}</div>
          )}
          <p className="font-display font-semibold leading-tight">
            <RichText>{card.title}</RichText>
          </p>
          {card.description != null && (
            <p className="mt-1 text-sm text-muted-foreground">
              <RichText>{card.description}</RichText>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

PatternCard.displayName = "PatternCard";
