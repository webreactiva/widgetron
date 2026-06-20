import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const predictOutputMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "Show code, ask the reader to predict what it prints, then reveal the actual output — with optional multiple-choice predictions.",
  whenToUse:
    "Reach for this to build mental models of execution — tracing loops, closures, async ordering, type coercion — where the learner must say what code outputs before seeing it. Prefer PredictOutput over Quiz when the question is specifically 'what does this code print' and the code block is central, and over SpotTheBug when the code is correct and the skill is tracing behavior rather than finding a defect.",
  schema: z.object({
    code: content().describe("The code to study. A plain string renders verbatim in a <pre>."),
    output: content().describe("The ACTUAL program output, revealed once the learner answers or reveals."),
    question: content()
      .optional()
      .describe("The prediction prompt. Defaults to 'What will this print?'."),
    options: z
      .array(
        z.object({
          text: content().describe("A predicted-output choice shown to the learner."),
          correct: z
            .boolean()
            .optional()
            .describe("Marks the correct prediction. Exactly one option should set this true."),
          feedback: content().optional().describe("Per-option explanation shown after answering."),
        }),
      )
      .optional()
      .describe("Optional multiple-choice predictions. When omitted, a 'Reveal output' button is shown instead."),
  }),
  example: {
    type: "predict-output",
    props: {
      code: "console.log([1, 2, 3].map(String));",
      output: "[ '1', '2', '3' ]",
      question: "What does this log?",
      options: [
        { text: "[1, 2, 3]", feedback: "No — String converts each element to text." },
        { text: "[ '1', '2', '3' ]", correct: true, feedback: "Right — map calls String on each number." },
        { text: "'123'", feedback: "map returns an array, not a joined string." },
      ],
    },
  },
};
