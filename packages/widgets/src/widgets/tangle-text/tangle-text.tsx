import * as React from "react";

import { cn } from "@/lib/utils";
import { evaluateFormula, formatValue } from "@/lib/formula";
import { useLabels, useLocale } from "@/lib/i18n";
import { RichText } from "@/primitives/rich-text";

export interface TangleVariable {
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: string;
  prefix?: string;
  suffix?: string;
}

export interface TangleOutput {
  formula: string;
  format?: string;
  prefix?: string;
  suffix?: string;
}

export interface TangleTextLabels {
  hint: React.ReactNode;
  /** Accessible name prefix for each draggable variable. */
  variable: string;
}

export const DEFAULT_TANGLE_TEXT_LABELS: TangleTextLabels = {
  hint: "↔ Drag the underlined numbers, or focus one and use the arrow keys.",
  variable: "Adjustable value",
};

export interface TangleTextProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Prose with `{varName}` (draggable) and `{=outName}` (computed) placeholders. */
  text: string;
  variables: Record<string, TangleVariable>;
  outputs?: Record<string, TangleOutput>;
  note?: React.ReactNode;
  /** BCP-47 locale for number formatting. Falls back to the provider/runtime. */
  locale?: string;
  labels?: Partial<TangleTextLabels>;
}

type Part =
  | { kind: "text"; content: string }
  | { kind: "var"; name: string }
  | { kind: "out"; name: string };

const PLACEHOLDER = /(\{=?[a-zA-Z_][a-zA-Z0-9_]*\})/g;

function parse(
  text: string,
  variables: Record<string, TangleVariable>,
  outputs: Record<string, TangleOutput>,
): Part[] {
  return text.split(PLACEHOLDER).map((segment): Part => {
    const varMatch = segment.match(/^\{([a-zA-Z_][a-zA-Z0-9_]*)\}$/);
    const outMatch = segment.match(/^\{=([a-zA-Z_][a-zA-Z0-9_]*)\}$/);
    if (varMatch && variables[varMatch[1]]) return { kind: "var", name: varMatch[1] };
    if (outMatch && outputs[outMatch[1]]) return { kind: "out", name: outMatch[1] };
    return { kind: "text", content: segment };
  });
}

/**
 * TangleText — a reactive document (Bret Victor's "Tangle"). Numbers in the
 * prose are draggable: scrub a variable and every dependent output recomputes
 * live. Drag with a pointer/finger, or focus a value and use the arrow keys.
 */
export function TangleText({
  text,
  variables,
  outputs = {},
  note,
  locale,
  labels,
  className,
  ...props
}: TangleTextProps) {
  const l = useLabels("tangleText", DEFAULT_TANGLE_TEXT_LABELS, labels);
  const activeLocale = useLocale(locale);
  const [values, setValues] = React.useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const [name, v] of Object.entries(variables)) init[name] = v.value;
    return init;
  });

  const parts = React.useMemo(
    () => parse(text, variables, outputs),
    [text, variables, outputs],
  );

  return (
    <div
      data-slot="tangle-text"
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
          if (part.kind === "var") {
            return (
              <TangleVariableSpan
                key={i}
                name={part.name}
                spec={variables[part.name]}
                value={values[part.name]}
                locale={activeLocale}
                ariaLabel={l.variable}
                onChange={(next) =>
                  setValues((prev) =>
                    prev[part.name] === next ? prev : { ...prev, [part.name]: next },
                  )
                }
              />
            );
          }
          const o = outputs[part.name];
          let display: string;
          try {
            display = `${o.prefix ?? ""}${formatValue(evaluateFormula(o.formula, values), o.format, activeLocale)}${o.suffix ?? ""}`;
          } catch {
            display = "—";
          }
          return (
            <span
              key={i}
              data-slot="tangle-output"
              className="mx-0.5 rounded bg-secondary px-1 font-semibold text-secondary-foreground"
            >
              {display}
            </span>
          );
        })}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">{l.hint}</p>
      {note != null && (
        <p className="mt-2 text-sm text-muted-foreground">
          <RichText>{note}</RichText>
        </p>
      )}
    </div>
  );
}

TangleText.displayName = "TangleText";

function TangleVariableSpan({
  name,
  spec,
  value,
  locale,
  ariaLabel,
  onChange,
}: {
  name: string;
  spec: TangleVariable;
  value: number;
  locale?: string;
  ariaLabel: string;
  onChange: (value: number) => void;
}) {
  const drag = React.useRef<{ startX: number; startValue: number } | null>(null);
  const step = spec.step ?? 1;
  const clampStep = (next: number) =>
    Math.min(spec.max, Math.max(spec.min, Math.round(next / step) * step));
  const display = `${spec.prefix ?? ""}${formatValue(value, spec.format, locale)}${spec.suffix ?? ""}`;

  return (
    <span
      role="slider"
      tabIndex={0}
      aria-label={`${ariaLabel}: ${name}`}
      aria-valuemin={spec.min}
      aria-valuemax={spec.max}
      aria-valuenow={value}
      data-slot="tangle-var"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { startX: e.clientX, startValue: value };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const delta = Math.round((e.clientX - drag.current.startX) / 5) * step;
        onChange(clampStep(drag.current.startValue + delta));
      }}
      onPointerUp={(e) => {
        drag.current = null;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* capture may already be released */
        }
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault();
          onChange(clampStep(value + step));
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault();
          onChange(clampStep(value - step));
        }
      }}
      className="mx-0.5 cursor-ew-resize touch-none select-none rounded px-1 font-semibold text-primary underline decoration-dotted underline-offset-4 outline-none hover:bg-[color-mix(in_oklab,var(--primary)_12%,var(--card))] focus-visible:ring-2 focus-visible:ring-ring"
    >
      {display}
    </span>
  );
}
