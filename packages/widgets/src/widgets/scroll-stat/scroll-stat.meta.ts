import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const scrollStatMeta: WidgetMeta = {
  version: 1,
  category: "Diagrams & data",
  summary:
    "A big metric that counts up from zero as it scrolls into view, with an optional meter bar — pure CSS, static under reduced motion.",
  whenToUse:
    "Use to land a single striking number the reader should feel — a percentage, a multiplier, a count (\"73% shipped nothing\", \"3× the meetings\"). The count-up rewards arriving at it. Whole numbers only. Set `meter` for a bar that fills alongside the count (with `max` when the value isn't already a 0–100 percentage). For several numbers compared against each other use `data-chart`; for a number woven into a sentence the reader can tweak use `tangle-text`; this is one hero figure standing alone.",
  schema: z.object({
    value: z
      .number()
      .describe("The number to land on (whole numbers only — it counts as an integer)."),
    label: z.string().describe("What the number means."),
    prefix: z.string().optional().describe("Rendered before the number, e.g. '$'."),
    suffix: z
      .string()
      .optional()
      .describe("Rendered after the number, e.g. '%', '×', 'k'."),
    meter: z
      .boolean()
      .optional()
      .describe("Show a bar that fills as the number counts. Default false."),
    max: z
      .number()
      .optional()
      .describe("Scale for the meter (fill = value / max). Default 100."),
    align: z
      .enum(["left", "center"])
      .optional()
      .describe("Alignment. Default 'left'."),
  }),
  example: {
    type: "scroll-stat",
    props: {
      value: 73,
      suffix: "%",
      label: "of the work that *looked* productive shipped **nothing**.",
      meter: true,
    },
  },
};
