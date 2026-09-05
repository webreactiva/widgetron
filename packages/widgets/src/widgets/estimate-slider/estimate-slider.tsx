import * as React from "react";

import { cn } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import { formatValue } from "@/lib/formula";
import { useLabels, useLocale } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { Button } from "@/primitives/button";
import {
  CalibrationNote,
  ConfidenceRequired,
  ConfidenceScale,
  calibrationOf,
  type ConfidenceLabels,
  type ConfidenceLevel,
} from "@/primitives/confidence";
import { RichText } from "@/primitives/rich-text";

export interface EstimateSliderLabels {
  submit: React.ReactNode;
  tryAgain: React.ReactNode;
  yourGuess: React.ReactNode;
  actual: React.ReactNode;
  close: React.ReactNode;
  off: React.ReactNode;
  /** Accessible name for the range input. */
  slider: string;
}

export const DEFAULT_ESTIMATE_SLIDER_LABELS: EstimateSliderLabels = {
  submit: "Lock in my guess",
  tryAgain: "Guess again",
  yourGuess: "Your guess",
  actual: "The real number",
  close: "Nice — you were close.",
  off: "Off by",
  slider: "Your estimate",
};

export interface EstimateSliderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** The question the reader estimates an answer to. */
  question: React.ReactNode;
  /** Lowest value the slider allows. */
  min: number;
  /** Highest value the slider allows. */
  max: number;
  /** Slider granularity. Default: 1. */
  step?: number;
  /** Where the handle starts. Default: the midpoint of the range. */
  initial?: number;
  /** The true value — revealed after the reader commits a guess. */
  answer: number;
  /**
   * How far off still counts as "close", in value units. Default: 10% of the
   * range.
   */
  tolerance?: number;
  /** Suffix appended to every formatted number (e.g. " %", " ms", "€"). */
  unit?: string;
  /** Number format: integer | decimal | currency | percent | compact. */
  format?: string;
  /** BCP-47 locale for number formatting. Falls back to the provider/runtime. */
  locale?: string;
  /** The payoff: why the real number is what it is. Shown after guessing. */
  reveal?: React.ReactNode;
  /** Where the number comes from — a study, the episode, a benchmark. */
  source?: React.ReactNode;
  /** Fire confetti when the guess lands inside the tolerance. Default: true. */
  celebrate?: boolean;
  /**
   * Ask the reader how sure they are BEFORE they lock the guess in, and read
   * the calibration back afterwards. Landing outside the tolerance counts as
   * wrong, so a confident reader whose sense of scale is off gets told exactly
   * that — which is the whole reason to ask for a number.
   */
  confidence?: boolean;
  /** Customizable / translatable strings. */
  labels?: Partial<EstimateSliderLabels> & Partial<ConfidenceLabels>;
}

