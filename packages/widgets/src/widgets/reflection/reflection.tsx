import * as React from "react";
import { Check, Lightbulb, X } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { fireConfetti } from "@/lib/confetti";
import { useLabels } from "@/lib/i18n";
import { useWidgetEvents } from "@/lib/use-widget-events";
import { Button } from "@/primitives/button";
import { RichText } from "@/primitives/rich-text";

export interface ReflectionKey {
  /** The idea, named for the reader — "a low hit rate wastes the cache". */
  idea: React.ReactNode;
  /**
   * Case-insensitive regular expression that decides whether the answer
   * touched the idea. Keep it generous and simple (`"stale|invalidat"`): you
   * are checking whether an idea is present, not marking spelling.
   */
  match: string;
}

export interface ReflectionLabels {
  save: React.ReactNode;
  /** Button state once the answer is committed. */
  committed: React.ReactNode;
  saved: React.ReactNode;
  modelAnswer: React.ReactNode;
  /** Eyebrow over the ideas panel. */
  ideasTitle: React.ReactNode;
  /** Note under the ideas panel, framing it as a mirror rather than a grade. */
  ideasNote: React.ReactNode;
  placeholder: string;
  /** Accessible name for the answer box. */
  answer: string;
}

export const DEFAULT_REFLECTION_LABELS: ReflectionLabels = {
  save: "Save my answer",
  committed: "Answer saved",
  saved: "Saved on this device — keep writing to change it.",
  modelAnswer: "One way to look at it",
  ideasTitle: "Ideas your answer touched",
  ideasNote: "Not a grade — a mirror. A missed idea is worth a second pass, not a lower score.",
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
  /**
   * Ideas the answer should touch. After the reader commits, each one is shown
   * as hit or missed, so they see WHICH pieces they left out — which is the
   * whole value of writing an answer instead of recognising one. Deliberately
   * loose: it never blocks, never scores, and a miss is an invitation.
   */
  keys?: ReflectionKey[];
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
  keys,
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

  /**
   * Which ideas the answer touched. Evaluated only on commit (never per
   * keystroke), against a bounded slice of the text, and an unparseable
   * pattern simply counts as "not matched" rather than throwing the widget.
   */
  const hits = React.useMemo(() => {
    if (!keys?.length || !committed) return [];
    const haystack = text.slice(0, 4000);
    return keys.map((key) => {
      try {
        return new RegExp(key.match, "i").test(haystack);
      } catch {
        return false;
      }
    });
  }, [keys, committed, text]);

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
    // Length and idea COUNTS only — the answer itself never leaves the device.
    const touched = keys?.length
      ? keys.filter((key) => {
          try {
            return new RegExp(key.match, "i").test(text.slice(0, 4000));
          } catch {
            return false;
          }
        }).length
      : undefined;
    emit("saved", {
      length: text.trim().length,
      ...(touched !== undefined && {
        ideasTouched: touched,
        ideasTotal: keys?.length ?? 0,
      }),
    });
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

          {keys != null && keys.length > 0 && (
            <div className="mt-3 rounded-md border border-input bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] p-3 text-sm motion-safe:animate-wgt-fade-up">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <RichText>{l.ideasTitle}</RichText>
              </p>
              <ul className="flex flex-col gap-1.5">
                {keys.map((key, index) => (
                  <li
                    key={index}
                    data-hit={hits[index] || undefined}
                    className="flex items-start gap-2"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
                        hits[index]
                          ? "bg-success text-success-foreground"
                          : "border border-muted-foreground/40 text-muted-foreground",
                      )}
                    >
                      {hits[index] ? (
                        <Check className="size-3" />
                      ) : (
                        <X className="size-3" />
                      )}
                    </span>
                    <span
                      className={cn(
                        hits[index]
                          ? "text-card-foreground/90"
                          : "text-muted-foreground",
                      )}
                    >
                      <RichText>{key.idea}</RichText>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                <RichText>{l.ideasNote}</RichText>
              </p>
            </div>
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
