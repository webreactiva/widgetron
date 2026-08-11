import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const sortStepsMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "A scrambled procedure the reader puts back in order, graded step by step.",
  whenToUse:
    "Reach for this when the LESSON IS THE ORDER — a pipeline, a deploy sequence, a debugging routine, the phases of a process — and getting it wrong has consequences the episode talked about. Prefer SortSteps over StepCards when you want the reader to reconstruct the sequence instead of reading it, and over DragAndDrop when the items form one line whose order matters rather than groups they belong to. Write `items` in the CORRECT order; the widget scrambles them deterministically.",
  schema: z.object({
    items: z
      .array(
        z.object({
          id: z.string().describe("Unique id for this step."),
          label: content().describe("The step text shown to the learner."),
          hint: optionalContent().describe(
            "Optional detail line shown under the label.",
          ),
        }),
      )
      .min(2)
      .describe(
        "The steps IN THEIR CORRECT ORDER — the widget scrambles them for the reader.",
      ),
    celebrate: z
      .boolean()
      .optional()
      .describe("Fire confetti when the order comes out right. Default: true."),
  }),
  example: {
    type: "sort-steps",
    props: {
      items: [
        { id: "branch", label: "Create a branch from `main`" },
        { id: "commit", label: "Commit the change with a message that explains why" },
        { id: "push", label: "Push the branch to the remote" },
        { id: "pr", label: "Open a pull request and ask for review" },
        { id: "merge", label: "Merge once CI is green" },
      ],
    },
  },
};
