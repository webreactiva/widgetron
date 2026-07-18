import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const kineticHeadlineMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "A display headline that reveals a word at a time as it scrolls into view — pure CSS scroll-driven motion, static under reduced motion.",
  whenToUse:
    "Use to open a module or mark a beat with a headline that earns attention as the reader scrolls to it — the words rise in one by one. Best for short, punchy lines (a claim, a section title, the episode's thesis). It is display art: plain text only, no markdown or glossary terms — reach for `section-header` when the heading needs an eyebrow, icon, description or rich text, and `prose` for a normal heading in running copy. Don't stack several in a row; the reveal works because it's occasional.",
  schema: z.object({
    text: z
      .string()
      .describe("The headline. Split on whitespace; each word reveals in turn."),
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
    type: "kinetic-headline",
    props: {
      text: "Half of what we call productivity is smoke",
      as: "h2",
    },
  },
};
