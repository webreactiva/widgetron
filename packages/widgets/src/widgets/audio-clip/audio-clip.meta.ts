import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const audioClipMeta: WidgetMeta = {
  version: 1,
  category: "Media",
  summary:
    "A custom audio player with an optional synced, clickable karaoke transcript.",
  whenToUse:
    "Use to embed a piece of audio — a clip, an interview, a pronunciation example — with custom play/seek controls and, optionally, a transcript that highlights and auto-scrolls each cue as it plays and lets the learner click a line to jump there. Reach for it for sound-only material; prefer VideoClip when there is moving picture to show. Provide a transcript inline via `transcript`, or fetch one (.json/.vtt/.srt) via `transcriptSrc`. With `start`/`end` it plays only that fragment of `src` (an episode file can serve many clips); transcript timestamps are then fragment-relative — use the fragment's cut .srt, not the episode's.",
  schema: z.object({
    src: z.string().describe("Audio source URL (required)."),
    start: z
      .number()
      .optional()
      .describe(
        "Fragment window start (seconds in src). Playback begins here and every time shown is fragment-relative — one long episode file can serve many clips.",
      ),
    end: z
      .number()
      .optional()
      .describe("Fragment window end (seconds in src). Playback pauses here."),
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
    storageKey: z
      .string()
      .optional()
      .describe(
        "Stable key for persisting the resume position across visits. Defaults to `src`; set it when the URL isn't stable (e.g. a signed CDN link).",
      ),
    sticky: z
      .boolean()
      .optional()
      .describe(
        "Show a sticky corner mini-player once playback starts and the main player scrolls out of view. Default: true.",
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
