import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const profileProviderMeta: WidgetMeta = {
  version: 1,
  category: "AI & personalization",
  summary:
    "Holds the reader's profile for everything underneath it (ProfileQuiz writes it, ProfileGate reads it).",
  whenToUse:
    "The context boundary for the profile family — wrap the section that contains a ProfileQuiz and its ProfileGate blocks so they share one profile, mirroring how GlossaryProvider shares terms. Set `storageKey` to persist the reader's choices to localStorage so the tailored view survives reloads; omit it for in-memory previews. You usually do NOT add this by hand: Storyline's `profile` prop already wraps the course in a ProfileProvider (passing a string sets the storageKey). Reach for it directly only when composing personalization outside a Storyline.",
  schema: z.object({
    storageKey: z
      .string()
      .optional()
      .describe(
        "localStorage key for persistence. Give each dispensa its own key so profiles don't collide. Omit to keep the profile in memory only.",
      ),
    children: content().describe(
      "The content that shares this profile — typically a ProfileQuiz plus ProfileGate blocks.",
    ),
  }),
  example: {
    type: "profile-provider",
    props: {
      storageKey: "dispensa:cli-basics",
      children: [
        {
          type: "profile-quiz",
          props: {
            questions: [
              {
                id: "level",
                question: "How comfortable are you with the command line?",
                options: [
                  { value: "beginner", label: "New to it" },
                  { value: "advanced", label: "Very comfortable" },
                ],
              },
            ],
          },
        },
        {
          type: "profile-gate",
          props: {
            when: { level: ["advanced"] },
            children: "Skip ahead — you already know the basics.",
          },
        },
      ],
    },
  },
};
