import * as React from "react";
import { createPortal } from "react-dom";
import { Play, Pause, RotateCcw, X } from "@/lib/icons";

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
  /** Accessible label for the playback-speed control. */
  speed: string;
  /** Accessible label for the volume slider. */
  volume: string;
  mute: string;
  unmute: string;
  /** Accessible label for the mini-player region. */
  miniPlayer: string;
  /** Accessible label for the mini-player close button. */
  close: string;
}

export const DEFAULT_AUDIO_CLIP_LABELS: AudioClipLabels = {
  play: "Play",
  pause: "Pause",
  seek: "Seek",
  transcript: "Transcript",
  restart: "Restart",
  speed: "Playback speed",
  volume: "Volume",
  mute: "Mute",
  unmute: "Unmute",
  miniPlayer: "Mini player",
  close: "Close mini player",
};

/** Playback rates the speed control cycles through. */
const RATES = [1, 1.25, 1.5, 1.75, 2] as const;
/** Speed and volume are global reader preferences, shared across clips. */
const RATE_KEY = "widgetron-audio-rate";
const VOL_KEY = "widgetron-audio-volume";
/** Resume position is per-track. */
const POS_PREFIX = "widgetron-audio-pos:";
const SAVE_THROTTLE_MS = 4000;

// --- Single-active-clip coordination -------------------------------------
// Widget instances are independent, but only one clip should ever play — and
// only one mini-player should show — at a time. Each instance registers a
// listener; when one starts playing it becomes the active clip and notifies the
// rest, which pause themselves and hide their sticky.
let activeClipId: string | null = null;
const activeClipListeners = new Set<() => void>();
function activateClip(id: string) {
  if (activeClipId === id) return;
  activeClipId = id;
  activeClipListeners.forEach((notify) => notify());
}

export interface AudioClipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Audio source URL. */
  src: string;
  /**
   * Fragment window start, in seconds of the source's timeline. Playback
   * begins here, and the seek bar, displayed times, transcript cues and the
   * resume position all become relative to the window — so one long episode
   * file can serve many clips.
   */
  start?: number;
  /** Fragment window end (seconds in the source). Playback pauses here. */
  end?: number;
  /** Optional title shown above the player. */
  title?: React.ReactNode;
  /** Optional cover image URL. */
  poster?: string;
  /** Inline transcript cues (seconds). Merged after a fetched transcript wins nothing — inline takes priority if both present. */
  transcript?: TranscriptCue[];
  /** URL to a .json / .vtt / .srt transcript fetched on mount. */
  transcriptSrc?: string;
  /**
   * Stable key for persisting the resume position across visits. Defaults to
   * `src` — set it when the URL isn't stable (e.g. a signed CDN link) so resume
   * survives re-signing.
   */
  storageKey?: string;
  /**
   * Show a sticky mini-player in the corner once playback starts and the main
   * player scrolls out of view. Default: true.
   */
  sticky?: boolean;
  labels?: Partial<AudioClipLabels>;
}

/** Speaker glyph (inline, no icon dependency) — crossed out when muted. */
function VolumeGlyph({
  muted,
  className,
}: {
  muted?: boolean;
  className?: string;
}) {
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
    >
      <path d="M11 5 6 9H2v6h4l5 4z" />
      {muted ? (
        <path d="M22 9l-6 6M16 9l6 6" />
      ) : (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      )}
    </svg>
  );
}
VolumeGlyph.displayName = "VolumeGlyph";

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

/** "1×", "1.5×". */
function formatRate(rate: number): string {
  return `${rate}×`;
}

function readNumber(key: string, min: number, max: number): number | null {
  if (typeof window === "undefined") return null;
  try {
    const v = Number(window.localStorage.getItem(key));
    return Number.isFinite(v) && v >= min && v <= max ? v : null;
  } catch {
    return null;
  }
}

function writeNumber(key: string, value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* storage may be unavailable (private mode) */
  }
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

/** A filled range input — used for both the seek bar and the volume slider. */
function FilledRange({
  value,
  max,
  step,
  onChange,
  label,
  valueText,
  className,
}: {
  value: number;
  max: number;
  step: number | "any";
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  valueText?: string;
  className?: string;
}) {
  const fill = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <input
      type="range"
      min={0}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      aria-label={label}
      aria-valuetext={valueText}
      className={cn(
        "cursor-pointer touch-none accent-[var(--primary)] outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      style={{
        background: `linear-gradient(to right, var(--primary) ${
          fill * 100
        }%, var(--muted) ${fill * 100}%)`,
      }}
    />
  );
}

