import * as React from "react";

import { cn } from "@/lib/utils";
import { GlossaryProvider, type GlossaryMap } from "@/widgets/glossary";
import { ProfileProvider } from "@/widgets/profile-quiz";

export interface StorylineModule {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** The widget screens shown in this module, top to bottom. */
  screens: React.ReactNode[];
}

export interface StorylineProps extends React.HTMLAttributes<HTMLDivElement> {
  modules: StorylineModule[];
  /** Show the "Module 01" eyebrow above each title. Default: true. */
  numbered?: boolean;
  /** Render the eyebrow for a 0-based module index. Default: "Module 01". */
  moduleLabel?: (index: number) => React.ReactNode;
  /** Glossary terms available to `[[term]]` text anywhere in the course. */
  glossary?: GlossaryMap;
  /**
   * Enable reader personalization for the whole course: a ProfileQuiz inside any
   * screen writes the profile, and ProfileGate screens tailor to it. Pass a
   * string to persist under that localStorage key, or `true` for in-memory only.
   */
  profile?: boolean | string;
}

const defaultModuleLabel = (i: number) =>
  `Module ${String(i + 1).padStart(2, "0")}`;

/**
 * Storyline — the dispensa reading composition (the "scrollytelling" reading
 * flow from ../dispensa, faithfully ported): a single-column, scroll-driven
 * document of modules. Each module fills the reading viewport, snaps into place,
 * alternates its background, and reveals its screens as they scroll in. A
 * progress bar tracks position and side dots jump between modules. Assembles any
 * widgets into a course — the formative composition that *generates a dispensa*.
 *
 * Self-contained: it owns its scroll viewport (default height via `className`,
 * e.g. `h-[80vh]`), so it works embedded anywhere — no scroll-snap fight with a
 * host page.
 */
export function Storyline({
  modules,
  numbered = true,
  moduleLabel = defaultModuleLabel,
  glossary,
  profile,
  className,
  ...props
}: StorylineProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const moduleRefs = React.useRef<(HTMLElement | null)[]>([]);
  const [progress, setProgress] = React.useState(0);
  const [active, setActive] = React.useState(0);

  // Progress bar + active module, driven by the container's own scroll.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = el.scrollHeight - el.clientHeight;
        setProgress(max > 0 ? (el.scrollTop / max) * 100 : 0);
        const center = el.scrollTop + el.clientHeight / 2;
        let idx = 0;
        moduleRefs.current.forEach((m, i) => {
          if (m && m.offsetTop <= center) idx = i;
        });
        setActive(idx);
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [modules.length]);

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

  const reveal =
    "transition-all duration-500 opacity-0 translate-y-5 data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100";

  const tree = (
    <div
      ref={scrollRef}
      data-slot="storyline"
      className={cn(
        "relative h-[600px] overflow-y-auto rounded-lg border bg-card text-card-foreground shadow-wgt [scroll-snap-type:y_proximity]",
        className,
      )}
      {...props}
    >
      {/* Progress bar — pinned to the top of the reading viewport. */}
      <div className="pointer-events-none sticky top-0 z-30 h-0">
        <div
          className="h-1 bg-primary transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Module navigation dots — pinned to the right, centered. */}
      {modules.length > 1 && (
        <div className="pointer-events-none sticky top-1/2 z-30 hidden h-0 sm:block">
          <nav
            aria-label="Modules"
            className="pointer-events-auto absolute right-3 flex -translate-y-1/2 flex-col gap-2"
          >
            {modules.map((m, i) => (
              <button
                key={i}
                type="button"
                aria-label={
                  typeof m.title === "string" ? m.title : `Module ${i + 1}`
                }
                aria-current={i === active || undefined}
                onClick={() =>
                  moduleRefs.current[i]?.scrollIntoView({ behavior: "smooth" })
                }
                className={cn(
                  "size-3 rounded-full border transition-colors",
                  i === active
                    ? "border-primary bg-primary"
                    : "border-border bg-card hover:border-primary",
                )}
              />
            ))}
          </nav>
        </div>
      )}

      {modules.map((m, i) => (
        <section
          key={i}
          ref={(el) => {
            moduleRefs.current[i] = el;
          }}
          className={cn(
            "flex min-h-full flex-col justify-center px-6 py-14 [scroll-snap-align:start] sm:px-10",
            i % 2 === 1 && "bg-muted/40",
          )}
        >
          <div className="mx-auto w-full max-w-2xl">
            <header data-reveal className={cn("mb-8", reveal)}>
              {numbered && (
                <p className="mb-2 font-mono text-sm font-bold uppercase tracking-[0.1em] text-primary">
                  {moduleLabel(i)}
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
                <div key={si} data-reveal className={reveal}>
                  {screen}
                </div>
              ))}
            </div>
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
