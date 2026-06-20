import * as React from "react";

import { cn } from "@/lib/utils";

export interface CodeTranslationProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The code to show on the left. A plain string is rendered verbatim; pass a
   * React node if you have pre-highlighted markup.
   */
  code: React.ReactNode;
  /** Plain-language explanation lines, shown on the right. */
  translations: React.ReactNode[];
  codeLabel?: string;
  translationLabel?: string;
}

/**
 * CodeTranslation — real code on one side, a plain-language explanation on the
 * other. The most valuable element for teaching code to non-technical readers.
 * Uses a container query: two columns when the widget is wide, stacked when
 * narrow (independent of the viewport, so it adapts inside any layout).
 */
export function CodeTranslation({
  code,
  translations,
  codeLabel = "Code",
  translationLabel = "In plain words",
  className,
  ...props
}: CodeTranslationProps) {
  return (
    <div
      data-slot="code-translation"
      className={cn(
        "@container/ct overflow-hidden rounded-lg border bg-card shadow-wgt",
        className,
      )}
      {...props}
    >
      <div className="grid grid-cols-1 @md/ct:grid-cols-2">
        {/* Code side */}
        <div className="bg-[var(--wgt-code-bg)] text-[var(--wgt-code-fg)]">
          <p className="border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/50">
            {codeLabel}
          </p>
          <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
            {code}
          </pre>
        </div>
        {/* Explanation side */}
        <div className="border-t @md/ct:border-l @md/ct:border-t-0">
          <p className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {translationLabel}
          </p>
          <ol className="flex flex-col gap-3 p-4 text-sm">
            {translations.map((line, index) => (
              <li key={index} className="flex gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <span className="text-card-foreground/90">{line}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

CodeTranslation.displayName = "CodeTranslation";
