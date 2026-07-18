import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const drawDiagramMeta: WidgetMeta = {
  version: 1,
  category: "Diagrams & data",
  summary:
    "A small line diagram whose strokes draw themselves in as it scrolls into view — pure CSS, static under reduced motion.",
  whenToUse:
    "Use for a simple, hand-drawn-feeling line graphic that gains impact by drawing itself as the reader arrives: a trend line, an arrow, an underline sweep, a bracket, a route between two points. You supply raw SVG paths (the `d` attribute) in a `viewBox`, so keep the geometry simple. Prefer `flow-diagram` for boxes-and-arrows process flows, `data-chart` for real quantitative data, and `mermaid-diagram` for graphs described in text — this is for a bespoke stroke drawing, not a chart.",
  schema: z.object({
    viewBox: z
      .string()
      .describe("e.g. '0 0 240 120' — the coordinate space the paths live in."),
    paths: z
      .array(
        z.union([
          z.string().describe("SVG path data (the `d` attribute)."),
          z.object({
            d: z.string().describe("SVG path data (the `d` attribute)."),
            width: z
              .number()
              .optional()
              .describe("Stroke width in viewBox units. Default 2."),
          }),
        ]),
      )
      .min(1)
      .describe("The strokes, drawn in order as the diagram enters view."),
    labels: z
      .array(
        z.object({
          x: z.number(),
          y: z.number(),
          text: z.string(),
          anchor: z
            .enum(["start", "middle", "end"])
            .optional()
            .describe("Horizontal anchor. Default 'start'."),
          size: z
            .number()
            .optional()
            .describe("Font size in viewBox units. Default 12."),
        }),
      )
      .optional()
      .describe("Static text labels, positioned in viewBox coordinates."),
    title: z
      .string()
      .optional()
      .describe("Accessible name for the diagram (also its visual meaning)."),
    caption: z.string().optional().describe("Optional caption below the diagram."),
  }),
  example: {
    type: "draw-diagram",
    props: {
      viewBox: "0 0 240 120",
      title: "Output climbs once the busywork is cut",
      paths: [
        { d: "M20 110 L20 10 M20 110 L230 110", width: 2 },
        "M20 96 C 80 92, 120 60, 170 40 S 220 16, 228 14",
      ],
      labels: [
        { x: 24, y: 22, text: "output" },
        { x: 228, y: 108, text: "time", anchor: "end" },
      ],
      caption: "Same team, same week — just less **smoke**.",
    },
  },
};
