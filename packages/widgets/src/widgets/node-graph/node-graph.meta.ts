import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const nodeGraphMeta: WidgetMeta = {
  version: 1,
  category: "Diagrams & data",
  summary:
    "A real graph — boxes on a grid joined by measured SVG arrows, with any node able to connect to any other.",
  whenToUse:
    "Reach for this when the shape is a GRAPH rather than a line: an architecture, a request lifecycle with a miss path, a module map with the dependencies pointing both ways, anything with a loop or a branch. Prefer NodeGraph over FlowDiagram whenever the picture needs more than one straight A → B → C row (FlowDiagram has no real edges — it puts an arrow icon between boxes and cannot express a back-edge). Prefer it over MermaidDiagram whenever the LABELS matter: this widget's boxes and edge labels are HTML, so they keep markdown, `code`, [[glossary]] tooltips, links and the theme's typography, while Mermaid renders every label inside SVG <text> where none of that works — take Mermaid instead when the graph is large enough that hand-placing it is the wrong job. Give nodes `row`/`col` when the layout carries meaning (a cache beside the database it fronts, not under it), and keep it under about eight nodes: past that the reader is reading a map, not an idea.",
  schema: z.object({
    nodes: z
      .array(
        z.object({
          id: z
            .string()
            .describe("Unique id, referenced by `edges`. Short and mnemonic ('api', 'db')."),
          label: content().describe(
            "The box label — what the thing IS, in the reader's words. Supports markdown and [[glossary]] terms, unlike a Mermaid node.",
          ),
          note: optionalContent().describe(
            "A second, smaller line inside the box: what it holds or what it is for. Three or four words.",
          ),
          row: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("1-based grid row. Set it when the POSITION carries meaning."),
          col: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("1-based grid column. Set it together with `row`."),
          active: z
            .boolean()
            .optional()
            .describe("Draw attention to this node — the one the surrounding prose is about."),
          muted: z
            .boolean()
            .optional()
            .describe("Subdue it: present in the system, not what this beat is about."),
          detail: optionalContent().describe(
            "Makes the node clickable and reveals this panel. Use it to let the reader meet the parts one at a time instead of reading a finished picture.",
          ),
        }),
      )
      .min(2)
      .describe(
        "The boxes. Two to about eight; past that the reader is decoding a map instead of learning an idea.",
      ),
    edges: z
      .array(
        z.object({
          from: z.string().describe("Source node id."),
          to: z.string().describe("Target node id."),
          label: optionalContent().describe(
            "What travels along it — 'GET /product/42', 'SELECT …'. An HTML chip on the curve, so markdown and [[glossary]] work here too. Keep it to a few words.",
          ),
          dashed: z
            .boolean()
            .optional()
            .describe("Dashed: an optional, failing or fallback path — the miss, the retry, the timeout."),
          active: z
            .boolean()
            .optional()
            .describe("Draw attention to this edge."),
        }),
      )
      .min(1)
      .describe(
        "The arrows. Any node may connect to any other, including backwards — that is what this widget exists for. Read them off the real system; a guessed dependency is a diagram the reader will not recognise.",
      ),
    cols: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Grid columns. Default: min(nodes.length, 3)."),
    caption: optionalContent().describe(
      "A line under the graph naming what it is a picture of — 'One product-page request'.",
    ),
  }),
  example: {
    type: "node-graph",
    props: {
      caption: "One product-page request, with the cache miss drawn in.",
      cols: 3,
      nodes: [
        { id: "browser", label: "Browser", note: "the reader", row: 1, col: 1 },
        { id: "api", label: "API", note: "your code", row: 1, col: 2, active: true },
        { id: "cache", label: "Redis", note: "the [[cache]]", row: 1, col: 3 },
        { id: "db", label: "Database", note: "the truth", row: 2, col: 2 },
      ],
      edges: [
        { from: "browser", to: "api", label: "GET /product/42" },
        { from: "api", to: "cache", label: "GET product:42" },
        { from: "cache", to: "db", label: "miss", dashed: true },
        { from: "db", to: "api", label: "90 ms" },
      ],
    },
  },
};
