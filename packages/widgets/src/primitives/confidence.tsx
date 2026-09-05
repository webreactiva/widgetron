import * as React from "react";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { RichText } from "@/primitives/rich-text";

/**
 * Confidence calibration — the shared layer behind every scored widget's
 * opt-in `confidence` prop.
 *
 * A check tells you whether the reader got it right. It does not tell you
 * whether they *trusted* the answer, and that is the more useful signal: a
 * belief the reader is sure of and that does not hold is exactly the thing an
 * explanation exists to repair, and it is invisible without asking. Four
 * outcomes, and only two of them are worth a word:
 *
 * |            | correct           | wrong                  |
 * | ---------- | ----------------- | ---------------------- |
 * | confident  | fine              | **the valuable one**   |
 * | unsure     | worth locking in  | expected               |
 *
 * The reader commits a confidence BEFORE answering — asked afterwards it is
 * hindsight, not calibration.
 *
 * Use it on the two or three checks in a guide where a misconception is
 * likely, never on all of them: asked constantly it becomes a tic and readers
 * stop reading it.
 */

/** 1 = guessing · 2 = fairly sure · 3 = certain. */
export type ConfidenceLevel = 1 | 2 | 3;

/** The quadrant a (confidence, outcome) pair lands in. */
export type Calibration =
  | "confident-right"
  | "confident-wrong"
  | "unsure-right"
  | "unsure-wrong";

export interface ConfidenceLabels {
  /** The question above the scale. */
  question: React.ReactNode;
  /** Level 1. */
  guessing: React.ReactNode;
  /** Level 2. */
  fairly: React.ReactNode;
  /** Level 3. */
  certain: React.ReactNode;
  /** Nudge shown while the check is locked waiting for a confidence pick. */
  required: React.ReactNode;
  /** Verdict for each quadrant, shown next to the answer's own feedback. */
  confidentRight: React.ReactNode;
  confidentWrong: React.ReactNode;
  unsureRight: React.ReactNode;
  unsureWrong: React.ReactNode;
  /** Accessible name for the radio group. */
  group: string;
}

export const DEFAULT_CONFIDENCE_LABELS: ConfidenceLabels = {
  question: "Before you answer — how sure are you?",
  guessing: "Guessing",
  fairly: "Fairly sure",
  certain: "Certain",
  required: "Pick how sure you are first.",
  confidentRight: "Sure, and right. Lock it in.",
  confidentWrong:
    "You were sure, and it doesn't hold. This is the belief worth rewriting — read the why below twice.",
  unsureRight: "Right, but you didn't trust it. Now you know you can.",
  unsureWrong: "Wrong, and you knew it was shaky. Nothing to unlearn — just this to learn.",
  group: "How sure are you?",
};

/** Which quadrant did the reader land in? Level 3 counts as confident. */
export function calibrationOf(
  level: ConfidenceLevel,
  correct: boolean,
): Calibration {
  const confident = level >= 3;
  if (confident) return correct ? "confident-right" : "confident-wrong";
  return correct ? "unsure-right" : "unsure-wrong";
}

const LEVELS: ConfidenceLevel[] = [1, 2, 3];

export interface ConfidenceScaleProps {
  /** The committed level, or null while the reader hasn't picked one. */
  value: ConfidenceLevel | null;
  /** Called when the reader picks a level. */
  onChange: (level: ConfidenceLevel) => void;
  /** Lock the scale (the check has been answered). */
  disabled?: boolean;
  /** Customizable / translatable strings. */
  labels?: Partial<ConfidenceLabels>;
  className?: string;
}

/**
 * The pre-answer scale. Render it above the interaction; the host widget keeps
 * its own answer path locked until `value` is set.
 */
export function ConfidenceScale({
  value,
  onChange,
  disabled,
  labels,
  className,
}: ConfidenceScaleProps) {
  const l = useLabels("confidence", DEFAULT_CONFIDENCE_LABELS, labels);
  return (
    <div
      data-slot="confidence-scale"
      data-picked={value ?? undefined}
      className={cn(
        "rounded-md border border-dashed border-input bg-[color-mix(in_oklab,var(--muted)_45%,var(--card))] p-3",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <RichText>{l.question}</RichText>
      </p>
      <div
        role="radiogroup"
        aria-label={l.group}
        className="mt-2 flex flex-wrap gap-2"
      >
        {LEVELS.map((level) => {
          const active = value === level;
          const text =
            level === 1 ? l.guessing : level === 2 ? l.fairly : l.certain;
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(level)}
              className={cn(
                "min-h-9 flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "cursor-pointer border-input bg-background hover:border-ring hover:bg-accent",
                disabled && !active && "opacity-55",
                disabled && "cursor-not-allowed",
              )}
            >
              <RichText>{text}</RichText>
            </button>
          );
        })}
      </div>
    </div>
  );
}

ConfidenceScale.displayName = "ConfidenceScale";

export interface CalibrationNoteProps {
  level: ConfidenceLevel;
  correct: boolean;
  labels?: Partial<ConfidenceLabels>;
  className?: string;
}

/**
 * The read-out, shown after answering. `confident-wrong` is the one that gets
 * the loud treatment — it is the only quadrant that names a belief to repair.
 */
export function CalibrationNote({
  level,
  correct,
  labels,
  className,
}: CalibrationNoteProps) {
  const l = useLabels("confidence", DEFAULT_CONFIDENCE_LABELS, labels);
  const quadrant = calibrationOf(level, correct);
  const text =
    quadrant === "confident-right"
      ? l.confidentRight
      : quadrant === "confident-wrong"
        ? l.confidentWrong
        : quadrant === "unsure-right"
          ? l.unsureRight
          : l.unsureWrong;
  const loud = quadrant === "confident-wrong";
  return (
    <p
      data-slot="calibration-note"
      data-calibration={quadrant}
      role="status"
      className={cn(
        "mt-3 rounded-md border p-3 text-sm motion-safe:animate-wgt-fade-up",
        loud
          ? "border-warning/50 bg-[color-mix(in_oklab,var(--warning)_12%,var(--card))] font-medium text-card-foreground"
          : "border-input bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-muted-foreground",
        className,
      )}
    >
      <RichText>{text}</RichText>
    </p>
  );
}

CalibrationNote.displayName = "CalibrationNote";

/** The nudge shown where the answer path would be, before a level is picked. */
export function ConfidenceRequired({
  labels,
  className,
}: {
  labels?: Partial<ConfidenceLabels>;
  className?: string;
}) {
  const l = useLabels("confidence", DEFAULT_CONFIDENCE_LABELS, labels);
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      <RichText>{l.required}</RichText>
    </p>
  );
}

ConfidenceRequired.displayName = "ConfidenceRequired";
