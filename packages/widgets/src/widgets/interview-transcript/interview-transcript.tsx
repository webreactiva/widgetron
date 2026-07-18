import * as React from "react";
import { Play, Pause } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText } from "@/primitives/rich-text";
import {
  FilledRange,
  activateClip,
  formatTime,
  getActiveClipId,
  releaseClip,
  subscribeActiveClip,
} from "@/widgets/audio-clip/audio-clip";
import { initials } from "@/widgets/quote/quote";

export interface InterviewSpeaker {
  name: string;
  /** Their role or context, e.g. "Host" or "Staff engineer". */
  role?: React.ReactNode;
}

export interface InterviewTurn {
  /** Which voice this turn belongs to. */
  speaker: "host" | "guest";
  /** Turn start, in seconds of the source timeline (same clock as `clip`). */
  start?: number;
  /** What was said. */
  text: React.ReactNode;
}

export interface InterviewClip {
  /** Audio URL — the full episode file works; combine with start/end. */
  src: string;
  /** Fragment start, in seconds within `src`. */
  start?: number;
  /** Fragment end, in seconds within `src`. */
  end?: number;
}

export interface InterviewTranscriptLabels {
  play: string;
  pause: string;
  seek: string;
}

export const DEFAULT_INTERVIEW_TRANSCRIPT_LABELS: InterviewTranscriptLabels = {
  play: "Play conversation",
  pause: "Pause",
  seek: "Seek",
};

export interface InterviewTranscriptProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** The two voices. Host renders in `--primary`, guest in `--brand-2`. */
  speakers: { host: InterviewSpeaker; guest: InterviewSpeaker };
  /** The exchange, in reading order. */
  turns: InterviewTurn[];
  /** Audio of the exchange. Turn `start` times share its source timeline. */
  clip?: InterviewClip;
  labels?: Partial<InterviewTranscriptLabels>;
}

/**
 * InterviewTranscript — a two-voice exchange laid out editorially (like
 * press, not chat bubbles: GroupChat already covers bubbles). Speaker
 * identity is the transversal pattern: host = `--primary`, guest =
 * `--brand-2` (lilac in Web Reactiva, neutral in the aseptic theme) — the
 * same color code quote and qa-card use. With a `clip`, the turn being
 * spoken lights up as the audio plays and clicking a turn jumps there. Use
 * for the exchange worth reading whole (30–90s).
 */
