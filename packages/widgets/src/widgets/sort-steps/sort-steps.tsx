import * as React from "react";
import { Check, ChevronDown, ChevronUp, GripVertical, X } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { Button } from "@/primitives/button";
import { RichText } from "@/primitives/rich-text";

export interface SortStepsItem {
  /** Unique id for this step. */
  id: string;
  /** The step text shown to the learner. */
  label: React.ReactNode;
  /** Optional second line — a detail shown under the label. */
  hint?: React.ReactNode;
}

export interface SortStepsLabels {
  instructions: React.ReactNode;
  /** Instruction used instead when `low`/`high` turn this into a ranking. */
  rankInstructions: React.ReactNode;
  /** Eyebrow over the explanation panel. */
  why: React.ReactNode;
  check: React.ReactNode;
  correct: React.ReactNode;
  incorrect: React.ReactNode;
  reset: React.ReactNode;
  moveUp: string;
  moveDown: string;
}

export const DEFAULT_SORT_STEPS_LABELS: SortStepsLabels = {
  instructions: "Put the steps in the right order, then check.",
  rankInstructions: "Order them along the scale, then check.",
  why: "Why this order",
  check: "Check order",
  correct: "That's the right order!",
  incorrect: "Not yet — the highlighted steps are out of place.",
  reset: "Shuffle again",
  moveUp: "Move up",
  moveDown: "Move down",
};

export interface SortStepsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The steps **in their correct order** — the widget scrambles them for the
   * reader, so authors always write the answer.
   */
  items: SortStepsItem[];
  /**
   * Turns the exercise into a RANKING: the items are ordered along a property
   * rather than through time. `low` names the top of the list, `high` the
   * bottom, so `items` still reads low → high in the correct order.
   */
  low?: React.ReactNode;
  /** The bottom-of-the-list end of the ranking scale. See `low`. */
  high?: React.ReactNode;
  /**
   * Why this order is the right one, shown after checking — the payoff. A
   * check that says "not yet" and stops has spent the reader's attention and
   * returned nothing.
   */
  explanation?: React.ReactNode;
  /** Fire confetti the moment the order becomes correct. Default: true. */
  celebrate?: boolean;
  /** Customizable / translatable strings. */
  labels?: Partial<SortStepsLabels>;
}

/**
 * Deterministic scramble. Math.random() would desync server and client markup,
 * so the starting order comes from a fixed-seed PRNG: same input, same shuffle,
 * every render and every environment.
 */
function scramble<T>(items: T[]): T[] {
  const out = [...items];
  if (out.length < 2) return out;
  // mulberry32 with a constant seed — deterministic, hydration-safe.
  let seed = 0x9e3779b9 ^ out.length;
  const next = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  // A shuffle that lands on the answer would hand the reader a free win.
  if (out.every((item, i) => item === items[i])) {
    [out[0], out[1]] = [out[1], out[0]];
  }
  return out;
}

/**
 * SortSteps — the ordering archetype: a procedure arrives scrambled and the
 * reader rebuilds its sequence. Where DragAndDrop teaches "what goes with
 * what", this teaches "what comes before what".
 *
 * Reordering is button-first (each row carries up/down controls), so it works
 * on touch and by keyboard without any pointer gymnastics; native HTML5 drag is
 * layered on top as a progressive enhancement and never required. Checking
 * grades each row in place: settled steps go green, misplaced ones red. All
 * copy is customizable / translatable via `labels`.
 */
