import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, nodeSchema } from "@/lib/widget-meta";

export const scrollytellingMeta: WidgetMeta = {
  version: 1,
  category: "Compositions",
  summary:
    "The sticky-graphic pattern (NYT / The Pudding): narrative steps scroll while a graphic stays pinned and updates per step.",
  whenToUse:
    "Reach for this when ONE evolving graphic should stay on screen while the explanation scrolls past it — annotating a diagram step by step, walking through stages of a chart, narrating a single visual as it changes. It is a composition: each step's `content` and `sticky` are other widget nodes. Prefer Storyline instead when you are assembling a whole multi-module lesson out of many independent screens; use Scrollytelling for a single pinned-visual segment within (or alongside) that flow.",
  schema: z.object({
    steps: z
      .array(
        z.object({
          content: content().describe(
            "The narrative content for this step (prose, a heading block, any node).",
          ),
          sticky: nodeSchema
            .optional()
            .describe(
              "The graphic pinned while this step is active. Omit to keep the previous/top-level graphic.",
            ),
        }),
      )
      .min(1)
      .describe("The narrative steps, in scroll order."),
    sticky: nodeSchema
      .optional()
      .describe(
        "Fallback graphic shown when a step provides none (defaults to the first step's sticky).",
      ),
  }),
  example: {
    type: "scrollytelling",
    props: {
      sticky: {
        type: "icon",
        props: { icon: "lucide:server", className: "size-24 text-primary" },
      },
      steps: [
        {
          content: {
            type: "prose",
            props: {
              children: "First, your browser opens a connection to the server.",
            },
          },
        },
        {
          content: {
            type: "prose",
            props: { children: "Then the server runs your query and responds." },
          },
          sticky: {
            type: "icon",
            props: { icon: "lucide:database", className: "size-24 text-secondary" },
          },
        },
      ],
    },
  },
};