/** Compact text button that cycles playback speed. */
function SpeedButton({
  rate,
  onCycle,
  label,
  className,
}: {
  rate: number;
  onCycle: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`${label} (${formatRate(rate)})`}
      className={cn(
        "shrink-0 rounded-md border px-2 py-1 text-xs font-semibold tabular-nums text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        rate !== 1 && "border-primary/40 text-foreground",
        className,
      )}
    >
      {formatRate(rate)}
    </button>
  );
}

/**
 * Volume control — a mute-toggle speaker icon plus a slider that reveals on
 * hover/focus, so it stays out of the way until wanted (YouTube-style). The
 * icon click mutes/unmutes; the slider fine-tunes the level.
 */
function VolumeControl({
  volume,
  muted,
  onToggle,
  onChange,
  toggleLabel,
  volumeLabel,
}: {
  volume: number;
  muted: boolean;
  onToggle: () => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  toggleLabel: string;
  volumeLabel: string;
}) {
  const level = muted ? 0 : volume;
  return (
    <div className="group/vol flex shrink-0 items-center">
      <button
        type="button"
        onClick={onToggle}
        aria-label={toggleLabel}
        className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <VolumeGlyph muted={level === 0} className="size-4" />
      </button>
      <FilledRange
        value={level}
        max={1}
        step={0.05}
        onChange={onChange}
        label={volumeLabel}
        valueText={`${Math.round(level * 100)}%`}
        className="h-1.5 w-0 opacity-0 transition-[width,opacity] duration-200 group-hover/vol:ml-1 group-hover/vol:w-14 group-hover/vol:opacity-100 group-focus-within/vol:ml-1 group-focus-within/vol:w-14 group-focus-within/vol:opacity-100"
      />
    </div>
  );
}

/**
 * AudioClip — a custom audio player with an optional synced transcript. Plays a
 * hidden <audio> through custom controls (play/pause, a clickable seek bar,
 * mm:ss times, a volume control and a playback-speed cycle). If a transcript is
 * supplied inline or fetched from `transcriptSrc` (.json array / .vtt / .srt),
 * it renders below the controls, highlighting and auto-scrolling each cue as it
 * plays (karaoke); clicking a cue seeks to its start.
 *
 * With `start`/`end` the player plays only that fragment of `src` (one long
 * episode file can serve many clips): times, seek bar, resume position and
 * transcript cues are all fragment-relative — hand it the fragment's own cut
 * .srt, not the episode's.
 *
 * Once playback starts, scrolling the main player out of view reveals a sticky
 * mini-player in the corner (play/pause, seek, volume, speed, close) driving the
 * same audio element. Preferred speed and volume, plus the resume position,
 * persist to localStorage; honors `prefers-reduced-motion`.
 */
