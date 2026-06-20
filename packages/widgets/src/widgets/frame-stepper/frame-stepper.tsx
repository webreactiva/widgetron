import * as React from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";

export interface StepperBox {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface StepperFrame {
  caption: React.ReactNode;
  /** Box ids to highlight on this frame. */
  active?: string[];
  /** 1-based code line numbers to highlight on this frame. */
  lines?: number[];
  /** Small data badges to attach to boxes, keyed by box id. */
  badges?: Record<string, string>;
}

export interface FrameStepperLabels {
  play: string;
  pause: string;
  previous: string;
  next: string;
}

export const DEFAULT_FRAME_STEPPER_LABELS: FrameStepperLabels = {
  play: "Play",
  pause: "Pause",
  previous: "Previous step",
  next: "Next step",
};

export interface FrameStepperProps extends React.HTMLAttributes<HTMLDivElement> {
  frames: StepperFrame[];
  /** A row of boxes to highlight per frame. */
  boxes?: StepperBox[];
  /** A code block (lines split on `\n`) to highlight per frame. */
  code?: string;
  /** Autoplay interval in ms. Default: 2000. */
  autoplayMs?: number;
  labels?: Partial<FrameStepperLabels>;
}

/**
 * FrameStepper — a state-timeline scrubber. A fixed stage (boxes and/or a code
 * block) plus ordered frames that highlight parts of the stage and show a
 * caption. Step with prev/next or autoplay. Discrete snapshots beat a paragraph
 * describing motion. The caption is an aria-live region for screen readers.
 */
export function FrameStepper({
  frames,
  boxes,
  code,
  autoplayMs = 2000,
  labels,
  className,
  ...props
}: FrameStepperProps) {
  const l = useLabels("frameStepper", DEFAULT_FRAME_STEPPER_LABELS, labels);
  const [index, setIndex] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);

  const frame = frames[index] ?? { caption: "" };
  const last = frames.length - 1;
  const codeLines = React.useMemo(() => (code ? code.split("\n") : []), [code]);

  React.useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), autoplayMs);
    return () => clearTimeout(t);
  }, [playing, index, last, autoplayMs]);

  function go(delta: number) {
    setPlaying(false);
    setIndex((i) => (i + delta + frames.length) % frames.length);
  }

  function togglePlay() {
    if (index >= last) setIndex(0);
    setPlaying((p) => !p);
  }

  return (
    <div
      data-slot="frame-stepper"
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-5",
        className,
      )}
      {...props}
    >
      {boxes && (
        <div className="flex flex-wrap justify-center gap-2">
          {boxes.map((box) => {
            const active = frame.active?.includes(box.id);
            return (
              <div
                key={box.id}
                data-active={active || undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-primary bg-[color-mix(in_oklab,var(--primary)_12%,var(--card))]"
                    : "border-border bg-background",
                )}
              >
                {box.icon}
                <span className="font-medium">{box.label}</span>
                {frame.badges?.[box.id] && (
                  <span className="rounded bg-primary px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary-foreground">
                    {frame.badges[box.id]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {code && (
        <pre className="mt-3 overflow-x-auto rounded-md bg-[var(--wgt-code-bg)] p-3 font-mono text-sm text-[var(--wgt-code-fg)]">
          {codeLines.map((line, i) => {
            const active = frame.lines?.includes(i + 1);
            return (
              <div
                key={i}
                className={cn(
                  "flex gap-3 rounded px-1 transition-colors",
                  active && "bg-white/10",
                )}
              >
                <span className="w-6 shrink-0 select-none text-right text-white/30">
                  {i + 1}
                </span>
                <span className="whitespace-pre">{line || " "}</span>
              </div>
            );
          })}
        </pre>
      )}

      <p
        key={index}
        aria-live="polite"
        className="mt-4 min-h-10 text-center text-sm text-muted-foreground motion-safe:animate-wgt-fade-in"
      >
        {frame.caption}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label={l.previous}
          onClick={() => go(-1)}
        >
          <ChevronLeft />
        </Button>
        <Button variant="outline" onClick={togglePlay}>
          {playing ? (
            <>
              <Pause />
              {l.pause}
            </>
          ) : (
            <>
              <Play />
              {l.play}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={l.next}
          onClick={() => go(1)}
        >
          <ChevronRight />
        </Button>
        <span className="ml-2 whitespace-nowrap text-sm tabular-nums text-muted-foreground">
          {index + 1} / {frames.length}
        </span>
      </div>
    </div>
  );
}

FrameStepper.displayName = "FrameStepper";
