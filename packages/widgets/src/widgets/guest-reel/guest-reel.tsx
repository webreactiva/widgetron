import * as React from "react";
import { ChevronLeft, ChevronRight } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { Quote, type QuoteClip } from "@/widgets/quote";

export interface GuestReelQuote {
  /** The quoted words. */
  text: React.ReactNode;
  /** Episode moment, e.g. "12:40". */
  timestamp?: string;
  /** Audio of the quoted moment (regular quote clip). */
  clip?: QuoteClip;
}

export interface GuestReelLabels {
  previous: string;
  next: string;
}

export const DEFAULT_GUEST_REEL_LABELS: GuestReelLabels = {
  previous: "Previous quotes",
  next: "More quotes",
};

export interface GuestReelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The guest whose words these are. */
  guest: string;
  /** Their role or context, e.g. "Staff engineer". */
  guestRole?: React.ReactNode;
  /** 3–5 of the best things they said. Each renders as a regular Quote. */
  quotes: GuestReelQuote[];
  labels?: Partial<GuestReelLabels>;
}

/**
 * GuestReel — a horizontal, scroll-snap reel with the best things the guest
 * said, built for the thumb on mobile. Each card is a regular Quote node
 * (monogram, timestamp, optional audio clip), so everything Quote does works
 * here. Use it to close an interview module with 3–5 quotes.
 */
export function GuestReel({
  guest,
  guestRole,
  quotes,
  labels,
  className,
  ...props
}: GuestReelProps) {
  const l = useLabels("guestReel", DEFAULT_GUEST_REEL_LABELS, labels);
  const reelRef = React.useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 1 | -1) {
    const reel = reelRef.current;
    if (!reel) return;
    reel.scrollBy({
      left: direction * reel.clientWidth * 0.8,
      behavior: "smooth",
    });
  }

  return (
    <div
      data-slot="guest-reel"
      className={cn("@container/reel", className)}
      {...props}
    >
      <div
        ref={reelRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]"
      >
        {quotes.map((quote, index) => (
          <Quote
            key={index}
            attribution={guest}
            role={guestRole}
            timestamp={quote.timestamp}
            clip={quote.clip}
            className="w-[min(78cqw,20rem)] shrink-0 snap-start"
          >
            {quote.text}
          </Quote>
        ))}
      </div>
      {quotes.length > 1 && (
        <div className="mt-1 flex justify-end gap-2">
          <button
            type="button"
            aria-label={l.previous}
            onClick={() => scrollByCard(-1)}
            className="grid size-9 place-items-center rounded-md border text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={l.next}
            onClick={() => scrollByCard(1)}
            className="grid size-9 place-items-center rounded-md border text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

GuestReel.displayName = "GuestReel";