export function AudioClip({
  src,
  start,
  end,
  title,
  poster,
  transcript,
  transcriptSrc,
  storageKey,
  sticky = true,
  labels,
  className,
  ...props
}: AudioClipProps) {
  const l = useLabels("audioClip", DEFAULT_AUDIO_CLIP_LABELS, labels);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const scrollBoxRef = React.useRef<HTMLDivElement>(null);
  const activeCueRef = React.useRef<HTMLButtonElement>(null);

  const [fetchedCues, setFetchedCues] = React.useState<TranscriptCue[]>([]);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [rate, setRate] = React.useState(1);
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);

  // Sticky mini-player state.
  const clipId = React.useId();
  const [isActive, setIsActive] = React.useState(false); // driving playback / the sticky?
  const [inView, setInView] = React.useState(true); // is the main player visible?
  const [dismissed, setDismissed] = React.useState(false); // mini closed by reader

  // Keep the latest values available to <audio> event handlers without
  // re-subscribing (the events effect runs once).
  const rateRef = React.useRef(1);
  const volumeRef = React.useRef(1);
  const mutedRef = React.useRef(false);
  // Fragment window. All UI state (currentTime, duration, cues, persistence)
  // is window-relative; only the <audio> element speaks source time.
  const clipStart = start != null && start > 0 ? start : 0;
  const clipStartRef = React.useRef(clipStart);
  clipStartRef.current = clipStart;
  const clipEndRef = React.useRef(end);
  clipEndRef.current = end;
  // Different windows over the same file must not share a resume position.
  const posKey =
    storageKey ??
    (clipStart > 0 || end != null ? `${src}#t=${clipStart},${end ?? ""}` : src);
  const posKeyRef = React.useRef(posKey);
  posKeyRef.current = posKey;
  const restoredRef = React.useRef(false);
  const lastSaveRef = React.useRef(0);

  // Inline transcript wins; otherwise use whatever we fetched.
  const cues = React.useMemo<TranscriptCue[]>(
    () => (transcript && transcript.length > 0 ? transcript : fetchedCues),
    [transcript, fetchedCues],
  );
  const hasTranscript = cues.length > 0;

  // Restore the reader's global preferences (speed, volume) on mount.
  React.useEffect(() => {
    const savedRate = readNumber(RATE_KEY, 0.25, 4);
    if (savedRate) {
      rateRef.current = savedRate;
      setRate(savedRate);
    }
    const savedVol = readNumber(VOL_KEY, 0, 1);
    if (savedVol != null) {
      volumeRef.current = savedVol;
      setVolume(savedVol);
    }
  }, []);

  // Mirror speed/volume/mute onto the audio element whenever they change.
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = rate;
    audio.volume = volume;
    audio.muted = muted;
    rateRef.current = rate;
    volumeRef.current = volume;
    mutedRef.current = muted;
  }, [rate, volume, muted]);

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

    const savePosition = (t: number) => writeNumber(POS_PREFIX + posKeyRef.current, t);

    const onTimeUpdate = () => {
      const cs = clipStartRef.current;
      const ce = clipEndRef.current;
      let rel = Math.max(0, audio.currentTime - cs);
      if (ce != null && audio.currentTime >= ce) {
        if (!audio.paused) audio.pause();
        rel = Math.max(0, ce - cs);
      }
      setCurrentTime(rel);
      const now = Date.now();
      if (now - lastSaveRef.current >= SAVE_THROTTLE_MS) {
        lastSaveRef.current = now;
        savePosition(rel);
      }
    };
    const onLoadedMetadata = () => {
      const cs = clipStartRef.current;
      const total =
        clipEndRef.current ??
        (Number.isFinite(audio.duration) ? audio.duration : 0);
      const windowLen = Math.max(0, total - cs);
      setDuration(windowLen);
      // Re-assert preferences (some browsers reset them on load).
      audio.playbackRate = rateRef.current;
      audio.volume = volumeRef.current;
      audio.muted = mutedRef.current;
      // Restore the saved position once, if it's not effectively the end.
      if (!restoredRef.current) {
        restoredRef.current = true;
        const saved = readNumber(POS_PREFIX + posKeyRef.current, 0, Infinity);
        if (
          saved != null &&
          saved > 0 &&
          (windowLen === 0 || saved < windowLen - 5)
        ) {
          audio.currentTime = cs + saved;
          setCurrentTime(saved);
        } else if (cs > 0) {
          audio.currentTime = cs;
          setCurrentTime(0);
        }
      }
    };
    const onPlay = () => {
      setIsPlaying(true);
      setDismissed(false);
      activateClip(clipId);
    };
    const onPause = () => {
      setIsPlaying(false);
      savePosition(audio.currentTime);
    };
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

  // Track whether the main player is on screen (drives the sticky mini-player).
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || !sticky || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sticky]);

  // Single-active-clip coordination: only the active clip plays and shows a
  // sticky. When another clip takes over, pause this one and step aside.
  React.useEffect(() => {
    const onActiveChange = () => {
      const active = activeClipId === clipId;
      setIsActive(active);
      if (!active) {
        const audio = audioRef.current;
        if (audio && !audio.paused) audio.pause();
      }
    };
    activeClipListeners.add(onActiveChange);
    return () => {
      activeClipListeners.delete(onActiveChange);
      if (activeClipId === clipId) activeClipId = null;
    };
  }, [clipId]);

  const activeIdx = hasTranscript ? findActiveCueIndex(cues, currentTime) : -1;

  // Auto-scroll the active cue into view within the scroll box.
  React.useEffect(() => {
    const box = scrollBoxRef.current;
    const cue = activeCueRef.current;
    if (!box || !cue) return;
    const top =
      cue.offsetTop - box.offsetTop - box.clientHeight / 2 + cue.clientHeight / 2;
    box.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [activeIdx]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      // Play again after pausing at the window's end restarts the fragment.
      if (end != null && audio.currentTime >= end - 0.05) {
        audio.currentTime = clipStart;
        setCurrentTime(0);
      }
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
    audio.currentTime = clipStart;
    setCurrentTime(0);
  }

  function seekTo(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(
      0,
      duration > 0 ? Math.min(seconds, duration) : seconds,
    );
    audio.currentTime = clipStart + clamped;
    setCurrentTime(clamped);
  }

  function onSeek(event: React.ChangeEvent<HTMLInputElement>) {
    seekTo(event.currentTarget.valueAsNumber);
  }

  function cycleRate() {
    const idx = RATES.indexOf(rate as (typeof RATES)[number]);
    const next = RATES[(idx + 1) % RATES.length] ?? 1;
    setRate(next);
    writeNumber(RATE_KEY, next);
  }

  function toggleMute() {
    if (muted) {
      setMuted(false);
      if (volume === 0) setVolume(0.5);
    } else {
      setMuted(true);
    }
  }

  function onVolume(event: React.ChangeEvent<HTMLInputElement>) {
    const v = event.currentTarget.valueAsNumber;
    setVolume(v);
    setMuted(v <= 0);
    writeNumber(VOL_KEY, v);
  }

  const effectiveMuted = muted || volume === 0;
  const volumeToggleLabel = effectiveMuted ? l.unmute : l.mute;
  const showMini = sticky && isActive && !inView && !dismissed;

  return (
    <div
      ref={rootRef}
      data-slot="audio-clip"
      className={cn(
        "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <div className="flex items-center gap-4 p-4">
        {poster && (
          <img
            src={poster}
            alt=""
            className="size-16 shrink-0 rounded-md border object-cover"
          />
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

            <FilledRange
              value={currentTime}
              max={duration > 0 ? duration : 1}
              step="any"
              onChange={onSeek}
              label={l.seek}
              valueText={`${formatTime(currentTime)} / ${formatTime(duration)}`}
              className="h-6 min-w-0 flex-1"
            />

            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <VolumeControl
              volume={volume}
              muted={effectiveMuted}
              onToggle={toggleMute}
              onChange={onVolume}
              toggleLabel={volumeToggleLabel}
              volumeLabel={l.volume}
            />

            <SpeedButton rate={rate} onCycle={cycleRate} label={l.speed} />

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

      {showMini &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="region"
            aria-label={l.miniPlayer}
            data-slot="audio-clip-mini"
            className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-2 rounded-xl border bg-card p-2.5 text-card-foreground shadow-lg motion-safe:animate-wgt-fade-up sm:inset-x-auto sm:right-4 sm:left-auto sm:w-96"
          >
            {poster && (
              <img
                src={poster}
                alt=""
                className="size-9 shrink-0 rounded-md border object-cover"
              />
            )}
            <Button
              type="button"
              size="icon"
              className="size-9 shrink-0"
              aria-label={isPlaying ? l.pause : l.play}
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4" />
              )}
            </Button>

            <FilledRange
              value={currentTime}
              max={duration > 0 ? duration : 1}
              step="any"
              onChange={onSeek}
              label={l.seek}
              valueText={`${formatTime(currentTime)} / ${formatTime(duration)}`}
              className="h-1.5 min-w-0 flex-1"
            />

            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {formatTime(currentTime)}
            </span>

            <VolumeControl
              volume={volume}
              muted={effectiveMuted}
              onToggle={toggleMute}
              onChange={onVolume}
              toggleLabel={volumeToggleLabel}
              volumeLabel={l.volume}
            />

            <SpeedButton rate={rate} onCycle={cycleRate} label={l.speed} />

            <button
              type="button"
              onClick={() => {
                const audio = audioRef.current;
                if (audio && !audio.paused) audio.pause();
                setDismissed(true);
              }}
              aria-label={l.close}
              className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

AudioClip.displayName = "AudioClip";
