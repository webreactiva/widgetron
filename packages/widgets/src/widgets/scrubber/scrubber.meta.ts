import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const scrubberMeta: WidgetMeta = {
  version: 1,
  category: "Reactive",
  summary:
    "A control-panel explorable explanation: labeled sliders for inputs and live-computed outputs shown as numbers and bars.",
  whenToUse:
    "Reach for this when you want the learner to explore how several inputs combine — a 'what-if' calculator with named sliders, formatted results, and proportion bars. Prefer it over TangleText when there are multiple variables or the relationship deserves an explicit panel rather than inline prose, and when seeing magnitudes as bars helps. Use TangleText instead when a single number belongs naturally inside a sentence.",
  schema: z.object({
    variables: z
      .record(
        z.string(),
        z.object({
          label: z.string().describe("Slider label shown to the learner."),
          value: z.number().describe("Initial value."),
          min: z.number().describe("Minimum slider value."),
          max: z.number().describe("Maximum slider value."),
          step: z.number().optional().describe("Slider increment. Default: 1."),
          unit: z.string().optional().describe("Unit appended to the displayed value, e.g. 'ms'."),
          format: z.string().optional().describe("Number format hint, applied via the locale."),
        }),
      )
      .describe("Input variables keyed by the name used in output formulas."),
    outputs: z
      .record(
        z.string(),
        z.object({
          label: z.string().describe("Output label shown to the learner."),
          formula: z
            .string()
            .describe("Arithmetic expression over the variable keys, evaluated live, e.g. 'rps * 60'."),
          format: z.string().optional().describe("Number format hint, applied via the locale."),
          unit: z.string().optional().describe("Unit appended to the computed value."),
          max: z
            .number()
            .optional()
            .describe("Full-scale value for the proportion bar. Omit to hide the bar and show only the number."),
        }),
      )
      .describe("Computed outputs keyed by name; each may render a proportion bar."),
    note: content().optional().describe("Optional footnote shown below the panel."),
    locale: z
      .string()
      .optional()
      .describe("BCP-47 locale for number formatting; falls back to the provider/runtime."),
  }),
  example: {
    type: "scrubber",
    props: {
      variables: {
        users: { label: "Concurrent users", value: 100, min: 0, max: 1000, step: 10 },
        rps: { label: "Requests / user / s", value: 2, min: 1, max: 10 },
      },
      outputs: {
        load: {
          label: "Total requests / s",
          formula: "users * rps",
          max: 10000,
          unit: " req/s",
        },
      },
      note: "Drag the sliders to see how load scales.",
    },
  },
};
