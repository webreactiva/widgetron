import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const dataChartMeta: WidgetMeta = {
  version: 1,
  category: "Diagrams & data",
  summary:
    "Declarative bar, horizontal-bar, and line charts rendered as dependency-free, locale-formatted SVG.",
  whenToUse:
    "Reach for this to make a quantitative point with real numbers — comparing magnitudes across categories ('bar'/'hbar') or showing a trend over an ordered axis ('line', one or more series). Choose 'hbar' when category labels are long, 'line' when the x-axis is time or another continuous sequence. Prefer Infographic instead when the relationship is conceptual (a funnel, cycle, hierarchy) rather than measured, and MermaidDiagram when you are drawing a process or structure rather than values.",
  schema: z.object({
    chartType: z
      .enum(["bar", "hbar", "line"])
      .describe(
        "Chart shape: 'bar' vertical bars, 'hbar' horizontal bars, 'line' line series.",
      ),
    data: z
      .array(
        z.object({
          label: z.string().describe("Category label for this bar."),
          value: z.number().describe("Numeric value of this bar."),
          color: z
            .string()
            .optional()
            .describe("Override the auto-assigned series color (any CSS color)."),
        }),
      )
      .optional()
      .describe("Bars for 'bar' / 'hbar' charts."),
    labels: z
      .array(z.string())
      .optional()
      .describe("X-axis labels for line charts (one per point)."),
    series: z
      .array(
        z.object({
          name: z.string().describe("Series name shown in the legend."),
          values: z
            .array(z.number())
            .describe("Y values aligned with `labels`."),
          color: z
            .string()
            .optional()
            .describe("Override the auto-assigned series color (any CSS color)."),
        }),
      )
      .optional()
      .describe("One or more series for line charts."),
    unit: z
      .string()
      .optional()
      .describe("Unit appended to formatted values (e.g. 'ms', '€')."),
    maxValue: z
      .number()
      .optional()
      .describe("Force the axis maximum instead of deriving it from the data."),
    locale: z
      .string()
      .optional()
      .describe(
        "BCP-47 locale for number formatting. Falls back to the provider/runtime.",
      ),
  }),
  example: {
    type: "data-chart",
    props: {
      chartType: "hbar",
      unit: "ms",
      data: [
        { label: "Backend", value: 6200 },
        { label: "Network", value: 1100 },
        { label: "Render", value: 350 },
      ],
    },
  },
};
