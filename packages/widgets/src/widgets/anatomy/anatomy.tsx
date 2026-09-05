import * as React from "react";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText } from "@/primitives/rich-text";

export interface AnatomyPart {
  /** The part's NAME — the word you will keep using for it afterwards. */
  label: React.ReactNode;
  /**
   * The literal fragment of the artifact this part is. Rendered verbatim; a
   * plain string keeps its whitespace. Omit it and the label is shown instead
   * (useful when the artifact is conceptual rather than textual).
   */
  text?: string;
  /** What this part does, and what breaks without it. */
  note: React.ReactNode;
}

export interface AnatomyLabels {
  /** Instruction shown above the artifact. */
  hint: React.ReactNode;
  /** Eyebrow over the detail panel. */
  part: React.ReactNode;
  /** Placeholder in the detail panel before anything is picked. */
  empty: React.ReactNode;
  /** Accessible name for the parts group. */
  group: string;
}

export const DEFAULT_ANATOMY_LABELS: AnatomyLabels = {
  hint: "Pick a part to inspect it.",
  part: "Part",
  empty: "Nothing selected yet.",
  group: "Parts of this artifact",
};

export interface AnatomyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** What the artifact IS — "a production prompt", "a cache-aside read". */
  label?: React.ReactNode;
  /** The parts, in the order they appear in the artifact. */
  parts: AnatomyPart[];
  /**
   * How the artifact is assembled from its parts:
   * - `"lines"` (default) — one part per line: prompts, config, JSON, code.
   * - `"inline"` — the parts run together as one continuous string: a URL, a
   *   shell command, a header, a log line.
   */
  layout?: "lines" | "inline";
  /** Render the artifact in monospace. Default: true. */
  mono?: boolean;
  /** Override the instruction line. */
  hint?: React.ReactNode;
  /** Customizable / translatable strings. */
  labels?: Partial<AnatomyLabels>;
}

/**
 * Anatomy — what parts does this thing have?
 *
 * Decomposes ONE artifact the reader will meet again — a prompt, a URL, an
 * HTTP response, a JSON payload, a config file, a shell command, a function
 * signature — into named, clickable parts. Selecting a part dims the rest and
 * explains it; the artifact itself never leaves the screen, so the part is
 * always read in the context of the whole.
 *
 * Two things it buys that a labelled list does not: the reader sees where each
 * part physically sits in the artifact, and they leave with the vocabulary.
 * For nomenclature-heavy material an anatomy early on pays for itself — then
 * use the same word for the same thing for the rest of the guide, because
 * silent synonyms are one of the most reliable ways to lose a reader.
 *
 * Sibling: Hotspots does this over an IMAGE; Anatomy does it over text you can
 * select, copy and search.
 */
export function Anatomy({
  label,
  parts,
  layout = "lines",
  mono = true,
  hint,
  labels,
  className,
  ...props
}: AnatomyProps) {
  const l = useLabels("anatomy", DEFAULT_ANATOMY_LABELS, labels);
  const { ref, emit } = useWidgetEvents("anatomy");
  const [active, setActive] = React.useState<number | null>(null);
  const panelId = React.useId();

  function select(index: number) {
    const next = active === index ? null : index;
    setActive(next);
    if (next !== null) emit("part_inspected", { index });
  }

  const selected = active !== null ? parts[active] : null;

  return (
    <div
      ref={ref}
      data-slot="anatomy"
      data-layout={layout}
      className={cn(
        "@container/ana overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-2">
        {label != null && (
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <RichText>{label}</RichText>
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          <RichText>{hint ?? l.hint}</RichText>
        </p>
      </div>

      {/* The artifact, assembled from its parts */}
      <div
        role="group"
        aria-label={l.group}
        className={cn(
          "overflow-x-auto bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] p-3 text-sm",
          mono && "font-mono",
          layout === "inline" ? "flex flex-wrap items-stretch" : "flex flex-col gap-1",
        )}
      >
        {parts.map((part, index) => {
          const isActive = active === index;
          const dimmed = active !== null && !isActive;
          return (
            <button
              key={index}
              type="button"
              aria-pressed={isActive}
              aria-controls={panelId}
              onClick={() => select(index)}
              // The visible text is the raw fragment ("https://"), which on its
              // own tells a screen-reader user nothing about which part it is.
              aria-label={
                typeof part.label === "string" && part.text != null
                  ? part.label
                  : undefined
              }
              title={typeof part.label === "string" ? part.label : undefined}
              className={cn(
                "cursor-pointer rounded border border-transparent text-left transition-all",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
                layout === "inline" ? "px-1 py-0.5" : "px-2 py-1",
                isActive &&
                  "border-primary/50 bg-[color-mix(in_oklab,var(--primary)_16%,var(--card))] text-card-foreground",
                dimmed && "opacity-40",
                !isActive && "hover:border-input hover:bg-background",
              )}
            >
              <span
                className={cn(
                  layout === "lines" && "whitespace-pre-wrap",
                  layout === "inline" && "whitespace-pre",
                )}
              >
                {part.text ?? (typeof part.label === "string" ? part.label : null)}
              </span>
              {part.text == null && typeof part.label !== "string" && (
                <RichText>{part.label}</RichText>
              )}
            </button>
          );
        })}
      </div>

      {/* The note for the selected part */}
      <div
        id={panelId}
        role="status"
        className="border-t p-4 text-sm"
      >
        {selected ? (
          <div className="motion-safe:animate-wgt-fade-up">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {l.part} · <RichText>{selected.label}</RichText>
            </p>
            <div className="text-card-foreground/90">
              <RichText>{selected.note}</RichText>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            <RichText>{l.empty}</RichText>
          </p>
        )}
      </div>
    </div>
  );
}

Anatomy.displayName = "Anatomy";
