import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const calloutBoxMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "Highlights a piece of information with an intent (insight, context, or caution).",
  whenToUse:
    "Use to make one idea stand out from the surrounding prose — an 'aha' insight, a piece of 'info' context, or a 'warning' caveat. Reach for it when a sentence deserves emphasis but doesn't need interaction; prefer Quiz or PredictOutput when you want the learner to act, and Prose for ordinary running text.",
  schema: z.object({
    variant: z
      .enum(["aha", "info", "warning"])
      .optional()
      .describe("Visual intent: aha=insight, info=context, warning=caution. Default: aha."),
    label: z
      .string()
      .optional()
      .describe("Override the uppercase eyebrow (defaults per variant)."),
    icon: z
      .boolean()
      .optional()
      .describe("Show the leading icon. Default: true."),
    children: content().describe(
      "The callout body (there is no separate title — lead with a bold sentence inside the body if you want a heading).",
    ),
  }),
  example: {
    type: "callout-box",
    props: {
      variant: "aha",
      children:
        "Latency lives in the round trip. Most slow page loads aren't the framework — they're what travels over the network and how fast the server responds.",
    },
  },
};
