import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const flowDiagramMeta: WidgetMeta = {
  version: 1,
  category: "Diagrams & data",
  summary:
    "A linear 'A → B → C' flow whose steps can become a clickable walkthrough with per-step detail panels.",
  whenToUse:
    "Reach for this to show a sequential process or pipeline where order matters — request lifecycle, build steps, a state progression. Give nodes a `detail` to turn it into an interactive walkthrough that explains what happens at each step (arrow keys move between them); leave details off for a plain static flow. Prefer MermaidDiagram instead when the relationships branch, merge, or loop rather than running in one straight line, and Storyline when you are sequencing whole teaching screens rather than labeled steps.",
  schema: z.object({
    nodes: z
      .array(
        z.object({
          label: content().describe("The step label shown in the node."),
          active: z
            .boolean()
            .optional()
            .describe("Highlight this node as the focal point of the flow."),
          detail: z
            .object({
              title: z
                .string()
                .optional()
                .describe("Optional bold heading for the detail panel."),
              description: content().describe(
                "What happens at this step, revealed when the node is selected.",
              ),
            })
            .optional()
            .describe(
              "When present, the node becomes clickable and opens this panel.",
            ),
        }),
      )
      .min(1)
      .describe("The steps of the flow, in left-to-right order."),
    separator: content()
      .optional()
      .describe("Custom separator between nodes. Defaults to an arrow icon."),
    defaultSelected: z
      .number()
      .optional()
      .describe(
        "Pre-select a node index (only meaningful when nodes have details).",
      ),
  }),
  example: {
    type: "flow-diagram",
    props: {
      nodes: [
        {
          label: "Request",
          detail: {
            title: "Browser sends the request",
            description:
              "The browser opens a connection and asks the server for the page.",
          },
        },
        {
          label: "Server",
          active: true,
          detail: {
            title: "Server does the work",
            description:
              "Queries run, templates render — this is where most latency lives.",
          },
        },
        {
          label: "Response",
          detail: {
            title: "Bytes come back",
            description: "The HTML travels back over the network and paints.",
          },
        },
      ],
    },
  },
};
