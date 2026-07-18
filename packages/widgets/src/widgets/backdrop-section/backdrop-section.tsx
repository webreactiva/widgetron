import * as React from "react";

import { cn } from "@/lib/utils";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { RichText } from "@/primitives/rich-text";

export interface BackdropWord {
  text: string;
  /** Visual prominence, 1 (small, dim) to 5 (huge). Default: 3. */
  weight?: 1 | 2 | 3 | 4 | 5;
}

export type BackdropSpec =
  | {
      kind: "image";
      /** Real image URL (same rule as figure: no invented assets). */
      src: string;
      /** Usually "" — the backdrop is scenery; the prose carries the meaning. */
      alt?: string;
      /** object-position, e.g. "50% 30%", so the key region survives crops. */
      focal?: string;
    }
  | {
      kind: "words";
      /** 10–25 words from the episode's own vocabulary. Deliberate art
       * direction, not a computed word cloud. */
      words: BackdropWord[];
    };

export interface BackdropStep {
  /** The prose card that scrolls over the backdrop. */
  content: React.ReactNode;
  /** Swap the whole backdrop when this step becomes active. */
  backdrop?: BackdropSpec;
  /** kind:"words" only — the words that light up while this step is active. */
  highlight?: string[];
}

export interface BackdropSectionProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** The initial / fallback scene. */
  backdrop: BackdropSpec;
  /** 2–5 short steps is the sweet spot. */
  steps: BackdropStep[];
  /**
   * Scroll-linked drift of the scene (the parallax): a slight scale/translate
   * across the section, via CSS scroll-driven animation — zero JS, and it
   * simply doesn't happen without browser support or with reduced motion.
   * Default: true.
   */
  parallax?: boolean;
}

const WORD_SIZE: Record<number, string> = {
  1: "text-xl @md:text-2xl",
  2: "text-2xl @md:text-4xl",
  3: "text-4xl @md:text-5xl",
  4: "text-5xl @md:text-7xl",
  5: "text-6xl @md:text-8xl",
};

/** The typographic composition — a hand-directed word wall, not a cloud. */
function WordsBackdrop({
  words,
  highlight,
}: {
  words: BackdropWord[];
  highlight?: string[];
}) {
  const lit = new Set((highlight ?? []).map((w) => w.toLowerCase()));
  return (
    <div className="flex h-full w-full flex-wrap content-center items-baseline justify-center gap-x-[0.6em] gap-y-2 overflow-hidden p-8 text-center">
      {words.map((word, i) => {
        const on = lit.has(word.text.toLowerCase());
        return (
          <span
            key={i}
            className={cn(
              "font-display font-bold leading-none transition-[color,opacity] duration-(--motion-slow)",
              WORD_SIZE[word.weight ?? 3],
              i % 3 === 1 ? "rotate-1" : i % 3 === 2 ? "-rotate-1" : "",
              on
                ? "text-primary opacity-100"
                : lit.size > 0
                  ? "text-muted-foreground opacity-25"
                  : "text-muted-foreground opacity-45",
            )}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
}
WordsBackdrop.displayName = "WordsBackdrop";

/**
 * BackdropSection — a full-pane scene with prose passing over it: the
 * backdrop (an image or a typographic composition of the episode's words)
 * sticks and fills the reading viewport while short step cards scroll across.
 * Sticky positions against the nearest scroll container, so inside a
 * storyline it fills the pane (100cqh — the storyline root is a size
 * container) and standalone it falls back to the viewport. Steps advance the
 * scene discretely (image swap / word highlights) via the same
 * IntersectionObserver recipe Scrollytelling uses; crossfades only, no
 * scroll-scrubbing, no dependencies. A scrim built from semantic tokens
 * keeps the cards legible in both themes. Emits `step_viewed` when the
 * active step changes.
 */
export function BackdropSection({
  backdrop,
  steps,
  parallax = true,
  className,
  ...props
}: BackdropSectionProps) {
  const { ref, emit } = useWidgetEvents("backdrop-section");
  const stepRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = React.useState(0);
  // Initial index is never emitted; only reader-driven changes are.
  const lastEmittedRef = React.useRef(0);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // Center-band tracking. rootMargin resolves against the window when root
    // is null, so pass the storyline pane as root when embedded.
    const pane =
      (ref.current?.closest('[data-slot="storyline"]') as HTMLElement | null) ??
      null;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.step);
            if (!Number.isNaN(index)) setActive(index);
          }
        }
      },
      { root: pane, rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    for (const el of stepRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [steps.length, ref]);

  React.useEffect(() => {
    if (active === lastEmittedRef.current) return;
    lastEmittedRef.current = active;
    emit("step_viewed", { index: active, total: steps.length });
  }, [active, steps.length, emit]);

  // The scene: the latest step-level backdrop that has passed, else the base.
  let scene = backdrop;
  let sceneKey = -1;
  for (let i = 0; i <= active && i < steps.length; i++) {
    if (steps[i].backdrop) {
      scene = steps[i].backdrop as BackdropSpec;
      sceneKey = i;
    }
  }
  const highlight = steps[active]?.highlight;
  const decorative =
    scene.kind === "words" || !("alt" in scene && scene.alt);

  return (
    <div
      ref={ref}
      data-slot="backdrop-section"
      className={cn("@container relative", className)}
      {...props}
    >
      {/* Sticky scene layer — pins against the nearest scroll container. */}
      <div
        aria-hidden={decorative || undefined}
        className="sticky top-0 z-0 h-[100cqh] overflow-hidden"
      >
        {/* Drift wrapper: the scroll-linked parallax animates this persistent
            layer (see wgt-backdrop-drift in theme.css); the keyed child below
            crossfades on backdrop swaps without restarting the drift. */}
        <div
          data-backdrop-drift={parallax ? "" : undefined}
          className="absolute inset-0"
        >
          {/* keyed on the providing step so a swapped backdrop crossfades;
              word highlights transition in place instead. */}
          <div key={sceneKey} className="absolute inset-0 motion-safe:animate-wgt-fade-in">
            {scene.kind === "image" ? (
              <img
                src={scene.src}
                alt={scene.alt ?? ""}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
                style={scene.focal ? { objectPosition: scene.focal } : undefined}
              />
            ) : (
              <WordsBackdrop words={scene.words} highlight={highlight} />
            )}
          </div>
        </div>
        {/* Scrim — semantic tokens, never a hardcoded overlay. */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/20 to-background/60" />
      </div>

      {/* Prose cards scrolling over the scene. */}
      <div className="relative z-10 -mt-[100cqh]">
        {steps.map((step, index) => (
          <div
            key={index}
            data-step={index}
            ref={(el) => {
              stepRefs.current[index] = el;
            }}
            className="flex min-h-[85cqh] items-center justify-center px-6"
          >
            <div
              className={cn(
                "w-full max-w-prose rounded-lg border bg-card/85 p-5 text-card-foreground shadow-wgt backdrop-blur transition-opacity duration-(--motion-base)",
                index === active ? "opacity-100" : "opacity-60",
              )}
            >
              <div className="text-base leading-relaxed">
                <RichText>{step.content}</RichText>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

BackdropSection.displayName = "BackdropSection";
