import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const quizMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "Single-question multiple-choice with instant per-option feedback and an optional celebration.",
  whenToUse:
    "Reach for this to check understanding right after teaching a concept, when the learner should commit to one answer and get immediate, per-option explanations. Prefer it over PredictOutput when the question is conceptual rather than 'what does this code print', and over Flashcards when you want a graded right/wrong moment instead of self-paced recall.",
  schema: z.object({
    question: z
      .string()
      .describe(
        "The question prompt. Place the check where it earns its keep: most checks follow the thing they taught (the reader needs the win), but at least one in a guide should reach back two or three modules — a check sitting directly under its teaching measures working memory, not retrieval.",
      ),
    options: z
      .array(
        z.object({
          text: z.string().describe("The answer text shown to the learner."),
          correct: z
            .boolean()
            .optional()
            .describe("Marks the correct option (exactly one should be true)."),
          feedback: z
            .string()
            .optional()
            .describe(
              "Explanation revealed after the learner answers. Write it BEFORE the question — if the explanation is thin the question is not worth asking. On a WRONG option, name the belief behind it ('you are reading [] as empty, therefore falsy — but every object is truthy') rather than restating the right answer: 'incorrect' spends the reader's attention and returns nothing.",
            ),
        }),
      )
      .min(2)
      .describe(
        "Answer options; exactly one should set correct: true. Keep them within a few words of the same length — when the correct answer is the long hedged one and the decoys are curt, readers pick on shape instead of meaning and the check stops measuring anything. Three real options beat four with a decoy: if you cannot name why someone would pick an option, delete it.",
      ),
    scenario: z
      .string()
      .optional()
      .describe("Optional context block shown above the question."),
    celebrate: z
      .boolean()
      .optional()
      .describe("Fire confetti on a correct answer. Default: true."),
    allowRetry: z
      .boolean()
      .optional()
      .describe("Allow retrying after answering. Default: true."),
    confidence: z
      .boolean()
      .optional()
      .describe(
        "Ask the reader how sure they are BEFORE they answer, then read the calibration back. Turn it on for the two or three checks in a guide where a misconception is likely — never on all of them (asked constantly it becomes a tic). Confident-and-wrong is the one outcome a plain check cannot surface, and the one an explanation exists to repair.",
      ),
  }),
  example: {
    type: "quiz",
    props: {
      question: "An 8-second page load most likely comes from…",
      options: [
        { text: "Complex CSS", feedback: "Rarely the cause of multi-second loads." },
        {
          text: "Slow backend / queries",
          correct: true,
          feedback: "Right — backend bottlenecks dominate page load time.",
        },
        { text: "A slow framework", feedback: "Not by itself." },
      ],
    },
  },
};
