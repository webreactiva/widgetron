import * as React from "react";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText } from "@/primitives/rich-text";
import { Button } from "@/primitives/button";
import { AudioClip } from "@/widgets/audio-clip";
import { initials } from "@/widgets/quote/quote";
import type { QuoteClip } from "@/widgets/quote/quote";

export interface QaCardLabels {
  /** The reveal button. */
  revealAnswer: React.ReactNode;
}

export const DEFAULT_QA_CARD_LABELS: QaCardLabels = {
  revealAnswer: "See the answer",
};

export interface QaCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "role"> {
  /** The question — the hook. */
  question: React.ReactNode;
  /** The answer — the reward, revealed on demand. */
  answer: React.ReactNode;
  /** Who asked (name). Renders as a host-colored monogram. */
  askedBy?: string;
  /** Who answered (name). Renders as a guest-colored (`--brand-2`) monogram. */
  answeredBy?: string;
  /** The answerer's role or context, e.g. "Episode guest". */
  answeredByRole?: React.ReactNode;
  /** Episode moment, e.g. "19:12" — shown next to the answerer. */
  timestamp?: string;
  /** Audio of the answered moment, played inline once revealed. */
  clip?: QuoteClip;
  labels?: Partial<QaCardLabels>;
}

/**
 * QaCard — the question as the hook, the answer as the reward: the same
 * reveal mechanic the rest of the library uses. Speaker identity follows the
 * transversal pattern (asker = `--primary`, answerer = `--brand-2`). Works
 * with no audio at all; with a `clip`, the revealed answer includes a compact
 * player so the reader hears it in the original voice.
 */
export function QaCard({
  question,
  answer,
  askedBy,
  answeredBy,
  answeredByRole,
  timestamp,
  clip,
  labels,
  className,
  ...props
}: QaCardProps) {
  const l = useLabels("qaCard", DEFAULT_QA_CARD_LABELS, labels);
  const { ref, emit } = useWidgetEvents("qa-card");
  const [revealed, setRevealed] = React.useState(false);

  function reveal() {
    setRevealed(true);
    emit("answer_revealed", { timestamp });
  }

  return (
    <div
      ref={ref}
      data-slot="qa-card"
      data-revealed={revealed || undefined}
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-5",
        className,
      )}
      {...props}
    >
      {/* The question, asked by the host voice. */}
      <div className="flex gap-3">
        {askedBy && (
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/35 bg-[color-mix(in_oklab,var(--primary)_14%,var(--card))] font-display text-xs font-bold text-primary"
          >
            {initials(askedBy)}
          </span>
        )}
        <p className="font-display text-lg font-bold leading-snug text-balance">
          <RichText>{question}</RichText>
        </p>
      </div>

      {revealed ? (
        <div className="mt-3 animate-wgt-fade-up sm:pl-11">
          <div className="text-sm leading-relaxed text-card-foreground/90">
            <RichText>{answer}</RichText>
          </div>
          {(answeredBy != null || timestamp != null) && (
            <p className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground">
              {answeredBy && (
                <span
                  aria-hidden
                  className="grid size-7 shrink-0 place-items-center rounded-full border font-display text-[0.65rem] font-bold"
                  style={{
                    color: "var(--brand-2)",
                    borderColor:
                      "color-mix(in oklab, var(--brand-2) 40%, transparent)",
                    backgroundColor:
                      "color-mix(in oklab, var(--brand-2) 14%, var(--card))",
                  }}
                >
                  {initials(answeredBy)}
                </span>
              )}
              <span>
                {answeredBy && (
                  <span className="font-semibold text-foreground">{answeredBy}</span>
                )}
                {answeredBy && answeredByRole != null && <span aria-hidden> · </span>}
                {answeredByRole}
                {timestamp && (
                  <span className="tabular-nums"> · {timestamp}</span>
                )}
              </span>
            </p>
          )}
          {clip && (
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
        <div className="mt-3 sm:pl-11">
          <Button variant="outline" size="sm" onClick={reveal}>
            {l.revealAnswer}
          </Button>
        </div>
      )}
    </div>
  );
}

QaCard.displayName = "QaCard";
