import * as React from "react";

import { emitWidgetronEvent } from "@/lib/analytics";
import { useLabels } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/primitives/tooltip";
import { GlossaryProvider, type GlossaryMap } from "@/widgets/glossary";
import { ProfileProvider } from "@/widgets/profile-quiz";

export interface StorylineModule {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** The widget screens shown in this module, top to bottom. */
  screens: React.ReactNode[];
}

export interface StorylineLabels {
  /** Eyebrow for a 1-based module number, e.g. "Module 01". */
  module: (n: number) => string;
  /** aria-label of the module dot navigation. */
  modulesNav: string;
  /** Resume bar: question shown when a saved position exists. */
  resumePrompt: string;
  /** Resume bar: jump back to the saved position. */
  resume: string;
  /** Resume bar: dismiss and read from the top. */
  startOver: string;
}

export const DEFAULT_STORYLINE_LABELS: StorylineLabels = {
  module: (n) => `Module ${String(n).padStart(2, "0")}`,
  modulesNav: "Modules",
  resumePrompt: "Pick up where you left off?",
  resume: "Resume",
  startOver: "Start from the top",
};

export interface StorylineProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /**
   * Course title, rendered as a cover section before the first module. In a
   * Story Studio document the engine fills it from `meta.title`.
   */
  title?: React.ReactNode;
  /** Cover lead line under the title. */
  description?: React.ReactNode;
  modules: StorylineModule[];
  /** Show the "Module 01" eyebrow above each title. Default: true. */
  numbered?: boolean;
  /** Render the eyebrow for a 0-based module index. Default: labels.module. */
  moduleLabel?: (index: number) => React.ReactNode;
  /** Glossary terms available to `[[term]]` text anywhere in the course. */
  glossary?: GlossaryMap;
  /**
   * Enable reader personalization for the whole course: a ProfileQuiz inside any
   * screen writes the profile, and ProfileGate screens tailor to it. Pass a
   * string to persist under that localStorage key, or `true` for in-memory only.
   */
  profile?: boolean | string;
  /**
   * Persist the reading position in localStorage under this key. On return, a
   * bar at the top of the storyline offers to jump back to the saved spot.
   */
  storageKey?: string;
  labels?: Partial<StorylineLabels>;
}

const POSITION_PREFIX = "wgt-storyline:";
/** Below this scroll offset (px) there is nothing worth resuming. */
const RESUME_MIN_TOP = 240;

function readSavedTop(key: string): number {
  try {
    const raw = window.localStorage.getItem(POSITION_PREFIX + key);
    const top = raw === null ? NaN : Number(raw);
    return Number.isFinite(top) ? top : 0;
  } catch {
    return 0;
  }
}

/**
 * Storyline — the dispensa reading composition (the "scrollytelling" reading
 * flow from ../dispensa, faithfully ported): a single-column, scroll-driven
 * document of modules. Each module fills the reading viewport, alternates its
 * background, and reveals its screens as they scroll in. A progress bar tracks
 * the raw scroll position and side dots (with a tooltip naming each module)
 * jump between modules. With `storageKey` it remembers where the reader
 * stopped and offers to resume there on the next visit. Assembles any widgets
 * into a course — the formative composition that *generates a dispensa*.
 *
 * Self-contained: it owns its scroll viewport (default height via `className`,
 * e.g. `h-[80vh]`), so it works embedded anywhere.
 */
