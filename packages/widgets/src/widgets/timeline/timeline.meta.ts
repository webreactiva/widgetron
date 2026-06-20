import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const timelineMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "A vertical sequence of milestones on a connector line; items with detail expand on click.",
  whenToUse:
    "Use to show events or milestones in chronological order — each with an optional timestamp and a title, and an optional description that the learner expands by clicking. Reach for it when the items are points in time or stages of a history/process worth exploring on demand; prefer StepCards for a procedure of actions to perform in order, and PatternCard for an unordered grid of peer concepts.",
  schema: z.object({
    items: z
      .array(
        z.object({
          time: z
            .string()
            .optional()
            .describe("Optional timestamp/label shown muted before the title."),
          title: z.string().describe("The milestone heading."),
          description: content()
            .optional()
            .describe(
              "Detail revealed when the item is clicked; when present the item becomes an expandable toggle.",
            ),
          icon: z
            .string()
            .optional()
            .describe(
              "Optional icon rendered inside the marker dot. Iconify icon name, e.g. 'lucide:check', or a bare name resolved by the theme.",
            ),
        }),
      )
      .min(1)
      .describe("The milestones, rendered top to bottom in array order."),
    defaultOpen: z
      .union([z.number(), z.array(z.number())])
      .optional()
      .describe("Item index or indices to open initially. Default: none open."),
    multiple: z
      .boolean()
      .optional()
      .describe("Allow more than one item open at a time. Default: true."),
  }),
  example: {
    type: "timeline",
    props: {
      items: [
        {
          time: "1991",
          title: "The first website goes live",
          description:
            "Tim Berners-Lee publishes the very first web page at CERN.",
        },
        {
          time: "1995",
          title: "JavaScript ships",
          description: "Brendan Eich builds the language in ten days.",
        },
        {
          time: "2015",
          title: "ES2015 modernizes the language",
          description: "let/const, arrow functions, classes and modules land.",
        },
      ],
      defaultOpen: 0,
    },
  },
};
