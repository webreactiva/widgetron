import * as React from "react";

import { cn } from "@/lib/utils";
import { RichText } from "@/primitives/rich-text";

export interface ScrollStatProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The number to land on (whole numbers only — it counts up as an integer). */
  value: number;
  /** What the number means. */
  label: React.ReactNode;
  /** Rendered before the number, e.g. "$". */
  prefix?: string;
  /** Rendered after the number, e.g. "%", "×", "k". */
  suffix?: string;
  /**
   * Show a bar that fills as the number counts. `value / max` is the fill; if
   * omitted, `max` defaults to 100 (i.e. `value` read as a percentage).
   */
  meter?: boolean;
  /** Scale for the meter. Default: 100. */
  max?: number;
  /** Alignment. Default: "left". */
  align?: "left" | "center";
}

const DURATION = 900;
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

/**
 * ScrollStat — a big metric that counts up from zero as it scrolls into view,
 * with an optional meter bar. The count-up is JS (an IntersectionObserver fires
 * a rAF ramp once, then tears down) rather than the pure-CSS `@property`/
 * `counter()` trick: that trick animates the meter width fine but does NOT
 * reliably render the counting *digits* across engines, so the number could
 * read a stale 0. Here the digit is real text — it renders the true value for
 * SSR / no-JS / reduced motion, and only animates when actually revealed, so it
 * is never stuck at 0. Whole numbers only.
 */
export function ScrollStat({
  value,
  label,
  prefix,
  suffix,
  meter = false,
  max = 100,
  align = "left",
  className,
  ...props
}: ScrollStatProps) {
  const target = Math.max(0, Math.round(value));
  const ref = React.useRef<HTMLDivElement>(null);
  // Rest at the true value: correct for SSR, no-JS and reduced motion.
  const [n, setN] = React.useState(target);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    let raf = 0;
    let started = false;
    const run = () => {
      let start: number | null = null;
      const tick = (t: number) => {
        if (start === null) start = t;
        const p = Math.min(1, (t - start) / DURATION);
        setN(Math.round(easeOutCubic(p) * target));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setN(0);
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started) {
          started = true;
          io.disconnect();
          run();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [target]);

  const fill = Math.min(100, (n / Math.max(1, max)) * 100);

  return (
    <div
      ref={ref}
      data-slot="scroll-stat"
      className={cn(
        "@container",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "flex items-baseline gap-0.5 font-display text-5xl font-bold leading-none tabular-nums @md:text-7xl",
          align === "center" && "justify-center",
        )}
      >
        {prefix ? <span>{prefix}</span> : null}
        <span>{n}</span>
        {suffix ? <span className="text-primary">{suffix}</span> : null}
      </div>
      {meter ? (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-100 ease-out"
            style={{ width: `${fill}%` }}
          />
        </div>
      ) : null}
      <div className="mt-2 text-sm text-muted-foreground">
        <RichText>{label}</RichText>
      </div>
    </div>
  );
}

ScrollStat.displayName = "ScrollStat";