export function InterviewTranscript({
  speakers,
  turns,
  clip,
  labels,
  className,
  ...props
}: InterviewTranscriptProps) {
  const l = useLabels(
    "interviewTranscript",
    DEFAULT_INTERVIEW_TRANSCRIPT_LABELS,
    labels,
  );
  const { ref, emit } = useWidgetEvents("interview-transcript");
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const clipId = React.useId();
  const playedRef = React.useRef(false);

  const [isPlaying, setIsPlaying] = React.useState(false);
  // Source-timeline seconds (same clock as turn.start), not fragment-relative.
  const [sourceTime, setSourceTime] = React.useState(0);

  const clipStart = clip?.start ?? 0;
  const clipEnd = clip?.end;
  const windowLen =
    clipEnd != null ? Math.max(0, clipEnd - clipStart) : undefined;

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => {
      if (clipEnd != null && audio.currentTime >= clipEnd && !audio.paused)
        audio.pause();
      setSourceTime(audio.currentTime);
    };
    const onPlay = () => {
      setIsPlaying(true);
      activateClip(clipId);
    };
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
    };
  }, [clipEnd, clipId]);

  React.useEffect(() => {
    const unsubscribe = subscribeActiveClip(() => {
      if (getActiveClipId() !== clipId) {
        const audio = audioRef.current;
        if (audio && !audio.paused) audio.pause();
      }
    });
    return () => {
      unsubscribe();
      releaseClip(clipId);
    };
  }, [clipId]);

  function markPlayed() {
    if (playedRef.current) return;
    playedRef.current = true;
    emit("played", {});
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (
        audio.currentTime < clipStart ||
        (clipEnd != null && audio.currentTime >= clipEnd - 0.05)
      )
        audio.currentTime = clipStart;
      markPlayed();
      void audio.play()?.catch(() => {});
    } else {
      audio.pause();
    }
  }

  function selectTurn(index: number) {
    const turn = turns[index];
    if (!clip || turn?.start == null) return;
    emit("turn_selected", { index, start: turn.start });
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = turn.start;
    setSourceTime(turn.start);
    markPlayed();
    void audio.play()?.catch(() => {});
  }

  // Latest turn (with a start) that the playhead has passed.
  const activeTurn = React.useMemo(() => {
    if (!clip || !isPlaying) return -1;
    let active = -1;
    for (let i = 0; i < turns.length; i++) {
      const s = turns[i].start;
      if (s == null) continue;
      if (s > sourceTime + 0.05) break;
      active = i;
    }
    return active;
  }, [clip, isPlaying, turns, sourceTime]);

  const voices = {
    host: { color: "var(--primary)", speaker: speakers.host },
    guest: { color: "var(--brand-2)", speaker: speakers.guest },
  } as const;

  return (
    <div
      ref={ref}
      data-slot="interview-transcript"
      className={cn(
        "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      {clip && (
        <audio ref={audioRef} src={clip.src} preload="metadata" className="hidden" />
      )}

      {/* Header: the two voices (+ the fragment's time range). */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-muted px-4 py-2.5">
        <div className="mr-auto flex flex-wrap items-center gap-4">
          {(["host", "guest"] as const).map((key) => {
            const voice = voices[key];
            return (
              <span key={key} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full border font-display text-xs font-bold"
                  style={{
                    color: voice.color,
                    borderColor: `color-mix(in oklab, ${voice.color} 35%, transparent)`,
                    backgroundColor: `color-mix(in oklab, ${voice.color} 14%, var(--card))`,
                  }}
                >
                  {initials(voice.speaker.name)}
                </span>
                <span className="leading-tight">
                  <span className="block font-semibold">{voice.speaker.name}</span>
                  {voice.speaker.role != null && (
                    <span className="block text-xs text-muted-foreground">
                      {voice.speaker.role}
                    </span>
                  )}
                </span>
              </span>
            );
          })}
        </div>
        {clip?.start != null && clipEnd != null && (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatTime(clipStart)} → {formatTime(clipEnd)}
          </span>
        )}
      </div>

      {/* Turns — editorial, not chat bubbles. */}
      <div className="p-2">
        {turns.map((turn, index) => {
          const voice = voices[turn.speaker] ?? voices.host;
          const isCurrent = index === activeTurn;
          const seekable = clip != null && turn.start != null;
          const Row = seekable ? "button" : "div";
          return (
            <Row
              key={index}
              {...(seekable
                ? { type: "button" as const, onClick: () => selectTurn(index) }
                : {})}
              className={cn(
                "my-0.5 flex w-full gap-3 rounded-md border-l-[3px] px-3 py-2 text-left transition-colors",
                seekable &&
                  "cursor-pointer outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              )}
              style={{
                borderLeftColor: isCurrent
                  ? voice.color
                  : turn.speaker === "guest"
                    ? `color-mix(in oklab, ${voice.color} 45%, transparent)`
                    : "transparent",
                backgroundColor: isCurrent
                  ? `color-mix(in oklab, ${voice.color} 10%, transparent)`
                  : turn.speaker === "guest"
                    ? `color-mix(in oklab, ${voice.color} 5%, transparent)`
                    : undefined,
              }}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2 font-mono text-[0.68rem] text-muted-foreground">
                  <span className="font-bold" style={{ color: voice.color }}>
                    {initials(voice.speaker.name)}
                  </span>
                  {turn.start != null && (
                    <span className="tabular-nums">{formatTime(turn.start)}</span>
                  )}
                </span>
                <span className="mt-0.5 block text-sm leading-relaxed">
                  <RichText>{turn.text}</RichText>
                </span>
              </span>
            </Row>
          );
        })}
      </div>

      {/* Playback footer — only when there is audio. */}
      {clip && (
        <div className="flex items-center gap-3 border-t px-4 py-2.5">
          <button
            type="button"
            aria-label={isPlaying ? l.pause : l.play}
            onClick={togglePlay}
            className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground transition-[background-color,scale] duration-(--motion-fast) ease-(--ease-out) outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <FilledRange
            value={Math.max(0, sourceTime - clipStart)}
            max={windowLen && windowLen > 0 ? windowLen : 1}
            step="any"
            onChange={(e) => {
              const audio = audioRef.current;
              if (!audio) return;
              audio.currentTime = clipStart + e.currentTarget.valueAsNumber;
              setSourceTime(audio.currentTime);
            }}
            label={l.seek}
            className="h-1.5 min-w-0 flex-1"
          />
          <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
            {formatTime(Math.max(0, sourceTime - clipStart))}
            {windowLen != null && <> / {formatTime(windowLen)}</>}
          </span>
        </div>
      )}
    </div>
  );
}

InterviewTranscript.displayName = "InterviewTranscript";
