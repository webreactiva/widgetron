import * as React from "react";
import { Play, Pause, RotateCcw } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import {
  activateClip,
  formatTime,
  getActiveClipId,
  releaseClip,
  subscribeActiveClip,
  useTranscriptCues,
  type TranscriptCue,
} from "@/widgets/audio-clip/audio-clip";

export interface KaraokeStageLabels {
  play: string;
  pause: string;
  restart: string;
  /** Accessible label for the playback-speed control. */
  speed: string;
  /** Mode tab: stacked lyric lines. */
  modeLines: React.ReactNode;
  /** Mode tab: one beat-by-beat chunk. */
  modeWords: React.ReactNode;
  /** Accessible name for the mode tab group. */
  modeGroup: string;
}

export const DEFAULT_KARAOKE_STAGE_LABELS: KaraokeStageLabels = {
  play: "Play",
  pause: "Pause",
  restart: "Restart",
  speed: "Playback speed",
  modeLines: "Lyrics",
  modeWords: "Word by word",
  modeGroup: "Typographic treatment",
};

export interface KaraokeStageProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Audio source URL. Optional: without it the stage self-paces from the cue
   * timestamps — a purely typographic piece.
   */
  src?: string;
  /** Fragment window start (seconds in `src`). Playback begins here. */
  start?: number;
  /** Fragment window end (seconds in `src`). Playback pauses here. */
  end?: number;
  /** Inline transcript cues (seconds, fragment-relative). */
  transcript?: TranscriptCue[];
  /** URL to a .json / .vtt / .srt transcript fetched on mount. */
  transcriptSrc?: string;
  /**
   * Typographic treatment. "lines" stacks lyric lines (Spotify-style) — best
   * for paragraphs with rhythm; "words" shows one beat-by-beat chunk
   * (TikTok-subtitle-style) — best for short, maximum-impact sentences.
   * Default: "lines". The reader can switch at any time.
   */
  mode?: "lines" | "words";
  /** Eyebrow above the stage, e.g. "WR 300 · 23:14". */
  eyebrow?: React.ReactNode;
  labels?: Partial<KaraokeStageLabels>;
}

const RATES = [1, 1.25, 1.5, 1.75, 2] as const;

interface TimedWord {
  text: string;
  start: number;
  end: number;
}

/**
 * Estimate per-word times by interpolating inside each cue: weight by word
 * length plus a pause for trailing punctuation. The everyday sentence-level
 * SRT feeds the karaoke — no word-level ASR needed.
 */
function timeWords(cues: TranscriptCue[]): TimedWord[][] {
  return cues.map((cue, c) => {
    // Real per-word timing wins when the cue carries it — accurate beats over a
    // stable sentence, no interpolation guesswork.
    if (cue.words && cue.words.length) {
      return cue.words.map((w) => ({
        text: w.text,
        start: w.start,
        end: w.end,
      }));
    }
    const cueEnd =
      cue.end ??
      cues[c + 1]?.start ??
      cue.start + Math.max(1.5, cue.text.length / 15);
    const tokens = cue.text.split(/\s+/).filter(Boolean);
    const weights = tokens.map(
      (w) => w.length + 1 + (/[.,;:!?…»)\]]$/.test(w) ? 4 : 0),
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
    const span = Math.max(0.2, cueEnd - cue.start);
    let t = cue.start;
    return tokens.map((text, i) => {
      const d = (weights[i] / totalWeight) * span;
      const word = { text, start: t, end: t + d };
      t += d;
      return word;
    });
  });
}

/**
 * KaraokeStage — the episode's peak moment on a full-width stage: the spoken
 * words light up one by one over the code surface (the "recording booth"),
 * like Spotify lyrics or TikTok subtitles. Two typographic treatments, one
 * engine: "lines" (stacked lyrics) and "words" (one sentence at a time). Word
 * timing is interpolated inside each SRT cue (length + punctuation heuristic),
 * so the everyday sentence-level transcript is enough — or, when a cue carries a
 * real `words` array, each word lights on its true beat. Either way the
 * highlight moves by color + glow only (never weight, padding or scale), so the
 * words never reflow. Without `src` it self-paces from the cue timestamps. Use once or twice per
 * storyline at most — it is the fortissimo.
 */
