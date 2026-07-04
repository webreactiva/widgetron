import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const checklistMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "An actionable, persistent to-do list whose checked state survives reloads, with a progress bar.",
  whenToUse:
    "Use this for a 'do this, then this' takeaway the learner works through over time — setup steps, a pre-flight list, or post-lesson actions — where checked progress should persist across visits. Prefer Checklist over DragAndDrop or FillInTheBlanks when there is no right/wrong grading, just tasks to tick off, and over plain prose when you want the steps to be trackable artifacts the learner can return to. Give it a `completion` message so finishing the list pays off — a confetti burst fires by default when the last item is checked.",
  schema: z.object({
    id: z
      .string()
      .describe("Stable unique id; used to persist checked state in localStorage."),
    items: z
      .array(
        z.object({
          text: content().describe("The task label."),
          hint: content().optional().describe("Optional secondary line clarifying the task."),
        }),
      )
      .min(1)
      .describe("The checklist items, in order."),
    persist: z
      .boolean()
      .optional()
      .describe("Persist checked state across visits. Default: true. When false, state is in-memory only."),
    completion: content()
      .optional()
      .describe(
        "Payoff shown when every item is checked (recommended — people like a reward). Omit for a default acknowledgement; pass null to hide the banner.",
      ),
    celebrate: z
      .boolean()
      .optional()
      .describe("Fire a confetti burst the moment the last item is checked. Default: true."),
  }),
  example: {
    type: "checklist",
    props: {
      id: "deploy-preflight",
      items: [
        { text: "Run the test suite", hint: "All green before you ship." },
        { text: "Bump the version number" },
        { text: "Write the changelog entry" },
      ],
      completion: "Nice — you're deploy-ready. 🚀",
    },
  },
};
