import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const audioClipMeta: WidgetMeta = {
  version: 1,
  category: "Media",
  summary:
    "A custom audio player with an optional synced, clickable karaoke transcript.",
  whenToUse:
    "Use to embed a piece of audio — a clip, an interview, a pronunciation example — with custom play/seek controls and, optionally, a transcript that highlights and auto-scrolls each cue as it plays and lets the learner click a line to jump there. Reach for it for sound-only material; prefer VideoClip when there is moving picture to show. Provide a transcript inline via `transcript`, or fetch one (.json/.vtt/.srt) via `transcriptSrc`. With `start`/`end` it plays only that fragment of `src` (an episode file can serve many clips); transcript timestamps are then fragment-relative — use the fragment's cut .srt, not the episode's. For an episode moment worth surfacing, turn on `context` (a strip naming the source minute and clip length). Set `transcriptView: \"spotlight\"` for 20–60s fragments where what's said matters sentence by sentence — the spoken line grows and lights up while the rest wait dimmed.",
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
    context: z
      .boolean()
      .optional()
      .describe(
        "Header strip naming where the clip comes from: 'Episode moment · 23:14 · 0:27' (source minute from `start`, plus clip length). Default: false.",
      ),
    transcriptView: z
      .enum(["compact", "spotlight"])
      .optional()
      .describe(
        "Transcript presentation. 'compact' (default) is the scrolling list; 'spotlight' enlarges and lights the sentence being spoken — for fragments read line by line.",
      ),
    waveform: z
      .boolean()
      .optional()
      .describe(
        "Draw a real waveform / audiogram (lazy wavesurfer.js) as a full-width seek bar instead of the plain slider — SHORT clips only. With `peaks` it renders from those (no network, CORS-proof); otherwise it decodes `src` in the browser (needs CORS). Falls back to the slider on failure. Default: false.",
      ),
    peaks: z
      .array(z.number())
      .optional()
      .describe(
        "Precomputed normalized (0–1) amplitude peaks — the real audio shape, extracted server-side (e.g. ffmpeg) so the audiogram needs no cross-origin decode. Pair with `waveform`.",
      ),
    waveHeight: z
      .number()
      .optional()
      .describe("Wave/audiogram height in px (the size knob). Default: 40."),
    barWidth: z
      .number()
      .optional()
      .describe("Bar thickness in px (the grosor knob). Default: 2."),
    barGap: z.number().optional().describe("Gap between bars in px. Default: 2."),
    waveColor: z
      .string()
      .optional()
      .describe(
        "Unplayed-wave color — any CSS color or `var(--token)`. Defaults to a muted token.",
      ),
    progressColor: z
      .string()
      .optional()
      .describe(
        "Played (progress) color — any CSS color or `var(--token)`. Defaults to `--primary`.",
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
