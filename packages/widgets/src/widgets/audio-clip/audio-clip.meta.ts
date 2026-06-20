import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const audioClipMeta: WidgetMeta = {
  version: 1,
  category: "Media",
  summary:
    "A custom audio player with an optional synced, clickable karaoke transcript.",
  whenToUse:
    "Use to embed a piece of audio — a clip, an interview, a pronunciation example — with custom play/seek controls and, optionally, a transcript that highlights and auto-scrolls each cue as it plays and lets the learner click a line to jump there. Reach for it for sound-only material; prefer VideoClip when there is moving picture to show. Provide a transcript inline via `transcript`, or fetch one (.json/.vtt/.srt) via `transcriptSrc`.",
  schema: z.object({
    src: z.string().describe("Audio source URL (required)."),
    title: z.string().optional().describe("Optional title shown above the player."),
    poster: z.string().optional().describe("Optional cover image URL."),
    transcript: z
      .array(
        z.object({
          start: z.number().describe("Cue start time in seconds."),
          end: z.number().optional().describe("Optional cue end time in seconds."),
          text: z.string().describe("The spoken text for this cue."),
        }),
      )
      .optional()
      .describe(
        "Inline transcript cues (seconds). Takes priority over transcriptSrc when both are present.",
      ),
    transcriptSrc: z
      .string()
      .optional()
      .describe(
        "URL to a .json / .vtt / .srt transcript fetched on mount (used when no inline transcript is given).",
      ),
  }),
  example: {
    type: "audio-clip",
    props: {
      src: "https://example.com/lesson-intro.mp3",
      title: "Lesson intro",
      transcript: [
        { start: 0, end: 4, text: "Welcome to the lesson." },
        { start: 4, end: 9, text: "Today we look at how the web loads a page." },
      ],
    },
  },
};
