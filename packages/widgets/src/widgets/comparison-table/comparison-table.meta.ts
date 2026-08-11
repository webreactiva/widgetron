import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const comparisonTableMeta: WidgetMeta = {
  version: 1,
  category: "Diagrams & data",
  summary:
    "A criteria × options matrix — booleans as check/cross, values verbatim, one column highlightable as the recommendation.",
  whenToUse:
    "Reach for this when the episode weighs SEVERAL OPTIONS ACROSS THE SAME CRITERIA — tools, plans, frameworks, approaches — and the reader's takeaway is the trade-off, not one number. Prefer ComparisonTable over the `versus` Infographic when there are more than two options or the cells carry real values; over DataChart when the cells are features and verdicts rather than magnitudes; and over DecisionTree when the reader should see everything at once instead of walking one path.",
  schema: z.object({
    columns: z
      .array(
        z.object({
          label: content().describe("Column heading — the option being compared."),
          note: optionalContent().describe(
            "Short qualifier under the heading (price, version, verdict…).",
          ),
          highlight: z
            .boolean()
            .optional()
            .describe("Tint this column as the recommended option."),
        }),
      )
      .min(2)
      .describe("The options being compared, left to right."),
    rows: z
      .array(
        z.object({
          label: content().describe("The criterion being compared."),
          hint: optionalContent().describe("Detail line under the criterion."),
          cells: z
            .array(z.union([z.boolean(), z.string(), z.null()]))
            .describe(
              "One cell per column, in the same order: true/false render as check/cross, strings verbatim, null as '—'.",
            ),
        }),
      )
      .min(1)
      .describe("One row per criterion; `cells` must line up with `columns`."),
    caption: optionalContent().describe(
      "Short sentence describing what the table compares.",
    ),
  }),
  example: {
    type: "comparison-table",
    props: {
      caption: "Picking a package manager for a monorepo.",
      columns: [
        { label: "npm", note: "bundled with Node" },
        { label: "pnpm", note: "workspaces first", highlight: true },
        { label: "yarn", note: "berry" },
      ],
      rows: [
        { label: "Disk usage", cells: ["High", "Lowest — one global store", "Medium"] },
        { label: "Workspaces", cells: [true, true, true] },
        { label: "Strict dependencies", cells: [false, true, false] },
      ],
    },
  },
};
