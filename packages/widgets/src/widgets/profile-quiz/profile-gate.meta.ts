import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const profileGateMeta: WidgetMeta = {
  version: 1,
  category: "AI & personalization",
  summary:
    "Conditionally reveals its children based on the reader's profile (the composable `show_if`).",
  whenToUse:
    "Wrap any content that should only appear for certain readers — the beginner-only aside, the advanced deep-dive — and gate it with a `when` condition keyed on a ProfileQuiz question. It is the READER half of the profile family: `when` maps a ProfileQuiz question `id` to the option `value`s that unlock the block (e.g. `{ level: [\"beginner\"] }`). Content stays hidden until the ProfileQuiz has been answered and the profile matches; it is lenient on unanswered keys, so a partial profile never blanks the page. Relies on the ProfileProvider that Storyline's `profile` prop sets up. Use ProfileQuiz to WRITE the profile and ProfileGate to READ it; for non-personalized emphasis prefer CalloutBox.",
  schema: z.object({
    when: z
      .record(z.string(), z.array(z.string()))
      .describe(
        "Condition keyed by ProfileQuiz question id → accepted option values. Children show only when the profile matches every key, e.g. { level: [\"beginner\"] }.",
      ),
    children: content().describe("The content revealed when the profile matches."),
    fallback: content()
      .optional()
      .describe("Optional content shown while the gate is closed. Default: nothing."),
  }),
  example: {
    type: "profile-gate",
    props: {
      when: { level: ["beginner"] },
      children: {
        type: "callout-box",
        props: {
          variant: "info",
          children:
            "New to the terminal? Take it slow — every command here is safe to re-run if something looks off.",
        },
      },
    },
  },
};
