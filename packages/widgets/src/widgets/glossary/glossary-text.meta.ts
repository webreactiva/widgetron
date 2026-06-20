import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const glossaryTextMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "A paragraph of prose where every `[[term]]` marker becomes a glossary tooltip.",
  whenToUse:
    "This is the default way to write running prose inside a glossary-aware course: author plain text and wrap any jargon in `[[double brackets]]` to get an inline definition tooltip resolved from the Storyline/GlossaryProvider glossary. Reach for it over Prose whenever the surrounding lesson defines a glossary and you want terms auto-linked. Prefer a single GlossaryTerm when you need a one-off inline definition not in the shared glossary, and use this when the markers should be looked up centrally.",
  schema: z.object({
    text: z
      .string()
      .describe(
        "Prose text. Wrap any glossary term as `[[term]]`; each marker is replaced by a GlossaryTerm resolved from the surrounding glossary.",
      ),
  }),
  example: {
    type: "glossary-text",
    props: {
      text: "Every request travels to a server and back; writing the [[spec]] first keeps that round trip intentional.",
    },
  },
};
