import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const karaokeStageMeta: WidgetMeta = {
  version: 1,
  category: "Media",
  summary:
    "A full-width stage where the spoken words light up one by one — Spotify-lyrics / TikTok-subtitle treatment for the episode's peak moment.",
  whenToUse:
    "Use for the episode's peak moment — the word of the week, the sentence that names the guide, a module's hook. One or two per storyline at most: it is the fortissimo, and it loses all power when repeated. Two typographic treatments: mode 'lines' (stacked lyrics) suits paragraphs with rhythm; mode 'words' (one beat-by-beat chunk) suits short maximum-impact sentences. Word timing is interpolated inside each transcript cue from word length and punctuation, so the everyday sentence-level .srt is enough — never fabricate word-level timestamps. If you happen to have genuine word-level ASR, attach it as a cue's optional `words` array and each word lights on its true beat over the still-readable sentence (the highlight moves by color only, so the line never reflows). With `src` + `start`/`end` it plays the real audio fragment (cue timestamps fragment-relative, like audio-clip); without `src` it self-paces from the cue timestamps as a purely typographic piece. For quieter needs prefer audio-clip (with `transcriptView: 'spotlight'` for sentence-level focus).",
  schema: z.object({
    src: z
      .string()
      .optional()
      .describe(
        "Audio source URL. Omit for a self-paced, purely typographic piece driven by the cue timestamps.",
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
          start: z.number().describe("Cue start time in seconds (fragment-relative)."),
          end: z.number().optional().describe("Optional cue end time in seconds."),
          text: z.string().describe("The spoken text for this cue."),
          words: z
            .array(
              z.object({
                text: z.string(),
                start: z.number(),
                end: z.number(),
              }),
            )
            .optional()
            .describe(
              "Optional real per-word timestamps (fragment-relative). When present, each word lights on its true beat instead of interpolating — only supply these if you have genuine word-level timing; never fabricate them.",
            ),
        }),
      )
      .optional()
      .describe("Inline transcript cues. Takes priority over transcriptSrc."),
    transcriptSrc: z
      .string()
      .optional()
      .describe("URL to a .json / .vtt / .srt transcript fetched on mount."),
    mode: z
      .enum(["lines", "words"])
      .optional()
      .describe(
        "Typographic treatment: 'lines' (stacked lyrics, default) for paragraphs with rhythm; 'words' (beat-by-beat chunk) for short high-impact sentences. The reader can switch.",
      ),
    eyebrow: z
      .string()
      .optional()
      .describe("Eyebrow above the stage, e.g. 'WR 300 · 23:14'."),
  }),
  example: {
    type: "karaoke-stage",
    props: {
      eyebrow: "WR 300 · 23:14",
      mode: "lines",
      transcript: [
        { start: 0, end: 3.2, text: "Smoke is activity that looks like work." },
        { start: 3.2, end: 6.8, text: "It demos well and leaves no trace." },
        { start: 6.8, end: 10, text: "You beat it with one honest number." },
      ],
    },
  },
};
