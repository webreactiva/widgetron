import * as React from "react";
import { Check, RotateCcw } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";

export interface Blank {
  /** Choices shown in the dropdown. `answer` must be one of these. */
  options: string[];
  /** The correct choice. Must be present in `options`. */
  answer: string;
}

export interface FillInTheBlanksLabels {
  check: React.ReactNode;
  correct: React.ReactNode;
  incorrect: React.ReactNode;
  reset: React.ReactNode;
  /** Empty-state text for the first (unselected) option in each dropdown. */
  placeholder: string;
}

export const DEFAULT_FILL_IN_THE_BLANKS_LABELS: FillInTheBlanksLabels = {
  check: "Check",
  correct: "All correct!",
  incorrect: "Not quite — try again.",
  reset: "Reset",
  placeholder: "…",
};

export interface FillInTheBlanksProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Prose with `{{blankId}}` placeholders, one per blank. */
  text: string;
  /** The blanks, keyed by the id used in `text`. */
  blanks: Record<string, Blank>;
  /** Customizable / translatable strings. */
  labels?: Partial<FillInTheBlanksLabels>;
}

type Part =
  | { kind: "text"; content: string }
  | { kind: "blank"; id: string };

const PLACEHOLDER = /(\{\{[a-zA-Z0-9_]+\}\})/g;

function parse(text: string, blanks: Record<string, Blank>): Part[] {
  return text.split(PLACEHOLDER).map((segment): Part => {
    const match = segment.match(/^\{\{([a-zA-Z0-9_]+)\}\}$/);
    if (match && blanks[match[1]]) return { kind: "blank", id: match[1] };
    return { kind: "text", content: segment };
  });
}

type BlankStatus = "idle" | "correct" | "incorrect";

/**
 * FillInTheBlanks — prose with inline dropdown blanks the reader fills in, then
 * checks. Each `{{blankId}}` in the text becomes a `<select>` that flows with
 * the surrounding words. After "Check", every blank is graded inline (success
 * or destructive tint) and a status panel reports whether all are correct.
 * Mobile-first and accessible; all copy is translatable via `labels` (or
 * globally through WidgetronProvider).
 */
export function FillInTheBlanks({
  text,
  blanks,
  labels,
  className,
  ...props
}: FillInTheBlanksProps) {
  const l = useLabels("fillBlanks", DEFAULT_FILL_IN_THE_BLANKS_LABELS, labels);
  const reactId = React.useId();
  const [chosen, setChosen] = React.useState<Record<string, string>>({});
  const [checked, setChecked] = React.useState(false);

  const parts = React.useMemo(() => parse(text, blanks), [text, blanks]);
  const ids = React.useMemo(() => Object.keys(blanks), [blanks]);

  const allFilled =
    ids.length > 0 && ids.every((id) => Boolean(chosen[id]));
  const allCorrect = ids.every((id) => chosen[id] === blanks[id].answer);

  function statusFor(id: string): BlankStatus {
    if (!checked) return "idle";
    return chosen[id] === blanks[id].answer ? "correct" : "incorrect";
  }

  function handleChange(id: string, value: string) {
    setChosen((prev) => ({ ...prev, [id]: value }));
    if (checked) setChecked(false);
  }

  function handleReset() {
    setChosen({});
    setChecked(false);
  }

  return (
    <div
      data-slot="fill-in-the-blanks"
      data-checked={checked || undefined}
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      <p className="text-base leading-relaxed">
        {parts.map((part, i) => {
          if (part.kind === "text")
            return <React.Fragment key={i}>{part.content}</React.Fragment>;
          const status = statusFor(part.id);
          const blank = blanks[part.id];
          return (
            <select
              key={i}
              data-slot="fill-blank"
              value={chosen[part.id] ?? ""}
              aria-label={`${reactId}-${part.id}`}
              onChange={(e) => handleChange(part.id, e.target.value)}
              className={cn(
                "mx-0.5 max-w-full rounded border bg-background px-2 py-1 align-baseline text-sm font-medium outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                status === "idle" && "border-input",
                status === "correct" &&
                  "border-success bg-[color-mix(in_oklab,var(--success)_12%,var(--card))] text-foreground",
                status === "incorrect" &&
                  "border-destructive bg-[color-mix(in_oklab,var(--destructive)_12%,var(--card))] text-foreground",
              )}
            >
              <option value="" disabled>
                {l.placeholder}
              </option>
              {blank.options.map((option, j) => (
                <option key={j} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );
        })}
      </p>

      {checked && (
        <div
          role="status"
          className={cn(
            "mt-4 rounded-md border p-3 text-sm font-semibold motion-safe:animate-wgt-fade-up",
            allCorrect
              ? "border-success/40 bg-[color-mix(in_oklab,var(--success)_8%,var(--card))]"
              : "border-destructive/40 bg-[color-mix(in_oklab,var(--destructive)_8%,var(--card))]",
          )}
        >
          {allCorrect ? l.correct : l.incorrect}
        </div>
      )}

      <div className="mt-4 flex flex-row gap-2">
        <Button
          type="button"
          disabled={!allFilled}
          onClick={() => setChecked(true)}
        >
          <Check />
          {l.check}
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          <RotateCcw />
          {l.reset}
        </Button>
      </div>
    </div>
  );
}

FillInTheBlanks.displayName = "FillInTheBlanks";