export function KaraokeStage({
  src,
  start,
  end,
  transcript,
  transcriptSrc,
  mode: initialMode = "lines",
  eyebrow,
  labels,
  className,
  ...props
}: KaraokeStageProps) {
  const l = useLabels("karaokeStage", DEFAULT_KARAOKE_STAGE_LABELS, labels);
  const { ref, emit } = useWidgetEvents("karaoke-stage");
  const clipId = React.useId();
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const activeLineRef = React.useRef<HTMLParagraphElement>(null);

  const cues = useTranscriptCues(transcript, transcriptSrc);
  const lines = React.useMemo(() => timeWords(cues), [cues]);
  const words = React.useMemo(() => lines.flat(), [lines]);

  const clipStart = start != null && start > 0 ? start : 0;
  // Fragment-relative timeline; cues are fragment-relative (same contract as
  // AudioClip: hand it the fragment's own cut .srt).
  const total =
    end != null
      ? Math.max(0, end - clipStart)
      : words.length
        ? words[words.length - 1].end
        : 0;

  const [mode, setMode] = React.useState<"lines" | "words">(initialMode);
  const [time, setTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const [scrollY, setScrollY] = React.useState(0);
  const timeRef = React.useRef(0);
  const playedRef = React.useRef(false);
  const completedRef = React.useRef(false);

  // Mirror rate onto the audio element.
  React.useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  // One audio thing plays on the page at a time (shared with AudioClip).
  React.useEffect(() => {
    const unsubscribe = subscribeActiveClip(() => {
      if (getActiveClipId() !== clipId) {
        const audio = audioRef.current;
        if (audio && !audio.paused) audio.pause();
        setPlaying(false);
      }
    });
    return () => {
      unsubscribe();
      releaseClip(clipId);
    };
  }, [clipId]);

  // The clock: audio time when there is audio, a rAF timer otherwise.
  React.useEffect(() => {
    if (!playing || total <= 0) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const audio = audioRef.current;
      let t: number;
      if (audio) {
        t = Math.max(0, audio.currentTime - clipStart);
        if (end != null && audio.currentTime >= end && !audio.paused)
          audio.pause();
      } else {
        t = Math.min(total, timeRef.current + ((now - last) / 1000) * rate);
        last = now;
      }
      timeRef.current = t;
      setTime(t);
      if (t >= total - 0.05) {
        setPlaying(false);
        if (!completedRef.current) {
          completedRef.current = true;
          emit("completed", { mode });
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, rate, clipStart, end, total, mode, emit]);

  // Keep the active line vertically centered on the stage.
  const activeLineIdx = React.useMemo(() => {
    let active = 0;
    for (let i = 0; i < cues.length; i++) {
      if (cues[i].start > time + 0.05) break;
      active = i;
    }
    return active;
  }, [cues, time]);

  React.useLayoutEffect(() => {
    if (mode !== "lines") return;
    const stage = stageRef.current;
    const line = activeLineRef.current;
    if (!stage || !line) return;
    setScrollY(
      Math.max(0, line.offsetTop - stage.clientHeight / 2 + line.clientHeight / 2),
    );
  }, [activeLineIdx, mode, cues]);

  function togglePlay() {
    const audio = audioRef.current;
    if (playing) {
      audio?.pause();
      setPlaying(false);
      return;
    }
    if (timeRef.current >= total - 0.05) {
      timeRef.current = 0;
      setTime(0);
      if (audio) audio.currentTime = clipStart;
    }
    if (audio) {
      if (audio.currentTime < clipStart) audio.currentTime = clipStart;
      void audio.play().catch(() => setPlaying(false));
    }
    activateClip(clipId);
    if (!playedRef.current) {
      playedRef.current = true;
      emit("played", { mode });
    }
    setPlaying(true);
  }

  function restart() {
    timeRef.current = 0;
    setTime(0);
    completedRef.current = false;
    const audio = audioRef.current;
    if (audio) audio.currentTime = clipStart;
  }

  function switchMode(next: "lines" | "words") {
    if (next === mode) return;
    setMode(next);
    emit("mode_changed", { mode: next });
  }

  function cycleRate() {
    const idx = RATES.indexOf(rate as (typeof RATES)[number]);
    const next = RATES[(idx + 1) % RATES.length] ?? 1;
    setRate(next);
  }

  const dimText = "color-mix(in oklab, var(--wgt-code-fg) 40%, transparent)";
  const hairline = "color-mix(in oklab, var(--wgt-code-fg) 16%, transparent)";
  const border = "color-mix(in oklab, var(--wgt-code-fg) 14%, transparent)";

  const activeWords = lines[activeLineIdx] ?? [];

  return (
    <div
      ref={ref}
      data-slot="karaoke-stage"
      data-mode={mode}
      className={cn(
        "@container/karaoke overflow-hidden rounded-lg border bg-[var(--wgt-code-bg)] text-[var(--wgt-code-fg)] shadow-wgt",
        className,
      )}
      style={{ borderColor: border }}
      {...props}
    >
      {src && <audio ref={audioRef} src={src} preload="metadata" className="hidden" />}

      {/* Top bar: eyebrow + mode tabs */}
      <div
        className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5"
        style={{ borderColor: border }}
      >
        {eyebrow != null && (
          <p
            className="mr-auto font-mono text-[0.68rem] uppercase tracking-wider"
            style={{ color: dimText }}
          >
            {eyebrow}
          </p>
        )}
        <div
          role="group"
          aria-label={l.modeGroup}
          className={cn("flex overflow-hidden rounded-md border", eyebrow == null && "ml-auto")}
          style={{ borderColor: border }}
        >
          {(["lines", "words"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => switchMode(m)}
              className={cn(
                "px-3 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                mode === m
                  ? "bg-[var(--wgt-code-property)] text-[var(--wgt-code-bg)]"
                  : "hover:text-[var(--wgt-code-fg)]",
              )}
              style={mode === m ? undefined : { color: dimText }}
            >
              {m === "lines" ? l.modeLines : l.modeWords}
            </button>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div ref={stageRef} className="relative h-72 overflow-hidden @md/karaoke:h-80">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-[var(--wgt-code-bg)] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-[var(--wgt-code-bg)] to-transparent"
        />

        {mode === "lines" ? (
          <div
            className="absolute inset-x-0 top-0 px-6 py-28 transition-transform duration-(--motion-base) ease-(--ease-out) @md/karaoke:px-8"
            style={{ transform: `translateY(${-scrollY}px)` }}
          >
            {lines.map((line, li) => {
              const isActive = li === activeLineIdx;
              const isSung = li < activeLineIdx;
              return (
                <p
                  key={li}
                  ref={isActive ? activeLineRef : undefined}
                  className={cn(
                    "my-2 font-display text-2xl font-bold leading-snug text-balance transition-[opacity,filter,transform] duration-(--motion-base) @md/karaoke:text-3xl",
                    isActive
                      ? "opacity-100 motion-safe:scale-[1.02]"
                      : isSung
                        ? "opacity-55"
                        : "opacity-30 motion-safe:blur-[0.5px]",
                  )}
                  style={{ transformOrigin: "left center" }}
                >
                  {line.map((word, wi) => {
                    const now = isActive && time >= word.start && time < word.end;
                    const past = isSung || (isActive && time >= word.end);
                    return (
                      <React.Fragment key={wi}>
                        <span
                          className="transition-colors duration-150"
                          style={
                            now
                              ? {
                                  color: "var(--wgt-code-property)",
                                  textShadow:
                                    "0 0 22px color-mix(in oklab, var(--wgt-code-property) 55%, transparent)",
                                }
                              : past
                                ? undefined
                                : { color: dimText }
                          }
                        >
                          {word.text}
                        </span>{" "}
                      </React.Fragment>
                    );
                  })}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            {/* One sentence at a time, big and centered. The highlight moves by
                color + glow only — never padding, weight or scale — so the words
                never reflow or resize as the beat advances. */}
            <p className="max-w-[20ch] font-display text-3xl font-extrabold leading-tight text-balance @md/karaoke:text-4xl">
              {activeWords.map((word, wi) => {
                const now = time >= word.start && time < word.end;
                const past = time >= word.end;
                return (
                  <React.Fragment key={wi}>
                    <span
                      className="transition-[color,text-shadow] duration-200 ease-(--ease-out)"
                      style={
                        now
                          ? {
                              color: "var(--wgt-code-property)",
                              textShadow:
                                "0 0 26px color-mix(in oklab, var(--wgt-code-property) 55%, transparent)",
                            }
                          : past
                            ? undefined
                            : { color: dimText }
                      }
                    >
                      {word.text}
                    </span>{" "}
                  </React.Fragment>
                );
              })}
            </p>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div
        className="flex items-center gap-3 border-t px-4 py-3"
        style={{ borderColor: border }}
      >
        <button
          type="button"
          aria-label={playing ? l.pause : l.play}
          onClick={togglePlay}
          className="grid size-11 shrink-0 place-items-center rounded-md bg-[var(--wgt-code-property)] text-[var(--wgt-code-bg)] transition-[color,background-color,scale] duration-(--motion-fast) ease-(--ease-out) outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
        >
          {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </button>
        <button
          type="button"
          aria-label={l.restart}
          onClick={restart}
          className="grid size-9 shrink-0 place-items-center rounded-md border transition-colors outline-none hover:text-[var(--wgt-code-fg)] focus-visible:ring-2 focus-visible:ring-ring"
          style={{ borderColor: border, color: dimText }}
        >
          <RotateCcw className="size-4" />
        </button>
        <div
          aria-hidden
          className="h-[3px] min-w-0 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: hairline }}
        >
          <div
            className="h-full w-full origin-left bg-[var(--wgt-code-property)]"
            style={{ transform: `scaleX(${total > 0 ? Math.min(1, time / total) : 0})` }}
          />
        </div>
        <span
          className="shrink-0 font-mono text-xs tabular-nums"
          style={{ color: dimText }}
        >
          {formatTime(time)} / {formatTime(total)}
        </span>
        <button
          type="button"
          onClick={cycleRate}
          aria-label={`${l.speed} (${rate}×)`}
          className={cn(
            "shrink-0 rounded-md border px-2 py-1 text-xs font-semibold tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            rate !== 1 && "text-[var(--wgt-code-property)]",
          )}
          style={{
            borderColor: border,
            ...(rate === 1 ? { color: dimText } : undefined),
          }}
        >
          {rate}×
        </button>
      </div>
    </div>
  );
}

KaraokeStage.displayName = "KaraokeStage";
