import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const stickyPanMeta: WidgetMeta = {
  version: 1,
  category: "Compositions",
  summary:
    "A horizontal filmstrip that pans sideways as the reader scrolls down — pins to the viewport; degrades to a swipeable strip under reduced motion or without support.",
  whenToUse:
    "Use to walk the reader through an ordered sequence that reads left-to-right — steps of a process, a before→after→result arc, a small gallery with captions — turning vertical scroll into a horizontal pan. 3–6 panels; each can be an image, text, or both. Prefer `scrollytelling` when a single graphic must stay put while text explains it, `timeline` for dated events in a vertical list, and `step-cards` for a static grid of steps. At most one per guide — the pin hijacks the scroll, so it's a set piece.",
  schema: z.object({
    panels: z
      .array(
        z.object({
          image: z
            .string()
            .optional()
            .describe("Real image URL for the panel background — never invented."),
          alt: z.string().optional(),
          focal: z
            .string()
            .optional()
            .describe("object-position for the image, e.g. '50% 30%'."),
          content: z.string().optional().describe("Text laid over / inside the panel."),
        }),
      )
      .min(2)
      .describe("The panels, left-to-right; 3–6 is the sweet spot."),
  }),
  example: {
    type: "sticky-pan",
    props: {
      panels: [
        { content: "**Monday.** The board is full of tickets that *sound* like work." },
        { content: "**Wednesday.** Half are still 'in progress' — nothing shipped." },
        { content: "**Friday.** One thing reached a user. That's the number that counted." },
      ],
    },
  },
};
