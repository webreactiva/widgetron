import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const tangleTextMeta: WidgetMeta = {
  version: 1,
  category: "Reactive",
  summary:
    "A reactive paragraph (Bret Victor's 'Tangle') whose underlined numbers are draggable and whose computed values recalculate live.",
  whenToUse:
    "Reach for this when a concept lives inside a sentence and you want the learner to feel how one number drives others — scrub an input in the prose and watch the dependent outputs update in place. Prefer it over Scrubber when the variables belong to a narrative claim ('if you ship {n} times a week…') rather than a control panel, and over a static CalloutBox when the relationship is quantitative and worth playing with. Keep the text short and conversational; use Scrubber instead when there are many inputs or you want labeled sliders and bars.",
  schema: z.object({
    text: z
      .string()
      .describe(
        "Prose containing `{varName}` placeholders (draggable variables) and `{=outName}` placeholders (computed outputs), e.g. 'Shipping {n} times costs {=total} hours.'",
      ),
    variables: z
      .record(
        z.string(),
        z.object({
          value: z.number().describe("Initial value."),
          min: z.number().describe("Minimum draggable value."),
          max: z.number().describe("Maximum draggable value."),
          step: z.number().optional().describe("Increment per step/arrow key. Default: 1."),
          format: z
            .string()
            .optional()
            .describe("Number format hint (e.g. for decimals/percent), applied via the locale."),
          prefix: z.string().optional().describe("Text shown before the number, e.g. '$'."),
          suffix: z.string().optional().describe("Text shown after the number, e.g. 'h'."),
        }),
      )
      .describe("Draggable variables keyed by the name used in `{varName}` placeholders."),
    outputs: z
      .record(
        z.string(),
        z.object({
          formula: z
            .string()
            .describe("Arithmetic expression over the variable keys, evaluated live, e.g. 'n * 8'."),
          format: z.string().optional().describe("Number format hint, applied via the locale."),
          prefix: z.string().optional().describe("Text shown before the computed number."),
          suffix: z.string().optional().describe("Text shown after the computed number."),
        }),
      )
      .optional()
      .describe("Computed outputs keyed by the name used in `{=outName}` placeholders."),
    note: content().optional().describe("Optional footnote shown below the prose."),
    locale: z
      .string()
      .optional()
      .describe("BCP-47 locale for number formatting; falls back to the provider/runtime."),
  }),
  example: {
    type: "tangle-text",
    props: {
      text: "If you deploy {deploys} times a week, that's about {=hours} hours of review.",
      variables: {
        deploys: { value: 3, min: 1, max: 20 },
      },
      outputs: {
        hours: { formula: "deploys * 0.5", suffix: "h" },
      },
      note: "Drag the underlined number to explore the trade-off.",
    },
  },
};
