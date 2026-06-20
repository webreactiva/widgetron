import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const dragAndDropMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "A categorize/match exercise: place each item chip into its correct zone, then check.",
  whenToUse:
    "Reach for this to teach classification and grouping — sorting concepts into categories, matching terms to definitions, or bucketing examples by type — where the relationship between many items and a few groups is the lesson. Prefer DragAndDrop over Quiz when several items must be sorted at once rather than answering one question, and over FillInTheBlanks when the task is grouping items into zones rather than completing a sentence.",
  schema: z.object({
    items: z
      .array(
        z.object({
          id: z.string().describe("Unique id for this item."),
          label: content().describe("The chip label shown to the learner."),
          target: z.string().describe("Id of the DropTarget this item correctly belongs in."),
        }),
      )
      .min(1)
      .describe("The chips to categorize; each carries the id of its correct target."),
    targets: z
      .array(
        z.object({
          id: z.string().describe("Unique id for this zone (referenced by item.target)."),
          label: content().describe("The zone heading / accessible name."),
        }),
      )
      .min(2)
      .describe("The drop zones items get placed into."),
  }),
  example: {
    type: "drag-and-drop",
    props: {
      items: [
        { id: "let", label: "let", target: "block" },
        { id: "const", label: "const", target: "block" },
        { id: "var", label: "var", target: "function" },
      ],
      targets: [
        { id: "block", label: "Block-scoped" },
        { id: "function", label: "Function-scoped" },
      ],
    },
  },
};
