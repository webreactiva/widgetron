import * as React from "react";
import { Check, Gift } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText } from "@/primitives/rich-text";

export interface ChecklistItem {
  text: React.ReactNode;
  hint?: React.ReactNode;
}

export interface ChecklistLabels {
  /** Fallback celebration shown when all items are checked and no `completion`
   * copy was authored. */
  done: React.ReactNode;
}

export const DEFAULT_CHECKLIST_LABELS: ChecklistLabels = {
  done: "All done!",
};

export interface ChecklistProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stable id — used to persist progress in localStorage. */
  id: string;
  items: ChecklistItem[];
  /**
   * Persist checked state across visits. Default: true. When false the
   * checklist is purely in-memory.
   */
  persist?: boolean;
  /**
   * Payoff revealed when every item is checked — people like something to
   * happen. Recommended. When omitted, a translatable default acknowledgement
   * is shown; pass `null` to suppress the banner entirely.
   */
  completion?: React.ReactNode;
  /**
   * Fire a confetti burst the moment the reader ticks the last item. Default:
   * true. Never fires on load for an already-completed list, and respects
   * reduced-motion.
   */
  celebrate?: boolean;
  /** Customizable / translatable strings. */
  labels?: Partial<ChecklistLabels>;
}

const STORAGE_PREFIX = "widgetron-checklist:";

/**
 * Checklist — an actionable, persistent to-do list. Checked state is saved to
 * localStorage (keyed by `id`) so it survives reloads, making it a "take this
 * home" artifact. A progress bar reflects completion, and finishing every item
 * reveals a completion payoff (with an optional confetti burst).
 */
export function Checklist({
  id,
  items,
  persist = true,
  completion,
  celebrate = true,
  labels,
  className,
  ...props
}: ChecklistProps) {
  const l = useLabels("checklist", DEFAULT_CHECKLIST_LABELS, labels);
  const { ref, emit } = useWidgetEvents("checklist", id);
  const storageKey = `${STORAGE_PREFIX}${id}`;
  const [checked, setChecked] = React.useState<Set<number>>(() => new Set());
  // Only celebrate completions the reader triggers — never the hydration of an
  // already-finished list on load.
  const interacted = React.useRef(false);
  // "completed" fires at most once per mount — unchecking and re-checking the
  // last item must not re-emit it.
  const completedEmitted = React.useRef(false);

  // Hydrate from storage after mount (SSR-safe).
  React.useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setChecked(new Set(JSON.parse(raw) as number[]));
    } catch {
      /* ignore malformed storage */
    }
  }, [persist, storageKey]);

  function toggle(index: number) {
    interacted.current = true;
    // Compute the next state outside the updater: emissions and storage writes
    // are side effects, and Strict Mode double-invokes updater functions.
    const next = new Set(checked);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setChecked(next);
    if (persist && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        /* storage may be unavailable (private mode) */
      }
    }
    emit("item_toggled", {
      index,
      checked: next.has(index),
      completed: next.size,
      total: items.length,
    });
    if (
      items.length > 0 &&
      next.size === items.length &&
      !completedEmitted.current
    ) {
      completedEmitted.current = true;
      emit("completed", { total: items.length });
    }
  }

  const completed = checked.size;
  const allDone = items.length > 0 && completed === items.length;
  const pct = items.length ? Math.round((completed / items.length) * 100) : 0;

  React.useEffect(() => {
    if (allDone && interacted.current && celebrate) void fireConfetti();
  }, [allDone, celebrate]);

  const showCompletion = allDone && completion !== null;

  return (
    <div
      ref={ref}
      data-slot="checklist"
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <ul className="flex flex-col gap-1">
        {items.map((item, index) => {
          const isDone = checked.has(index);
          return (
            <li key={index}>
              <button
                type="button"
                role="checkbox"
                aria-checked={isDone}
                onClick={() => toggle(index)}
                className="flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition-colors",
                    isDone
                      ? "border-success bg-success text-success-foreground"
                      : "border-input",
                  )}
                >
                  {isDone && <Check className="size-3.5" />}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-sm",
                      isDone && "text-muted-foreground line-through",
                    )}
                  >
                    <RichText>{item.text}</RichText>
                  </span>
                  {item.hint != null && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      <RichText>{item.hint}</RichText>
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Progress */}
      <div className="mt-3 flex items-center gap-3 px-2">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-success transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {completed}/{items.length}
        </span>
      </div>

      {/* Completion payoff */}
      {showCompletion && (
        <div
          role="status"
          className="mt-3 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success motion-safe:animate-wgt-fade-up"
        >
          <Gift className="size-4 shrink-0" aria-hidden />
          <span>
            <RichText>{completion ?? l.done}</RichText>
          </span>
        </div>
      )}
    </div>
  );
}

Checklist.displayName = "Checklist";
