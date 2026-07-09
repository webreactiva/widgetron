import * as React from "react";

import { emitWidgetronEvent, onWidgetronEvent } from "@/lib/analytics";
import { fireConfetti } from "@/lib/confetti";
import { Check, X } from "@/lib/icons";
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
  /** Finale: heading of the completion section at the end of the course. */
  finaleTitle: React.ReactNode;
  /** Finale: challenges stat, counted from bubbled `answered` events. */
  finaleChallenges: (correct: number, answered: number) => React.ReactNode;
  /** Finale: activities stat, counted from bubbled `completed` events. */
  finaleActivities: (count: number) => React.ReactNode;
  /** Finale: session reading time, in whole minutes. */
  finaleTime: (minutes: number) => React.ReactNode;
  /** Mobile module index: close-button label. */
  tocClose: string;
  /** Mobile module index: estimated reading time remaining. */
  minutesLeft: (minutes: number) => React.ReactNode;
}

export const DEFAULT_STORYLINE_LABELS: StorylineLabels = {
  module: (n) => `Module ${String(n).padStart(2, "0")}`,
  modulesNav: "Modules",
  resumePrompt: "Pick up where you left off?",
  resume: "Resume",
  startOver: "Start from the top",
  finaleTitle: "You've completed the guide!",
  finaleChallenges: (correct, answered) =>
    `Challenges passed: ${correct}/${answered}`,
  finaleActivities: (count) => `Activities completed: ${count}`,
  finaleTime: (minutes) => `~${minutes} min of reading`,
  tocClose: "Close",
  minutesLeft: (minutes) => `~${minutes} min left`,
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
  /**
   * Closing screen rendered AFTER the built-in completion finale — the natural
   * slot for a CTA, so the reader is celebrated first and pitched second.
   */
  outro?: React.ReactNode;
  /**
   * Fire a confetti burst the first time the reader scrolls to the end.
   * Default: true. Reduced-motion-safe; never fires without a real scroll.
   */
  celebrate?: boolean;
  labels?: Partial<StorylineLabels>;
}

const POSITION_PREFIX = "wgt-storyline:";
/** Below this scroll offset (px) there is nothing worth resuming. */
const RESUME_MIN_TOP = 240;
// ponytail: ~220 wpm flat estimate; per-widget weights if it ever matters.
const WORDS_PER_MINUTE = 220;

export interface StorylineProgress {
  /** Saved scroll offset, px. */
  top: number;
  /** Scroll progress, 0–100. */
  pct: number;
  /** The reader has reached the end at least once. */
  done: boolean;
}

/**
 * Read the reading progress a Storyline persisted under `storageKey` — the
 * hook for hosts (catalogs, dashboards) to show "Continue · 60%" or
 * "Completed ✓" without touching the widget. Returns null when nothing was
 * saved. Understands the legacy bare-px format from earlier versions.
 */
export function readStorylineProgress(key: string): StorylineProgress | null {
  try {
    const raw = window.localStorage.getItem(POSITION_PREFIX + key);
    if (raw === null) return null;
    if (raw.startsWith("{")) {
      const p = JSON.parse(raw) as Partial<StorylineProgress>;
      return {
        top: Number(p.top) || 0,
        pct: Number(p.pct) || 0,
        done: p.done === true,
      };
    }
    const top = Number(raw);
    return Number.isFinite(top) ? { top, pct: 0, done: false } : null;
  } catch {
    return null;
  }
}

