import * as React from "react";
import { ChevronRight, Play, RotateCcw } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { RichText } from "@/primitives/rich-text";
import { useLabels } from "@/lib/i18n";

export interface ChatMessage {
  from: React.ReactNode;
  text: React.ReactNode;
  /** Which side the bubble sits on. Default: "left" (incoming). */
  side?: "left" | "right";
}

export interface GroupChatLabels {
  next: React.ReactNode;
  play: React.ReactNode;
  replay: React.ReactNode;
  typing: React.ReactNode;
}

export const DEFAULT_GROUP_CHAT_LABELS: GroupChatLabels = {
  next: "Next",
  play: "Play all",
  replay: "Replay",
  typing: "typing…",
};

export interface GroupChatProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  messages: ChatMessage[];
  title?: React.ReactNode;
  /** Delay between messages while "Play all" runs, in ms. Default: 900. */
  typingMs?: number;
  labels?: Partial<GroupChatLabels>;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * GroupChat — a conversation the reader paces. Messages reveal one by one
 * (with a typing indicator) so a flow reads as a dialogue between actors.
 * Step with "Next", auto-reveal with "Play all", or "Replay" from the start.
 * Honors `prefers-reduced-motion` (instant reveal, no typing). The list is an
 * aria-live region and auto-scrolls to the newest message.
 */
export function GroupChat({
  messages,
  title,
  typingMs = 900,
  labels,
  className,
  ...props
}: GroupChatProps) {
  const l = useLabels("groupChat", DEFAULT_GROUP_CHAT_LABELS, labels);
  const [shown, setShown] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [typing, setTyping] = React.useState(false);
  const bodyRef = React.useRef<HTMLDivElement>(null);

  const total = messages.length;
  const done = shown >= total;

  React.useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown, typing]);

  React.useEffect(() => {
    if (!playing) return;
    if (shown >= total) {
      setPlaying(false);
      setTyping(false);
      return;
    }
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setShown((s) => Math.min(s + 1, total));
    }, typingMs);
    return () => clearTimeout(t);
  }, [playing, shown, total, typingMs]);

  function next() {
    if (playing || done) return;
    setShown((s) => Math.min(s + 1, total));
  }

  function playAll() {
    if (playing || done) return;
    if (prefersReducedMotion()) {
      setShown(total);
      return;
    }
    setPlaying(true);
  }

  function replay() {
    setPlaying(false);
    setTyping(false);
    setShown(0);
  }

  const visible = messages.slice(0, shown);

  return (
    <div
      data-slot="group-chat"
      className={cn(
        "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      {title != null && (
        <div className="border-b bg-muted px-4 py-2 text-sm font-medium">
          <RichText>{title}</RichText>
        </div>
      )}

      <div
        ref={bodyRef}
        aria-live="polite"
        className="flex max-h-96 min-h-40 flex-col gap-3 overflow-y-auto p-4"
      >
        {visible.map((message, i) => {
          const right = message.side === "right";
          return (
            <div
              key={i}
              className={cn(
                "flex max-w-[85%] flex-col gap-1 motion-safe:animate-wgt-fade-up",
                right ? "items-end self-end" : "items-start self-start",
              )}
            >
              <span className="text-xs font-semibold text-muted-foreground">
                {message.from}
              </span>
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm",
                  right
                    ? "rounded-br-sm border border-primary/30 bg-[color-mix(in_oklab,var(--primary)_14%,var(--card))]"
                    : "rounded-bl-sm bg-muted text-foreground",
                )}
              >
                <RichText>{message.text}</RichText>
              </div>
            </div>
          );
        })}

        {typing && (
          <div
            className={cn(
              "flex max-w-[85%] flex-col gap-1 self-start",
              messages[shown]?.side === "right" && "items-end self-end",
            )}
          >
            <span className="text-xs font-semibold text-muted-foreground">
              {l.typing}
            </span>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-3 py-2.5">
              <span className="size-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce [animation-delay:-0.2s]" />
              <span className="size-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce [animation-delay:-0.1s]" />
              <span className="size-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t bg-card p-3">
        <Button onClick={next} disabled={done || playing}>
          {l.next}
          <ChevronRight />
        </Button>
        <Button variant="outline" onClick={playAll} disabled={done || playing}>
          <Play />
          {l.play}
        </Button>
        <Button variant="outline" onClick={replay} disabled={shown === 0}>
          <RotateCcw />
          {l.replay}
        </Button>
        <span className="ml-auto whitespace-nowrap text-sm tabular-nums text-muted-foreground">
          {shown} / {total}
        </span>
      </div>
    </div>
  );
}

GroupChat.displayName = "GroupChat";
