import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const radialAudiogramMeta: WidgetMeta = {
  version: 1,
  category: "Media",
  summary:
    "A circular 'Headliner'-style audiogram: a ring of bars drawn from the clip's real peaks that animates with the audio, with the live caption beside it.",
  whenToUse:
    "Use for ONE hero audio moment you want to feel like a shareable podcast clip — a bold, circular audiogram that plays the audio while a ring of bars (the real waveform, from `peaks`) breathes with the loudness and fills as it plays, and the spoken line shows as a live caption. Needs real `peaks` (extract them server-side, e.g. with ffmpeg — CORS-proof, unlike decoding in the browser). Prefer AudioClip when you want a full transcript, seek bar, speed/volume controls or a sticky mini-player; reach for this when the visual IS the point. One per guide — it's the fortissimo.",
  schema: z.object({
    src: z.string().describe("Audio source URL (required)."),
    peaks: z
      .array(z.number())
      .describe(
        "Precomputed normalized (0–1) amplitude peaks — the real audio shape drawn as the ring. Extract server-side (ffmpeg) so no cross-origin decode is needed. Required.",
      ),
    start: z
      .number()
      .optional()
      .describe("Fragment window start (seconds in src). Playback begins here."),
    end: z
      .number()
      .optional()
      .describe("Fragment window end (seconds in src). Playback pauses here."),
    transcript: z
      .array(
        z.object({
          start: z.number().describe("Cue start (seconds, fragment-relative)."),
          end: z.number().optional().describe("Optional cue end (seconds)."),
          text: z.string().describe("The spoken line, shown as the live caption."),
        }),
      )
      .optional()
      .describe("Caption cues — the active line shows beside the ring as it plays."),
    eyebrow: z
      .string()
      .optional()
      .describe("Small label above the title (e.g. an episode minute)."),
    title: z
      .string()
      .optional()
      .describe("Title beside the ring (e.g. speaker or clip name)."),
    bars: z.number().optional().describe("Bars around the ring. Default: 64."),
    size: z.number().optional().describe("Ring diameter in px. Default: 220."),
    barWidth: z.number().optional().describe("Bar thickness in px. Default: 3."),
    color: z
      .string()
      .optional()
      .describe(
        "Active/progress color — any CSS color or `var(--token)`. Default: `--primary`.",
      ),
  }),
  example: {
    type: "radial-audiogram",
    props: {
      src: "https://example.com/clip.mp3",
      peaks: [
        0.2, 0.5, 0.8, 0.6, 0.3, 0.7, 0.9, 0.4, 0.2, 0.6, 0.8, 0.5, 0.3, 0.7,
        0.6, 0.4,
      ],
      eyebrow: "23:14",
      title: "Daniel Primo",
      transcript: [
        { start: 0, end: 3, text: "Es una adicción sin sustancia." },
        { start: 3, end: 6, text: "Va a salir en las noticias." },
      ],
    },
  },
};
