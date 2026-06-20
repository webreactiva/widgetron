import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const mermaidDiagramMeta: WidgetMeta = {
  version: 1,
  category: "Diagrams & data",
  summary:
    "Renders a Mermaid chart into the active theme, optionally zoomable and with clickable nodes that open detail overlays.",
  whenToUse:
    "Reach for this for structural or relational diagrams that Mermaid expresses well — flowcharts that branch/merge/loop, sequence diagrams, class/ER diagrams, state machines, gantt. Author the `chart` as Mermaid source text. Add `details` (keyed by node id) to let learners click a node for an explanation, and `zoomable` for large graphs. Prefer FlowDiagram instead for a simple straight-line 'A → B → C' walkthrough, and Infographic when you want a fixed visual metaphor rather than a graph.",
  schema: z.object({
    chart: z
      .string()
      .describe(
        "Mermaid diagram source, e.g. a flowchart definition like 'flowchart TD\\n  A[Start] --> B[End]'.",
      ),
    details: z
      .array(
        z.object({
          id: z
            .string()
            .describe(
              "Node id in the chart whose rendered node opens this detail on click.",
            ),
          title: content().describe("Heading of the detail overlay."),
          description: content().describe("Body text of the detail overlay."),
        }),
      )
      .optional()
      .describe("Optional clickable-node details, keyed by node id in the chart."),
    zoomable: z
      .boolean()
      .optional()
      .describe(
        "Enable zoom buttons, mouse-wheel zoom and click-drag panning. Default: false.",
      ),
  }),
  example: {
    type: "mermaid-diagram",
    props: {
      chart:
        "flowchart TD\n  A[Request] --> B{Cached?}\n  B -->|Yes| C[Serve cache]\n  B -->|No| D[Query DB] --> C",
      details: [
        {
          id: "D",
          title: "Query the database",
          description:
            "A cache miss falls through to the database — the slow path you want to avoid.",
        },
      ],
    },
  },
};
