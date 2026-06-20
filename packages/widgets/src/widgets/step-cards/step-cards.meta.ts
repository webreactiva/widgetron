import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const stepCardsMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary: "An ordered sequence of numbered steps connected by a line.",
  whenToUse:
    "Use to lay out a procedure or recipe the learner should follow in order — numbered steps with short instructions. Reach for it when sequence matters and each step is an action to take; prefer Timeline when the items are events or milestones over time (and may expand for detail), and PatternCard for an unordered grid of concepts.",
  schema: z.object({
    steps: z
      .array(
        z.object({
          title: z.string().describe("The step's heading / instruction."),
          description: content()
            .optional()
            .describe("Optional supporting detail shown under the title."),
        }),
      )
      .min(1)
      .describe("The ordered steps, rendered in array order."),
    start: z
      .number()
      .optional()
      .describe("Start the visible numbering at this value. Default: 1."),
  }),
  example: {
    type: "step-cards",
    props: {
      steps: [
        {
          title: "Open the network tab",
          description: "DevTools → Network, then reload the page.",
        },
        {
          title: "Find the slowest request",
          description: "Sort by Time and look at the document request first.",
        },
        {
          title: "Read the waterfall",
          description: "Most of the bar is usually 'Waiting (TTFB)'.",
        },
      ],
    },
  },
};
