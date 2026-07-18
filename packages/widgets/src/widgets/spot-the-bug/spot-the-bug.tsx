import * as React from "react";
import { Check, RotateCcw, X } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";

export interface BugLine {
  /** The code shown on this line. A plain string is rendered verbatim; pass a
   * React node if you have pre-highlighted markup. */
  code: React.ReactNode;
  /** Whether this line contains the bug. Exactly one line should set this. */
  buggy?: boolean;
  /** Explanation revealed when the learner finds this (buggy) line. */
  explanation?: React.ReactNode;
}

export interface SpotTheBugLabels {
  /** Instruction shown above the code. */
  prompt: React.ReactNode;
  /** Heading for the success panel (used when the buggy line has no explanation). */
  found: React.ReactNode;
  /** Transient hint shown when the learner clicks a non-buggy line. */
  notHere: React.ReactNode;
  /** Label for the reset control shown after solving. */
  tryAgain: React.ReactNode;
}

export const DEFAULT_SPOT_THE_BUG_LABELS: SpotTheBugLabels = {
  prompt: "Click the line you think has the bug.",
  found: "You found it!",
  notHere: "Not this line — keep looking.",
  tryAgain: "Try again",
};

export interface SpotTheBugProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The code lines. Exactly one should set `buggy: true`. */
  lines: BugLine[];
  /** Customizable / translatable strings. */
  labels?: Partial<SpotTheBugLabels>;
}

/**
 * SpotTheBug — an interactive code-debugging archetype. The learner reads a
 * block of code and clicks the line they think holds the bug. The correct line
 * locks in green and reveals its explanation; a wrong click flashes red with a
 * gentle "keep looking" cue but never locks, so the learner can keep trying.
 * Mobile-first: lines are full-width buttons with readable mono text and a
 * horizontally scrollable code surface so long lines never break the layout.
 * All copy is customizable/translatable via `labels` (or globally through
 * WidgetronProvider).
 */
export function SpotTheBug({
  lines,
  labels,
  className,
  ...props
}: SpotTheBugProps) {
  const l = useLabels("spotTheBug", DEFAULT_SPOT_THE_BUG_LABELS, labels);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [wrong, setWrong] = React.useState<number | null>(null);

  const solved =
    selected !== null && Boolean(lines[selected]?.buggy);

  function handleSelect(index: number) {
    if (solved) return;
    if (lines[index]?.buggy) {
      setSelected(index);
      setWrong(null);
    } else {
      setSelected(index);
      setWrong(index);
    }
  }

  function reset() {
    setSelected(null);
    setWrong(null);
  }

  const buggyLine = lines.find((line) => line.buggy);

  return (
    <div
      data-slot="spot-the-bug"
      data-solved={solved || undefined}
      className={cn(
        "@container/stb overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <p className="border-b px-4 py-2 text-xs text-muted-foreground">
        {l.prompt}
      </p>

      <div className="overflow-x-auto bg-[var(--wgt-code-bg)] text-[var(--wgt-code-fg)]">
        <ol className="min-w-full font-mono text-sm leading-relaxed">
          {lines.map((line, index) => {
            const isCorrect = solved && index === selected;
            const isWrong = !solved && wrong === index;
            return (
              <li key={index}>
                <button
                  type="button"
                  disabled={solved}
                  aria-pressed={index === selected}
                  onClick={() => handleSelect(index)}
                  className={cn(
                    "flex w-full items-start gap-3 border-l-2 border-transparent px-4 py-1 text-left transition-colors",
                    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    !solved &&
                      "cursor-pointer hover:bg-white/5 focus-visible:bg-white/5",
                    isCorrect &&
                      "border-l-[var(--success)] bg-[color-mix(in_oklab,var(--success)_18%,transparent)]",
                    isWrong &&
                      "animate-wgt-shake border-l-[var(--destructive)] bg-[color-mix(in_oklab,var(--destructive)_18%,transparent)]",
                  )}
                >
                  <span
                    aria-hidden
                    className="w-6 shrink-0 select-none text-right text-[var(--wgt-code-comment)] tabular-nums"
                  >
                    {index + 1}
                  </span>
                  <code className="flex-1 whitespace-pre">{line.code}</code>
                  <span aria-hidden className="w-4 shrink-0">
                    {isCorrect && (
                      <Check className="size-4 animate-wgt-pop text-[var(--success)]" />
                    )}
                    {isWrong && (
                      <X className="size-4 animate-wgt-pop text-[var(--destructive)]" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {solved && (
        <div
          role="status"
          className="flex items-start gap-2 border-t border-success/40 bg-[color-mix(in_oklab,var(--success)_8%,var(--card))] p-3 text-sm"
        >
          <span
            aria-hidden
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success text-success-foreground"
          >
            <Check className="size-3.5" />
          </span>
          <div className="text-card-foreground/90">
            {buggyLine?.explanation ?? l.found}
          </div>
        </div>
      )}

      {!solved && wrong !== null && (
        <div
          role="status"
          className="flex items-center gap-2 border-t border-destructive/40 bg-[color-mix(in_oklab,var(--destructive)_8%,var(--card))] p-3 text-sm text-card-foreground/90"
        >
          <X className="size-4 shrink-0 text-destructive" />
          <span>{l.notHere}</span>
        </div>
      )}

      {solved && (
        <div className="flex justify-end border-t p-3">
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw />
            {l.tryAgain}
          </Button>
        </div>
      )}
    </div>
  );
}

SpotTheBug.displayName = "SpotTheBug";
