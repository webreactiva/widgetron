import * as React from "react";
import { Check, ChevronLeft, ChevronRight, RotateCcw, X } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { RichText } from "@/primitives/rich-text";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";

export interface Flashcard {
  front: React.ReactNode;
  back: React.ReactNode;
}

export interface FlashcardsLabels {
  prompt: React.ReactNode;
  answer: React.ReactNode;
  knewIt: React.ReactNode;
  review: React.ReactNode;
  previous: string;
  next: string;
  graded: React.ReactNode;
  deckComplete: React.ReactNode;
  studyAgain: React.ReactNode;
  /** Summary line shown when the deck is complete. */
  summary: (known: number, total: number) => React.ReactNode;
  flipToReveal: string;
  flipBack: string;
}

export const DEFAULT_FLASHCARDS_LABELS: FlashcardsLabels = {
  prompt: "Prompt",
  answer: "Answer",
  knewIt: "Knew it",
  review: "Review",
  previous: "Previous card",
  next: "Next card",
  graded: "graded",
  deckComplete: "Deck complete",
  studyAgain: "Study again",
  summary: (known, total) =>
    `You knew ${known} of ${total} card${total === 1 ? "" : "s"}.`,
  flipToReveal: "Showing the prompt. Activate to reveal the answer.",
  flipBack: "Showing the answer. Activate to flip back.",
};

export interface FlashcardsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  cards: Flashcard[];
  labels?: Partial<FlashcardsLabels>;
  /** Fired when the learner grades a card. */
  onGrade?: (index: number, knew: boolean) => void;
}

/**
 * Flashcards — a flip deck for active recall. Click / tap the card (or press
 * Space/Enter) to reveal the answer, then grade it. Navigation and grading
 * controls sit below the card, full-width and thumb-reachable on mobile.
 */
export function Flashcards({
  cards,
  labels,
  onGrade,
  className,
  ...props
}: FlashcardsProps) {
  const l = useLabels("flashcards", DEFAULT_FLASHCARDS_LABELS, labels);
  const { ref, emit } = useWidgetEvents("flashcards");
  const [index, setIndex] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [grades, setGrades] = React.useState<Record<number, boolean>>({});

  const total = cards.length;
  const card = cards[index];
  const gradedCount = Object.keys(grades).length;
  const knownCount = Object.values(grades).filter(Boolean).length;
  const done = gradedCount === total;

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => (i + delta + total) % total);
  }

  function gradeCard(knew: boolean) {
    const nextGrades = { ...grades, [index]: knew };
    setGrades(nextGrades);
    emit("graded", {
      index,
      knew,
      graded: Object.keys(nextGrades).length,
      total,
    });
    onGrade?.(index, knew);
    if (Object.keys(nextGrades).length === total) {
      emit("completed", {
        known: Object.values(nextGrades).filter(Boolean).length,
        total,
      });
    }
    const nextUngraded = findNextUngraded(index, nextGrades, total);
    setFlipped(false);
    if (nextUngraded !== null) setIndex(nextUngraded);
  }

  function reset() {
    setGrades({});
    setFlipped(false);
    setIndex(0);
  }

  if (done) {
    return (
      <div
        ref={ref}
        data-slot="flashcards"
        className={cn(
          "rounded-lg border bg-card p-6 text-center text-card-foreground shadow-wgt motion-safe:animate-wgt-pop",
          className,
        )}
        {...props}
      >
        <p className="font-display text-lg font-bold">{l.deckComplete}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {l.summary(knownCount, total)}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
          <RotateCcw />
          {l.studyAgain}
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-slot="flashcards"
      className={cn("flex flex-col items-center gap-4", className)}
      {...props}
    >
      <button
        type="button"
        aria-pressed={flipped}
        aria-label={flipped ? l.flipBack : l.flipToReveal}
        onClick={() => setFlipped((f) => !f)}
        className="group w-full max-w-md [perspective:1200px] outline-none transition-[translate] duration-(--motion-fast) ease-(--ease-out) hover:-translate-y-0.5"
      >
        <div
          className={cn(
            "relative h-56 w-full rounded-lg transition-transform duration-500 [transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]",
          )}
        >
          {/* Front */}
          <div className="absolute inset-0 grid overflow-y-auto rounded-lg border bg-card p-6 text-center shadow-wgt [backface-visibility:hidden] group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background">
            <div className="m-auto">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {l.prompt}
              </p>
              <div className="font-display text-lg font-semibold">
                <RichText>{card.front}</RichText>
              </div>
            </div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 grid overflow-y-auto rounded-lg border border-primary/40 bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))] p-6 text-center shadow-wgt [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="m-auto">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                {l.answer}
              </p>
              <div className="text-sm">
                <RichText>{card.back}</RichText>
              </div>
            </div>
          </div>
        </div>
      </button>

      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={l.previous}
            onClick={() => go(-1)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm tabular-nums text-muted-foreground">
            {index + 1} / {total}
            <span className="ml-2 text-xs">
              · {gradedCount} {l.graded}
            </span>
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label={l.next}
            onClick={() => go(1)}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-1 border-success bg-[color-mix(in_oklab,var(--success)_14%,var(--card))] text-foreground hover:bg-[color-mix(in_oklab,var(--success)_22%,var(--card))]"
            variant="outline"
            onClick={() => gradeCard(true)}
          >
            <Check className="text-success" />
            {l.knewIt}
          </Button>
          <Button
            className="flex-1 border-destructive bg-[color-mix(in_oklab,var(--destructive)_12%,var(--card))] text-foreground hover:bg-[color-mix(in_oklab,var(--destructive)_20%,var(--card))]"
            variant="outline"
            onClick={() => gradeCard(false)}
          >
            <X className="text-destructive" />
            {l.review}
          </Button>
        </div>
      </div>
    </div>
  );
}

Flashcards.displayName = "Flashcards";

function findNextUngraded(
  from: number,
  grades: Record<number, boolean>,
  total: number,
): number | null {
  for (let step = 1; step <= total; step++) {
    const candidate = (from + step) % total;
    if (!(candidate in grades)) return candidate;
  }
  return null;
}
