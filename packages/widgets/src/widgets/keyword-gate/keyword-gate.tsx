import * as React from "react";

import { cn } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import { Button } from "@/primitives/button";
import { RichText } from "@/primitives/rich-text";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { ArrowRight, Gift, Lightbulb } from "@/lib/icons";

export interface KeywordGateLabels {
  /** Submit button. */
  submit: React.ReactNode;
  /** Eyebrow above the hint. */
  hint: React.ReactNode;
  /** Transient message after a wrong attempt. */
  incorrect: React.ReactNode;
  /** Eyebrow above the revealed reward. */
  unlocked: React.ReactNode;
  /** Input placeholder before the ghost reveal. */
  placeholder: string;
}

export const DEFAULT_KEYWORD_GATE_LABELS: KeywordGateLabels = {
  submit: "Unlock",
  hint: "Hint",
  incorrect: "Not that one — try again.",
  unlocked: "Unlocked",
  placeholder: "Type the word…",
};

export interface KeywordGateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "prompt"> {
  /** The ask shown above the input. */
  prompt: React.ReactNode;
  /** Accepted answer(s). Compared after normalization unless `normalize` is false. */
  answer: string | string[];
  /** The payload revealed once the gate opens — plain text or any nested widget. */
  reward: React.ReactNode;
  /**
   * Case/accent/article-insensitive matching (lowercase, strip accents, drop a
   * leading article). Default: true.
   */
  normalize?: boolean;
  /**
   * Idle seconds before the hint appears, then the same again before the answer
   * shows as a ghost in the field — so nobody stays locked out. 0 disables both.
   * Default: 5.
   */
  hintAfterSeconds?: number;
  /** The hint, shown after `hintAfterSeconds` of no typing. */
  hint?: React.ReactNode;
  /**
   * Skip button label (e.g. "I haven't heard it"). Omit to hide the skip path.
   * When set, the reward opens without answering.
   */
  skipLabel?: React.ReactNode;
  /** Shown above the reward when opened via skip — the invite for a cold reader. */
  invite?: React.ReactNode;
  /** Fire confetti when the reader types the word correctly. Default: true. */
  celebrate?: boolean;
  /** Customizable / translatable strings. */
  labels?: Partial<KeywordGateLabels>;
}

/** lowercase, strip accents, drop a leading article, collapse whitespace. */
function normalizeWord(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/^(el|la|los|las|un|una|unos|unas|the|an?)\s+/, "")
    .replace(/\s+/g, " ");
}

/**
 * KeywordGate — the reward is gated behind typing the episode's keyword from
 * memory (active recall, the strongest retention move in the guide). Idle for
 * `hintAfterSeconds` and the hint appears; idle again and the word shows as a
 * ghost in the field, so nobody is locked out. An optional skip opens the reward
 * for a reader who hasn't heard the episode. Emits one `keyword_attempt` per
 * gate ({ result: "correct" | "hint" | "ghost" | "skip" }) — correct-without-hint
 * is recall demonstrated inside the artifact. Aseptic; usable as a storyline
 * screen. Cousin of Surprise, but earned instead of clicked.
 */
export function KeywordGate({
  prompt,
  answer,
  reward,
  normalize = true,
  hintAfterSeconds = 5,
  hint,
  skipLabel,
  invite,
  celebrate = true,
  labels,
  className,
  ...props
}: KeywordGateProps) {
  const l = useLabels("keywordGate", DEFAULT_KEYWORD_GATE_LABELS, labels);
  const { ref, emit } = useWidgetEvents("keyword-gate");
  const [input, setInput] = React.useState("");
  const [wrong, setWrong] = React.useState(false);
  // null = still gated; how it opened decides whether the invite shows.
  const [opened, setOpened] = React.useState<null | "solve" | "skip">(null);
  // 0 = nothing, 1 = hint shown, 2 = answer shown as a ghost.
  const [hintLevel, setHintLevel] = React.useState(0);

  const answers = Array.isArray(answer) ? answer : [answer];
  const matches = (value: string) =>
    normalize
      ? answers.some((a) => normalizeWord(a) === normalizeWord(value))
      : answers.some((a) => a.trim() === value.trim());

  // Idle escalation: each keystroke (input dep) rearms the timer, so an active
  // typer pushes the hint back while an idle reader climbs 0 → hint → ghost.
  // Effects never emit, so this stays hydration/Strict-Mode safe.
  React.useEffect(() => {
    if (opened || !hintAfterSeconds || hintLevel >= 2) return;
    const t = setTimeout(() => setHintLevel((h) => h + 1), hintAfterSeconds * 1000);
    return () => clearTimeout(t);
  }, [opened, hintAfterSeconds, hintLevel, input]);

  function solve(e: React.FormEvent) {
    e.preventDefault();
    if (opened) return;
    if (matches(input)) {
      const result = hintLevel === 0 ? "correct" : hintLevel === 1 ? "hint" : "ghost";
      setOpened("solve");
      if (celebrate) void fireConfetti();
      emit("keyword_attempt", { result });
    } else {
      setWrong(true);
    }
  }

  function skip() {
    if (opened) return;
    setOpened("skip");
    emit("keyword_attempt", { result: "skip" });
  }

  if (opened) {
    return (
      <div
        ref={ref}
        data-slot="keyword-gate"
        data-opened={opened}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-wgt",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "p-4 sm:p-6 [&_a]:font-medium [&_a]:text-primary [&_a]:underline",
            // Earned open gets the spring; a skip is not a celebration.
            opened === "solve" ? "animate-wgt-unlock" : "animate-wgt-fade-up",
          )}
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-primary">
            <Gift className="size-4 shrink-0" />
            {l.unlocked}
          </span>
          {opened === "skip" && invite != null && (
            <div className="mt-3">{invite}</div>
          )}
          <div className="mt-3">{reward}</div>
        </div>
      </div>
    );
  }

  const ghost = hintLevel >= 2 ? answers[0] : undefined;

  return (
    <div
      ref={ref}
      data-slot="keyword-gate"
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      <p className="font-display text-lg font-semibold leading-snug">
        <RichText>{prompt}</RichText>
      </p>

      <form onSubmit={solve} className="mt-4 flex flex-col gap-2 @sm:flex-row">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (wrong) setWrong(false);
          }}
          placeholder={ghost ?? l.placeholder}
          aria-label={l.placeholder}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(
            "min-h-11 flex-1 rounded-md border bg-background px-4 text-base outline-none transition-colors",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            wrong
              ? "animate-wgt-shake border-destructive"
              : "border-input focus-visible:border-ring",
            ghost && "placeholder:italic placeholder:text-muted-foreground/60",
          )}
        />
        <Button type="submit" className="min-h-11">
          {l.submit}
          <ArrowRight />
        </Button>
      </form>

      {wrong && (
        <p role="status" className="mt-2 text-sm text-destructive">
          <RichText>{l.incorrect}</RichText>
        </p>
      )}

      {hintLevel >= 1 && hint != null && (
        <div
          role="status"
          className="mt-4 flex gap-2 rounded-md border border-info/30 bg-[color-mix(in_oklab,var(--info)_8%,var(--card))] p-3 text-sm motion-safe:animate-wgt-fade-up"
        >
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-info" />
          <span>
            <span className="mr-1 font-semibold text-info">{l.hint}:</span>
            <RichText>{hint}</RichText>
          </span>
        </div>
      )}

      {skipLabel != null && (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={skip}>
            <RichText>{skipLabel}</RichText>
          </Button>
        </div>
      )}
    </div>
  );
}

KeywordGate.displayName = "KeywordGate";
