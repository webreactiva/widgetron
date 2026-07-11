import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { nodeSchema } from "@/lib/widget-meta";

export const storylineMeta: WidgetMeta = {
  version: 1,
  category: "Compositions",
  summary:
    "The dispensa reading composition: a scroll-driven document of modules that assembles any widgets into a course.",
  whenToUse:
    "This is the top-level container for generating a whole dispensa/lesson. Use it to sequence many widgets into modules the reader scrolls through (progress bar, module dots with title tooltips, reveal-on-scroll). Put atomic widgets in each module's `screens`. Add `glossary` for [[term]] tooltips across the course, `profile` to personalize it (with ProfileQuiz/ProfileGate screens), and `storageKey` so the course remembers the reading position and offers to resume on the next visit. Add `challenge` for a themed progress meter, or `lives` to turn the guide into a soft game (the 'game' format): wrong scored answers cost hearts and a game-over withholds the finale reward until the reader wins a life back. Prefer Scrollytelling instead when you need a single graphic that stays pinned while text scrolls past it.",
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
    minutes: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        "Total reading-time estimate for the cover badge, in minutes. Story Studio injects it from the document's word count at resolve time; without it the widget measures the rendered text (which undercounts gated guides).",
      ),
    modules: z
      .array(
        z.object({
          title: z.string().describe("Module heading."),
          subtitle: z.string().optional().describe("Short module intro line."),
          screens: z
            .array(nodeSchema)
            .describe("The widget nodes shown in this module, top to bottom."),
          emoji: z
            .string()
            .optional()
            .describe(
              "Stamp for the module — a single emoji that matches its theme. The reader earns it on completing the module (shown in the navigation, collected in the finale).",
            ),
          outro: z
            .string()
            .optional()
            .describe(
              "One-line send-off with voice, shown at the module's end after a 'Module N ✓' seal — close the module's idea and nudge into the next one. Supports inline markdown.",
            ),
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
    outro: nodeSchema
      .optional()
      .describe(
        "Closing widget node (usually the CTA) rendered after the built-in completion finale, so the reader is celebrated before being pitched.",
      ),
    celebrate: z
      .boolean()
      .optional()
      .describe(
        "Fire a confetti burst the first time the reader scrolls to the end. Default: true.",
      ),
    challenge: z
      .string()
      .optional()
      .describe(
        "Challenge mode (opt-in): a short themed label naming the guide's own progress narrative (e.g. 'Tu delta de garantías'). Shows a pinned meter that fills as the reader beats interactions. Take the theme from the content's central metaphor; never blocks reading.",
      ),
    lives: z
      .object({
        total: z
          .number()
          .int()
          .min(1)
          .describe("Starting lives (hearts). Keep it below the guide's number of scored challenges so a game-over is reachable."),
        label: z
          .string()
          .optional()
          .describe("Themed name for the lives meter, e.g. 'Vidas' or 'Intentos'."),
      })
      .optional()
      .describe(
        "Game mode (opt-in — the signature of the 'game' format): the reader loses a life on each wrong scored answer and wins one back on a correct one. At 0 lives the finale withholds its reward (a game-over screen invites a retry, confetti waits) while the prose stays readable. Session-scoped; scroll variant only.",
      ),
    gated: z
      .boolean()
      .optional()
      .describe(
        "Gated progression (scroll variant): each module after the first stays locked — only its header previews — until the reader answers a scored question in the module before it. Answering the previous module's reto unlocks the next. Requires a quiz in every non-final module or the reader soft-locks. Session-scoped.",
      ),
    variant: z
      .enum(["scroll", "thread"])
      .optional()
      .describe(
        "Presentation: 'scroll' (default) is the scroll-driven document; 'thread' is an experimental screen-by-screen tap-through of the same modules.",
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
          emoji: "🌐",
          outro: "You can now follow a request end to end — next, we make it fast.",
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
