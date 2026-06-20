import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const videoClipMeta: WidgetMeta = {
  version: 1,
  category: "Media",
  summary:
    "A responsive, privacy-friendly video embed (native file, or click-to-load YouTube / Vimeo).",
  whenToUse:
    "Use to embed a video — a native file via `src`, or a YouTube / Vimeo clip via `youtube` / `vimeo` ids, where the third-party iframe loads only after the learner clicks the poster (no tracking until opt-in). Reach for it whenever moving picture carries the teaching; prefer AudioClip for sound-only material. Supply exactly one source (src, youtube, or vimeo).",
  schema: z.object({
    src: z
      .string()
      .optional()
      .describe(
        "Direct video file URL. Mutually exclusive with youtube / vimeo.",
      ),
    youtube: z
      .string()
      .optional()
      .describe("YouTube video id for a privacy-friendly nocookie embed."),
    vimeo: z
      .string()
      .optional()
      .describe("Vimeo video id for a dnt (do-not-track) embed."),
    poster: z
      .string()
      .optional()
      .describe(
        "Poster / cover image URL. For iframe embeds, doubles as the click-to-load thumbnail.",
      ),
    title: z
      .string()
      .optional()
      .describe("Accessible title (iframe title / video aria-label)."),
    aspect: z
      .string()
      .optional()
      .describe("CSS aspect ratio of the frame, e.g. '16/9'. Default: '16/9'."),
  }),
  example: {
    type: "video-clip",
    props: {
      youtube: "dQw4w9WgXcQ",
      title: "How HTTP requests work",
      poster: "https://example.com/http-thumb.jpg",
    },
  },
};
