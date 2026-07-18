import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const episodePlayerMeta: WidgetMeta = {
  version: 1,
  category: "Media",
  summary:
    "The whole episode as a header player: cover, chapters that map the guide's modules, and a sticky mini-player to listen while reading.",
  whenToUse:
    "Use once per storyline, in the header or the closing: 'this guide comes from this episode — listen while you read it'. Chapters should map the guide's modules; clicking one jumps the audio there, and the sticky mini-player follows the reader down the page. The resume position persists per `storageKey` (required — picking a 40-minute episode back up is the star feature). For a single moment of audio prefer audio-clip; for the peak sentence prefer karaoke-stage.",
  schema: z.object({
    src: z.string().describe("Audio source URL — the full episode file (required)."),
    title: z.string().describe("Episode title (required)."),
    episode: z
      .string()
      .optional()
      .describe("Small label above the title, e.g. 'WR 300 · 42:17'."),
    poster: z.string().optional().describe("Optional cover image URL."),
    chapters: z
      .array(
        z.object({
          start: z.number().describe("Chapter start, in seconds of the episode."),
          title: z.string().describe("Chapter title."),
        }),
      )
      .optional()
      .describe(
        "Chapters — ideally one per module of the guide, so the reader can jump the audio to what they are reading.",
      ),
    storageKey: z
      .string()
      .describe(
        "Stable key for persisting the resume position (required). Use the episode slug, e.g. 'wr300'.",
      ),
    sticky: z
      .boolean()
      .optional()
      .describe("Sticky corner mini-player while reading. Default: true."),
  }),
  example: {
    type: "episode-player",
    props: {
      src: "https://example.com/episode-300.mp3",
      title: "Coding without smoke",
      episode: "WR 300",
      chapters: [
        { start: 0, title: "The word of the week" },
        { start: 214, title: "What smoke is" },
        { start: 887, title: "The antidote" },
      ],
      storageKey: "wr300",
    },
  },
};
