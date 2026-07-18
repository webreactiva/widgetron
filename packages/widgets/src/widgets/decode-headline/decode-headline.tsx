import * as React from "react";

import { cn } from "@/lib/utils";

export interface DecodeHeadlineProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** The headline. It scrambles, then resolves character by character. */
  text: string;
  /** Heading level / size. Default: "h2". */
  as?: "h1" | "h2" | "h3" | "p";
  /** Text alignment. Default: "left". */
  align?: "left" | "center";
}

const SIZE: Record<NonNullable<DecodeHeadlineProps["as"]>, string> = {
  h1: "text-4xl @md:text-6xl",
  h2: "text-3xl @md:text-5xl",
  h3: "text-2xl @md:text-4xl",
  p: "text-xl @md:text-2xl",
};

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/\\<>*+=-_?";
const rnd = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

/**
 * DecodeHeadline — a headline that arrives scrambled and resolves character by
 * character when it scrolls into view, like a terminal decrypting. The scramble
 * is the one non-CSS effect in the scroll-driven set — ~30 lines of own code, no
 * library. It runs once, triggered by an IntersectionObserver, and is fully
 * torn down on unmount. Under reduced motion (or before hydration / without JS)
 * the final text shows immediately — the effect is decorative, never gating the
 * words. Like `kinetic-headline`, this is plain-text display type.
 */
export function DecodeHeadline({
  text,
  as = "h2",
  align = "left",
  className,
  ...props
}: DecodeHeadlineProps) {
  const Tag = as as React.ElementType;
  const ref = React.useRef<HTMLElement>(null);
  const [display, setDisplay] = React.useState(text);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    const chars = [...text];
    // Each char settles a bit after the previous one, with a little jitter.
    const settle = chars.map((_, i) => i * 1.4 + 4 + Math.random() * 8);
    const maxFrame = Math.max(0, ...settle) + 1;
    let frame = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    const scramble = () =>
      setDisplay(
        chars.map((c, i) => (c === " " || frame >= settle[i] ? c : rnd())).join(""),
      );

    const start = () => {
      scramble();
      timer = setInterval(() => {
        frame += 1;
        scramble();
        if (frame >= maxFrame) {
          clearInterval(timer);
          setDisplay(text);
        }
      }, 45);
    };

    // Scramble immediately so below-the-fold headlines never flash the answer,
    // then resolve when the reader actually reaches it.
    setDisplay(chars.map((c) => (c === " " ? " " : rnd())).join(""));
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (timer) clearInterval(timer);
    };
  }, [text]);

  return (
    <Tag
      ref={ref}
      data-slot="decode-headline"
      aria-label={text}
      className={cn(
        "@container font-mono font-bold leading-[1.1] tracking-tight tabular-nums",
        SIZE[as],
        align === "center" ? "text-center" : "text-left",
        className,
      )}
      {...props}
    >
      <span aria-hidden="true">{display}</span>
    </Tag>
  );
}

DecodeHeadline.displayName = "DecodeHeadline";
