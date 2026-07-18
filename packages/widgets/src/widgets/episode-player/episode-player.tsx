import * as React from "react";
import { Play, Pause } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText } from "@/primitives/rich-text";
import { Button } from "@/primitives/button";
import {
  FilledRange,
  MiniPlayer,
  SpeedButton,
  VolumeControl,
  activateClip,
  formatTime,
  getActiveClipId,
  releaseClip,
  subscribeActiveClip,
  readNumber,
  writeNumber,
  RATES,
  RATE_KEY,
  VOL_KEY,
  POS_PREFIX,
  SAVE_THROTTLE_MS,
} from "@/widgets/audio-clip/audio-clip";

export interface EpisodeChapter {
  /** Chapter start, in seconds of the episode. */
  start: number;
  title: React.ReactNode;
}

export interface EpisodePlayerLabels {
  play: string;
  pause: string;
  seek: string;
  speed: string;
  volume: string;
  mute: string;
  unmute: string;
  miniPlayer: string;
  close: string;
  /** Accessible name for the chapter list. */
  chapters: string;
}

export const DEFAULT_EPISODE_PLAYER_LABELS: EpisodePlayerLabels = {
  play: "Play",
  pause: "Pause",
  seek: "Seek",
  speed: "Playback speed",
  volume: "Volume",
  mute: "Mute",
  unmute: "Unmute",
  miniPlayer: "Mini player",
  close: "Close mini player",
  chapters: "Chapters",
};

export interface EpisodePlayerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Audio source URL — the full episode file. */
  src: string;
  /** Episode title. */
  title: React.ReactNode;
  /** Small label above the title, e.g. "WR 300 · 42:17". */
  episode?: React.ReactNode;
  /** Optional cover image URL. */
  poster?: string;
  /**
   * Chapters — ideally one per module of the guide, so the reader can jump the
   * audio to the module they are reading. Clicking one seeks and plays.
   */
  chapters?: EpisodeChapter[];
  /**
   * Stable key for persisting the resume position. Required: picking a
   * 40-minute episode back up where you left it is the star feature.
   */
  storageKey: string;
  /** Sticky corner mini-player while reading. Default: true. */
  sticky?: boolean;
  labels?: Partial<EpisodePlayerLabels>;
}

/**
 * EpisodePlayer — the whole episode as the storyline's header (or closing)
 * player: cover, title, chapters that map the guide's modules, and the shared
 * sticky mini-player so the reader can listen while reading. One per
 * storyline. The resume position persists per `storageKey`; speed and volume
 * are the reader's global preferences (shared with AudioClip). Emits
 * `played`, `chapter_selected` and `completed` (at ≥90% listened).
 */
