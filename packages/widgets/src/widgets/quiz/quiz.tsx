import * as React from "react";
import { Check, RotateCcw, X } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";

export interface QuizOption {
  /** The answer text shown to the learner. */
  text: React.ReactNode;
  /** Whether this option is the correct answer. */
  correct?: boolean;
  /** Per-option explanation, shown after the learner answers. */
  feedback?: React.ReactNode;
}

export interface QuizLabels {
  scenario: React.ReactNode;
  correct: React.ReactNode;
  incorrect: React.ReactNode;
  tryAgain: React.ReactNode;
  /** Accessible name for the options group. */
  options: string;
}

export const DEFAULT_QUIZ_LABELS: QuizLabels = {
  scenario: "Scenario",
  correct: "Correct",
  incorrect: "Not quite",
  tryAgain: "Try again",
  options: "Answer options",
};

export interface QuizProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The question prompt. */
  question: React.ReactNode;
  /** The selectable answers. Exactly one should set `correct: true`. */
  options: QuizOption[];
  /** Optional scenario / context block shown above the question. */
  scenario?: React.ReactNode;
  /** Fire confetti when the learner answers correctly. Default: true. */
  celebrate?: boolean;
  /** Allow retrying after answering. Default: true. */
  allowRetry?: boolean;
  /** Customizable / translatable strings. */
  labels?: Partial<QuizLabels>;
  /** Called once the learner picks an option. */
  onAnswered?: (option: QuizOption, index: number, correct: boolean) => void;
}

type OptionStatus = "idle" | "correct" | "selected-wrong" | "missed";

function optionStatus(
  option: QuizOption,
  index: number,
  selected: number | null,
): OptionStatus {
  if (selected === null) return "idle";
  if (option.correct) return "correct";
  if (index === selected) return "selected-wrong";
  return "missed";
}

async function fireConfetti() {
  try {
    const mod = await import("canvas-confetti");
    mod.default({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.7 },
      disableForReducedMotion: true,
    });
  } catch {
    /* canvas-confetti is optional — silently skip if unavailable */
  }
}

/**
 * Quiz — single-question, application-style assessment with instant per-option
 * feedback and an optional celebration. Mobile-first: options are full-width,
 * thumb-sized tap targets stacked vertically; the retry control sits at the
 * bottom within thumb reach. All copy is customizable/translatable via `labels`
 * (or globally through WidgetronProvider).
 */
export function Quiz({
  question,
  options,
  scenario,
  celebrate = true,
  allowRetry = true,
  labels,
  onAnswered,
  className,
  ...props
}: QuizProps) {
  const l = useLabels("quiz", DEFAULT_QUIZ_LABELS, labels);
  const [selected, setSelected] = React.useState<number | null>(null);
  const answered = selected !== null;
  const selectedOption = selected !== null ? options[selected] : null;
  const isCorrect = Boolean(selectedOption?.correct);

  function handleSelect(index: number) {
    if (answered) return;
    const option = options[index];
    setSelected(index);
    if (option.correct && celebrate) void fireConfetti();
    onAnswered?.(option, index, Boolean(option.correct));
  }

  return (
    <div
      data-slot="quiz"
      data-answered={answered || undefined}
      className={cn(
        "@container/quiz rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      {scenario != null && (
        <div className="mb-4 rounded-md border border-info/30 bg-[color-mix(in_oklab,var(--info)_8%,var(--card))] p-3 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-info">
            {l.scenario}
          </p>
          <div className="text-card-foreground/90">{scenario}</div>
        </div>
      )}

      <p className="font-display text-lg font-semibold leading-snug @md/quiz:text-xl">
        {question}
      </p>

      <div role="group" aria-label={l.options} className="mt-4 flex flex-col gap-2">
        {options.map((option, index) => {
          const status = optionStatus(option, index, selected);
          return (
            <button
              key={index}
              type="button"
              disabled={answered}
              aria-pressed={index === selected}
              onClick={() => handleSelect(index)}
              className={cn(
                "group flex min-h-11 w-full items-center gap-3 rounded-md border px-4 py-2.5 text-left text-sm transition-colors",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                status === "idle" &&
                  "cursor-pointer border-input bg-background hover:border-ring hover:bg-accent",
                status === "correct" &&
                  "border-success bg-[color-mix(in_oklab,var(--success)_12%,var(--card))] text-foreground",
                status === "selected-wrong" &&
                  "border-destructive bg-[color-mix(in_oklab,var(--destructive)_12%,var(--card))] text-foreground",
                status === "missed" && "border-input opacity-55",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border text-current",
                  status === "idle" && "border-muted-foreground/40",
                  status === "correct" &&
                    "border-success bg-success text-success-foreground",
                  status === "selected-wrong" &&
                    "border-destructive bg-destructive text-destructive-foreground",
                  status === "missed" && "border-muted-foreground/30",
                )}
              >
                {status === "correct" && <Check className="size-3.5" />}
                {status === "selected-wrong" && <X className="size-3.5" />}
              </span>
              <span className="flex-1">{option.text}</span>
            </button>
          );
        })}
      </div>

      {answered && selectedOption?.feedback && (
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

      {answered && allowRetry && (
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
            <RotateCcw />
            {l.tryAgain}
          </Button>
        </div>
      )}
    </div>
  );
}

Quiz.displayName = "Quiz";
