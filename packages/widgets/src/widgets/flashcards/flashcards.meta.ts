import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const flashcardsMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "A flip deck for active recall: reveal each card's answer, then self-grade it.",
  whenToUse:
    "Reach for this when the goal is self-paced memorization — terms, definitions, syntax, shortcuts — where the learner tests their own recall and judges whether they knew it, with no single graded verdict. Prefer Flashcards over Quiz when you want low-stakes repetition the learner controls rather than a right/wrong check, and over FillInTheBlanks when items are discrete prompt/answer pairs rather than a sentence to complete.",
  schema: z.object({
    cards: z
      .array(
        z.object({
          front: content().describe("The prompt side of the card (term, question, or cue)."),
          back: content().describe("The answer side revealed after flipping."),
        }),
      )
      .min(1)
      .describe("The deck of flip cards, shown one at a time."),
  }),
  example: {
    type: "flashcards",
    props: {
      cards: [
        { front: "What does CSS `position: sticky` do?", back: "Acts like relative until a scroll threshold, then sticks like fixed within its container." },
        { front: "What does `git switch -c` do?", back: "Creates a new branch and switches to it." },
      ],
    },
  },
};
