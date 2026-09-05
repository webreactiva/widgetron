import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

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
    explanation: optionalContent().describe(
      "The RULE that separates the zones, revealed after checking. Effectively required: a board that turns green and says nothing has tested the reader's sorting and left them no criterion to sort by next time. Name the dimension ('whether staleness is acceptable'), not the answers.",
    ),
    celebrate: z
      .boolean()
      .optional()
      .describe("Fire confetti the moment the board is fully correct. Default: true."),
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
