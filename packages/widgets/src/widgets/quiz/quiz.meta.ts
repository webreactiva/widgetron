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
    question: z.string().describe("The question prompt."),
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
            .describe("Explanation revealed after the learner answers."),
        }),
      )
      .min(2)
      .describe("Answer options; exactly one should set correct: true."),
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
