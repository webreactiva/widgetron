import * as React from "react";
import { Pause, Play, RotateCcw } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { RichText } from "@/primitives/rich-text";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";

export interface AudiogramCue {
  /** Cue start, in seconds (fragment-relative). */
  start: number;
  /** Optional cue end, in seconds. */
  end?: number;
  /** The spoken line, shown as the live caption while it plays. */
  text: string;
}

export interface RadialAudiogramLabels {
  play: string;
  pause: string;
  restart: string;
}

export const DEFAULT_RADIAL_AUDIOGRAM_LABELS: RadialAudiogramLabels = {
  play: "Play",
  pause: "Pause",
  restart: "Restart",
};

export interface RadialAudiogramProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> {
  /** Audio source URL (required). */
  src: string;
  /**
   * Precomputed normalized (0–1) amplitude peaks — the real audio shape,
   * extracted server-side. The ring is drawn from these, so no cross-origin
   * decode is needed (CORS-proof). Required for the waveform ring.
   */
  peaks: number[];
  /** Fragment window start (seconds in src). Playback begins here. */
  start?: number;
  /** Fragment window end (seconds in src). Playback pauses here. */
  end?: number;
  /** Caption cues (fragment-relative). The active line shows beside the ring. */
  transcript?: AudiogramCue[];
  /** Small label above the title (e.g. an episode minute). */
  eyebrow?: React.ReactNode;
  /** Title beside the ring (e.g. speaker or clip name). */
  title?: React.ReactNode;
  /** Bars around the ring. Default: 64. */
  bars?: number;
  /** Ring diameter in px. Default: 220. */
  size?: number;
  /** Bar thickness in px. Default: 3. */
  barWidth?: number;
  /** Active/progress color — any CSS color or `var(--token)`. Default: `--primary`. */
  color?: string;
  /** Customizable / translatable strings. */
  labels?: Partial<RadialAudiogramLabels>;
}

/** Resolve aseptic colors to concrete rgb(a) for the canvas (which can't read CSS vars). */
function resolveColors(root: HTMLElement, colorOverride?: string) {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;opacity:0;pointer-events:none;";
  root.appendChild(probe);
  const read = (expr: string, fallback: string) => {
    probe.style.color = fallback;
    probe.style.color = expr;
    return getComputedStyle(probe).color || fallback;
  };
  const colors = {
    wave: read(
      "color-mix(in oklab, var(--muted-foreground) 45%, transparent)",
      "rgba(148,163,184,0.5)",
    ),
    active: read(colorOverride ?? "var(--primary)", "#e11d48"),
  };
  root.removeChild(probe);
  return colors;
}

function activeCue(cues: AudiogramCue[], t: number): number {
  let active = -1;
  for (let i = 0; i < cues.length; i++) {
    if (cues[i].start > t + 0.05) break;
    active = i;
  }
  return active;
}

/**
 * RadialAudiogram — a "Headliner"-style circular audiogram: a ring of bars drawn
 * from the clip's REAL peaks that breathes with the audio's loudness and fills
 * as it plays, with the live caption beside it. Sound-only, bold, and honest
 * (no fabricated bars — the shape is the real waveform). Aseptic: the ring uses
 * `--muted-foreground` / `--primary` tokens; reduced motion holds it still.
 */
