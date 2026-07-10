import * as React from "react";

import { emitWidgetronEvent, onWidgetronEvent } from "@/lib/analytics";
import { fireConfetti } from "@/lib/confetti";
import { Check, X } from "@/lib/icons";
import { useLabels } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { RichText } from "@/primitives/rich-text";
import { Tooltip } from "@/primitives/tooltip";
import { GlossaryProvider, type GlossaryMap } from "@/widgets/glossary";
import { ProfileProvider } from "@/widgets/profile-quiz";

export interface StorylineModule {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** The widget screens shown in this module, top to bottom. */
  screens: React.ReactNode[];
  /**
   * Stamp for the module — a single emoji the reader earns on completing it,
   * shown in the navigation and collected in the finale.
   */
  emoji?: string;
  /**
   * One-line send-off shown at the module's end ("Module 2 ✓ — …"), nudging
   * the reader into the next module.
   */
  outro?: React.ReactNode;
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
  /** Resume bar: names the saved module when it is known. */
  resumeAt: (moduleTitle: string) => React.ReactNode;
  /** Cover: estimated total reading time badge. */
  coverTime: (minutes: number) => React.ReactNode;
  /** Cover: module count badge. */
  coverModules: (count: number) => React.ReactNode;
  /** Cover: interactive challenges badge. */
  coverChallenges: (count: number) => React.ReactNode;
  /** Cover: start-reading button. */
  start: string;
  /** Cover: expand a clamped description. */
  readMore: string;
  /** Module outro: the "Module N ✓" seal before the send-off line. */
  moduleDone: (n: number) => React.ReactNode;
  /** Finale: copy-my-result button. */
  shareResult: string;
  /** Finale: transient feedback after copying the result. */
  shareCopied: string;
  /** Finale: clipboard text built from the session score. */
  shareText: (
    correct: number,
    answered: number,
    title: string,
    url: string,
  ) => string;
  /** Thread variant: next-slide button. */
  threadNext: string;
  /** Thread variant: previous-slide button. */
  threadPrev: string;
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
  resumeAt: (moduleTitle) => `You were at “${moduleTitle}”`,
  coverTime: (minutes) => `~${minutes} min`,
  coverModules: (count) => (count === 1 ? "1 module" : `${count} modules`),
  coverChallenges: (count) =>
    count === 1 ? "1 challenge" : `${count} challenges`,
  start: "Start",
  readMore: "Read more",
  moduleDone: (n) => `Module ${n} ✓`,
  shareResult: "Copy my result",
  shareCopied: "Copied!",
  shareText: (correct, answered, title, url) =>
    `I passed ${correct}/${answered} challenges in “${title}” 🏆 → ${url}`,
  threadNext: "Next",
  threadPrev: "Back",
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
  /**
   * Challenge mode (opt-in): names the guide's own progress narrative (e.g.
   * "Your guarantee delta"). A themed meter pinned above the content fills as
   * the reader beats interactions — correct answers and completed activities
   * over the guide's total challenges. Purely additive; never blocks reading.
   */
  challenge?: React.ReactNode;
  /**
   * Presentation. "scroll" (default) is the scroll-driven document;
   * "thread" is an experimental screen-by-screen tap-through (stories-like)
   * over the same modules.
   */
  variant?: "scroll" | "thread";
  labels?: Partial<StorylineLabels>;
}

const POSITION_PREFIX = "wgt-storyline:";
/** Below this scroll offset (px) there is nothing worth resuming. */
const RESUME_MIN_TOP = 240;
// ponytail: ~220 wpm flat estimate; per-widget weights if it ever matters.
const WORDS_PER_MINUTE = 220;
// displayNames of the "Interactive" widget category — the cover's challenge
// count. Mirrors the category in each widget's meta; re-sync by hand.
const CHALLENGE_TYPES = new Set([
  "Checklist",
  "DecisionTree",
  "DragAndDrop",
  "FillInTheBlanks",
  "Flashcards",
  "PredictOutput",
  "Quiz",
  "SpotTheBug",
  "Surprise",
]);

