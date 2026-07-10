import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { Gift } from "@/lib/icons";

export interface SurpriseLabels {
  /** Eyebrow shown above the teaser in the closed state. */
  surprise: React.ReactNode;
  /** Reveal button. */
  reveal: React.ReactNode;
}

export const DEFAULT_SURPRISE_LABELS: SurpriseLabels = {
  surprise: "Surprise",
  reveal: "Reveal",
};

export interface SurpriseProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  /** The hidden payload, revealed on click (text or any nested widget). */
  content: React.ReactNode;
  /**
   * Extra payloads that join `content` in the reveal pool: opening the
   * surprise shows ONE of them, picked at random — variable reward.
   */
  variants?: React.ReactNode[];
  /** Optional short line teasing the reveal, shown while still closed. */
  teaser?: React.ReactNode;
  /** Start already revealed (shows `content`). Default: false. */
  defaultRevealed?: boolean;
  /** Customizable / translatable strings. */
  labels?: Partial<SurpriseLabels>;
}

/**
 * Surprise — a reveal wrapper that keeps a payload hidden behind a small,
 * opt-in moment. Closed, it shows an eyebrow + teaser + reveal button; on click
 * the content fades in and stays open. With `variants`, the reveal picks one
 * payload at random from `[content, ...variants]` — uncertainty as reward.
 * Aseptic: the accent comes from `--primary`, so it picks up the active theme.
 * Usable as a storyline screen.
 */
export function Surprise({
  content,
  variants,
  teaser,
  defaultRevealed = false,
  labels,
  className,
  ...props
}: SurpriseProps) {
  const l = useLabels("surprise", DEFAULT_SURPRISE_LABELS, labels);
  const { ref, emit } = useWidgetEvents("surprise");
  // Which pool entry was revealed; null = still closed. defaultRevealed shows
  // `content` (index 0) so hydration stays deterministic.
  const [revealed, setRevealed] = React.useState<number | null>(
    defaultRevealed ? 0 : null,
  );
  const pool = [content, ...(variants ?? [])];

  const reveal = () => {
    const index = Math.floor(Math.random() * pool.length);
    setRevealed(index);
    emit("revealed", { variant: index, variants: pool.length });
  };

  return (
    <div
      ref={ref}
      data-slot="surprise"
      data-revealed={revealed !== null}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      {revealed !== null ? (
        <div
          data-slot="surprise-content"
          className="p-4 motion-safe:animate-wgt-fade-up [&_a]:font-medium [&_a]:text-primary [&_a]:underline"
        >
          {pool[revealed]}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
            <Gift className="size-4 shrink-0" />
            {l.surprise}
          </span>
          {teaser != null && (
            <p className="text-sm text-muted-foreground">{teaser}</p>
          )}
          <Button size="sm" onClick={reveal}>
            {l.reveal}
          </Button>
        </div>
      )}
    </div>
  );
}

Surprise.displayName = "Surprise";
