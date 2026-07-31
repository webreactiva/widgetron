import * as React from "react";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { RichText } from "@/primitives/rich-text";

export interface CodeDiffLabels {
  added: string;
  removed: string;
  /** Heading above the plain-language notes. */
  whatChanged: React.ReactNode;
}

export const DEFAULT_CODE_DIFF_LABELS: CodeDiffLabels = {
  added: "added",
  removed: "removed",
  whatChanged: "What changed",
};

export interface CodeDiffProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The code as it was. */
  before: string;
  /** The code as it should be. */
  after: string;
  /** File name / path shown in the header (e.g. `src/app.ts`). */
  filename?: React.ReactNode;
  /** Plain-language bullets explaining why the change matters. */
  notes?: React.ReactNode[];
  /** Show the before/after line-number gutter. Default: true. */
  lineNumbers?: boolean;
  /** Customizable / translatable strings. */
  labels?: Partial<CodeDiffLabels>;
}

type DiffKind = "context" | "add" | "remove";

interface DiffLine {
  kind: DiffKind;
  text: string;
  /** Line number in `before` (removed + context lines). */
  from?: number;
  /** Line number in `after` (added + context lines). */
  to?: number;
}

/** Above this many cells the LCS table stops being worth it for a snippet. */
const LCS_CELL_BUDGET = 40_000;

/**
 * Line-level diff (longest common subsequence). Dependency-free and
 * deterministic, sized for teaching snippets: past the cell budget it degrades
 * to "everything replaced", which still reads correctly.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.replace(/\n$/, "").split("\n");
  const b = after.replace(/\n$/, "").split("\n");

  if (a.length * b.length > LCS_CELL_BUDGET) {
    return [
      ...a.map((text, i) => ({ kind: "remove" as const, text, from: i + 1 })),
      ...b.map((text, i) => ({ kind: "add" as const, text, to: i + 1 })),
    ];
  }

  // lcs[i][j] = length of the LCS of a[i…] and b[j…].
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] =
        a[i] === b[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: "context", text: a[i], from: i + 1, to: j + 1 });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ kind: "remove", text: a[i], from: i + 1 });
      i++;
    } else {
      out.push({ kind: "add", text: b[j], to: j + 1 });
      j++;
    }
  }
  for (; i < a.length; i++) out.push({ kind: "remove", text: a[i], from: i + 1 });
  for (; j < b.length; j++) out.push({ kind: "add", text: b[j], to: j + 1 });
  return out;
}

const SIGN: Record<DiffKind, string> = {
  add: "+",
  remove: "-",
  context: " ",
};

/**
 * CodeDiff — before and after in one block, with every changed line marked.
 * The unified layout (one column, `+`/`-` gutter) is deliberate: side-by-side
 * code is unreadable on a phone, and the reader's eye follows a single flow.
 *
 * Where CodeTranslation explains what code DOES, this explains what a change
 * DID — the refactor, the fix, the "before I knew better". Code renders
 * verbatim (never through RichText); the `notes` carry the plain-language why.
 */
export function CodeDiff({
  before,
  after,
  filename,
  notes,
  lineNumbers = true,
  labels,
  className,
  ...props
}: CodeDiffProps) {
  const l = useLabels("codeDiff", DEFAULT_CODE_DIFF_LABELS, labels);
  const lines = React.useMemo(() => diffLines(before, after), [before, after]);

  const added = lines.filter((line) => line.kind === "add").length;
  const removed = lines.filter((line) => line.kind === "remove").length;

  return (
    <div
      data-slot="code-diff"
      className={cn(
        "@container/diff overflow-hidden rounded-lg border bg-card shadow-wgt",
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b bg-muted/40 px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">
          {filename}
        </span>
        {/* A zero count is noise — a pure addition has nothing removed. */}
        <span className="flex items-center gap-3 text-xs font-semibold tabular-nums">
          {added > 0 && (
            <span className="text-success">
              +{added} <span className="font-normal">{l.added}</span>
            </span>
          )}
          {removed > 0 && (
            <span className="text-destructive">
              −{removed} <span className="font-normal">{l.removed}</span>
            </span>
          )}
        </span>
      </div>

      <pre className="overflow-x-auto bg-[var(--wgt-code-bg)] py-2 font-mono text-sm leading-relaxed text-[var(--wgt-code-fg)]">
        <code>
          {lines.map((line, index) => (
            <span
              key={index}
              data-diff={line.kind}
              className={cn(
                "flex min-w-max",
                line.kind === "add" &&
                  "bg-[color-mix(in_oklab,var(--success)_22%,transparent)]",
                line.kind === "remove" &&
                  "bg-[color-mix(in_oklab,var(--destructive)_22%,transparent)]",
              )}
            >
              {lineNumbers && (
                <span
                  aria-hidden
                  className="sticky left-0 select-none bg-[var(--wgt-code-bg)] px-2 text-right text-xs tabular-nums text-white/35"
                >
                  <span className="inline-block w-6">{line.from ?? ""}</span>
                  <span className="ml-1 inline-block w-6">{line.to ?? ""}</span>
                </span>
              )}
              <span
                aria-hidden
                className={cn(
                  "w-4 shrink-0 select-none text-center",
                  line.kind === "add" && "text-success",
                  line.kind === "remove" && "text-destructive",
                  line.kind === "context" && "text-white/25",
                )}
              >
                {SIGN[line.kind]}
              </span>
              <span className="grow whitespace-pre pr-4">{line.text || " "}</span>
            </span>
          ))}
        </code>
      </pre>

      {notes != null && notes.length > 0 && (
        <div className="border-t p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <RichText>{l.whatChanged}</RichText>
          </p>
          <ul className="flex flex-col gap-2 text-sm text-card-foreground/90">
            {notes.map((note, index) => (
              <li key={index} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  <RichText>{note}</RichText>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

CodeDiff.displayName = "CodeDiff";
