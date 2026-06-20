import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const glossaryTermMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "An inline term with a dotted underline that reveals its definition in a tooltip.",
  whenToUse:
    "Use to gloss a single jargon word in place, giving the reader an on-demand definition without breaking the flow of the sentence. Reach for it when you are composing content as nested nodes and want one specific term tipped, or when you need an inline `definition` that isn't in the shared glossary. Prefer GlossaryText when you have a whole paragraph and want every `[[term]]` resolved automatically against the Storyline/GlossaryProvider glossary, rather than wiring up terms one by one.",
  schema: z.object({
    term: z.string().describe("The visible term text shown inline."),
    definition: z
      .string()
      .optional()
      .describe(
        "Inline definition shown in the tooltip; if omitted, it is looked up by `name` in the surrounding glossary.",
      ),
    name: z
      .string()
      .optional()
      .describe(
        "Key to look up in the glossary provider. Defaults to `term`. Use it when the visible text differs from the glossary key.",
      ),
  }),
  example: {
    type: "glossary-term",
    props: {
      term: "idempotent",
      definition:
        "An operation that produces the same result no matter how many times you run it.",
    },
  },
};
