import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const codeTranslationMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "Real code on one side, a numbered plain-language explanation on the other.",
  whenToUse:
    "The key widget for teaching code to non-technical or beginner readers: show a snippet and, beside it, a numbered list that says what each part does in plain words. Reach for it whenever the goal is to demystify a specific piece of code line by line; prefer Prose for general explanation that has no code, and PredictOutput when you want the learner to guess what the code does instead of being told.",
  schema: z.object({
    code: z
      .string()
      .describe(
        "The code to show on the left, rendered verbatim in a monospaced block.",
      ),
    translations: z
      .array(content())
      .min(1)
      .describe(
        "Plain-language explanation lines shown on the right; rendered as an auto-numbered list.",
      ),
    codeLabel: z
      .string()
      .optional()
      .describe("Heading over the code side. Default: 'Code'."),
    translationLabel: z
      .string()
      .optional()
      .describe(
        "Heading over the explanation side. Default: 'In plain words'.",
      ),
  }),
  example: {
    type: "code-translation",
    props: {
      code: "const res = await fetch('/api/users');\nconst users = await res.json();",
      translations: [
        "Ask the server for the list of users and wait for the reply.",
        "Turn the reply's text into a usable JavaScript array.",
      ],
    },
  },
};
