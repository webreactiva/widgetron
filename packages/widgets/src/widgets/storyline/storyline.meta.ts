import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { nodeSchema } from "@/lib/widget-meta";

export const storylineMeta: WidgetMeta = {
  version: 1,
  category: "Compositions",
  summary:
    "The dispensa reading composition: a scroll-driven document of modules that assembles any widgets into a course.",
  whenToUse:
    "This is the top-level container for generating a whole dispensa/lesson. Use it to sequence many widgets into modules the reader scrolls through (progress bar, module dots with title tooltips, reveal-on-scroll). Put atomic widgets in each module's `screens`. Add `glossary` for [[term]] tooltips across the course, `profile` to personalize it (with ProfileQuiz/ProfileGate screens), and `storageKey` so the course remembers the reading position and offers to resume on the next visit. Prefer Scrollytelling instead when you need a single graphic that stays pinned while text scrolls past it.",
  schema: z.object({
    title: z
      .string()
      .optional()
      .describe(
        "Course title, rendered as a cover section before the first module. Don't repeat it as a section-header screen.",
      ),
    description: z
      .string()
      .optional()
      .describe("Cover lead line under the title."),
    modules: z
      .array(
        z.object({
          title: z.string().describe("Module heading."),
          subtitle: z.string().optional().describe("Short module intro line."),
          screens: z
            .array(nodeSchema)
            .describe("The widget nodes shown in this module, top to bottom."),
        }),
      )
      .min(1)
      .describe("The modules the reader scrolls through, in order."),
    numbered: z
      .boolean()
      .optional()
      .describe("Show the 'Module 01' eyebrow above each title. Default: true."),
    glossary: z
      .record(z.string(), z.string())
      .optional()
      .describe("term → definition for [[term]] text anywhere in the course."),
    profile: z
      .union([z.boolean(), z.string()])
      .optional()
      .describe(
        "Enable reader personalization. Pass a string to persist the profile under that localStorage key, or true for in-memory only.",
      ),
    storageKey: z
      .string()
      .optional()
      .describe(
        "Persist the reading position in localStorage under this key; on return the course offers to resume where the reader left off. Use the document slug.",
      ),
  }),
  example: {
    type: "storyline",
    props: {
      glossary: {
        spec: "A written description of intent — what to build and why — before any code.",
      },
      modules: [
        {
          title: "The round trip",
          subtitle: "What happens between Enter and the page.",
          screens: [
            {
              type: "prose",
              props: {
                children:
                  "Every request travels to a server and back. Writing the [[spec]] first keeps that journey intentional.",
              },
            },
            {
              type: "quiz",
              props: {
                question: "What most often makes a page slow?",
                options: [
                  { text: "CSS", feedback: "Rarely seconds." },
                  { text: "Backend latency", correct: true, feedback: "Exactly." },
                ],
              },
            },
          ],
        },
      ],
    },
  },
};