export function Storyline({
  title,
  description,
  modules,
  numbered = true,
  moduleLabel,
  glossary,
  profile,
  storageKey,
  labels,
  className,
  ...props
}: StorylineProps) {
  const l = useLabels("storyline", DEFAULT_STORYLINE_LABELS, labels);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const moduleRefs = React.useRef<(HTMLElement | null)[]>([]);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [active, setActive] = React.useState(0);
  const [savedTop, setSavedTop] = React.useState<number | null>(null);
  // Analytics dedup — refs survive Strict Mode re-runs and effect re-subscribes,
  // so each section view / milestone is emitted at most once per instance.
  const lastSectionEmitted = React.useRef(-1);
  const milestonesEmitted = React.useRef<Set<number>>(new Set());

  const emitStoryline = React.useCallback(
    (action: string, data?: Record<string, unknown>) =>
      emitWidgetronEvent(scrollRef.current, {
        source: "storyline",
        widget: "storyline",
        action,
        id: storageKey,
        data,
      }),
    [storageKey],
  );

  const eyebrow = moduleLabel ?? ((i: number) => l.module(i + 1));

  // Offer to resume when a meaningful position was saved on a previous visit.
  React.useEffect(() => {
    if (!storageKey) return;
    const top = readSavedTop(storageKey);
    if (top >= RESUME_MIN_TOP) setSavedTop(top);
  }, [storageKey]);

  // Progress bar + active module + position persistence, driven by the
  // container's own scroll. The bar measures the raw scroll offset — it is
  // deliberately not quantized to modules.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = el.scrollHeight - el.clientHeight;
        const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
        setProgress(pct);
        const center = el.scrollTop + el.clientHeight / 2;
        let idx = 0;
        moduleRefs.current.forEach((m, i) => {
          if (m && m.offsetTop <= center) idx = i;
        });
        setActive(idx);
        if (idx !== lastSectionEmitted.current) {
          lastSectionEmitted.current = idx;
          const title = modules[idx]?.title;
          emitStoryline("section_viewed", {
            index: idx,
            total: modules.length,
            title: typeof title === "string" ? title : undefined,
          });
        }
        for (const m of [25, 50, 75, 100]) {
          if (pct >= m && !milestonesEmitted.current.has(m)) {
            milestonesEmitted.current.add(m);
            emitStoryline("scroll_milestone", { percent: m });
            if (m === 100) emitStoryline("completed", {});
          }
        }
        ticking = false;
      });
      if (storageKey) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          try {
            window.localStorage.setItem(
              POSITION_PREFIX + storageKey,
              String(Math.round(el.scrollTop)),
            );
          } catch {
            /* private mode etc. — reading position is best-effort */
          }
        }, 250);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [modules.length, storageKey]);

  // Reveal screens as they enter the reading viewport.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            entry.target.setAttribute("data-visible", "true");
        }
      },
      { root: el, threshold: 0.15 },
    );
    el.querySelectorAll("[data-reveal]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [modules]);

  const resume = () => {
    if (savedTop !== null) {
      scrollRef.current?.scrollTo({ top: savedTop, behavior: "smooth" });
      emitStoryline("resumed", { top: savedTop });
    }
    setSavedTop(null);
  };

  const startOver = () => {
    setSavedTop(null);
    if (storageKey) {
      try {
        window.localStorage.removeItem(POSITION_PREFIX + storageKey);
      } catch {
        /* ignore */
      }
    }
  };

  const reveal =
    "transition-all duration-500 opacity-0 translate-y-5 data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100";

  // Screens live in a reading column (max-w-2xl), but screens holding
  // wide-content widgets (code, diagrams, annotated figures) break out to
  // max-w-5xl. On narrow viewports both caps exceed the screen, so mobile is
  // unaffected — wide displays just get used.
  const screenWidth =
    "mx-auto w-full max-w-2xl has-[[data-slot=code-translation]]:max-w-5xl has-[[data-slot=mermaid-diagram]]:max-w-5xl has-[[data-slot=data-chart]]:max-w-5xl has-[[data-slot=compare-slider]]:max-w-5xl has-[[data-slot=hotspots]]:max-w-5xl has-[[data-slot=frame-stepper]]:max-w-5xl";

  const tree = (
    <div
      ref={scrollRef}
      data-slot="storyline"
      className={cn(
        "relative h-[600px] overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      {/* Progress bar — pinned to the top of the reading viewport. */}
      <div className="pointer-events-none sticky top-0 z-30 h-0">
        <div className="h-1 bg-primary" style={{ width: `${progress}%` }} />
      </div>

      {/* Resume bar — offers to jump back to the saved reading position. */}
      {savedTop !== null && (
        <div className="sticky top-1 z-40 h-0">
          <div className="mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-md border bg-popover px-4 py-2 text-sm text-popover-foreground shadow-wgt motion-safe:animate-wgt-fade-in">
            <span>{l.resumePrompt}</span>
            <button
              type="button"
              onClick={resume}
              className="font-semibold text-primary underline-offset-2 hover:underline"
            >
              {l.resume}
            </button>
            <button
              type="button"
              onClick={startOver}
              className="text-muted-foreground underline-offset-2 hover:underline"
            >
              {l.startOver}
            </button>
          </div>
        </div>
      )}

      {/* Module navigation dots — pinned to the right, centered. */}
      {modules.length > 1 && (
        <div className="pointer-events-none sticky top-1/2 z-30 hidden h-0 sm:block">
          <nav
            aria-label={l.modulesNav}
            className="pointer-events-auto absolute right-3 flex -translate-y-1/2 flex-col gap-2"
          >
            {modules.map((m, i) => (
              <Tooltip
                key={i}
                side="left"
                content={
                  <span className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    {typeof m.title === "string" ? m.title : l.module(i + 1)}
                  </span>
                }
              >
                <button
                  type="button"
                  aria-label={
                    typeof m.title === "string" ? m.title : l.module(i + 1)
                  }
                  aria-current={i === active || undefined}
                  onClick={() =>
                    moduleRefs.current[i]?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                  className={cn(
                    "block size-3 rounded-full border transition-colors",
                    i === active
                      ? "border-primary bg-primary"
                      : "border-border bg-card hover:border-primary",
                  )}
                />
              </Tooltip>
            ))}
          </nav>
        </div>
      )}

      {/* Cover — the course title, before the first module. */}
      {title != null && (
        <section className="flex min-h-full flex-col justify-center px-6 py-14 sm:px-10">
          <div
            data-reveal
            className={cn("mx-auto w-full max-w-2xl text-center", reveal)}
          >
            <h1 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>
            {description != null && (
              <p className="mx-auto mt-5 max-w-prose text-lg text-muted-foreground">
                {description}
              </p>
            )}
            <div
              aria-hidden="true"
              className="mx-auto mt-10 h-8 w-px bg-gradient-to-b from-primary to-transparent"
            />
          </div>
        </section>
      )}

      {modules.map((m, i) => (
        <section
          key={i}
          ref={(el) => {
            moduleRefs.current[i] = el;
          }}
          data-module-index={i}
          className={cn(
            "flex min-h-full flex-col justify-center px-6 py-14 sm:px-10",
            i % 2 === 1 && "bg-muted/40",
          )}
        >
          <header
            data-reveal
            className={cn("mx-auto mb-8 w-full max-w-2xl", reveal)}
          >
            {numbered && (
              <p className="mb-2 font-mono text-sm font-bold uppercase tracking-[0.1em] text-primary">
                {eyebrow(i)}
              </p>
            )}
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {m.title}
            </h2>
            {m.subtitle != null && (
              <p className="mt-3 max-w-prose text-lg text-muted-foreground">
                {m.subtitle}
              </p>
            )}
          </header>

          <div className="flex flex-col gap-10">
            {m.screens.map((screen, si) => (
              <div key={si} data-reveal className={cn(screenWidth, reveal)}>
                {screen}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  let content = tree;
  if (glossary)
    content = <GlossaryProvider terms={glossary}>{content}</GlossaryProvider>;
  if (profile)
    content = (
      <ProfileProvider
        storageKey={typeof profile === "string" ? profile : undefined}
      >
        {content}
      </ProfileProvider>
    );
  return content;
}

Storyline.displayName = "Storyline";
