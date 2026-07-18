import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

const backdropSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("image"),
    src: z.string().describe("Real image URL — never an invented asset."),
    alt: z
      .string()
      .optional()
      .describe(
        "Usually '' — the backdrop is scenery; the prose carries the meaning.",
      ),
    focal: z
      .string()
      .optional()
      .describe(
        "object-position, e.g. '50% 30%', so the key region survives tall-phone crops.",
      ),
  }),
  z.object({
    kind: z.literal("words"),
    words: z
      .array(
        z.object({
          text: z.string().describe("One word or very short phrase."),
          weight: z
            .number()
            .int()
            .min(1)
            .max(5)
            .optional()
            .describe("Visual prominence, 1 (small) to 5 (huge). Default 3."),
        }),
      )
      .min(3)
      .describe(
        "10–25 words from the episode's own vocabulary — deliberate art direction, not a computed cloud.",
      ),
  }),
]);

export const backdropSectionMeta: WidgetMeta = {
  version: 1,
  category: "Compositions",
  summary:
    "A full-pane scene (image or a typographic composition of the episode's words) that sticks while short prose cards scroll over it.",
  whenToUse:
    "Use when one graphic should own the whole screen as a scene while short prose passes over it — an atmospheric image, or a `words` composition built from the episode's key terms (the signature move for podcast episodes with a strong recurring vocabulary). 2–5 short steps; at most one backdrop-section per guide — it is a scene change, and repeating it dulls it. Steps can swap the backdrop or, with `kind: 'words'`, light up the words they name via `highlight`. Prefer scrollytelling when the reader must study the graphic while reading (it stays beside, not behind, the text); prefer figure for an image that just illustrates a paragraph.",
  schema: z.object({
    backdrop: backdropSchema.describe("The initial / fallback scene (required)."),
    steps: z
      .array(
        z.object({
          content: z
            .string()
            .describe("The short prose card that scrolls over the scene."),
          backdrop: backdropSchema
            .optional()
            .describe("Swap the whole backdrop when this step becomes active."),
          highlight: z
            .array(z.string())
            .optional()
            .describe(
              "kind:'words' only — the words that light up while this step is active (must match `words[].text`).",
            ),
        }),
      )
      .min(1)
      .describe("2–5 short steps is the sweet spot (required)."),
    parallax: z
      .boolean()
      .optional()
      .describe(
        "Scroll-linked drift of the scene (slight scale/translate). Pure CSS, off automatically under reduced motion or without browser support. Default: true.",
      ),
  }),
  example: {
    type: "backdrop-section",
    props: {
      backdrop: {
        kind: "words",
        words: [
          { text: "smoke", weight: 5 },
          { text: "productivity", weight: 4 },
          { text: "metrics", weight: 2 },
          { text: "meetings", weight: 2 },
          { text: "focus", weight: 3 },
          { text: "shipping", weight: 3 },
        ],
      },
      steps: [
        {
          content:
            "Half of what we call productivity is **smoke**: motion that photographs well and ships nothing.",
          highlight: ["smoke", "productivity"],
        },
        {
          content:
            "The tell isn't the metric — it's whether anything reached a user this week.",
          highlight: ["shipping", "focus"],
        },
      ],
    },
  },
};
