import * as React from "react";

import { cn } from "@/lib/utils";
import { evaluateFormula, formatValue } from "@/lib/formula";
import { useLabels, useLocale } from "@/lib/i18n";
import { Button } from "@/primitives/button";

export interface ScrubberVariable {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  format?: string;
}

export interface ScrubberOutput {
  label: React.ReactNode;
  /** Arithmetic expression over the variable keys; evaluated live. */
  formula: string;
  format?: string;
  unit?: string;
  /** Full-scale value for the bar. Omit to hide the bar and show only the number. */
  max?: number;
}

export interface ScrubberLabels {
  reset: string;
}

export const DEFAULT_SCRUBBER_LABELS: ScrubberLabels = {
  reset: "Reset",
};

export interface ScrubberProps extends React.HTMLAttributes<HTMLDivElement> {
  variables: Record<string, ScrubberVariable>;
  outputs: Record<string, ScrubberOutput>;
  note?: React.ReactNode;
  /** BCP-47 locale for number formatting. Falls back to the provider/runtime. */
  locale?: string;
  labels?: Partial<ScrubberLabels>;
}

/** Categorical bar colors, cycled by output index. */
const BAR_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/**
 * Scrubber — a control-panel "explorable explanation" (Bret Victor style). The
 * reader drags sliders for the input variables and watches the computed outputs
 * update live, as formatted numbers and little bars. It is the panel sibling of
 * the inline TangleText: same formula engine, same locale/i18n contract.
 */
export function Scrubber({
  variables,
  outputs,
  note,
  locale,
  labels,
  className,
  ...props
}: ScrubberProps) {
  const l = useLabels("scrubber", DEFAULT_SCRUBBER_LABELS, labels);
  const activeLocale = useLocale(locale);

  const initial = React.useMemo<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const [name, v] of Object.entries(variables)) init[name] = v.value;
    return init;
  }, [variables]);

  const [values, setValues] = React.useState<Record<string, number>>(initial);

  return (
    <div
      data-slot="scrubber"
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-4" data-slot="scrubber-controls">
        {Object.entries(variables).map(([name, spec]) => (
          <ScrubberControl
            key={name}
            spec={spec}
            value={values[name] ?? spec.value}
            locale={activeLocale}
            onChange={(next) =>
              setValues((prev) =>
                prev[name] === next ? prev : { ...prev, [name]: next },
              )
            }
          />
        ))}
      </div>

      <div
        className="mt-5 flex flex-col gap-3 border-t pt-4"
        data-slot="scrubber-outputs"
      >
        {Object.entries(outputs).map(([name, out], i) => {
          let raw: number | null;
          try {
            raw = evaluateFormula(out.formula, values);
          } catch {
            raw = null;
          }
          const display =
            raw == null
              ? "—"
              : `${formatValue(raw, out.format, activeLocale)}${out.unit ?? ""}`;
          const showBar = out.max != null && raw != null && Number.isFinite(raw);
          const pct =
            showBar && out.max != null
              ? Math.min(1, Math.max(0, (raw as number) / out.max)) * 100
              : 0;

          return (
            <div key={name} data-slot="scrubber-output">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-muted-foreground">{out.label}</span>
                <span className="font-semibold tabular-nums">{display}</span>
              </div>
              {showBar && (
                <div
                  className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setValues(initial)}
        >
          {l.reset}
        </Button>
      </div>

      {note != null && (
        <p className="mt-3 text-sm text-muted-foreground">{note}</p>
      )}
    </div>
  );
}

Scrubber.displayName = "Scrubber";

function ScrubberControl({
  spec,
  value,
  locale,
  onChange,
}: {
  spec: ScrubberVariable;
  value: number;
  locale?: string;
  onChange: (value: number) => void;
}) {
  const id = React.useId();
  const display = `${formatValue(value, spec.format, locale)}${spec.unit ?? ""}`;

  return (
    <div className="flex flex-col gap-1.5" data-slot="scrubber-control">
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-3 text-sm"
      >
        <span className="font-medium">{spec.label}</span>
        <span className="font-semibold tabular-nums text-primary">{display}</span>
      </label>
      <input
        id={id}
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step ?? 1}
        value={value}
        onChange={(e) => onChange(e.currentTarget.valueAsNumber)}
        className="h-6 w-full cursor-ew-resize touch-none accent-[var(--primary)] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
