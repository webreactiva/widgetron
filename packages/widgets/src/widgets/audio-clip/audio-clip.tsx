import * as React from "react";
import { Play, Pause, RotateCcw, type IconProps } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";

/** A single transcript cue. Times are in seconds. */
export interface TranscriptCue {
  start: number;
  end?: number;
  text: string;
}

export interface AudioClipLabels {
  play: string;
  pause: string;
  /** Accessible label for the seek slider. */
  seek: string;
  transcript: React.ReactNode;
  restart: string;
}

export const DEFAULT_AUDIO_CLIP_LABELS: AudioClipLabels = {
  play: "Play",
  pause: "Pause",
  seek: "Seek",
  transcript: "Transcript",
  restart: "Restart",
};

export interface AudioClipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Audio source URL. */
  src: string;
  /** Optional title shown above the player. */
  title?: React.ReactNode;
  /** Optional cover image URL. */
  poster?: string;
  /** Inline transcript cues (seconds). Merged after a fetched transcript wins nothing — inline takes priority if both present. */
  transcript?: TranscriptCue[];
  /** URL to a .json / .vtt / .srt transcript fetched on mount. */
  transcriptSrc?: string;
  labels?: Partial<AudioClipLabels>;
}

/** Volume / speaker glyph (inline, no icon dependency). */
function Volume({ className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
Volume.displayName = "Volume";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** mm:ss formatter. Non-finite/negative values render as 0:00. */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function parseTimestamp(value: string): number | null {
  // Accepts HH:MM:SS(.mmm) or MM:SS(.mmm), comma or dot for milliseconds.
  const m = value
    .trim()
    .match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/);
  if (!m) return null;
  const h = m[1] ? Number(m[1]) : 0;
  const min = Number(m[2]);
  const sec = Number(m[3]);
  const ms = m[4] ? Number(m[4].padEnd(3, "0")) : 0;
  return h * 3600 + min * 60 + sec + ms / 1000;
}

function parseClockRange(line: string): { start: number; end: number } | null {
  const m = line.match(
    /(\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?\s*-->\s*(\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?/,
  );
  if (!m) return null;
  const [rawStart, rawEnd] = m[0].split("-->");
  const start = parseTimestamp(rawStart);
  const end = parseTimestamp(rawEnd);
  if (start == null || end == null) return null;
  return { start, end };
}

/** Parse .srt or .vtt text into cues. Handles WEBVTT headers and cue numbers. */
function parseCueText(text: string): TranscriptCue[] {
  const cues: TranscriptCue[] = [];
  const normalized = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const blocks = normalized.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.length > 0);
    if (lines.length === 0) continue;
    if (/^WEBVTT/i.test(lines[0])) continue; // header block
    const timingIdx = lines.findIndex((l) => l.includes("-->"));
    if (timingIdx === -1) continue;
    const range = parseClockRange(lines[timingIdx]);
    if (!range) continue;
    const cueText = lines
      .slice(timingIdx + 1)
      .join(" ")
      .trim();
    if (!cueText) continue;
    cues.push({ start: range.start, end: range.end, text: cueText });
  }
  return cues;
}

/** Coerce a fetched JSON array into TranscriptCue[]. Returns [] if unusable. */
function parseJsonCues(data: unknown): TranscriptCue[] {
  if (!Array.isArray(data)) return [];
  const cues: TranscriptCue[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const start =
      typeof rec.start === "number"
        ? rec.start
        : typeof rec.start === "string"
          ? parseTimestamp(rec.start)
          : null;
    const text = typeof rec.text === "string" ? rec.text : null;
    if (start == null || !text) continue;
    const end =
      typeof rec.end === "number"
        ? rec.end
        : typeof rec.end === "string"
          ? (parseTimestamp(rec.end) ?? undefined)
          : undefined;
    cues.push({ start, text, end: end ?? undefined });
  }
  return cues;
}

/** Latest cue whose start <= currentTime. -1 before the first cue. */
function findActiveCueIndex(cues: TranscriptCue[], currentTime: number): number {
  let active = -1;
  for (let i = 0; i < cues.length; i++) {
    if (cues[i].start > currentTime + 0.05) break;
    active = i;
  }
  return active;
}

/**
 * AudioClip — a custom audio player with an optional synced transcript. Plays a
 * hidden <audio> through custom controls (play/pause, a clickable seek bar,
 * mm:ss times). If a transcript is supplied inline or fetched from
 * `transcriptSrc` (.json array / .vtt / .srt), it renders below the controls,
 * highlighting and auto-scrolling each cue as it plays (karaoke); clicking a
 * cue seeks to its start. Honors `prefers-reduced-motion` for smooth scroll.
 */
export function AudioClip({
  src,
  title,
  poster,
  transcript,
  transcriptSrc,
  labels,
  className,
  ...props
}: AudioClipProps) {
  const l = useLabels("audioClip", DEFAULT_AUDIO_CLIP_LABELS, labels);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const scrollBoxRef = React.useRef<HTMLDivElement>(null);
  const activeCueRef = React.useRef<HTMLButtonElement>(null);

  const [fetchedCues, setFetchedCues] = React.useState<TranscriptCue[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  // Inline transcript wins; otherwise use whatever we fetched.
  const cues = React.useMemo<TranscriptCue[]>(
    () =>
      transcript && transcript.length > 0
        ? transcript
        : fetchedCues,
    [transcript, fetchedCues],
  );
  const hasTranscript = cues.length > 0;

  // Fetch the transcript on mount if a URL is given and no inline cues exist.
  React.useEffect(() => {
    if (!transcriptSrc) return;
    if (transcript && transcript.length > 0) return;
    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : undefined;

    fetch(transcriptSrc, { signal: controller?.signal })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error("transcript"))))
      .then((raw) => {
        if (cancelled) return;
        const trimmed = raw.trim();
        let parsed: TranscriptCue[] = [];
        if (trimmed.startsWith("[")) {
          try {
            parsed = parseJsonCues(JSON.parse(trimmed));
          } catch {
            parsed = [];
          }
        } else {
          parsed = parseCueText(raw);
        }
        if (!cancelled) setFetchedCues(parsed);
      })
      .catch(() => {
        // Network/abort/parse failure — silently render no transcript.
      });

    return () => {
      cancelled = true;
      controller?.abort();
    };
  }, [transcriptSrc, transcript]);

  // Wire the <audio> element events to local state.
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const activeIdx = hasTranscript ? findActiveCueIndex(cues, currentTime) : -1;

  // Auto-scroll the active cue into view within the scroll box.
  React.useEffect(() => {
    const box = scrollBoxRef.current;
    const cue = activeCueRef.current;
    if (!box || !cue) return;
    const top = cue.offsetTop - box.offsetTop - box.clientHeight / 2 + cue.clientHeight / 2;
    box.scrollTo({
      top,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [activeIdx]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => {
        // Autoplay/permission rejection — leave paused.
      });
    } else {
      audio.pause();
    }
  }

  function restart() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  }

  function seekTo(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, duration > 0 ? Math.min(seconds, duration) : seconds);
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }

  function onSeek(event: React.ChangeEvent<HTMLInputElement>) {
    seekTo(event.currentTarget.valueAsNumber);
  }

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  return (
    <div
      data-slot="audio-clip"
      className={cn(
        "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <div className="flex items-center gap-4 p-4">
        {poster ? (
          <img
            src={poster}
            alt=""
            className="size-16 shrink-0 rounded-md border object-cover"
          />
        ) : (
          <div className="grid size-16 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <Volume className="size-6" />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {title != null && (
            <p className="truncate font-semibold leading-tight">{title}</p>
          )}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="icon"
              aria-label={isPlaying ? l.pause : l.play}
              onClick={togglePlay}
            >
              {isPlaying ? <Pause /> : <Play />}
            </Button>

            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 1}
              step="any"
              value={currentTime}
              onChange={onSeek}
              aria-label={l.seek}
              aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
              className="h-6 min-w-0 flex-1 cursor-pointer touch-none accent-[var(--primary)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{
                background: `linear-gradient(to right, var(--primary) ${
                  progress * 100
                }%, var(--muted) ${progress * 100}%)`,
              }}
            />

            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={l.restart}
              onClick={restart}
            >
              <RotateCcw />
            </Button>
          </div>
        </div>
      </div>

      {hasTranscript && (
        <div className="border-t" data-slot="audio-clip-transcript">
          <p className="border-b bg-muted px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {l.transcript}
          </p>
          <div
            ref={scrollBoxRef}
            className="max-h-64 overflow-y-auto p-2"
            aria-live="off"
          >
            {cues.map((cue, i) => {
              const isActive = i === activeIdx;
              return (
                <button
                  key={i}
                  ref={isActive ? activeCueRef : undefined}
                  type="button"
                  onClick={() => seekTo(cue.start)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "block w-full rounded-md px-2 py-1.5 text-left text-sm leading-relaxed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "font-medium text-card-foreground [background-color:color-mix(in_oklab,var(--primary)_14%,transparent)]"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {cue.text}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

AudioClip.displayName = "AudioClip";
