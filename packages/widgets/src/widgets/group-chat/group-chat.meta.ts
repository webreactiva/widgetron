import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const groupChatMeta: WidgetMeta = {
  version: 1,
  category: "Reactive",
  summary:
    "A paced chat thread: messages reveal one by one (with a typing indicator) so a flow reads as a dialogue between actors.",
  whenToUse:
    "Reach for this when a concept is best taught as a conversation — a back-and-forth between people, a client and a server speaking in turns, or a Socratic exchange that builds an idea message by message. Stepping or autoplaying the reveal lets the learner absorb one line before the next. Prefer it over FrameStepper when the actors are personas in a dialogue rather than components on a stage, and over a plain transcript when the pacing of the exchange is part of the lesson.",
  schema: z.object({
    messages: z
      .array(
        z.object({
          from: z.string().describe("The sender's name shown above the bubble."),
          text: content().describe("The message body (plain text or rich/nested content)."),
          side: z
            .enum(["left", "right"])
            .optional()
            .describe("Which side the bubble sits on: left=incoming, right=outgoing. Default: left."),
        }),
      )
      .min(1)
      .describe("Ordered messages revealed one at a time."),
    title: content().optional().describe("Optional header shown above the thread."),
    typingMs: z
      .number()
      .optional()
      .describe("Delay between messages while 'Play all' runs, in ms. Default: 900."),
  }),
  example: {
    type: "group-chat",
    props: {
      title: "Code review",
      messages: [
        { from: "Ana", text: "Why is this query so slow?", side: "left" },
        { from: "Beto", text: "It's missing an index on user_id.", side: "right" },
        { from: "Ana", text: "Got it — adding one now.", side: "left" },
      ],
    },
  },
};