/**
 * Storyline — the dispensa reading composition (the "scrollytelling" reading
 * flow from ../dispensa, faithfully ported): a single-column, scroll-driven
 * document of modules. Each module fills the reading viewport, alternates its
 * background, and reveals its screens as they scroll in. A segmented progress
 * bar (one segment per module) and side dots with pending/active/✓ states (a
 * tooltip names each module) jump between modules. Reaching the end lands on a
 * built-in finale — confetti plus a session scoreboard counted from the child
 * widgets' own bubbled events — followed by the optional `outro` screen. With
 * `storageKey` it remembers where the reader stopped and offers to resume
 * there on the next visit. Assembles any widgets into a course — the formative
 * composition that *generates a dispensa*.
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
  outro,
  celebrate = true,
  labels,
  className,
  ...props
}: StorylineProps) {
  const l = useLabels("storyline", DEFAULT_STORYLINE_LABELS, labels);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const moduleRefs = React.useRef<(HTMLElement | null)[]>([]);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = React.useState(0);
  // How far the reader is through the ACTIVE module (0..1) — fills its segment.
  const [fill, setFill] = React.useState(0);
  const [savedTop, setSavedTop] = React.useState<number | null>(null);
  // Session scoreboard for the finale — child widget events bubble to the
  // storyline root, so counting them needs zero cooperation from the widgets.
  const [score, setScore] = React.useState({
    answered: 0,
    correct: 0,
    completed: 0,
  });
  const [elapsedMin, setElapsedMin] = React.useState<number | null>(null);
  // Mobile module index (bottom sheet) — the rail is desktop-only.
  const [tocOpen, setTocOpen] = React.useState(false);
  const [minutesLeft, setMinutesLeft] = React.useState(0);
  const startedAt = React.useRef(0);
  const finished = React.useRef(false);
  // Completion persisted on a previous visit — must survive re-reads.
  const wasDone = React.useRef(false);
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
    const saved = readStorylineProgress(storageKey);
    if (!saved) return;
    wasDone.current = saved.done;
    if (saved.top >= RESUME_MIN_TOP) setSavedTop(saved.top);
  }, [storageKey]);

  // Segmented progress + active module + position persistence, driven by the
  // container's own scroll. Progress is quantized to modules (goal-gradient):
  // one segment per module, the active one filling as the reader moves through.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    startedAt.current ||= Date.now();
    let ticking = false;
    // `userScroll` separates real reader scrolls from the mount measurement, so
    // the finale payoff can never fire on hydration of an already-read state.
    const onScroll = (userScroll: boolean) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = el.scrollHeight - el.clientHeight;
        const pct = max > 0 ? (el.scrollTop / max) * 100 : 0;
        const center = el.scrollTop + el.clientHeight / 2;
        let idx = 0;
        moduleRefs.current.forEach((m, i) => {
          if (m && m.offsetTop <= center) idx = i;
        });
        setActive(idx);
        const mod = moduleRefs.current[idx];
        setFill(
          mod && mod.offsetHeight > 0
            ? Math.min(1, Math.max(0, (center - mod.offsetTop) / mod.offsetHeight))
            : 0,
        );
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
        if (pct >= 100 && userScroll && !finished.current) {
          finished.current = true;
          setElapsedMin(
            Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)),
          );
          if (celebrate) void fireConfetti();
        }
        ticking = false;
      });
      if (storageKey) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          try {
            const max = el.scrollHeight - el.clientHeight;
            const pct =
              max > 0 ? Math.round((el.scrollTop / max) * 100) : 0;
            if (pct >= 100) wasDone.current = true;
            const progress: StorylineProgress = {
              top: Math.round(el.scrollTop),
              pct,
              done: wasDone.current,
            };
            window.localStorage.setItem(
              POSITION_PREFIX + storageKey,
              JSON.stringify(progress),
            );
          } catch {
            /* private mode etc. — reading position is best-effort */
          }
        }, 250);
      }
    };
    const listener = () => onScroll(true);
    el.addEventListener("scroll", listener, { passive: true });
    onScroll(false);
    return () => {
      el.removeEventListener("scroll", listener);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [modules.length, storageKey, celebrate]);

  // Finale scoreboard — count the child widgets' own analytics events as they
  // bubble through the scroll container (source "widget" only; the storyline's
  // events also pass through here).
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    return onWidgetronEvent((e) => {
      const { source, action, data } = e.detail;
      if (source !== "widget") return;
      if (action === "answered")
        setScore((s) => ({
          ...s,
          answered: s.answered + 1,
          correct: s.correct + (data?.correct === true ? 1 : 0),
        }));
      else if (action === "completed")
        setScore((s) => ({ ...s, completed: s.completed + 1 }));
    }, el);
  }, []);

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

  const openToc = () => {
    // Remaining reading time, estimated from the words still below the reader.
    const words = moduleRefs.current
      .slice(active)
      .reduce((n, m) => n + (m?.textContent?.split(/\s+/).length ?? 0), 0);
    setMinutesLeft(Math.ceil(words / WORDS_PER_MINUTE));
    setTocOpen(true);
    emitStoryline("toc_opened", {});
  };

  const jumpToModule = (i: number) => {
    setTocOpen(false);
    moduleRefs.current[i]?.scrollIntoView({ behavior: "smooth" });
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
      {/* Progress — one segment per module; the active one fills as it's read. */}
      <div className="pointer-events-none sticky top-0 z-30 h-0">
        <div aria-hidden="true" className="flex h-1 gap-px">
          {modules.map((_, i) => (
            <div key={i} className="flex-1 bg-primary/15">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${(i < active ? 1 : i === active ? fill : 0) * 100}%`,
                }}
              />
            </div>
          ))}
        </div>
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
            className="pointer-events-auto absolute right-3 flex -translate-y-1/2 flex-col items-center gap-2"
          >
            <span
              aria-hidden="true"
              className="mb-1 rounded-full border bg-popover/90 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground shadow-wgt"
            >
              {active + 1}/{modules.length}
            </span>
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
                    "flex size-3 items-center justify-center rounded-full border transition-colors",
                    i === active
                      ? "border-primary bg-primary"
                      : i < active
                        ? "border-primary bg-primary/70 text-primary-foreground"
                        : "border-border bg-card hover:border-primary",
                  )}
                >
                  {i < active && (
                    <Check
                      aria-hidden="true"
                      strokeWidth={4}
                      className="size-2"
                    />
                  )}
                </button>
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

      {/* Finale — the container's own payoff. The reader is celebrated first
          (confetti + session scoreboard), pitched (outro) second. */}
      <section
        data-slot="storyline-finale"
        className={cn(
          "flex min-h-full flex-col justify-center px-6 py-14 sm:px-10",
          modules.length % 2 === 1 && "bg-muted/40",
        )}
      >
        <div
          data-reveal
          className={cn("mx-auto w-full max-w-2xl text-center", reveal)}
        >
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check aria-hidden="true" className="size-7" />
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {l.finaleTitle}
          </h2>
          {(score.answered > 0 ||
            score.completed > 0 ||
            elapsedMin !== null) && (
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {score.answered > 0 && (
                <li className="rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-wgt">
                  {l.finaleChallenges(score.correct, score.answered)}
                </li>
              )}
              {score.completed > 0 && (
                <li className="rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-wgt">
                  {l.finaleActivities(score.completed)}
                </li>
              )}
              {elapsedMin !== null && (
                <li className="rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-wgt">
                  {l.finaleTime(elapsedMin)}
                </li>
              )}
            </ul>
          )}
        </div>
      </section>

      {outro != null && (
        <section data-slot="storyline-outro" className="px-6 pb-14 sm:px-10">
          <div data-reveal className={cn(screenWidth, reveal)}>
            {outro}
          </div>
        </section>
      )}

      {/* Mobile module index — floating pill that opens a bottom sheet with
          the full table of contents (the dot rail is desktop-only). Sticky
          bottom as the container's last child = pinned in the thumb zone. */}
      {modules.length > 1 && (
        <div className="pointer-events-none sticky bottom-4 z-40 h-0 sm:hidden">
          {tocOpen ? (
            <div
              data-slot="storyline-toc"
              className="pointer-events-auto absolute inset-x-3 bottom-0 max-h-[60vh] overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-wgt motion-safe:animate-wgt-fade-in"
            >
              <div className="sticky top-0 flex items-center gap-2 border-b bg-popover px-4 py-1">
                <span className="text-sm font-semibold">{l.modulesNav}</span>
                {minutesLeft > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {l.minutesLeft(minutesLeft)}
                  </span>
                )}
                <button
                  type="button"
                  aria-label={l.tocClose}
                  onClick={() => setTocOpen(false)}
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground",
                    minutesLeft <= 0 && "ml-auto",
                  )}
                >
                  <X className="size-4" />
                </button>
              </div>
              <ol>
                {modules.map((m, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      aria-current={i === active || undefined}
                      onClick={() => jumpToModule(i)}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left",
                        i === active && "bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] tabular-nums",
                          i < active
                            ? "border-primary bg-primary text-primary-foreground"
                            : i === active
                              ? "border-primary text-primary"
                              : "text-muted-foreground",
                        )}
                      >
                        {i < active ? (
                          <Check
                            aria-hidden="true"
                            strokeWidth={3}
                            className="size-3"
                          />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {typeof m.title === "string" ? m.title : eyebrow(i)}
                        </span>
                        {m.subtitle != null && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {m.subtitle}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <button
              type="button"
              aria-label={l.modulesNav}
              onClick={openToc}
              className="pointer-events-auto absolute bottom-0 left-1/2 flex h-11 max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border bg-popover/95 px-4 text-sm text-popover-foreground shadow-wgt backdrop-blur"
            >
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {active + 1}/{modules.length}
              </span>
              <span className="truncate font-medium">
                {typeof modules[active]?.title === "string"
                  ? modules[active].title
                  : eyebrow(active)}
              </span>
            </button>
          )}
        </div>
      )}
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
