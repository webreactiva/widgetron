import * as React from "react";
import { Check } from "@/lib/icons";

import { cn } from "@/lib/utils";

export interface ChecklistItem {
  text: React.ReactNode;
  hint?: React.ReactNode;
}

export interface ChecklistProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stable id — used to persist progress in localStorage. */
  id: string;
  items: ChecklistItem[];
  /**
   * Persist checked state across visits. Default: true. When false the
   * checklist is purely in-memory.
   */
  persist?: boolean;
}

const STORAGE_PREFIX = "widgetron-checklist:";

/**
 * Checklist — an actionable, persistent to-do list. Checked state is saved to
 * localStorage (keyed by `id`) so it survives reloads, making it a "take this
 * home" artifact. A progress bar reflects completion.
 */
export function Checklist({
  id,
  items,
  persist = true,
  className,
  ...props
}: ChecklistProps) {
  const storageKey = `${STORAGE_PREFIX}${id}`;
  const [checked, setChecked] = React.useState<Set<number>>(() => new Set());

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
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      if (persist && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {
          /* storage may be unavailable (private mode) */
        }
      }
      return next;
    });
  }

  const completed = checked.size;
  const pct = items.length ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div
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
                    {item.text}
                  </span>
                  {item.hint != null && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {item.hint}
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
    </div>
  );
}

Checklist.displayName = "Checklist";
