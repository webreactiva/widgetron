import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const fillInTheBlanksMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "Prose with inline dropdown blanks the reader fills in and then checks, graded inline.",
  whenToUse:
    "Reach for this to test recall in context — completing a sentence, code snippet, or definition where word choice and surrounding wording matter. Prefer FillInTheBlanks over Quiz when the answer belongs inside a sentence rather than as a standalone option, and over Flashcards when you want a graded check of multiple blanks at once instead of self-paced recall.",
  schema: z.object({
    text: z
      .string()
      .describe("Prose containing `{{blankId}}` placeholders, one per blank, e.g. 'CSS {{prop}} centers items.'"),
    blanks: z
      .record(
        z.string(),
        z.object({
          options: z
            .array(z.string())
            .min(2)
            .describe("Choices shown in the dropdown; `answer` must be one of these."),
          answer: z.string().describe("The correct choice. Must be present in `options`."),
        }),
      )
      .describe("The blanks keyed by the id used in `text`."),
  }),
  example: {
    type: "fill-in-the-blanks",
    props: {
      text: "In flexbox, {{justify}} aligns items along the main axis and {{align}} along the cross axis.",
      blanks: {
        justify: { options: ["justify-content", "align-items", "flex-wrap"], answer: "justify-content" },
        align: { options: ["justify-content", "align-items", "gap"], answer: "align-items" },
      },
    },
  },
};
