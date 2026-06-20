import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const compareSliderMeta: WidgetMeta = {
  version: 1,
  category: "Diagrams & data",
  summary:
    "A before/after comparison with a draggable divider the reader sweeps to reveal each side.",
  whenToUse:
    "Reach for this to show a transformation as a direct visual contrast — before vs. after a refactor, light vs. dark, slow vs. optimized — where sweeping the divider drives the point home. Provide image URLs via `beforeSrc`/`afterSrc` (with `alt`), or arbitrary nodes via `before`/`after`. Prefer Hotspots instead when you are annotating points on a single figure rather than comparing two states, and DataChart when the difference is best expressed as numbers.",
  schema: z.object({
    before: content()
      .optional()
      .describe("Content for the clipped ('before') layer. Use this OR beforeSrc."),
    after: content()
      .optional()
      .describe("Content for the underneath ('after') layer. Use this OR afterSrc."),
    beforeSrc: z
      .string()
      .optional()
      .describe(
        "Image URL for the 'before' layer (convenience; rendered as object-cover).",
      ),
    afterSrc: z.string().optional().describe("Image URL for the 'after' layer."),
    alt: z
      .string()
      .optional()
      .describe("Alt text applied to the convenience images."),
    defaultPosition: z
      .number()
      .optional()
      .describe("Initial divider position as a percentage (0–100). Default: 50."),
  }),
  example: {
    type: "compare-slider",
    props: {
      beforeSrc: "https://example.com/before.png",
      afterSrc: "https://example.com/after.png",
      alt: "Page layout before and after the redesign",
      defaultPosition: 50,
    },
  },
};
