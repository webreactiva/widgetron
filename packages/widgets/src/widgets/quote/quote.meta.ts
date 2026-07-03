import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const quoteMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "A highlighted pull-quote / testimonial that attributes words to a person.",
  whenToUse:
    "Use for a verbatim quote — a memorable line from a podcast episode, an expert's words, or a testimonial. Semantic figure/blockquote/figcaption with an accent from the theme. Reach for it when the words belong to someone and that attribution matters; prefer CalloutBox for editorial emphasis that is the author's own voice.",
  schema: z.object({
    children: content().describe("The quoted words."),
    attribution: z
      .string()
      .optional()
      .describe("Who said it (e.g. a person's name)."),
    role: z
      .string()
      .optional()
      .describe("Their role or context (e.g. 'Episode guest')."),
  }),
  example: {
    type: "quote",
    props: {
      children:
        "The best code is the code you never had to write. Delete before you optimize.",
      attribution: "Ada Lovelace",
      role: "Episode guest",
    },
  },
};