export function SortSteps({
  items,
  low,
  high,
  explanation,
  celebrate = true,
  labels,
  className,
  ...props
}: SortStepsProps) {
  const l = useLabels("sortSteps", DEFAULT_SORT_STEPS_LABELS, labels);
  const { ref, emit } = useWidgetEvents("sort-steps");

  const [order, setOrder] = React.useState<SortStepsItem[]>(() =>
    scramble(items),
  );
  const [checked, setChecked] = React.useState(false);
  const solvedRef = React.useRef(false);
  /** Row index a native drag started from (progressive enhancement only). */
  const dragIndex = React.useRef<number | null>(null);
  const [dragOver, setDragOver] = React.useState<number | null>(null);

  // A ranking orders items by a property (coupling, cost, risk) instead of by
  // time; same mechanic, different question, so it only changes the framing.
  const ranking = low != null || high != null;
  const isCorrect = order.every((item, i) => item.id === items[i]?.id);
  const misplaced = order.filter((item, i) => item.id !== items[i]?.id).length;

  function apply(next: SortStepsItem[]) {
    setOrder(next);
    // Any move invalidates the previous verdict.
    setChecked(false);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    apply(next);
    emit("reordered", { from, to });
  }

  function handleCheck() {
    setChecked(true);
    emit("checked", { correct: isCorrect, misplaced });
    if (isCorrect && !solvedRef.current) {
      solvedRef.current = true;
      emit("completed", { steps: items.length });
      if (celebrate) void fireConfetti();
    }
  }

  function handleReset() {
    solvedRef.current = false;
    setChecked(false);
    setOrder(scramble(items));
  }

  return (
    <div
      ref={ref}
      data-slot="sort-steps"
      data-checked={checked || undefined}
      className={cn(
        "@container/sort rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      <p className="text-sm text-muted-foreground">
        <RichText>{ranking ? l.rankInstructions : l.instructions}</RichText>
      </p>

      {ranking && low != null && (
        <p className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ChevronUp aria-hidden className="size-3.5" />
          <RichText>{low}</RichText>
        </p>
      )}

      <ol className={cn("flex flex-col gap-2", ranking ? "mt-1.5" : "mt-3")}>
        {order.map((item, index) => {
          const settled = checked && item.id === items[index]?.id;
          const wrong = checked && item.id !== items[index]?.id;
          return (
            <li
              key={item.id}
              draggable
              onDragStart={(event) => {
                dragIndex.current = index;
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.id);
              }}
              onDragEnd={() => {
                dragIndex.current = null;
                setDragOver(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(index);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(null);
                const from = dragIndex.current;
                dragIndex.current = null;
                if (from == null) return;
                move(from, index);
              }}
              className={cn(
                "flex items-center gap-2 rounded-lg border bg-background p-2 shadow-wgt transition-colors",
                !checked && "border-input",
                settled &&
                  "border-success bg-[color-mix(in_oklab,var(--success)_10%,var(--card))]",
                wrong &&
                  "border-destructive bg-[color-mix(in_oklab,var(--destructive)_10%,var(--card))]",
                dragOver === index && "border-ring bg-accent",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums",
                  settled && "bg-success text-success-foreground",
                  wrong && "bg-destructive text-destructive-foreground",
                  !checked && "bg-muted text-muted-foreground",
                )}
              >
                {settled ? (
                  <Check className="size-4" />
                ) : wrong ? (
                  <X className="size-4" />
                ) : (
                  index + 1
                )}
              </span>

              <GripVertical
                aria-hidden
                className="hidden size-4 shrink-0 cursor-grab text-muted-foreground/60 @sm/sort:block"
              />

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  <RichText>{item.label}</RichText>
                </span>
                {item.hint != null && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    <RichText>{item.hint}</RichText>
                  </span>
                )}
              </span>

              <span className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  aria-label={l.moveUp}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  className="grid size-6 place-items-center rounded border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={l.moveDown}
                  disabled={index === order.length - 1}
                  onClick={() => move(index, index + 1)}
                  className="grid size-6 place-items-center rounded border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronDown className="size-4" />
                </button>
              </span>
            </li>
          );
        })}
      </ol>

      {ranking && high != null && (
        <p className="mt-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ChevronDown aria-hidden className="size-3.5" />
          <RichText>{high}</RichText>
        </p>
      )}

      {checked && (
        <div
          role="status"
          className={cn(
            "mt-4 rounded-md border p-3 text-sm font-semibold motion-safe:animate-wgt-fade-up",
            isCorrect
              ? "border-success/40 bg-[color-mix(in_oklab,var(--success)_8%,var(--card))]"
              : "border-destructive/40 bg-[color-mix(in_oklab,var(--destructive)_8%,var(--card))]",
          )}
        >
          <RichText>{isCorrect ? l.correct : l.incorrect}</RichText>
        </div>
      )}

      {checked && explanation != null && (
        <div className="mt-3 rounded-md border border-info/30 bg-[color-mix(in_oklab,var(--info)_8%,var(--card))] p-3 text-sm motion-safe:animate-wgt-fade-up">
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-info">
            {l.why}
          </p>
          <div className="text-card-foreground/90">
            <RichText>{explanation}</RichText>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          {l.reset}
        </Button>
        <Button size="sm" onClick={handleCheck}>
          {l.check}
        </Button>
      </div>
    </div>
  );
}

SortSteps.displayName = "SortSteps";
