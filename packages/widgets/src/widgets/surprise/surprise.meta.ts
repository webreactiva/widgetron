import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const surpriseMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "A reveal wrapper: keeps a payload hidden until the reader opens it, with a small reveal moment.",
  whenToUse:
    "Use for a delight moment mid- or end-of-guide — a bonus video, a quote, or a copy-ready prompt the reader unwraps on demand. The teaser builds anticipation; the payload fades in on click and stays open. Reach for it when the reveal itself is part of the reward; prefer CalloutBox when the point should always be visible, and put the surprise content (any widget) in `content`. Add `variants` (1-2 alternatives of the same spirit) so the reveal picks one at random — variable reward.",
  schema: z.object({
    content: content().describe(
      "The hidden payload, revealed on click — plain text or any nested widget node (e.g. a prompt-template, video-clip, or quote).",
    ),
    variants: z
      .array(content())
      .optional()
      .describe(
        "Extra payloads that join `content` in the reveal pool: the reader gets ONE at random — variable reward. Give 1–2 alternatives of the same spirit as `content`.",
      ),
    teaser: optionalContent().describe(
      "A short line shown while still closed, teasing what's inside.",
    ),
    defaultRevealed: z
      .boolean()
      .optional()
      .describe("Start already revealed (skip the closed state). Default: false."),
  }),
  example: {
    type: "surprise",
    props: {
      teaser: "You made it to the end. Here's a little something.",
      content: {
        type: "callout-box",
        props: {
          variant: "aha",
          children:
            "The best way to learn this is to teach it. Explain today's idea to one person before tomorrow.",
        },
      },
    },
  },
};
