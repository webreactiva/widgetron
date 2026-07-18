import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const qaCardMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "The question as the hook, the answer as the reward — a reveal card for one round question→answer from an interview.",
  whenToUse:
    "Use for a question with a well-rounded answer from an interview episode — the question hooks, the reader chooses to reveal, the answer pays off with the answerer's signature (monogram in `--brand-2`, name, minute). Works with no audio at all; add `clip` so the revealed answer plays in the original voice. Prefer interview-transcript when the exchange deserves reading whole, and quote when there is no question to hold back.",
  schema: z.object({
    question: z.string().describe("The question — the hook (required)."),
    answer: z.string().describe("The answer — revealed on demand (required)."),
    askedBy: z
      .string()
      .optional()
      .describe("Who asked (name). Renders as a host-colored monogram."),
    answeredBy: z
      .string()
      .optional()
      .describe("Who answered (name). Renders as a guest-colored monogram."),
    answeredByRole: z
      .string()
      .optional()
      .describe("The answerer's role, e.g. 'Episode guest'."),
    timestamp: z
      .string()
      .optional()
      .describe("Episode moment, e.g. '19:12'."),
    clip: z
      .object({
        src: z.string().describe("Audio URL."),
        start: z.number().optional().describe("Fragment start (seconds in src)."),
        end: z.number().optional().describe("Fragment end (seconds in src)."),
        transcriptSrc: z
          .string()
          .optional()
          .describe("Fragment transcript URL (.srt/.vtt/.json)."),
      })
      .optional()
      .describe("Audio of the answered moment, played inline once revealed."),
  }),
  example: {
    type: "qa-card",
    props: {
      question: "How do you spot smoke in a job offer?",
      answer:
        "When the title has more words than the description of what you'll do. Always ask about the last deploy: **the date can't lie**.",
      askedBy: "Daniel Primo",
      answeredBy: "Laura G.",
      answeredByRole: "Episode guest",
      timestamp: "19:12",
    },
  },
};
