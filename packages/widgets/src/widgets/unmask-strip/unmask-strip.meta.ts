import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const unmaskStripMeta: WidgetMeta = {
  version: 1,
  category: "Media",
  summary:
    "An image that wipes into view behind a moving clip-path edge as it scrolls in — pure CSS, fully shown under reduced motion.",
  whenToUse:
    "Use to give a single photograph a moment of arrival: it wipes in from one edge as the reader reaches it. Good for a scene-setting image between sections. Requires a real image URL (never invent one). Prefer `figure` for an image that just illustrates a paragraph (no motion), `backdrop-section` when the image should own the whole screen while prose scrolls over it, and `compare-slider` for a before/after. One or two per guide — the reveal is a punctuation mark, not a default.",
  schema: z.object({
    src: z.string().describe("Real image URL — never an invented asset."),
    alt: z
      .string()
      .optional()
      .describe("Describe the image; '' if purely atmospheric."),
    direction: z
      .enum(["left", "right", "up", "down"])
      .optional()
      .describe("Which edge the wipe reveals from. Default 'left'."),
    focal: z
      .string()
      .optional()
      .describe("object-position, e.g. '50% 30%', so the key region survives crops."),
    aspectRatio: z
      .string()
      .optional()
      .describe("CSS aspect-ratio for the strip, e.g. '16 / 9' (default) or '3 / 1'."),
    caption: z.string().optional().describe("Optional caption below the strip."),
  }),
  example: {
    type: "unmask-strip",
    props: {
      src: "https://picsum.photos/id/1043/1600/900",
      alt: "",
      direction: "left",
      aspectRatio: "3 / 1",
      caption: "The office at 7pm — everyone *looks* busy.",
    },
  },
};
