import * as React from "react";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export interface ChartDatum {
  label: string;
  value: number;
  /** Override the auto-assigned series color (any CSS color). */
  color?: string;
}

export interface ChartSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface DataChartProps extends React.HTMLAttributes<HTMLDivElement> {
  chartType: "bar" | "hbar" | "line";
  /** For bar / hbar. */
  data?: ChartDatum[];
  /** X-axis labels for line charts. */
  labels?: string[];
  /** One or more series for line charts. */
  series?: ChartSeries[];
  /** Unit appended to formatted values (e.g. "ms", "€"). */
  unit?: string;
  /** Force the axis maximum instead of deriving it from the data. */
  maxValue?: number;
  /** BCP-47 locale for number formatting. Falls back to the provider/runtime. */
  locale?: string;
}

// Theme tokens — the chart is aseptic: colors come from CSS variables.
const FG = "var(--foreground)";
const MUTED = "var(--muted-foreground)";
const GRID = "var(--border)";
const SHADOW = "var(--wgt-shadow-color)";

function seriesColor(explicit: string | undefined, index: number) {
  return explicit ?? `var(--chart-${(index % 5) + 1})`;
}

/**
 * DataChart — declarative data graphics (bar, horizontal bar, line) rendered as
 * inline SVG with zero chart dependencies. Brand-agnostic: colors come from the
 * `--chart-*` theme tokens (neutral categorical palette by default, the brand
 * palette under Web Reactiva). Numbers are locale-formatted.
 */
export function DataChart({
  chartType,
  data = [],
  labels = [],
  series = [],
  unit = "",
  maxValue,
  locale,
  className,
  ...props
}: DataChartProps) {
  const activeLocale = useLocale(locale);
  const fmt = React.useCallback(
    (v: number) =>
      new Intl.NumberFormat(activeLocale, { maximumFractionDigits: 1 }).format(v) +
      (unit ? ` ${unit}` : ""),
    [activeLocale, unit],
  );

  let chart: React.ReactNode = null;
  let aria = "";

  if (chartType === "bar") {
    const W = 640, H = 340, top = 30, bottom = 50, left = 16, right = 16;
    const plotW = W - left - right, plotH = H - top - bottom;
    const max = maxValue ?? (Math.max(...data.map((d) => d.value), 0) * 1.15 || 1);
    const slot = plotW / Math.max(data.length, 1);
    const barW = Math.min(slot * 0.62, 90);

    chart = (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[26rem]">
        {[0.5, 1].map((f, k) => {
          const y = top + plotH - plotH * f;
          return <line key={`g${k}`} x1={left} y1={y} x2={W - right} y2={y} stroke={GRID} strokeWidth={1} />;
        })}
        {data.map((d, i) => {
          const h = Math.max((d.value / max) * plotH, 2);
          const x = left + slot * i + (slot - barW) / 2;
          const y = top + plotH - h;
          const c = seriesColor(d.color, i);
          return (
            <g key={i}>
              <rect x={x + 3} y={y + 3} width={barW} height={h} fill={SHADOW} />
              <rect x={x} y={y} width={barW} height={h} fill={c} />
              <text x={x + barW / 2} y={y - 8} textAnchor="middle" className="font-mono" fontSize={13} fontWeight={700} fill={FG}>{fmt(d.value)}</text>
              <text x={left + slot * i + slot / 2} y={H - bottom + 24} textAnchor="middle" className="font-mono" fontSize={12} fill={MUTED}>{d.label}</text>
            </g>
          );
        })}
        <line x1={left} y1={top + plotH} x2={W - right} y2={top + plotH} stroke={FG} strokeWidth={2} />
      </svg>
    );
    aria = `Bar chart: ${data.map((d) => `${d.label} ${fmt(d.value)}`).join(", ")}`;
  }

  if (chartType === "hbar") {
    const rowH = 44, gap = 10, labelW = 150, W = 640;
    const H = data.length * (rowH + gap) + 16;
    const max = maxValue ?? (Math.max(...data.map((d) => d.value), 0) * 1.1 || 1);
    const plotW = W - labelW - 90;

    chart = (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[26rem]">
        <line x1={labelW} y1={0} x2={labelW} y2={H} stroke={FG} strokeWidth={2} />
        {data.map((d, i) => {
          const y = 8 + i * (rowH + gap);
          const w = Math.max((d.value / max) * plotW, 2);
          const c = seriesColor(d.color, i);
          return (
            <g key={i}>
              <text x={labelW - 12} y={y + rowH / 2 + 4} textAnchor="end" className="font-mono" fontSize={13} fill={FG}>{d.label}</text>
              <rect x={labelW + 3} y={y + 3} width={w} height={rowH - 8} fill={SHADOW} />
              <rect x={labelW} y={y} width={w} height={rowH - 8} fill={c} />
              <text x={labelW + w + 10} y={y + rowH / 2 - 2} className="font-mono" fontSize={13} fontWeight={700} fill={FG}>{fmt(d.value)}</text>
            </g>
          );
        })}
      </svg>
    );
    aria = `Horizontal bar chart: ${data.map((d) => `${d.label} ${fmt(d.value)}`).join(", ")}`;
  }

  if (chartType === "line") {
    const W = 640, H = 340, top = 36, bottom = 50, left = 24, right = 24;
    const plotW = W - left - right, plotH = H - top - bottom;
    const max = maxValue ?? (Math.max(...series.flatMap((s) => s.values), 0) * 1.15 || 1);
    const n = labels.length;
    const xAt = (i: number) => left + (n > 1 ? (plotW / (n - 1)) * i : plotW / 2);
    const yAt = (v: number) => top + plotH - (v / max) * plotH;

    chart = (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[26rem]">
        {[0.25, 0.5, 0.75, 1].map((f, k) => {
          const y = top + plotH - plotH * f;
          return <line key={`g${k}`} x1={left} y1={y} x2={W - right} y2={y} stroke={GRID} strokeWidth={1} />;
        })}
        {series.length > 1 &&
          series.map((s, si) => {
            const x = left + si * 150;
            return (
              <g key={`l${si}`}>
                <rect x={x} y={8} width={12} height={12} fill={seriesColor(s.color, si)} />
                <text x={x + 20} y={19} className="font-mono" fontSize={13} fill={FG}>{s.name}</text>
              </g>
            );
          })}
        {series.map((s, si) => {
          const c = seriesColor(s.color, si);
          const points = s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
          return (
            <g key={si}>
              <polyline points={points} fill="none" stroke={c} strokeWidth={3} />
              {s.values.map((v, i) => (
                <rect key={i} x={xAt(i) - 5} y={yAt(v) - 5} width={10} height={10} fill={c} />
              ))}
            </g>
          );
        })}
        {labels.map((l, i) => (
          <text key={i} x={xAt(i)} y={H - bottom + 24} textAnchor="middle" className="font-mono" fontSize={12} fill={MUTED}>{l}</text>
        ))}
        <line x1={left} y1={top + plotH} x2={W - right} y2={top + plotH} stroke={FG} strokeWidth={2} />
      </svg>
    );
    aria = `Line chart with ${series.length} series: ${series.map((s) => s.name).join(", ")}`;
  }

  return (
    <div
      data-slot="data-chart"
      role="img"
      aria-label={aria}
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      {/* Scroll instead of shrinking labels into illegibility on narrow widths. */}
      <div className="overflow-x-auto">{chart}</div>
    </div>
  );
}

DataChart.displayName = "DataChart";
