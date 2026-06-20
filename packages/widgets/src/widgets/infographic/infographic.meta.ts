import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const infographicMeta: WidgetMeta = {
  version: 1,
  category: "Diagrams & data",
  summary:
    "Visual-metaphor templates (funnel, pyramid, cycle, venn, iceberg, balance, target, hub, matrix, stairs) rendered as dependency-free SVG.",
  whenToUse:
    "Reach for this to turn a conceptual relationship into a memorable picture — pick the `layout` whose metaphor matches the idea: 'funnel' for narrowing stages, 'pyramid' for a layered hierarchy, 'cycle' for a repeating loop, 'venn' for overlap, 'iceberg' for visible-vs-hidden, 'balance' for a trade-off, 'target' for nested goals, 'hub' for a center-and-spokes, 'matrix' for a 2x2, 'stairs' for cumulative progress. Keep `items[].label` to 1–3 words and put longer text in `description` (it becomes a numbered legend). Prefer DataChart instead when you have actual numbers to compare, and FlowDiagram or MermaidDiagram when the point is a step-by-step process rather than a static metaphor.",
  schema: z.object({
    layout: z
      .enum([
        "funnel",
        "pyramid",
        "cycle",
        "venn",
        "iceberg",
        "balance",
        "target",
        "hub",
        "matrix",
        "stairs",
      ])
      .describe("The visual-metaphor template to render."),
    items: z
      .array(
        z.object({
          label: z.string().describe("Short 1–3 word label drawn in the shape."),
          description: content()
            .optional()
            .describe(
              "Longer explanation; when present it appears in the numbered legend below.",
            ),
          icon: z
            .string()
            .optional()
            .describe(
              "Short symbol shown as the bullet (e.g. an emoji or single character). Rendered verbatim — NOT theme-resolved. Defaults to the item number.",
            ),
        }),
      )
      .min(1)
      .describe("The labeled parts of the metaphor, in order."),
    center: z
      .string()
      .optional()
      .describe("Center label for 'cycle', 'venn', and 'hub' layouts."),
    zones: z
      .tuple([z.string(), z.string()])
      .optional()
      .describe("Zone captions for 'iceberg' as [visible, hidden]."),
    tilt: z
      .enum(["left", "right", "equal"])
      .optional()
      .describe("Tilt direction for the 'balance' layout."),
    axes: z
      .object({
        x: z
          .tuple([z.string(), z.string()])
          .optional()
          .describe("X-axis captions as [low, high]."),
        y: z
          .tuple([z.string(), z.string()])
          .optional()
          .describe("Y-axis captions as [low, high]."),
      })
      .optional()
      .describe("Axis captions for the 'matrix' layout."),
  }),
  example: {
    type: "infographic",
    props: {
      layout: "funnel",
      items: [
        { label: "Visitors", description: "Everyone who lands on the page." },
        { label: "Sign-ups", description: "Those who create an account." },
        { label: "Paying", description: "The few who convert to a plan." },
      ],
    },
  },
};
