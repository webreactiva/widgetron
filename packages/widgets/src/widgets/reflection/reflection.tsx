import * as React from "react";
import { Check, Lightbulb } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { Button } from "@/primitives/button";
import { RichText } from "@/primitives/rich-text";

export interface ReflectionLabels {
  save: React.ReactNode;
  /** Button state once the answer is committed. */
  committed: React.ReactNode;
  saved: React.ReactNode;
  modelAnswer: React.ReactNode;
  placeholder: string;
  /** Accessible name for the answer box. */
  answer: string;
}

export const DEFAULT_REFLECTION_LABELS: ReflectionLabels = {
  save: "Save my answer",
  committed: "Answer saved",
  saved: "Saved on this device — keep writing to change it.",
  modelAnswer: "One way to look at it",
  placeholder: "Write it in your own words…",
  answer: "Your answer",
};

export interface ReflectionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Stable id — used to persist the answer in localStorage. */
  id: string;
  /** The question the reader answers in their own words. */
  prompt: React.ReactNode;
  /** Hint under the prompt: what a good answer looks like. */
  hint?: React.ReactNode;
  /** Placeholder shown inside the empty box. */
  placeholder?: string;
  /** Characters needed before the answer can be saved. Default: 20. */
  minLength?: number;
  /**
   * Shown only AFTER the reader saves: not "the" answer, a perspective to
   * compare theirs against.
   */
  modelAnswer?: React.ReactNode;
  /** Persist the answer across visits. Default: true. */
  persist?: boolean;
  /** Fire confetti the first time the reader commits an answer. Default: true. */
  celebrate?: boolean;
  /** Customizable / translatable strings. */
  labels?: Partial<ReflectionLabels>;
}

const STORAGE_PREFIX = "widgetron-reflection:";

/**
 * Reflection — the reader answers in their own words before being told
 * anything. Retrieval that has to be *composed* (not recognized from options)
 * is what makes an idea stick, and the optional `modelAnswer` only appears
 * after they commit, so it can't be copied instead of thought.
 *
 * The answer persists in localStorage (keyed by `id`), which turns a guide into
 * something worth reopening. It never leaves the device: no network, and the
 * analytics event carries the answer's LENGTH, never its text.
 */
export function Reflection({
  id,
  prompt,
  hint,
  placeholder,
  minLength = 20,
  modelAnswer,
  persist = true,
  celebrate = true,
  labels,
  className,
  ...props
}: ReflectionProps) {
  const l = useLabels("reflection", DEFAULT_REFLECTION_LABELS, labels);
  const { ref, emit } = useWidgetEvents("reflection", id);
  const fieldId = React.useId();
  const storageKey = `${STORAGE_PREFIX}${id}`;

  const [text, setText] = React.useState("");
  const [committed, setCommitted] = React.useState(false);
  // Only celebrate an answer the reader just wrote — never a restored one.
  const celebratedRef = React.useRef(false);

  // Hydrate from storage after mount (SSR-safe): a restored answer comes back
  // already committed, so the reader sees their own words, not an empty box.
  React.useEffect(() => {
    if (!persist || typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        setText(saved);
        setCommitted(true);
      }
    } catch {
      /* storage may be unavailable (private mode) */
    }
  }, [persist, storageKey]);

  const ready = text.trim().length >= minLength;

  function handleSave() {
    if (!ready) return;
    setCommitted(true);
    if (persist && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(storageKey, text);
      } catch {
        /* storage may be unavailable (private mode) */
      }
    }
    // Length only — the answer itself never leaves the device.
    emit("saved", { length: text.trim().length });
    if (!celebratedRef.current) {
      celebratedRef.current = true;
      if (celebrate) void fireConfetti();
    }
  }

  return (
    <div
      ref={ref}
      data-slot="reflection"
      data-committed={committed || undefined}
      className={cn(
        "@container/refl rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      <label
        htmlFor={fieldId}
        className="block font-display text-lg font-semibold leading-snug @md/refl:text-xl"
      >
        <RichText>{prompt}</RichText>
      </label>
      {hint != null && (
        <p className="mt-1 text-sm text-muted-foreground">
          <RichText>{hint}</RichText>
        </p>
      )}

      <textarea
        id={fieldId}
        aria-label={l.answer}
        value={text}
        rows={4}
        placeholder={placeholder ?? l.placeholder}
        onChange={(event) => {
          setText(event.currentTarget.value);
          if (committed) setCommitted(false);
        }}
        className={cn(
          "mt-3 w-full resize-y rounded-md border border-input bg-background p-3 text-sm leading-relaxed",
          "outline-none transition-colors placeholder:text-muted-foreground/70",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring",
        )}
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-muted-foreground">
          {text.trim().length}
          {!ready && ` / ${minLength}`}
        </span>
        <Button size="sm" disabled={!ready || committed} onClick={handleSave}>
          {committed && <Check />}
          {committed ? l.committed : l.save}
        </Button>
      </div>

      {committed && (
        <>
          {persist && (
            <p
              role="status"
              className="mt-3 text-xs text-muted-foreground motion-safe:animate-wgt-fade-up"
            >
              <RichText>{l.saved}</RichText>
            </p>
          )}

          {modelAnswer != null && (
            <div className="mt-3 rounded-md border border-info/30 bg-[color-mix(in_oklab,var(--info)_8%,var(--card))] p-3 text-sm motion-safe:animate-wgt-fade-up">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-info">
                <Lightbulb className="size-3.5" />
                <RichText>{l.modelAnswer}</RichText>
              </p>
              <div className="text-card-foreground/90">
                <RichText>{modelAnswer}</RichText>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

Reflection.displayName = "Reflection";
