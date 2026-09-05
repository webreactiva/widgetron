import * as React from "react";
import { ArrowRight, Lightbulb } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { Button } from "@/primitives/button";
import { RichText } from "@/primitives/rich-text";

export interface ContrastLabels {
  /** Eyebrow over the belief the reader is about to have broken. */
  expected: React.ReactNode;
  /** Eyebrow over what really happens. */
  actual: React.ReactNode;
  /** Eyebrow over the explanation. */
  why: React.ReactNode;
  /** The commit control that reveals reality. */
  reveal: React.ReactNode;
  /** Accessible caption for the expected → actual relationship. */
  gap: string;
}

export const DEFAULT_CONTRAST_LABELS: ContrastLabels = {
  expected: "What most people assume",
  actual: "What actually happens",
  why: "Why",
  reveal: "Show what actually happens",
  gap: "Expectation versus reality",
};

export interface ContrastProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The belief the reader (or most readers) hold going in. */
  expected: React.ReactNode;
  /** What is actually the case. */
  actual: React.ReactNode;
  /** The explanation for the gap — where the teaching happens. */
  why?: React.ReactNode;
  /** Override the eyebrow over `expected` (e.g. "What the team predicted"). */
  expectedLabel?: React.ReactNode;
  /** Override the eyebrow over `actual` (e.g. "What the profiler says"). */
  actualLabel?: React.ReactNode;
  /**
   * Hold `actual` and `why` back behind a button, so the reader commits to the
   * expectation before reality lands. Default: true — once they have read the
   * answer, asking them to hold an expectation is theatre.
   */
  gate?: boolean;
  /** Where the real figure or behaviour comes from — a benchmark, the episode. */
  source?: React.ReactNode;
  /** Customizable / translatable strings. */
  labels?: Partial<ContrastLabels>;
}

/**
 * Contrast — expectation, then reality, then why.
 *
 * The move an explorable explanation is built on: a reader who never stated an
 * expectation has nothing for reality to correct, and an explanation they read
 * cold produces a convincing feeling of understanding that survives right up
 * until it is tested. This widget stages that gap explicitly — the belief on
 * one side, what is actually true on the other, and the reason between them.
 *
 * Reach for it after a benchmark, a profiler run, a design decision or a
 * production incident: anywhere the interesting thing is the distance between
 * what people think happens and what does. Quiz/PredictOutput generate the
 * same shape from a reader's own wrong answer; this one works when there is no
 * question to ask, only a belief to break.
 */
export function Contrast({
  expected,
  actual,
  why,
  expectedLabel,
  actualLabel,
  gate = true,
  source,
  labels,
  className,
  ...props
}: ContrastProps) {
  const l = useLabels("contrast", DEFAULT_CONTRAST_LABELS, labels);
  const { ref, emit } = useWidgetEvents("contrast");
  const [revealed, setRevealed] = React.useState(!gate);

  function handleReveal() {
    setRevealed(true);
    emit("revealed");
  }

  return (
    <div
      ref={ref}
      data-slot="contrast"
      data-revealed={revealed || undefined}
      className={cn(
        "@container/con rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      <div
        role="group"
        aria-label={l.gap}
        className="grid gap-3 @md/con:grid-cols-[1fr_auto_1fr] @md/con:items-stretch"
      >
        {/* The belief */}
        <div className="rounded-md border border-input bg-[color-mix(in_oklab,var(--muted)_45%,var(--card))] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <RichText>{expectedLabel ?? l.expected}</RichText>
          </p>
          <div className="mt-1.5 text-sm text-card-foreground/90">
            <RichText>{expected}</RichText>
          </div>
        </div>

        <div
          aria-hidden
          className="grid place-items-center text-muted-foreground @md/con:px-1"
        >
          <ArrowRight className="size-5 rotate-90 @md/con:rotate-0" />
        </div>

        {/* Reality */}
        {revealed ? (
          <div className="rounded-md border border-primary/45 bg-[color-mix(in_oklab,var(--primary)_10%,var(--card))] p-3 motion-safe:animate-wgt-fade-up">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              <RichText>{actualLabel ?? l.actual}</RichText>
            </p>
            <div className="mt-1.5 text-sm font-medium text-card-foreground">
              <RichText>{actual}</RichText>
            </div>
          </div>
        ) : (
          <div className="grid place-items-center rounded-md border border-dashed border-input p-3">
            <Button size="sm" onClick={handleReveal}>
              {l.reveal}
            </Button>
          </div>
        )}
      </div>

      {revealed && why != null && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-info/30 bg-[color-mix(in_oklab,var(--info)_8%,var(--card))] p-3 text-sm motion-safe:animate-wgt-fade-up">
          <Lightbulb aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
          <div>
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-info">
              <RichText>{l.why}</RichText>
            </p>
            <div className="text-card-foreground/90">
              <RichText>{why}</RichText>
            </div>
          </div>
        </div>
      )}

      {revealed && source != null && (
        <p className="mt-2 text-xs text-muted-foreground">
          <RichText>{source}</RichText>
        </p>
      )}
    </div>
  );
}

Contrast.displayName = "Contrast";
