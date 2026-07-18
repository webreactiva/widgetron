import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const interviewTranscriptMeta: WidgetMeta = {
  version: 1,
  category: "Media",
  summary:
    "A two-voice interview exchange laid out editorially, with per-speaker identity and an optional audio clip that lights up the turn being spoken.",
  whenToUse:
    "Use in interview episodes for the exchange worth reading whole (30–90 seconds): a question and its full answer, a back-and-forth with rhythm. Speaker identity is the transversal pattern — host renders in the primary color, guest in `--brand-2` — the same code quote and qa-card use. Editorial, not chat: prefer group-chat for casual bubble-style conversations. Turn `start` times share the source timeline with `clip.start`/`clip.end` (seconds in the episode file); with a clip, the turn being spoken highlights and clicking a turn jumps the audio there. For a single quote prefer quote; for question-as-hook prefer qa-card.",
  schema: z.object({
    speakers: z
      .object({
        host: z.object({
          name: z.string().describe("Host name."),
          role: z.string().optional().describe("e.g. 'Host'."),
        }),
        guest: z.object({
          name: z.string().describe("Guest name."),
          role: z.string().optional().describe("e.g. 'Staff engineer'."),
        }),
      })
      .describe("The two voices (required)."),
    turns: z
      .array(
        z.object({
          speaker: z.enum(["host", "guest"]).describe("Whose turn this is."),
          start: z
            .number()
            .optional()
            .describe(
              "Turn start, in seconds of the source timeline (same clock as clip.start).",
            ),
          text: z.string().describe("What was said."),
        }),
      )
      .describe("The exchange, in reading order (required)."),
    clip: z
      .object({
        src: z.string().describe("Audio URL — the full episode file works."),
        start: z.number().optional().describe("Fragment start (seconds in src)."),
        end: z.number().optional().describe("Fragment end (seconds in src)."),
      })
      .optional()
      .describe("Audio of the exchange. Omit for a purely readable transcript."),
  }),
  example: {
    type: "interview-transcript",
    props: {
      speakers: {
        host: { name: "Daniel Primo", role: "Host" },
        guest: { name: "Laura G.", role: "Staff engineer" },
      },
      turns: [
        {
          speaker: "host",
          start: 1102,
          text: "How do you spot smoke in a job offer?",
        },
        {
          speaker: "guest",
          start: 1106,
          text: "When the title has more words than the description of what you'll actually do. Always ask about the last deploy: the date can't lie.",
        },
      ],
      clip: {
        src: "https://example.com/episode-300.mp3",
        start: 1102,
        end: 1144,
      },
    },
  },
};
