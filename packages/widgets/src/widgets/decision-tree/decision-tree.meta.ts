import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const decisionTreeMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "A branching 'choose-your-own-path' explorable: pick a choice, follow a branch, and land on an outcome.",
  whenToUse:
    "Use this to teach conditional, 'it depends' reasoning — which tool/approach to pick, troubleshooting flows, or guided decision-making — where the answer depends on the learner's earlier choices. Prefer DecisionTree over Quiz when there is no single correct answer but a path that leads to a recommendation, and over a flat list when the value is in the branching itself (different choices reach different outcomes).",
  schema: z.object({
    start: z.string().describe("Id of the first node to show."),
    nodes: z
      .record(
        z.string(),
        z.object({
          prompt: content().describe("The question or text shown for this node."),
          options: z
            .array(
              z.object({
                label: content().describe("The choice text shown on the button."),
                to: z.string().describe("Id of the node this choice leads to."),
              }),
            )
            .optional()
            .describe("Branch choices. A node WITH options is a question."),
          outcome: content()
            .optional()
            .describe("Terminal result. A node with outcome and NO options is a leaf."),
        }),
      )
      .describe("All nodes keyed by id; each is either a question (options) or a leaf (outcome)."),
  }),
  example: {
    type: "decision-tree",
    props: {
      start: "q1",
      nodes: {
        q1: {
          prompt: "Does the data change between requests?",
          options: [
            { label: "No, it's static", to: "ssg" },
            { label: "Yes, often", to: "ssr" },
          ],
        },
        ssg: {
          prompt: "Static it is.",
          outcome: "Use static generation (SSG) — build it once and serve from the CDN.",
        },
        ssr: {
          prompt: "Dynamic it is.",
          outcome: "Use server-side rendering (SSR) so each request gets fresh data.",
        },
      },
    },
  },
};
