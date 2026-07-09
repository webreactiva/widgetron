import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const quoteMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "A highlighted pull-quote / testimonial that attributes words to a person.",
  whenToUse:
    "Use for a verbatim quote — a memorable line from a podcast episode, an expert's words, or a testimonial. Semantic figure/blockquote/figcaption with an accent from the theme. Reach for it when the words belong to someone and that attribution matters; prefer CalloutBox for editorial emphasis that is the author's own voice. When the episode moment is known (from the SRT), add `timestamp` so a chip pins the words to the minute; when the episode audio is reachable, add `clip` so the chip plays the fragment in the speaker's own voice.",
  schema: z.object({
    children: content().describe("The quoted words."),
    attribution: z
      .string()
      .optional()
      .describe("Who said it (e.g. a person's name)."),
    role: z
      .string()
      .optional()
      .describe("Their role or context (e.g. 'Episode guest')."),
    timestamp: z
      .string()
      .optional()
      .describe(
        "Episode moment the quote was said at, e.g. '23:14' — shown as a 'Said at 23:14' chip. Take it from the transcript SRT. Derived from clip.start when omitted.",
      ),
    clip: z
      .object({
        src: z
          .string()
          .describe(
            "Audio URL — the full episode file works; combine with start/end.",
          ),
        start: z
          .number()
          .optional()
          .describe("Fragment start in seconds within src."),
        end: z
          .number()
          .optional()
          .describe("Fragment end in seconds within src."),
        transcriptSrc: z
          .string()
          .optional()
          .describe(
            "URL to the fragment's cut .srt/.vtt/.json transcript (timestamps relative to the fragment, not the episode).",
          ),
      })
      .optional()
      .describe(
        "Audio of the quoted moment; the chip expands a compact player with a karaoke transcript when transcriptSrc is given.",
      ),
  }),
  example: {
    type: "quote",
    props: {
      children:
        "The best code is the code you never had to write. Delete before you optimize.",
      attribution: "Ada Lovelace",
      role: "Episode guest",
    },
  },
};
