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
        "The steps IN THEIR CORRECT ORDER — the widget scrambles them for the reader. With `low`/`high` this reads low → high instead of first → last.",
      ),
    low: optionalContent().describe(
      "Turns the exercise into a RANKING: names the property's low end, shown above the list. Use it when the items are ordered by a property (coupling, cost, risk, blast radius) rather than through time — 'which of these is most coupled' is a different and often harder question than 'what happens first'.",
    ),
    high: optionalContent().describe(
      "The high end of the ranking scale, shown below the list. Set it together with `low`.",
    ),
    explanation: optionalContent().describe(
      "Why this order is the right one, revealed after checking. Effectively required: a check that says 'not yet' and stops has spent the reader's attention and returned nothing. Name what decides the order, not just the order.",
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
