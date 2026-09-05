import * as React from "react";
import { Check, X } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText } from "@/primitives/rich-text";

export interface CheckpointItem {
  /** The thing the reader should be able to say out loud, in one sentence. */
  text: React.ReactNode;
  /** Where to go back to if they can't — a module name, a section, a link. */
  revisit?: React.ReactNode;
}

export interface CheckpointLabels {
  /** Default heading. */
  title: React.ReactNode;
  /** Instruction under the heading. */
  hint: React.ReactNode;
  /** The "yes, I can say this" control. */
  can: React.ReactNode;
  /** The "not yet" control. */
  notYet: React.ReactNode;
  /** Prefix before an item's `revisit` pointer. */
  revisit: React.ReactNode;
  /** Summary when every item is claimed. */
  allClear: React.ReactNode;
  /** Summary while some items are still open: (open, total). */
  summary: (open: number, total: number) => React.ReactNode;
  /** Accessible name for the list. */
  group: string;
}

export const DEFAULT_CHECKPOINT_LABELS: CheckpointLabels = {
  title: "Before you move on, you should be able to explain",
  hint: "Say each one out loud. If it doesn't come out in a sentence, it isn't there yet.",
  can: "I can say this",
  notYet: "Not yet",
  revisit: "Go back to",
  allClear: "All of it holds. Keep going.",
  summary: (open, total) =>
    `${open} of ${total} still open — worth a second pass before the next module.`,
  group: "Things you should be able to explain",
};

type Verdict = "can" | "not-yet";

export interface CheckpointProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** The things the reader should now be able to say out loud. 2–5 works. */
  items: CheckpointItem[];
  /** Override the heading. */
  title?: React.ReactNode;
  /** Override the instruction line. */
  hint?: React.ReactNode;
  /** Customizable / translatable strings. */
  labels?: Partial<CheckpointLabels>;
}

/**
 * Checkpoint — consolidate before moving on.
 *
 * Not an exam and not a to-do list: a short list of things the reader should
 * now be able to say out loud, each one self-rated. Long explanations need
 * these, because without a pause the reader stacks new concepts on a base they
 * never checked, and the collapse happens three modules later where nobody can
 * trace it.
 *
 * The self-rating is the point. Recognition is cheap and feels exactly like
 * knowledge; asking "can you say this in a sentence?" is the cheapest test
 * that tells the two apart, and an honest "not yet" with a place to go back to
 * is worth more than a green tick.
 *
 * Sibling: Checklist is the keepsake the reader *acts* on after the guide;
 * Checkpoint is the pause inside it. Place one every three or four modules.
 */
export function Checkpoint({
  items,
  title,
  hint,
  labels,
  className,
  ...props
}: CheckpointProps) {
  const l = useLabels("checkpoint", DEFAULT_CHECKPOINT_LABELS, labels);
  const { ref, emit } = useWidgetEvents("checkpoint");
  const [verdicts, setVerdicts] = React.useState<
    Record<number, Verdict | undefined>
  >({});

  const rated = items.filter((_, i) => verdicts[i] != null).length;
  const open = items.filter((_, i) => verdicts[i] === "not-yet").length;
  const complete = rated === items.length && items.length > 0;

  function rate(index: number, verdict: Verdict) {
    const next = { ...verdicts, [index]: verdict };
    setVerdicts(next);
    const openNow = items.filter((_, i) => next[i] === "not-yet").length;
    emit("rated", {
      index,
      verdict,
      rated: items.filter((_, i) => next[i] != null).length,
      open: openNow,
      total: items.length,
    });
  }

  return (
    <div
      ref={ref}
      data-slot="checkpoint"
      data-complete={complete || undefined}
      className={cn(
        "@container/cp rounded-lg border-2 border-dashed bg-card p-4 text-card-foreground sm:p-6",
        className,
      )}
      {...props}
    >
      <h3 className="font-display text-base font-semibold leading-snug @md/cp:text-lg">
        <RichText>{title ?? l.title}</RichText>
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        <RichText>{hint ?? l.hint}</RichText>
      </p>

      <ul
        aria-label={l.group}
        className="mt-4 flex flex-col gap-2"
      >
        {items.map((item, index) => {
          const verdict = verdicts[index];
          return (
            <li
              key={index}
              data-verdict={verdict}
              className={cn(
                "rounded-md border p-3 transition-colors",
                verdict === "can" &&
                  "border-success/45 bg-[color-mix(in_oklab,var(--success)_8%,var(--card))]",
                verdict === "not-yet" &&
                  "border-warning/45 bg-[color-mix(in_oklab,var(--warning)_8%,var(--card))]",
                verdict == null && "border-input",
              )}
            >
              <div className="text-sm text-card-foreground/90">
                <RichText>{item.text}</RichText>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-pressed={verdict === "can"}
                  onClick={() => rate(index, "can")}
                  className={cn(
                    "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
                    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    verdict === "can"
                      ? "border-success bg-success text-success-foreground"
                      : "border-input bg-background hover:border-ring hover:bg-accent",
                  )}
                >
                  <Check aria-hidden className="size-3.5" />
                  <RichText>{l.can}</RichText>
                </button>
                <button
                  type="button"
                  aria-pressed={verdict === "not-yet"}
                  onClick={() => rate(index, "not-yet")}
                  className={cn(
                    "inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
                    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    verdict === "not-yet"
                      ? "border-warning bg-warning text-warning-foreground"
                      : "border-input bg-background hover:border-ring hover:bg-accent",
                  )}
                >
                  <X aria-hidden className="size-3.5" />
                  <RichText>{l.notYet}</RichText>
                </button>

                {verdict === "not-yet" && item.revisit != null && (
                  <span className="text-xs text-muted-foreground motion-safe:animate-wgt-fade-up">
                    {l.revisit} <RichText>{item.revisit}</RichText>
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {complete && (
        <p
          role="status"
          className={cn(
            "mt-4 text-sm font-medium motion-safe:animate-wgt-fade-up",
            open === 0 ? "text-success" : "text-muted-foreground",
          )}
        >
          {open === 0 ? (
            <RichText>{l.allClear}</RichText>
          ) : (
            l.summary(open, items.length)
          )}
        </p>
      )}
    </div>
  );
}

Checkpoint.displayName = "Checkpoint";