export function EpisodePlayer({
  src,
  title,
  episode,
  poster,
  chapters,
  storageKey,
  sticky = true,
  labels,
  className,
  ...props
}: EpisodePlayerProps) {
  const l = useLabels("episodePlayer", DEFAULT_EPISODE_PLAYER_LABELS, labels);
  const { ref, emit } = useWidgetEvents("episode-player", storageKey);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [rate, setRate] = React.useState(1);
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);

  const clipId = React.useId();
  const [isActive, setIsActive] = React.useState(false);
  const [inView, setInView] = React.useState(true);
  const [dismissed, setDismissed] = React.useState(false);

  const rateRef = React.useRef(1);
  const volumeRef = React.useRef(1);
  const mutedRef = React.useRef(false);
  const restoredRef = React.useRef(false);
  const lastSaveRef = React.useRef(0);
  const playedRef = React.useRef(false);
  const completedRef = React.useRef(false);
  const emitRef = React.useRef(emit);
  emitRef.current = emit;

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

  // Wire the <audio> element events to local state.
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const posKey = POS_PREFIX + storageKey;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const now = Date.now();
      if (now - lastSaveRef.current >= SAVE_THROTTLE_MS) {
        lastSaveRef.current = now;
        writeNumber(posKey, audio.currentTime);
      }
      // Completed = ≥90% listened; timeupdate only fires during playback, so
      // this can never fire from hydrating a restored position.
      if (
        !completedRef.current &&
        Number.isFinite(audio.duration) &&
        audio.duration > 0 &&
        audio.currentTime / audio.duration >= 0.9
      ) {
        completedRef.current = true;
        emitRef.current("completed", {});
      }
    };
    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      audio.playbackRate = rateRef.current;
      audio.volume = volumeRef.current;
      audio.muted = mutedRef.current;
      if (!restoredRef.current) {
        restoredRef.current = true;
        const saved = readNumber(posKey, 0, Infinity);
        if (saved != null && saved > 0 && saved < audio.duration - 5) {
          audio.currentTime = saved;
          setCurrentTime(saved);
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
      writeNumber(posKey, audio.currentTime);
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
  }, [storageKey, clipId]);

  // Track whether the main player is on screen (drives the sticky mini).
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

  // One audio thing plays on the page at a time.
  React.useEffect(() => {
    const unsubscribe = subscribeActiveClip(() => {
      const active = getActiveClipId() === clipId;
      setIsActive(active);
      if (!active) {
        const audio = audioRef.current;
        if (audio && !audio.paused) audio.pause();
      }
    });
    return () => {
      unsubscribe();
      releaseClip(clipId);
    };
  }, [clipId]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (!playedRef.current) {
        playedRef.current = true;
        emit("played", {});
      }
      void audio.play()?.catch(() => {
        /* autoplay/permission rejection — leave paused */
      });
    } else {
      audio.pause();
    }
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

  function selectChapter(index: number) {
    const chapter = chapters?.[index];
    if (!chapter) return;
    emit("chapter_selected", { index, start: chapter.start });
    seekTo(chapter.start);
    void audioRef.current?.play()?.catch(() => {});
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

  // Active chapter = latest one whose start has passed.
  const activeChapter = React.useMemo(() => {
    if (!chapters?.length) return -1;
    let active = -1;
    for (let i = 0; i < chapters.length; i++) {
      if (chapters[i].start > currentTime + 0.05) break;
      active = i;
    }
    return active;
  }, [chapters, currentTime]);

  const mergeRefs = (el: HTMLDivElement | null) => {
    rootRef.current = el;
    (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
  };

  return (
    <div
      ref={mergeRefs}
      data-slot="episode-player"
      className={cn(
        "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      {/* Header: cover + episode + title */}
      <div className="flex items-center gap-3.5 px-4 pt-4 pb-3">
        {poster && (
          <img
            src={poster}
            alt=""
            className="size-14 shrink-0 rounded-md border object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          {episode != null && (
            <p className="font-mono text-[0.68rem] uppercase tracking-wider text-muted-foreground">
              {episode}
            </p>
          )}
          <p className="truncate font-display text-lg font-bold leading-tight">
            <RichText>{title}</RichText>
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-4 pb-3.5">
        <Button
          type="button"
          size="icon"
          aria-label={isPlaying ? l.pause : l.play}
          onClick={togglePlay}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>

        <div className="relative flex h-6 min-w-0 flex-1 items-center">
          <FilledRange
            value={currentTime}
            max={duration > 0 ? duration : 1}
            step="any"
            onChange={onSeek}
            label={l.seek}
            valueText={`${formatTime(currentTime)} / ${formatTime(duration)}`}
            className="h-6 w-full min-w-0"
          />
          {/* Chapter tick marks over the seek bar. */}
          {duration > 0 &&
            chapters?.map(
              (chapter, i) =>
                chapter.start > 0 && (
                  <span
                    key={i}
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 h-2.5 w-0.5 -translate-y-1/2 rounded-full bg-background/90"
                    style={{ left: `${(chapter.start / duration) * 100}%` }}
                  />
                ),
            )}
        </div>

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
      </div>

      {/* Chapters — one per module of the guide. */}
      {chapters != null && chapters.length > 0 && (
        <ol aria-label={l.chapters} className="border-t">
          {chapters.map((chapter, index) => {
            const isCurrent = index === activeChapter;
            return (
              <li key={index} className="border-b last:border-b-0">
                <button
                  type="button"
                  aria-current={isCurrent ? "true" : undefined}
                  onClick={() => selectChapter(index)}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    isCurrent
                      ? "font-semibold [background-color:color-mix(in_oklab,var(--primary)_8%,transparent)]"
                      : "hover:bg-muted",
                  )}
                >
                  <span className="w-11 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatTime(chapter.start)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <RichText>{chapter.title}</RichText>
                  </span>
                  {isCurrent && (
                    <span aria-hidden className="flex h-3 shrink-0 items-end gap-0.5">
                      {[0, 200, 450].map((delay) => (
                        <span
                          key={delay}
                          className="w-[3px] rounded-[1px] bg-primary motion-safe:animate-[wgt-eq_0.9s_ease-in-out_infinite]"
                          style={{
                            animationDelay: `${delay}ms`,
                            animationPlayState: isPlaying ? "running" : "paused",
                            height: 4,
                          }}
                        />
                      ))}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {showMini && (
        <MiniPlayer
          poster={poster}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={togglePlay}
          onSeek={onSeek}
          volume={volume}
          muted={effectiveMuted}
          onToggleMute={toggleMute}
          onVolume={onVolume}
          rate={rate}
          onCycleRate={cycleRate}
          onClose={() => {
            const audio = audioRef.current;
            if (audio && !audio.paused) audio.pause();
            setDismissed(true);
          }}
          labels={{
            play: l.play,
            pause: l.pause,
            seek: l.seek,
            volume: l.volume,
            muteToggle: volumeToggleLabel,
            speed: l.speed,
            region: l.miniPlayer,
            close: l.close,
          }}
        />
      )}
    </div>
  );
}

EpisodePlayer.displayName = "EpisodePlayer";
