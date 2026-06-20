import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const patternCardMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "A responsive auto-fit grid of icon + title + description cards.",
  whenToUse:
    "Use to present a small set of related concepts, features, or options side by side as scannable cards — each with an icon, a title, and a short description. Reach for it when order does not matter and items are peers; prefer StepCards for an ordered procedure and Timeline for events over time.",
  schema: z.object({
    cards: z
      .array(
        z.object({
          icon: z
            .string()
            .optional()
            .describe(
              "Card glyph: an emoji, a single character, or an Iconify icon name, e.g. 'lucide:zap', or a bare name resolved by the theme.",
            ),
          title: z.string().describe("The card heading."),
          description: content()
            .optional()
            .describe("Optional supporting detail shown under the title."),
        }),
      )
      .min(1)
      .describe("The cards to display in the grid."),
    minColumn: z
      .number()
      .optional()
      .describe("Minimum column width in px before wrapping. Default: 220."),
  }),
  example: {
    type: "pattern-card",
    props: {
      cards: [
        {
          icon: "⚡",
          title: "Cache",
          description: "Serve repeated work from memory instead of recomputing.",
        },
        {
          icon: "🗜️",
          title: "Compress",
          description: "Send fewer bytes over the wire with gzip or brotli.",
        },
        {
          icon: "🪄",
          title: "Defer",
          description: "Load non-critical assets after first paint.",
        },
      ],
    },
  },
};
