import * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "@/primitives/icon";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText } from "@/primitives/rich-text";

export type ResourceKind =
  | "article"
  | "episode"
  | "video"
  | "docs"
  | "tool"
  | "book"
  | "repo"
  | "link";

export interface Resource {
  /** The resource title (the linked text). */
  label: React.ReactNode;
  /** Destination URL (opens in a new tab). */
  href: string;
  /** Optional one-line blurb under the title. */
  description?: React.ReactNode;
  /** Resource kind — picks the leading icon. Default: "link". */
  kind?: ResourceKind;
  /** Where it lives — a site or show name, e.g. "Web Reactiva". */
  source?: string;
  /** A short qualifier — reading time, episode number, a timestamp… */
  meta?: string;
}

export interface ResourceListLabels {
  /** Screen-reader hint appended to each external link. */
  newTab: string;
}

export const DEFAULT_RESOURCE_LIST_LABELS: ResourceListLabels = {
  newTab: "opens in a new tab",
};

export interface ResourceListProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** The resources to list, in order. */
  items: Resource[];
  /** Optional heading, e.g. "Keep exploring" or "References". */
  title?: React.ReactNode;
  /** "list" (default): stacked rows. "cards": responsive auto-fit grid. */
  layout?: "list" | "cards";
  /** Customizable / translatable strings. */
  labels?: Partial<ResourceListLabels>;
}

/** Bare Iconify names (resolved against the theme's icon set) per kind. */
const KIND_ICON: Record<ResourceKind, string> = {
  article: "file-text",
  episode: "mic",
  video: "play",
  docs: "book-open",
  tool: "wrench",
  book: "book",
  repo: "github",
  link: "link",
};

/**
 * ResourceList — a "keep exploring" / references block: a titled list of
 * external links, each with a kind icon, a source + qualifier eyebrow, and an
 * optional blurb. It is the home for further-reading and citations that come
 * from outside the source material, so every item is a real outbound URL.
 * Emits `resource_opened` on click. Aseptic: card/border/muted tokens only.
 */
export function ResourceList({
  items,
  title,
  layout = "list",
  labels,
  className,
  ...props
}: ResourceListProps) {
  const l = useLabels("resourceList", DEFAULT_RESOURCE_LIST_LABELS, labels);
  const { ref, emit } = useWidgetEvents("resource-list");

  if (!items || items.length === 0) return null;

  return (
    <section
      ref={ref}
      data-slot="resource-list"
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      {title != null && (
        <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <RichText>{title}</RichText>
        </h3>
      )}
      <ul
        data-slot="resource-list-items"
        className={cn(layout === "cards" ? "grid gap-3" : "flex flex-col gap-1.5")}
        style={
          layout === "cards"
            ? {
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
              }
            : undefined
        }
      >
        {items.map((item, index) => {
          const kind = item.kind ?? "link";
          return (
            <li key={index} data-slot="resource" data-kind={kind}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  emit("resource_opened", { kind, href: item.href, index })
                }
                className="group flex gap-3 rounded-md border border-transparent p-2 outline-none transition-colors hover:border-border hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-[color-mix(in_oklab,var(--primary)_12%,var(--muted))] group-hover:text-primary">
                  <Icon icon={KIND_ICON[kind]} className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start gap-1 font-medium leading-snug">
                    <span className="min-w-0">
                      <RichText>{item.label}</RichText>
                      <span className="sr-only"> ({l.newTab})</span>
                    </span>
                    <Icon
                      icon="arrow-up-right"
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  </span>
                  {(item.source || item.meta) && (
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                      {item.source && (
                        <span className="font-medium">{item.source}</span>
                      )}
                      {item.source && item.meta && (
                        <span aria-hidden>·</span>
                      )}
                      {item.meta && <span>{item.meta}</span>}
                    </span>
                  )}
                  {item.description != null && (
                    <span className="mt-1 block text-sm text-muted-foreground [&_a]:underline">
                      <RichText>{item.description}</RichText>
                    </span>
                  )}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

ResourceList.displayName = "ResourceList";