export interface StorylineProgress {
  /** Saved scroll offset, px — fallback when the semantic position is absent. */
  top: number;
  /** Scroll progress, 0–100. */
  pct: number;
  /** The reader has reached the end at least once. */
  done: boolean;
  /**
   * Index of the module the reader was in. The semantic position — robust to
   * content edits and viewport changes, preferred over `top` on resume.
   */
  module?: number;
  /** How far through that module, 0–1. */
  frac?: number;
  /** Module indices whose stamp (module `emoji`) was earned. */
  stamps?: number[];
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
      const out: StorylineProgress = {
        top: Number(p.top) || 0,
        pct: Number(p.pct) || 0,
        done: p.done === true,
      };
      if (typeof p.module === "number" && Number.isInteger(p.module))
        out.module = p.module;
      if (typeof p.frac === "number" && Number.isFinite(p.frac))
        out.frac = Math.min(1, Math.max(0, p.frac));
      if (Array.isArray(p.stamps))
        out.stamps = p.stamps.filter(
          (s): s is number => typeof s === "number" && Number.isInteger(s),
        );
      return out;
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
export function Storyline(props: StorylineProps) {
  return props.variant === "thread" ? (
    <StorylineThread {...props} />
  ) : (
    <StorylineScroll {...props} />
  );
}

/** Wrap the rendered tree in the course-level providers, when enabled. */
function withCourseProviders(
  tree: React.ReactElement,
  glossary: GlossaryMap | undefined,
  profile: boolean | string | undefined,
): React.ReactElement {
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

function StorylineScroll({
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
  challenge,
  variant: _variant,
  labels,
  className,
  ...props
}: StorylineProps) {
  const l = useLabels("storyline", DEFAULT_STORYLINE_LABELS, labels);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const moduleRefs = React.useRef<(HTMLElement | null)[]>([]);
  // Dot-nav buttons — roving tabindex + arrow keys walk the modules.
  const dotRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = React.useState(0);
  // How far the reader is through the ACTIVE module (0..1) — fills its segment.
  const [fill, setFill] = React.useState(0);
  const [saved, setSaved] = React.useState<StorylineProgress | null>(null);
  // Reading time left below the saved position — context for the resume bar.
  const [resumeMinutes, setResumeMinutes] = React.useState(0);
  // Module stamps earned this or a previous session (indices into `modules`).
  const [stamps, setStamps] = React.useState<ReadonlySet<number>>(new Set());
  const stampsRef = React.useRef<Set<number>>(new Set());
  // Last semantic position computed by the scroll handler, for the saver.
  const posRef = React.useRef({ module: 0, frac: 0 });
  // Cover promise: total estimated reading time, measured after mount.
  const [totalMin, setTotalMin] = React.useState(0);
  const [descExpanded, setDescExpanded] = React.useState(false);
  const [descClamped, setDescClamped] = React.useState(false);
  const descRef = React.useRef<HTMLParagraphElement>(null);
  // Share-result feedback.
  const [copied, setCopied] = React.useState(false);
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

  // Offer to resume when a meaningful position was saved on a previous visit,
  // and restore the stamps earned on earlier reads.
  React.useEffect(() => {
    if (!storageKey) return;
    const p = readStorylineProgress(storageKey);
    if (!p) return;
    wasDone.current = p.done;
    if (p.stamps?.length) {
      stampsRef.current = new Set(p.stamps);
      setStamps(new Set(p.stamps));
    }
    if (p.top < RESUME_MIN_TOP) return;
    setSaved(p);
    if (p.module != null) {
      // Words still below the saved module → "~N min left" on the resume bar.
      const words = moduleRefs.current
        .slice(p.module)
        .reduce((n, m) => n + (m?.textContent?.split(/\s+/).length ?? 0), 0);
      setResumeMinutes(Math.ceil(words / WORDS_PER_MINUTE));
    }
  }, [storageKey]);

  // Cover promise: reading time measured from the rendered text.
  React.useEffect(() => {
    const words = moduleRefs.current.reduce(
      (n, m) => n + (m?.textContent?.split(/\s+/).length ?? 0),
      0,
    );
    setTotalMin(Math.ceil(words / WORDS_PER_MINUTE));
  }, [modules]);

  // Show "read more" only when the description actually overflows its clamp.
  React.useEffect(() => {
    const p = descRef.current;
    if (p) setDescClamped(p.scrollHeight > p.clientHeight + 1);
  }, [description]);

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
        const frac =
          mod && mod.offsetHeight > 0
            ? Math.min(1, Math.max(0, (center - mod.offsetTop) / mod.offsetHeight))
            : 0;
        setFill(frac);
        posRef.current = { module: idx, frac };
        // Stamps: a module is completed once the reader scrolls past it (all
        // of them at 100%). Earned stamps persist in the progress JSON.
        const doneCount = pct >= 100 ? modules.length : idx;
        let stamped = false;
        for (let i = 0; i < doneCount; i++) {
          if (modules[i]?.emoji && !stampsRef.current.has(i)) {
            stampsRef.current.add(i);
            stamped = true;
          }
        }
        if (stamped) setStamps(new Set(stampsRef.current));
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
              module: posRef.current.module,
              frac: Math.round(posRef.current.frac * 1000) / 1000,
            };
            if (stampsRef.current.size > 0)
              progress.stamps = [...stampsRef.current];
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
    const el = scrollRef.current;
    if (saved && el) {
      // Semantic first: recompute the pixel target from the saved module +
      // fraction, so edits to earlier content can't strand the reader. The
      // raw `top` is the fallback for legacy saves.
      const mod = saved.module != null ? moduleRefs.current[saved.module] : null;
      const top = mod
        ? Math.max(
            0,
            mod.offsetTop + (saved.frac ?? 0) * mod.offsetHeight - el.clientHeight / 2,
          )
        : saved.top;
      el.scrollTo({ top, behavior: "smooth" });
      emitStoryline("resumed", { top: Math.round(top), module: saved.module });
    }
    setSaved(null);
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

  const copyResult = () => {
    if (!navigator.clipboard) return;
    const text = l.shareText(
      score.correct,
      score.answered,
      typeof title === "string" ? title : "",
      window.location.href,
    );
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      emitStoryline("result_copied", {
        correct: score.correct,
        answered: score.answered,
      });
    });
  };

  const startOver = () => {
    setSaved(null);
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

  const chip =
    "rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-wgt";

  // Cover promise: interactive screens counted from the resolved elements.
  const challenges = React.useMemo(
    () =>
      modules.reduce(
        (n, m) =>
          n +
          m.screens.filter((s) => {
            if (!React.isValidElement(s)) return false;
            const t = s.type as { displayName?: string };
            return typeof t !== "string" && CHALLENGE_TYPES.has(t.displayName ?? "");
          }).length,
        0,
      ),
    [modules],
  );

  const savedModuleTitle =
    saved?.module != null ? modules[saved.module]?.title : null;

  // Challenge mode: interactions beaten so far, over the guide's total.
  const challengeEarned = Math.min(challenges, score.correct + score.completed);

  // Stamp collection shown in the finale — only modules that declare an emoji.
  const stampRow = modules.flatMap((m, i) =>
    m.emoji ? [{ emoji: m.emoji, index: i, earned: stamps.has(i) }] : [],
  );

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
        // overflow-wrap is inherited — break pathological unbreakable author
        // strings so no generated text can scroll the reading column sideways.
        "relative h-[600px] overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-wgt [overflow-wrap:anywhere]",
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

      {/* Challenge mode — the guide's own progress narrative: a themed meter
          that fills as the reader beats interactions. Opt-in, never blocks.
          Hidden while the resume bar is up (they share the top edge). */}
      {challenge != null && challenges > 0 && saved === null && (
        <div className="pointer-events-none sticky top-2 z-30 h-0">
          <div
            data-slot="storyline-challenge"
            className="absolute right-3 max-w-[70%] overflow-hidden rounded-full border bg-popover/95 px-3 py-1 text-xs text-popover-foreground shadow-wgt backdrop-blur"
          >
            <div
              aria-hidden="true"
              className="absolute inset-y-0 left-0 bg-primary/25 transition-[width] duration-500"
              style={{ width: `${(challengeEarned / challenges) * 100}%` }}
            />
            <span className="relative flex items-center gap-1.5">
              <span className="truncate font-medium">{challenge}</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {challengeEarned}/{challenges}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Resume bar — offers to jump back to the saved reading position. */}
      {saved !== null && (
        <div className="sticky top-1 z-40 h-0">
          <div className="mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-md border bg-popover px-4 py-2 text-sm text-popover-foreground shadow-wgt motion-safe:animate-wgt-fade-in">
            <span>
              {typeof savedModuleTitle === "string"
                ? l.resumeAt(savedModuleTitle)
                : l.resumePrompt}
              {resumeMinutes > 0 && (
                <span className="text-muted-foreground">
                  {" · "}
                  {l.minutesLeft(resumeMinutes)}
                </span>
              )}
            </span>
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
            {modules.map((m, i) => {
              // Stamped: the module was completed and its emoji seal earned.
              const stamped = i < active && !!m.emoji && stamps.has(i);
              return (
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
                  ref={(el) => {
                    dotRefs.current[i] = el;
                  }}
                  type="button"
                  aria-label={
                    typeof m.title === "string" ? m.title : l.module(i + 1)
                  }
                  aria-current={i === active || undefined}
                  // Roving tabindex: one Tab stop enters the nav at the active
                  // module; ArrowUp/Down then walk between modules.
                  tabIndex={i === active ? 0 : -1}
                  onClick={() =>
                    moduleRefs.current[i]?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                  onKeyDown={(e) => {
                    const last = modules.length - 1;
                    let next: number;
                    if (e.key === "ArrowDown" || e.key === "ArrowRight")
                      next = Math.min(i + 1, last);
                    else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
                      next = Math.max(i - 1, 0);
                    else if (e.key === "Home") next = 0;
                    else if (e.key === "End") next = last;
                    else return;
                    e.preventDefault();
                    moduleRefs.current[next]?.scrollIntoView({
                      behavior: "smooth",
                    });
                    // preventScroll: focusing the dot (in a sticky nav) would
                    // otherwise scroll it into view and cancel the module scroll.
                    dotRefs.current[next]?.focus({ preventScroll: true });
                  }}
                  className={cn(
                    "flex items-center justify-center rounded-full border transition-colors",
                    stamped ? "size-4 border-transparent" : "size-3",
                    i === active
                      ? "border-primary bg-primary"
                      : i < active
                        ? stamped
                          ? "bg-transparent"
                          : "border-primary bg-primary/70 text-primary-foreground"
                        : "border-border bg-card hover:border-primary",
                  )}
                >
                  {i < active &&
                    (stamped ? (
                      <span
                        aria-hidden="true"
                        className="text-[11px] leading-none motion-safe:animate-wgt-pop"
                      >
                        {m.emoji}
                      </span>
                    ) : (
                      <Check
                        aria-hidden="true"
                        strokeWidth={4}
                        className="size-2"
                      />
                    ))}
                </button>
              </Tooltip>
              );
            })}
          </nav>
        </div>
      )}

      {/* Cover — the promise, computed from the tree itself: what this costs
          (time), what's inside (modules, challenges) and where to start. */}
      {title != null && (
        <section
          data-slot="storyline-cover"
          className="flex min-h-full flex-col justify-center px-6 py-14 sm:px-10"
        >
          <div
            data-reveal
            className={cn("mx-auto w-full max-w-2xl text-center", reveal)}
          >
            <h1 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>
            {description != null && (
              <>
                <p
                  ref={descRef}
                  className={cn(
                    "mx-auto mt-5 max-w-prose text-lg text-muted-foreground",
                    !descExpanded && "line-clamp-2",
                  )}
                >
                  {description}
                </p>
                {descClamped && !descExpanded && (
                  <button
                    type="button"
                    onClick={() => setDescExpanded(true)}
                    className="mt-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {l.readMore}
                  </button>
                )}
              </>
            )}
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {totalMin > 0 && <li className={chip}>{l.coverTime(totalMin)}</li>}
              <li className={chip}>{l.coverModules(modules.length)}</li>
              {challenges > 0 && (
                <li className={chip}>{l.coverChallenges(challenges)}</li>
              )}
            </ul>
            {modules.length > 1 && (
              <ol className="mx-auto mt-6 w-fit max-w-full text-left">
                {modules.map((m, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => jumpToModule(i)}
                      className="flex min-h-8 w-full items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <span className="font-mono text-xs tabular-nums text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate">
                        {typeof m.title === "string" ? m.title : eyebrow(i)}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
            <Button
              className="mt-8"
              onClick={() => {
                emitStoryline("started", {});
                jumpToModule(0);
              }}
            >
              {l.start}
            </Button>
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

          {/* Module send-off — turns the classic drop-off point (end of a
              section) into a nudge toward the next module. Author-provided. */}
          {m.outro != null && (
            <div
              data-slot="storyline-module-outro"
              data-reveal
              className={cn("mx-auto mt-12 w-full max-w-2xl", reveal)}
            >
              <p className="border-t pt-5 text-center text-sm text-muted-foreground">
                <span className="mr-2 font-mono font-bold text-primary">
                  {m.emoji != null && (
                    <span aria-hidden="true" className="mr-1.5">
                      {m.emoji}
                    </span>
                  )}
                  {l.moduleDone(i + 1)}
                </span>
                <RichText>{m.outro}</RichText>
              </p>
            </div>
          )}
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
                <li className={chip}>
                  {l.finaleChallenges(score.correct, score.answered)}
                </li>
              )}
              {score.completed > 0 && (
                <li className={chip}>{l.finaleActivities(score.completed)}</li>
              )}
              {elapsedMin !== null && (
                <li className={chip}>{l.finaleTime(elapsedMin)}</li>
              )}
            </ul>
          )}
          {/* Stamp collection — the seals earned module by module; unearned
              slots stay visible (dimmed) so the collection asks to be filled. */}
          {stampRow.length > 0 && (
            <ul
              aria-hidden="true"
              className="mt-6 flex flex-wrap justify-center gap-3 text-3xl"
            >
              {stampRow.map((s) => (
                <li
                  key={s.index}
                  className={cn(
                    s.earned
                      ? "motion-safe:animate-wgt-pop"
                      : "opacity-25 grayscale",
                  )}
                >
                  {s.emoji}
                </li>
              ))}
            </ul>
          )}
          {score.answered > 0 && (
            <Button variant="outline" className="mt-6" onClick={copyResult}>
              {copied ? l.shareCopied : l.shareResult}
            </Button>
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
                            ? m.emoji && stamps.has(i)
                              ? "border-transparent"
                              : "border-primary bg-primary text-primary-foreground"
                            : i === active
                              ? "border-primary text-primary"
                              : "text-muted-foreground",
                        )}
                      >
                        {i < active ? (
                          m.emoji && stamps.has(i) ? (
                            <span
                              aria-hidden="true"
                              className="text-sm leading-none"
                            >
                              {m.emoji}
                            </span>
                          ) : (
                            <Check
                              aria-hidden="true"
                              strokeWidth={3}
                              className="size-3"
                            />
                          )
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

  return withCourseProviders(tree, glossary, profile);
}

/* -------------------------------------------------------------------------- */
/* Thread variant (experimental)                                              */
/* -------------------------------------------------------------------------- */

type ThreadSlide =
  | { kind: "cover" }
  | { kind: "header"; module: number }
  | { kind: "screen"; module: number; node: React.ReactNode }
  | { kind: "finale" };

/**
 * StorylineThread — the same module tree presented screen-by-screen,
 * stories-style: one slide at a time, segmented progress on top, next/back
 * buttons, arrow keys and horizontal swipe. A render variant, not a format:
 * the JSON is identical to the scroll presentation.
 *
 * ponytail: prototype for A/B — no position persistence and no scroll
 * analytics; wire those up if the experiment graduates.
 */
function StorylineThread({
  title,
  description,
  modules,
  numbered = true,
  moduleLabel,
  glossary,
  profile,
  storageKey: _storageKey,
  outro,
  celebrate = true,
  challenge: _challenge,
  variant: _variant,
  labels,
  className,
  ...props
}: StorylineProps) {
  const l = useLabels("storyline", DEFAULT_STORYLINE_LABELS, labels);
  const eyebrow = moduleLabel ?? ((i: number) => l.module(i + 1));

  const slides = React.useMemo(() => {
    const s: ThreadSlide[] = [];
    if (title != null) s.push({ kind: "cover" });
    modules.forEach((m, mi) => {
      s.push({ kind: "header", module: mi });
      m.screens.forEach((node) => s.push({ kind: "screen", module: mi, node }));
    });
    s.push({ kind: "finale" });
    return s;
  }, [title, modules]);

  const [index, setIndex] = React.useState(0);
  const celebrated = React.useRef(false);
  const touchX = React.useRef<number | null>(null);

  const go = (delta: number) => {
    setIndex((i) => {
      const next = Math.min(slides.length - 1, Math.max(0, i + delta));
      if (
        next !== i &&
        slides[next]?.kind === "finale" &&
        celebrate &&
        !celebrated.current
      ) {
        celebrated.current = true;
        void fireConfetti();
      }
      return next;
    });
  };

  const slide = slides[index];
  let content: React.ReactNode = null;
  if (slide.kind === "cover") {
    content = (
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {title}
        </h1>
        {description != null && (
          <p className="mx-auto mt-4 max-w-prose text-lg text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    );
  } else if (slide.kind === "header") {
    const m = modules[slide.module];
    content = (
      <div className="text-center">
        {m.emoji != null && (
          <p aria-hidden="true" className="mb-3 text-4xl">
            {m.emoji}
          </p>
        )}
        {numbered && (
          <p className="mb-2 font-mono text-sm font-bold uppercase tracking-[0.1em] text-primary">
            {eyebrow(slide.module)}
          </p>
        )}
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {m.title}
        </h2>
        {m.subtitle != null && (
          <p className="mx-auto mt-3 max-w-prose text-muted-foreground">
            {m.subtitle}
          </p>
        )}
      </div>
    );
  } else if (slide.kind === "screen") {
    content = slide.node;
  } else {
    content = (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check aria-hidden="true" className="size-7" />
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {l.finaleTitle}
        </h2>
        {outro != null && <div className="w-full text-left">{outro}</div>}
      </div>
    );
  }

  const tree = (
    <div
      data-slot="storyline"
      data-variant="thread"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
      }}
      className={cn(
        "relative flex h-[600px] flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt [overflow-wrap:anywhere]",
        className,
      )}
      {...props}
    >
      {/* One progress segment per slide. */}
      <div aria-hidden="true" className="flex h-1 shrink-0 gap-px">
        {slides.map((_, i) => (
          <div
            key={i}
            className={cn("flex-1", i <= index ? "bg-primary" : "bg-primary/15")}
          />
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-10">
        <div className="mx-auto grid min-h-full w-full max-w-2xl place-items-center">
          {/* key remounts the slide so each one replays the entrance. */}
          <div key={index} className="w-full motion-safe:animate-wgt-fade-up">
            {content}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground disabled:invisible"
        >
          ← {l.threadPrev}
        </button>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {index + 1}/{slides.length}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === slides.length - 1}
          className="flex min-h-11 items-center rounded-md px-3 text-sm font-semibold text-primary disabled:invisible"
        >
          {l.threadNext} →
        </button>
      </div>
    </div>
  );

  return withCourseProviders(tree, glossary, profile);
}

Storyline.displayName = "Storyline";
