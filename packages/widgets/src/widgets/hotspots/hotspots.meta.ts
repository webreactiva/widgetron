import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const hotspotsMeta: WidgetMeta = {
  version: 1,
  category: "Diagrams & data",
  summary:
    "An annotated figure: clickable points overlaid on an image or diagram reveal explanations in a detail panel.",
  whenToUse:
    "Reach for this to label and explain parts of a single picture — anatomy of a UI screenshot, regions of an architecture diagram, points of interest on a chart. Position each point with `x`/`y` percentages over the figure (passed as `children`, or `src`/`alt` for a convenience image). Prefer CompareSlider instead when you are contrasting two whole states rather than annotating one, and FlowDiagram or MermaidDiagram when the relationships between the parts (not just their locations) are the lesson.",
  schema: z.object({
    children: content()
      .optional()
      .describe(
        "The figure to annotate — an image, SVG, or any node. Omit and pass `src` for a convenience image.",
      ),
    src: z
      .string()
      .optional()
      .describe("Convenience image source, used only when no `children` are provided."),
    alt: z.string().optional().describe("Alt text for the convenience image."),
    hotspots: z
      .array(
        z.object({
          x: z
            .number()
            .describe("Horizontal position as a percentage (0–100) of the figure box."),
          y: z
            .number()
            .describe("Vertical position as a percentage (0–100) of the figure box."),
          title: content().describe("Heading shown in the detail panel."),
          description: content().describe("Explanation shown in the detail panel."),
        }),
      )
      .min(1)
      .describe("Clickable points overlaid on the figure, positioned by x/y percent."),
    defaultSelected: z
      .number()
      .optional()
      .describe("Pre-select a hotspot index."),
    emptyHint: content()
      .optional()
      .describe("Shown in the detail panel while nothing is selected."),
  }),
  example: {
    type: "hotspots",
    props: {
      src: "https://example.com/dashboard.png",
      alt: "Analytics dashboard",
      hotspots: [
        {
          x: 25,
          y: 30,
          title: "Primary metric",
          description: "The headline number the whole dashboard is built around.",
        },
        {
          x: 70,
          y: 60,
          title: "Trend sparkline",
          description: "Shows whether the metric is improving over time.",
        },
      ],
    },
  },
};
