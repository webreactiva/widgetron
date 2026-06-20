import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const promptTemplateMeta: WidgetMeta = {
  version: 1,
  category: "AI & personalization",
  summary:
    "A copy-ready AI prompt with inline-editable {{slots}} and a copy button.",
  whenToUse:
    "Use whenever the lesson should hand the learner the exact prompt to run with an AI — turning theory into an immediately reusable artifact. Reach for it after explaining a technique, so they can edit the {{slots}}, copy, and paste it into their assistant. Prefer CodeTranslation when the goal is to explain code rather than to give a runnable prompt.",
  schema: z.object({
    template: z
      .string()
      .describe(
        "The prompt text. Wrap fill-in parts as {{slot name}} to make them inline-editable.",
      ),
    note: z
      .string()
      .optional()
      .describe("Optional helper note shown next to the copy button."),
  }),
  example: {
    type: "prompt-template",
    props: {
      template:
        "Act as a senior {{language}} engineer.\nReview the code below for {{focus}} and suggest concrete, minimal changes.\n\n{{paste your code here}}",
      note: "Tip: keep the role specific.",
    },
  },
};
