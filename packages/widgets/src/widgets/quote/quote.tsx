import * as React from "react";
import { Play } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText } from "@/primitives/rich-text";
import { AudioClip } from "@/widgets/audio-clip";

/** The audio of the quoted moment. */
export interface QuoteClip {
  /** Audio URL — the full episode file works; combine with start/end. */
  src: string;
  /** Fragment start, in seconds within `src`. */
  start?: number;
  /** Fragment end, in seconds within `src`. */
  end?: number;
  /** Transcript URL (.srt/.vtt/.json), timestamps relative to the fragment. */
  transcriptSrc?: string;
}

export interface QuoteLabels {
  /** Chip text for the moment the quote was said, e.g. "Said at 23:14". */
  saidAt: (timestamp: string) => React.ReactNode;
  /** Chip text when a clip exists but no timestamp does. */
  listen: React.ReactNode;
}

export const DEFAULT_QUOTE_LABELS: QuoteLabels = {
  saidAt: (timestamp) => `Said at ${timestamp}`,
  listen: "Listen to this moment",
};

export interface QuoteProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "role"> {
  /** The quoted words. */
  children: React.ReactNode;
  /** Who said it (e.g. a person's name). */
  attribution?: React.ReactNode;
  /** Their role or context (e.g. "Episode guest"). Any string. */
  role?: React.ReactNode;
  /**
   * Episode moment the quote was said at, e.g. "23:14" — rendered as a chip
   * ("Said at 23:14"). Derived from `clip.start` when omitted.
   */
  timestamp?: string;
  /**
   * Audio of the quoted moment. The chip becomes a button that expands a
   * compact AudioClip player (karaoke transcript included when
   * `transcriptSrc` is given), so the reader hears it in the original voice.
   */
  clip?: QuoteClip;
  labels?: Partial<QuoteLabels>;
}

/** Seconds → "23:14" / "1:02:45". */
function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 && m < 10 ? `0${m}` : String(m);
  const ss = s < 10 ? `0${s}` : String(s);
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Quote — a highlighted pull-quote / testimonial. Semantic
 * `<figure>`/`<blockquote>`/`<figcaption>`, with a brand-aware accent from the
 * `--primary` token and the display typeface for the quoted words. A
 * `timestamp` pins the words to the episode minute; a `clip` makes that chip
 * play the actual fragment in the speaker's own voice (compact AudioClip,
 * karaoke transcript included).
 */
export function Quote({
  children,
  attribution,
  role,
  timestamp,
  clip,
  labels,
  className,
  ...props
}: QuoteProps) {
  const l = useLabels("quote", DEFAULT_QUOTE_LABELS, labels);
  const { ref, emit } = useWidgetEvents<HTMLElement>("quote");
  const [open, setOpen] = React.useState(false);

  const shownTimestamp =
    timestamp ?? (clip?.start != null ? formatClock(clip.start) : undefined);
  const chipText = shownTimestamp != null ? l.saidAt(shownTimestamp) : l.listen;
  const chip =
    "inline-flex min-h-8 items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground";

  const toggleClip = () => {
    const next = !open;
    setOpen(next);
    if (next) emit("clip_opened", { start: clip?.start });
  };

  return (
    <figure
      ref={ref}
      data-slot="quote"
      className={cn(
        "rounded-lg border border-l-4 border-l-primary bg-[color-mix(in_oklab,var(--primary)_5%,var(--card))] py-4 pr-4 pl-5 text-card-foreground",
        className,
      )}
      {...props}
    >
      <blockquote className="font-display text-lg leading-relaxed text-pretty [&_a]:font-medium [&_a]:text-primary [&_a]:underline">
        <RichText>{children}</RichText>
      </blockquote>
      {(attribution != null || role != null) && (
        <figcaption className="mt-3 text-sm text-muted-foreground">
          {attribution != null && (
            <span className="font-semibold text-foreground">{attribution}</span>
          )}
          {attribution != null && role != null && <span aria-hidden> · </span>}
          {role != null && <span>{role}</span>}
        </figcaption>
      )}
      {clip ? (
        <div className="mt-3">
          <button
            type="button"
            aria-expanded={open}
            onClick={toggleClip}
            className={cn(
              chip,
              "transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              open && "border-primary text-foreground",
            )}
          >
            <Play aria-hidden="true" className="size-3" />
            {chipText}
          </button>
          {open && (
            <AudioClip
              src={clip.src}
              start={clip.start}
              end={clip.end}
              transcriptSrc={clip.transcriptSrc}
              sticky={false}
              className="mt-3"
            />
          )}
        </div>
      ) : (
        shownTimestamp != null && (
          <div className="mt-3">
            <span className={chip}>{chipText}</span>
          </div>
        )
      )}
    </figure>
  );
}

Quote.displayName = "Quote";
