import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/primitives/button";
import { useLabels } from "@/lib/i18n";
import { Check, Copy } from "@/lib/icons";
import { RichText } from "@/primitives/rich-text";

export interface PromptTemplateLabels {
  /** Eyebrow above the prompt body. */
  eyebrow: React.ReactNode;
  /** Copy button (idle). */
  copy: React.ReactNode;
  /** Copy button after a successful copy. */
  copied: React.ReactNode;
  /** Copy button when the clipboard write fails. */
  copyFailed: React.ReactNode;
}

export const DEFAULT_PROMPT_TEMPLATE_LABELS: PromptTemplateLabels = {
  eyebrow: "PROMPT — edit the slots and copy",
  copy: "Copy prompt",
  copied: "Copied",
  copyFailed: "Couldn't copy",
};

export interface PromptTemplateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** The prompt text. `{{slot}}` placeholders become inline-editable fields. */
  template: string;
  /** Optional helper note shown next to the copy button. */
  note?: React.ReactNode;
  /** Customizable / translatable strings. */
  labels?: Partial<PromptTemplateLabels>;
}

type Part =
  | { kind: "text"; content: string }
  | { kind: "slot"; name: string };

const SLOT_PATTERN = /(\{\{[^}]+\}\})/g;

function parseTemplate(template: string): Part[] {
  return template.split(SLOT_PATTERN).map((segment) => {
    const m = segment.match(/^\{\{([^}]+)\}\}$/);
    return m
      ? ({ kind: "slot", name: m[1].trim() } as const)
      : ({ kind: "text", content: segment } as const);
  });
}

type CopyStatus = "idle" | "copied" | "error";

/**
 * PromptTemplate — a copy-ready prompt with inline-editable slots. The dispensa
 * teaches a concept AND hands over the exact prompt to use with an AI: `{{slot}}`
 * placeholders render as editable fields, and the copy button grabs the resolved
 * text (with the learner's edits). The most practical artifact for an AI-first
 * audience. All copy is customizable/translatable via `labels`.
 */
export function PromptTemplate({
  template,
  note,
  labels,
  className,
  ...props
}: PromptTemplateProps) {
  const l = useLabels("promptTemplate", DEFAULT_PROMPT_TEMPLATE_LABELS, labels);
  const parts = React.useMemo(() => parseTemplate(template), [template]);
  const bodyRef = React.useRef<HTMLDivElement>(null);
  const [status, setStatus] = React.useState<CopyStatus>("idle");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function handleCopy() {
    const text = bodyRef.current?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <div
      data-slot="prompt-template"
      className={cn(
        "overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <div className="border-b bg-muted/40 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {l.eyebrow}
      </div>

      <div
        ref={bodyRef}
        className="whitespace-pre-wrap px-4 py-4 font-mono text-sm leading-relaxed text-card-foreground"
      >
        {parts.map((part, i) =>
          part.kind === "slot" ? (
            <span
              key={i}
              role="textbox"
              aria-label={part.name}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              className="mx-0.5 inline-block min-w-4 rounded border border-primary/40 bg-[color-mix(in_oklab,var(--primary)_10%,var(--card))] px-1.5 py-0.5 font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {part.name}
            </span>
          ) : (
            <React.Fragment key={i}>{part.content}</React.Fragment>
          ),
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t px-4 py-3">
        <Button
          size="sm"
          variant={status === "copied" ? "default" : "outline"}
          onClick={handleCopy}
        >
          {status === "copied" ? <Check /> : <Copy />}
          {status === "copied"
            ? l.copied
            : status === "error"
              ? l.copyFailed
              : l.copy}
        </Button>
        {note != null && (
          <span className="text-sm text-muted-foreground">
            <RichText>{note}</RichText>
          </span>
        )}
      </div>
    </div>
  );
}

PromptTemplate.displayName = "PromptTemplate";
