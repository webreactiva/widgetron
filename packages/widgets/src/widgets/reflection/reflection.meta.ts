import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const reflectionMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "An open question the reader answers in their own words; the answer persists on their device, and a perspective is revealed only after they commit.",
  whenToUse:
    "Reach for this when the valuable answer is the READER'S OWN — 'where does this happen in your codebase?', 'what would you do differently on Monday?', 'explain it to a teammate' — and no multiple choice would be honest. It is the one widget that asks for production instead of recognition, so use it once or twice per guide at the moments worth a pause, typically closing a module. Prefer Quiz when there IS a right answer, Flashcards for recall of a definition, and Checklist when the reader should act rather than write. Give `modelAnswer` only as a perspective to compare against, never as the correct solution.",
  schema: z.object({
    id: z
      .string()
      .describe("Stable id — persists the answer in localStorage on the reader's device."),
    prompt: content().describe("The question the reader answers in their own words."),
    hint: optionalContent().describe("What a good answer looks like."),
    placeholder: z
      .string()
      .optional()
      .describe("Placeholder shown inside the empty box."),
    minLength: z
      .number()
      .int()
      .optional()
      .describe("Characters needed before the answer can be saved. Default: 20."),
    modelAnswer: optionalContent().describe(
      "A perspective revealed only AFTER the reader saves — not 'the' answer. Its value is the reader seeing which pieces they left out, so make it concrete enough to compare against.",
    ),
    keys: z
      .array(
        z.object({
          idea: content().describe(
            "The idea, named for the reader — 'a low hit rate wastes the cache', not 'hit rate'.",
          ),
          match: z
            .string()
            .describe(
              "Case-insensitive regular expression deciding whether the answer touched the idea. Keep it GENEROUS and simple ('stale|invalidat|wrong') — you are checking whether an idea is present, not marking spelling, and an over-tight pattern tells an author's-eye-correct answer it missed the point. A plain alternation is all this needs: patterns over 200 characters, and any with nested quantifiers like '(a+)+', are refused and count as a miss, because a regex that backtracks exponentially would freeze the reader's tab mid-guide with no error.",
            ),
        }),
      )
      .optional()
      .describe(
        "Ideas the answer should touch. After the reader commits, each is shown hit or missed — that read-back is the whole value of writing an answer instead of recognising one. It never blocks, never scores and never leaves the device. 2–4 ideas; more turns a reflection into an exam.",
      ),
    persist: z
      .boolean()
      .optional()
      .describe("Persist the answer across visits. Default: true."),
    celebrate: z
      .boolean()
      .optional()
      .describe("Fire confetti the first time the reader commits. Default: true."),
  }),
  example: {
    type: "reflection",
    props: {
      id: "reflection-error-handling",
      prompt: "Where in your own project does an error get swallowed silently?",
      hint: "One concrete file or function is worth more than a general answer.",
      modelAnswer:
        "The usual suspects are `catch` blocks that only `console.log`, and `fetch` calls that never check `res.ok` — the failure shows up later, far from its cause.",
    },
  },
};
