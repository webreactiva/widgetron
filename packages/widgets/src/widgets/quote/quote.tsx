import * as React from "react";

import { cn } from "@/lib/utils";

export interface QuoteProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "role"> {
  /** The quoted words. */
  children: React.ReactNode;
  /** Who said it (e.g. a person's name). */
  attribution?: React.ReactNode;
  /** Their role or context (e.g. "Episode guest"). Any string. */
  role?: React.ReactNode;
}

/**
 * Quote — a highlighted pull-quote / testimonial. Semantic
 * `<figure>`/`<blockquote>`/`<figcaption>`, with a brand-aware accent from the
 * `--primary` token and the display typeface for the quoted words. No chrome,
 * so nothing to translate — the words come from `children`.
 */
export function Quote({
  children,
  attribution,
  role,
  className,
  ...props
}: QuoteProps) {
  return (
    <figure
      data-slot="quote"
      className={cn(
        "rounded-lg border border-l-4 border-l-primary bg-[color-mix(in_oklab,var(--primary)_5%,var(--card))] py-4 pr-4 pl-5 text-card-foreground",
        className,
      )}
      {...props}
    >
      <blockquote className="font-display text-lg leading-relaxed text-balance [&_a]:font-medium [&_a]:text-primary [&_a]:underline">
        {children}
      </blockquote>
      {(attribution != null || role != null) && (
        <figcaption className="mt-3 text-sm text-muted-foreground">
          {attribution != null && (
            <span className="font-semibold text-foreground">{attribution}</span>
          )}
          {attribution != null && role != null && <span aria-hidden> · </span>}
          {role != null && <span>{role}</span>}
        </figcaption>
      )}
    </figure>
  );
}

Quote.displayName = "Quote";
