import * as React from "react";

import { cn } from "@/lib/utils";

export interface KineticHeadlineProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** The headline. Split on whitespace; each word reveals in turn on scroll. */
  text: string;
  /** Heading level / size. Default: "h2". */
  as?: "h1" | "h2" | "h3" | "p";
  /** Text alignment. Default: "left". */
  align?: "left" | "center";
}

const SIZE: Record<NonNullable<KineticHeadlineProps["as"]>, string> = {
  h1: "text-4xl @md:text-6xl",
  h2: "text-3xl @md:text-5xl",
  h3: "text-2xl @md:text-4xl",
  p: "text-xl @md:text-2xl",
};

/**
 * KineticHeadline — display typography that reveals a word at a time as the
 * headline scrolls into view. The string is split on whitespace (no SplitType /
 * Splitting.js — the JSON surface only sends strings anyway) and each word gets
 * a `--i` index; the staggered rise/fade is pure CSS scroll-driven animation
 * (see `[data-slot="kinetic-headline"]` in theme.css). Zero JS, zero deps.
 * Browsers without scroll-driven animations, and readers with reduced motion,
 * simply see the full headline — the reveal carries no meaning, so `@supports`
 * is the whole fallback story. Like the words backdrop, this is display art:
 * plain text only (no markdown/glossary) — use `section-header` for a rich one.
 */
export function KineticHeadline({
  text,
  as = "h2",
  align = "left",
  className,
  ...props
}: KineticHeadlineProps) {
  const Tag = as;
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag
      data-slot="kinetic-headline"
      className={cn(
        "@container font-display font-bold leading-[1.08] tracking-tight text-balance",
        SIZE[as],
        align === "center" ? "text-center" : "text-left",
        className,
      )}
      {...props}
    >
      {words.map((word, i) => (
        <React.Fragment key={i}>
          <span
            className="wgt-kinetic-word inline-block will-change-[transform,opacity]"
            style={{ "--i": i } as React.CSSProperties}
          >
            {word}
          </span>
          {i < words.length - 1 ? " " : ""}
        </React.Fragment>
      ))}
    </Tag>
  );
}

KineticHeadline.displayName = "KineticHeadline";
