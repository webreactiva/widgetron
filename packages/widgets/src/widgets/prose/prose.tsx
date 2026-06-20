import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProseProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render a trusted HTML string instead of (or alongside) children. */
  html?: string;
  /** Base text size. Default: "base". */
  size?: "sm" | "base" | "lg";
}

const SIZE: Record<NonNullable<ProseProps["size"]>, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
};

/**
 * Prose — a static typographic container for free-form titles and descriptions
 * (headings, paragraphs, lists, inline code, links). Styles descendants with
 * the theme tokens, so it stays brand-agnostic. Pass `children` (JSX) or a
 * trusted `html` string. No typography plugin required.
 */
export function Prose({
  html,
  size = "base",
  className,
  children,
  ...props
}: ProseProps) {
  const classes = cn(
    "max-w-prose leading-relaxed text-foreground",
    SIZE[size],
    // headings
    "[&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:mt-6 [&_h1]:mb-3",
    "[&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-6 [&_h2]:mb-3",
    "[&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2",
    // flow
    "[&_p]:my-3 [&_ul]:my-3 [&_ol]:my-3 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:my-1",
    "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
    "[&_strong]:font-semibold",
    "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]",
    "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
    "[&>:first-child]:mt-0 [&>:last-child]:mb-0",
    className,
  );

  if (html != null) {
    return (
      <div
        data-slot="prose"
        className={classes}
        dangerouslySetInnerHTML={{ __html: html }}
        {...props}
      />
    );
  }

  return (
    <div data-slot="prose" className={classes} {...props}>
      {children}
    </div>
  );
}

Prose.displayName = "Prose";
