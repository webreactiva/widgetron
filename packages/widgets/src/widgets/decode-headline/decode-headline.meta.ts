import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const decodeHeadlineMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "A headline that arrives scrambled and resolves character by character when it scrolls into view — decrypting-terminal effect, static under reduced motion.",
  whenToUse:
    "Use for a headline you want to land with a jolt of suspense — a reveal, a punchline, the name of the villain — where the text 'decrypting' into place adds tension. Monospace by nature. Plain text only (like `kinetic-headline`). Reach for `kinetic-headline` when you want a calmer word-by-word rise, and `section-header` for a normal titled heading. Use it sparingly — the effect is a special move, and repeating it makes it a gimmick.",
  schema: z.object({
    text: z
      .string()
      .describe("The headline. It scrambles, then resolves character by character."),
    as: z
      .enum(["h1", "h2", "h3", "p"])
      .optional()
      .describe("Heading level / size. Default 'h2'."),
    align: z
      .enum(["left", "center"])
      .optional()
      .describe("Text alignment. Default 'left'."),
  }),
  example: {
    type: "decode-headline",
    props: {
      text: "The boss was the hype all along",
      as: "h2",
    },
  },
};
