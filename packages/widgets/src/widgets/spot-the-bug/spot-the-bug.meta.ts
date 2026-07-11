import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const spotTheBugMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "A block of code where the learner clicks the line they think holds the bug, with an explanation on success.",
  whenToUse:
    "Reach for this to train debugging and close code-reading: the learner must locate a single flawed line in real code and gets the reasoning once they find it. Prefer SpotTheBug over PredictOutput when the skill is finding a defect rather than tracing what code prints, and over Quiz when the answer lives inside the code itself (a specific line) rather than among prose options.",
  schema: z.object({
    lines: z
      .array(
        z.object({
          code: content().describe("The code shown on this line. A plain string renders verbatim."),
          buggy: z
            .boolean()
            .optional()
            .describe("Marks the line that contains the bug. Exactly one line should set this true."),
          explanation: content()
            .optional()
            .describe("Explanation revealed when the learner clicks the buggy line."),
        }),
      )
      .min(2)
      .describe("The code lines, in order; exactly one should set buggy: true.")
      // Without exactly one buggy line the exercise is unsolvable (every click
      // says "keep looking") or ambiguous — a generated guide shipped that way
      // once; validation is the gate, not prose.
      .refine((lines) => lines.filter((l) => l.buggy === true).length === 1, {
        message:
          "exactly ONE line must set buggy: true (and its explanation lives on that line) — with none the learner can never solve it",
      }),
  }),
  example: {
    type: "spot-the-bug",
    props: {
      lines: [
        { code: "function sum(arr) {" },
        { code: "  let total = 0;" },
        {
          code: "  for (let i = 0; i <= arr.length; i++) {",
          buggy: true,
          explanation: "Off-by-one: `i <= arr.length` reads one past the end. Use `i < arr.length`.",
        },
        { code: "    total += arr[i];" },
        { code: "  }" },
        { code: "  return total;" },
        { code: "}" },
      ],
    },
  },
};
