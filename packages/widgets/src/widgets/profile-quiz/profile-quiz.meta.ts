import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const profileQuizMeta: WidgetMeta = {
  version: 1,
  category: "AI & personalization",
  summary:
    "A short onboarding quiz (one question at a time) that writes a reader profile used to personalize the rest of the page.",
  whenToUse:
    "Place this near the top of a personalized course to capture 2-3 onboarding facts about the reader (level, role, goal) and write them into the surrounding profile. It is the WRITER half of the profile family: each question's `id` and each option's `value` become the keys/values that ProfileGate later reads via its `when` condition. Usually set up through Storyline's `profile` prop (which supplies the ProfileProvider); add ProfileGate blocks downstream to branch on the answers. Prefer plain Quiz when you want to grade understanding rather than tailor the page.",
  schema: z.object({
    questions: z
      .array(
        z.object({
          id: z
            .string()
            .describe(
              "Stable key written into the profile; reference it in ProfileGate `when` conditions.",
            ),
          question: z.string().describe("The question prompt."),
          options: z
            .array(
              z.object({
                value: z
                  .string()
                  .describe(
                    "Stored in the profile under this question's id; matched by ProfileGate.",
                  ),
                label: z.string().describe("The option text shown to the reader."),
                description: z
                  .string()
                  .optional()
                  .describe("Optional secondary line under the option label."),
              }),
            )
            .min(2)
            .describe("The selectable answers for this question."),
        }),
      )
      .min(1)
      .describe("The 2-3 onboarding questions, asked one at a time, in order."),
    intro: z
      .string()
      .optional()
      .describe("Optional intro line shown above the first question."),
  }),
  example: {
    type: "profile-quiz",
    props: {
      intro: "Two quick questions so we can tailor this lesson to you.",
      questions: [
        {
          id: "level",
          question: "How comfortable are you with the command line?",
          options: [
            {
              value: "beginner",
              label: "New to it",
              description: "I mostly use a GUI.",
            },
            {
              value: "advanced",
              label: "Very comfortable",
              description: "I live in the terminal.",
            },
          ],
        },
      ],
    },
  },
};
