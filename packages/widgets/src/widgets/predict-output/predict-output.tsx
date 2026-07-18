import * as React from "react";
import { Check, RotateCcw, X } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";

export interface PredictOption {
  /** The predicted-output text shown to the learner. */
  text: React.ReactNode;
  /** Whether this option is the correct prediction. */
  correct?: boolean;
  /** Per-option explanation, shown after the learner answers. */
  feedback?: React.ReactNode;
}

export interface PredictOutputLabels {
  reveal: React.ReactNode;
  correct: React.ReactNode;
  incorrect: React.ReactNode;
  tryAgain: React.ReactNode;
  question: React.ReactNode;
  /** Small uppercase label shown above the revealed output. */
  outputLabel: React.ReactNode;
}

export const DEFAULT_PREDICT_OUTPUT_LABELS: PredictOutputLabels = {
  reveal: "Reveal output",
  correct: "Correct!",
  incorrect: "Not quite",
  tryAgain: "Try again",
  question: "What will this print?",
  outputLabel: "Output",
};

export interface PredictOutputProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The code to study. A plain string is rendered verbatim inside a `<pre>`;
   * pass a React node if you have pre-highlighted markup.
   */
  code: React.ReactNode;
  /** The ACTUAL program output, revealed once the learner answers/reveals. */
  output: React.ReactNode;
  /** The prediction prompt. Defaults to `labels.question`. */
  question?: React.ReactNode;
  /**
   * Optional multiple-choice predictions. When provided, the learner picks an
   * option (which reveals the output); otherwise a "Reveal output" button is
   * shown. Exactly one option should set `correct: true`.
   */
  options?: PredictOption[];
  /** Customizable / translatable strings. */
  labels?: Partial<PredictOutputLabels>;
}

type OptionStatus = "idle" | "correct" | "selected-wrong" | "missed";

function optionStatus(
  option: PredictOption,
  index: number,
  selected: number | null,
): OptionStatus {
  if (selected === null) return "idle";
  if (option.correct) return "correct";
  if (index === selected) return "selected-wrong";
  return "missed";
}

/**
 * PredictOutput — an active-recall widget: show some code, ask the reader to
 * predict what it prints, then reveal the actual output. Either offer
 * multiple-choice predictions (quiz-style options with instant per-option
 * feedback) or a single "Reveal output" control. Mobile-first: the code block
 * stacks above the controls, options are full-width thumb-sized tap targets,
 * and the retry control sits at the bottom within thumb reach. All copy is
 * customizable/translatable via `labels` (or globally through
 * WidgetronProvider).
 */
export function PredictOutput({
  code,
  output,
  question,
  options,
  labels,
  className,
  ...props
}: PredictOutputProps) {
  const l = useLabels("predictOutput", DEFAULT_PREDICT_OUTPUT_LABELS, labels);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);

  const hasOptions = options != null && options.length > 0;
  const selectedOption =
    selected !== null && options ? options[selected] : null;
  const isCorrect = Boolean(selectedOption?.correct);
  const answered = revealed || selected !== null;

  function handleSelect(index: number) {
    if (selected !== null) return;
    setSelected(index);
    setRevealed(true);
  }

  function handleReveal() {
    setRevealed(true);
  }

  function handleReset() {
    setSelected(null);
    setRevealed(false);
  }

  const prompt = question ?? l.question;

  return (
    <div
      data-slot="predict-output"
      data-answered={answered || undefined}
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <pre className="overflow-x-auto rounded-md bg-[var(--wgt-code-bg)] p-4 font-mono text-sm leading-relaxed text-[var(--wgt-code-fg)]">
        {code}
      </pre>

      <p className="mt-4 font-display text-base font-semibold leading-snug">
        {prompt}
      </p>

      {hasOptions ? (
        <div role="group" className="mt-4 flex flex-col gap-2">
          {options.map((option, index) => {
            const status = optionStatus(option, index, selected);
            return (
              <button
                key={index}
                type="button"
                disabled={selected !== null}
                aria-pressed={index === selected}
                onClick={() => handleSelect(index)}
                className={cn(
                  "group flex min-h-11 w-full items-center gap-3 rounded-md border px-4 py-2.5 text-left text-sm transition-colors",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                  status === "idle" &&
                    "cursor-pointer border-input bg-background hover:border-ring hover:bg-accent",
                  status === "correct" &&
                    "animate-wgt-glow border-success bg-[color-mix(in_oklab,var(--success)_12%,var(--card))] text-foreground",
                  status === "selected-wrong" &&
                    "animate-wgt-shake border-destructive bg-[color-mix(in_oklab,var(--destructive)_12%,var(--card))] text-foreground",
                  status === "missed" && "border-input opacity-55",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border text-current",
                    status === "idle" && "border-muted-foreground/40",
                    status === "correct" &&
                      "animate-wgt-pop border-success bg-success text-success-foreground",
                    status === "selected-wrong" &&
                      "animate-wgt-pop border-destructive bg-destructive text-destructive-foreground",
                    status === "missed" && "border-muted-foreground/30",
                  )}
                >
                  {status === "correct" && <Check className="size-3.5" />}
                  {status === "selected-wrong" && <X className="size-3.5" />}
                </span>
                <span className="flex-1 font-mono">{option.text}</span>
              </button>
            );
          })}
        </div>
      ) : (
        !revealed && (
          <div className="mt-4">
            <Button onClick={handleReveal}>{l.reveal}</Button>
          </div>
        )
      )}

      {hasOptions && selectedOption?.feedback && (
        <div
          role="status"
          className={cn(
            "mt-4 rounded-md border p-3 text-sm motion-safe:animate-wgt-fade-up",
            isCorrect
              ? "border-success/40 bg-[color-mix(in_oklab,var(--success)_8%,var(--card))]"
              : "border-destructive/40 bg-[color-mix(in_oklab,var(--destructive)_8%,var(--card))]",
          )}
        >
          <p className="mb-0.5 font-semibold">
            {isCorrect ? l.correct : l.incorrect}
          </p>
          <p className="text-card-foreground/90">{selectedOption.feedback}</p>
        </div>
      )}

      {answered && (
        <div
          role="status"
          className="mt-4 overflow-hidden rounded-md bg-[var(--wgt-code-bg)] text-[var(--wgt-code-fg)] motion-safe:animate-wgt-fade-up"
        >
          <p className="border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/50">
            {l.outputLabel}
          </p>
          <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
            {output}
          </pre>
        </div>
      )}

      {answered && (
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw />
            {l.tryAgain}
          </Button>
        </div>
      )}
    </div>
  );
}

PredictOutput.displayName = "PredictOutput";
