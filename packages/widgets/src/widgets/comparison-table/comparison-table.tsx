import * as React from "react";
import { Check, X } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { RichText } from "@/primitives/rich-text";

export type ComparisonCell = boolean | string | null;

export interface ComparisonColumn {
  /** Column heading — the option being compared. */
  label: React.ReactNode;
  /** Short qualifier under the heading (price, version, verdict…). */
  note?: React.ReactNode;
  /** Tint this column as the recommended / winning option. */
  highlight?: boolean;
}

export interface ComparisonRow {
  /** The criterion being compared across columns. */
  label: React.ReactNode;
  /** Detail line under the criterion. */
  hint?: React.ReactNode;
  /** One cell per column: `true`/`false` render as icons, strings verbatim. */
  cells: ComparisonCell[];
}

export interface ComparisonTableLabels {
  /** Heading of the criteria column. */
  criteria: React.ReactNode;
  /** Accessible text for a `true` cell. */
  yes: string;
  /** Accessible text for a `false` cell. */
  no: string;
  /** Accessible text for an empty cell. */
  unknown: string;
}

export const DEFAULT_COMPARISON_TABLE_LABELS: ComparisonTableLabels = {
  criteria: "",
  yes: "Yes",
  no: "No",
  unknown: "Not applicable",
};

export interface ComparisonTableProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** The options being compared, left to right. */
  columns: ComparisonColumn[];
  /** One row per criterion; `cells` must line up with `columns`. */
  rows: ComparisonRow[];
  /** Short sentence describing what the table compares. */
  caption?: React.ReactNode;
  /** Customizable / translatable strings. */
  labels?: Partial<ComparisonTableLabels>;
}

/**
 * ComparisonTable — a criteria × options matrix for "which one do I pick?".
 * Booleans become check/cross icons, strings stay verbatim, and one column can
 * be highlighted as the recommendation.
 *
 * Mobile-first without a second layout: the table scrolls horizontally while
 * the criteria column stays pinned, so a row never loses its label — the
 * failure mode of every responsive table that reflows into cards. Prefer the
 * `versus` / `matrix` Infographic layouts when the comparison is a visual
 * metaphor of two sides; use this one when the reader needs the actual values.
 */
export function ComparisonTable({
  columns,
  rows,
  caption,
  labels,
  className,
  ...props
}: ComparisonTableProps) {
  const l = useLabels(
    "comparisonTable",
    DEFAULT_COMPARISON_TABLE_LABELS,
    labels,
  );

  return (
    <div
      data-slot="comparison-table"
      className={cn(
        "@container/cmp overflow-hidden rounded-lg border bg-card text-card-foreground shadow-wgt",
        className,
      )}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {caption != null && (
            <caption className="border-b px-4 py-3 text-left text-sm text-muted-foreground">
              <RichText>{caption}</RichText>
            </caption>
          )}
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 min-w-40 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                <RichText>{l.criteria}</RichText>
              </th>
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    "min-w-28 px-4 py-3 text-left align-bottom",
                    column.highlight &&
                      "bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))]",
                  )}
                >
                  <span
                    className={cn(
                      "block font-semibold",
                      column.highlight && "text-primary",
                    )}
                  >
                    <RichText>{column.label}</RichText>
                  </span>
                  {column.note != null && (
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      <RichText>{column.note}</RichText>
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-card px-4 py-3 text-left align-top font-medium"
                >
                  <span className="block">
                    <RichText>{row.label}</RichText>
                  </span>
                  {row.hint != null && (
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      <RichText>{row.hint}</RichText>
                    </span>
                  )}
                </th>
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      "px-4 py-3 align-top",
                      column.highlight &&
                        "bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))]",
                    )}
                  >
                    <Cell value={row.cells[colIndex] ?? null} labels={l} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({
  value,
  labels,
}: {
  value: ComparisonCell;
  labels: ComparisonTableLabels;
}) {
  if (value === true) {
    return (
      <span className="inline-flex items-center text-success">
        <Check className="size-4" />
        <span className="sr-only">{labels.yes}</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center text-destructive">
        <X className="size-4" />
        <span className="sr-only">{labels.no}</span>
      </span>
    );
  }
  if (value == null || value === "") {
    return (
      <span className="text-muted-foreground/60">
        <span aria-hidden>—</span>
        <span className="sr-only">{labels.unknown}</span>
      </span>
    );
  }
  return (
    <span className="text-card-foreground/90">
      <RichText>{value}</RichText>
    </span>
  );
}

ComparisonTable.displayName = "ComparisonTable";