/** Position of `value` along the track, clamped to 0–100 %. */
function percent(value: number, min: number, max: number) {
  if (max === min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/**
 * EstimateSlider — the "commit before you're told" explorable. The reader drags
 * a slider to guess a number, locks it in, and only THEN sees the real value
 * next to their guess on the same track, with the explanation.
 *
 * Committing first is the whole point: an intuition the reader has staked a
 * position on is the one that updates when the answer contradicts it — reading
 * the number cold changes nothing. Use it for the counter-intuitive figures an
 * episode drops. Scrubber is its sibling for exploring a model with no right
 * answer; this one has exactly one.
 */
export function EstimateSlider({
  question,
  min,
  max,
  step = 1,
  initial,
  answer,
  tolerance,
  unit = "",
  format = "integer",
  locale,
  reveal,
  source,
  celebrate = true,
  confidence = false,
  labels,
  className,
  ...props
}: EstimateSliderProps) {
  const l = useLabels("estimateSlider", DEFAULT_ESTIMATE_SLIDER_LABELS, labels);
  const activeLocale = useLocale(locale);
  const { ref, emit } = useWidgetEvents("estimate-slider");
  const sliderId = React.useId();

  const [guess, setGuess] = React.useState(
    () => initial ?? Math.round((min + max) / 2),
  );
  const [locked, setLocked] = React.useState(false);
  const [sureness, setSureness] = React.useState<ConfidenceLevel | null>(null);
  // The confidence is staked before the guess is committed — afterwards it is
  // hindsight, not calibration.
  const awaitingConfidence = confidence && sureness === null;

  const margin = tolerance ?? (max - min) * 0.1;
  const offBy = Math.abs(answer - guess);
  const isClose = offBy <= margin;

  const show = (value: number) =>
    `${formatValue(value, format, activeLocale)}${unit}`;

  function handleSubmit() {
    if (awaitingConfidence) return;
    setLocked(true);
    emit("estimated", {
      guess,
      answer,
      offBy,
      close: isClose,
      ...(sureness !== null && {
        confidence: sureness,
        calibration: calibrationOf(sureness, isClose),
      }),
    });
    if (isClose && celebrate) void fireConfetti();
  }

  return (
    <div
      ref={ref}
      data-slot="estimate-slider"
      data-locked={locked || undefined}
      className={cn(
        "@container/est rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      <p className="font-display text-lg font-semibold leading-snug @md/est:text-xl">
        <RichText>{question}</RichText>
      </p>

      {confidence && (
        <ConfidenceScale
          className="mt-4"
          value={sureness}
          onChange={setSureness}
          disabled={locked}
          labels={labels}
        />
      )}

      {/* The guess */}
      <div className="mt-4">
        <label
          htmlFor={sliderId}
          className="flex items-baseline justify-between gap-3 text-sm"
        >
          <span className="text-muted-foreground">{l.yourGuess}</span>
          <span
            className={cn(
              "font-display text-2xl font-bold tabular-nums",
              locked ? "text-muted-foreground" : "text-primary",
            )}
          >
            {show(guess)}
          </span>
        </label>
        <input
          id={sliderId}
          type="range"
          aria-label={l.slider}
          min={min}
          max={max}
          step={step}
          value={guess}
          disabled={locked}
          onChange={(event) => setGuess(event.currentTarget.valueAsNumber)}
          className="mt-1 h-6 w-full cursor-ew-resize touch-none accent-[var(--primary)] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>{show(min)}</span>
          <span>{show(max)}</span>
        </div>
      </div>

      {/* The verdict: both numbers on the same track */}
      {locked && (
        <div className="mt-5 motion-safe:animate-wgt-fade-up">
          <div className="relative h-2 w-full rounded-full bg-muted">
            <span
              aria-hidden
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-muted-foreground"
              style={{ left: `${percent(guess, min, max)}%` }}
            />
            <span
              aria-hidden
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary motion-safe:animate-wgt-pop"
              style={{ left: `${percent(answer, min, max)}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {l.actual}
            </span>
            <span className="font-display text-3xl font-bold tabular-nums text-primary">
              {show(answer)}
            </span>
          </div>

          <p
            role="status"
            className={cn(
              "mt-2 text-sm font-medium",
              isClose ? "text-success" : "text-muted-foreground",
            )}
          >
            {isClose ? (
              <RichText>{l.close}</RichText>
            ) : (
              <>
                {l.off} <span className="tabular-nums">{show(offBy)}</span>
              </>
            )}
          </p>

          {reveal != null && (
            <div className="mt-3 rounded-md border border-info/30 bg-[color-mix(in_oklab,var(--info)_8%,var(--card))] p-3 text-sm text-card-foreground/90">
              <RichText>{reveal}</RichText>
            </div>
          )}

          {source != null && (
            <p className="mt-2 text-xs text-muted-foreground">
              <RichText>{source}</RichText>
            </p>
          )}

          {sureness !== null && (
            <CalibrationNote
              level={sureness}
              correct={isClose}
              labels={labels}
            />
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        {awaitingConfidence && !locked && (
          <ConfidenceRequired className="mr-auto" labels={labels} />
        )}
        {locked ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLocked(false);
              setSureness(null);
            }}
          >
            {l.tryAgain}
          </Button>
        ) : (
          <Button size="sm" onClick={handleSubmit} disabled={awaitingConfidence}>
            {l.submit}
          </Button>
        )}
      </div>
    </div>
  );
}

EstimateSlider.displayName = "EstimateSlider";
