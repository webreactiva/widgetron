import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/primitives/icon";
import { RichText } from "@/primitives/rich-text";

export interface SectionHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** The section title (larger display type). */
  title: React.ReactNode;
  /**
   * Optional leading icon. A string is an Iconify name resolved against the
   * theme's icon set (e.g. `"server"` → lucide / pixelarticons); pass a node
   * for full control.
   */
  icon?: React.ReactNode;
  /** Optional supporting description / lead text below the title. */
  description?: React.ReactNode;
  /** Small label shown above the title (e.g. a section number or category). */
  eyebrow?: React.ReactNode;
  /** Heading level for the title element. Default: 2. */
  level?: 1 | 2 | 3 | 4;
  /** Horizontal alignment. Default: "left". */
  align?: "left" | "center";
  /** Optional actions (buttons/links) shown alongside the title. */
  actions?: React.ReactNode;
  /** Extra body content rendered under the description. */
  children?: React.ReactNode;
}

const TITLE_SIZE: Record<NonNullable<SectionHeaderProps["level"]>, string> = {
  1: "text-3xl sm:text-4xl",
  2: "text-2xl sm:text-3xl",
  3: "text-xl sm:text-2xl",
  4: "text-lg sm:text-xl",
};

/**
 * SectionHeader — a section cabecera: an optional eyebrow, a larger display
 * title, and optional description / body text. Brand-agnostic and fully
 * customizable; all text comes from props, so it is translatable out of the box.
 */
export function SectionHeader({
  title,
  icon,
  description,
  eyebrow,
  level = 2,
  align = "left",
  actions,
  children,
  className,
  ...props
}: SectionHeaderProps) {
  const Heading = `h${level}` as React.ElementType;
  const centered = align === "center";

  return (
    <header
      data-slot="section-header"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        centered && "sm:flex-col sm:items-center",
        className,
      )}
      {...props}
    >
      <div className={cn("min-w-0", centered && "text-center")}>
        {icon != null && (
          <div
            className={cn(
              "mb-3 text-2xl text-primary",
              centered && "flex justify-center",
            )}
          >
            {typeof icon === "string" ? (
              <Icon icon={icon} className="size-8" />
            ) : (
              icon
            )}
          </div>
        )}
        {eyebrow != null && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <RichText>{eyebrow}</RichText>
          </p>
        )}
        <Heading
          className={cn(
            "font-display font-bold tracking-tight text-foreground",
            TITLE_SIZE[level],
          )}
        >
          <RichText>{title}</RichText>
        </Heading>
        {description != null && (
          <p
            className={cn(
              "mt-2 max-w-2xl text-base text-muted-foreground sm:text-lg",
              centered && "mx-auto",
            )}
          >
            <RichText>{description}</RichText>
          </p>
        )}
        {children != null && (
          <div className="mt-3 text-sm text-muted-foreground">{children}</div>
        )}
      </div>
      {actions != null && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

SectionHeader.displayName = "SectionHeader";