export function RadialAudiogram({
  src,
  peaks,
  start,
  end,
  transcript,
  eyebrow,
  title,
  bars = 64,
  size = 220,
  barWidth = 3,
  color,
  labels,
  className,
  ...props
}: RadialAudiogramProps) {
  const l = useLabels(
    "radialAudiogram",
    DEFAULT_RADIAL_AUDIOGRAM_LABELS,
    labels,
  );
  const { ref, emit } = useWidgetEvents("radial-audiogram");

  const rootRef = React.useRef<HTMLDivElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number | null>(null);

  const clipStart = start != null && start > 0 ? start : 0;
  const clipStartRef = React.useRef(clipStart);
  clipStartRef.current = clipStart;
  const windowLen = end != null ? Math.max(0.001, end - clipStart) : undefined;

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(windowLen ?? 0);

  const cues = transcript ?? [];
  const activeIdx = activeCue(cues, currentTime);

  // --- canvas drawing --------------------------------------------------------
  const drawRef = React.useRef<(t: number) => void>(() => {});
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = resolveColors(root, color);
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const c = size / 2;
    const r0 = size * 0.32;
    const maxLen = size * 0.16;
    const N = Math.max(12, bars);
    const dur = duration || windowLen || 1;
    const rate = peaks.length / dur; // samples per second
    const travelSpan = 1.1; // seconds of loudness spread around the ring

    const sampleAt = (sec: number) => {
      const x = sec * rate;
      if (x <= 0) return peaks[0] ?? 0;
      if (x >= peaks.length - 1) return peaks[peaks.length - 1] ?? 0;
      const i = Math.floor(x);
      const f = x - i;
      return peaks[i] * (1 - f) + peaks[i + 1] * f;
    };

    drawRef.current = (relTime: number) => {
      ctx.clearRect(0, 0, size, size);
      ctx.lineWidth = barWidth;
      ctx.lineCap = "round";
      for (let i = 0; i < N; i++) {
        const ang = -Math.PI / 2 + (i / N) * Math.PI * 2;
        // The real loudness of the last ~1s spread around the ring: as playback
        // advances, the "aura" travels around the circle and pulses. Reduced
        // motion freezes it to the whole clip's shape.
        const t = reduce ? (i / N) * dur : relTime - (i / N) * travelSpan;
        const amp = sampleAt(t);
        const len = r0 + (0.12 + 0.95 * amp) * maxLen;
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);
        ctx.beginPath();
        ctx.moveTo(c + cos * r0, c + sin * r0);
        ctx.lineTo(c + cos * len, c + sin * len);
        ctx.strokeStyle = colors.active;
        ctx.stroke();
      }
    };
    drawRef.current(currentTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, barWidth, color, peaks, bars, duration, windowLen]);

  // --- playback wiring -------------------------------------------------------
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const cs = clipStartRef.current;

    const onLoaded = () => {
      setDuration(
        windowLen ??
          (Number.isFinite(audio.duration) ? audio.duration - cs : 0),
      );
      if (audio.currentTime < cs) audio.currentTime = cs;
    };
    const onTime = () => {
      if (end != null && audio.currentTime >= end) {
        audio.pause();
        setIsPlaying(false);
        audio.currentTime = end;
      }
      setCurrentTime(Math.max(0, audio.currentTime - cs));
    };
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("durationchange", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("durationchange", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [end, windowLen]);

  // Smooth ring animation via rAF while playing; a single frame when paused.
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!isPlaying) {
      drawRef.current(currentTime);
      return;
    }
    const loop = () => {
      const rel = Math.max(0, audio.currentTime - clipStartRef.current);
      drawRef.current(rel);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, currentTime]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (audio.currentTime < clipStartRef.current)
        audio.currentTime = clipStartRef.current;
      void audio.play();
      setIsPlaying(true);
      emit("play", { at: Math.round(currentTime) });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function restart() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = clipStartRef.current;
    setCurrentTime(0);
    drawRef.current(0);
  }

  return (
    <div
      ref={(node) => {
        rootRef.current = node;
        ref.current = node;
      }}
      data-slot="radial-audiogram"
      data-playing={isPlaying || undefined}
      className={cn(
        "@container/aud rounded-lg border bg-card p-5 text-card-foreground shadow-wgt @sm/aud:p-6",
        className,
      )}
      {...props}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      {/* Layout wrapper: the container query only styles descendants, so the
          row/column switch must live *inside* the @container/aud root. */}
      <div className="flex flex-col items-center gap-5 @sm/aud:flex-row @sm/aud:gap-6">
        <div
          className="relative shrink-0"
          style={{ width: size, height: size }}
        >
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            aria-hidden
            className="size-full"
          />
          <Button
            type="button"
            size="icon"
            aria-label={isPlaying ? l.pause : l.play}
            onClick={togglePlay}
            className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full"
          >
            {isPlaying ? <Pause /> : <Play />}
          </Button>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 text-center @sm/aud:w-auto @sm/aud:flex-1 @sm/aud:text-left">
          {eyebrow != null && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <RichText>{eyebrow}</RichText>
            </p>
          )}
          {title != null && (
            <p className="text-lg font-bold leading-tight @sm/aud:text-xl">
              <RichText>{title}</RichText>
            </p>
          )}
          <p
            className="min-h-[2.5em] text-balance text-base font-medium leading-snug text-primary @sm/aud:text-lg"
            aria-live="polite"
          >
            {activeIdx >= 0 ? (
              <span
                key={activeIdx}
                className="inline-block motion-safe:animate-wgt-fade-up"
              >
                <RichText>{cues[activeIdx].text}</RichText>
              </span>
            ) : (
              "�"
            )}
          </p>
          {duration > 0 && (
            <div className="mt-1 flex items-center justify-center gap-3 text-xs tabular-nums text-muted-foreground @sm/aud:justify-start">
              <span>
                {formatClock(currentTime)} / {formatClock(duration)}
              </span>
              <button
                type="button"
                onClick={restart}
                aria-label={l.restart}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

RadialAudiogram.displayName = "RadialAudiogram";
