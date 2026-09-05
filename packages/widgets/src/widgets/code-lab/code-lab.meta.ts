import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const codeLabMeta: WidgetMeta = {
  version: 1,
  category: "Reactive",
  summary:
    "Run the author's fixed code variants side by side in a sandbox and compare what they actually print.",
  whenToUse:
    "Reach for this when the source contains a MECHANISM the reader should operate rather than watch — a bug beside its fix, two strategies over the same input, the same call with and without the guard. Readers consistently take more from running a thing than from a diagram of it, because the output is produced in front of them instead of asserted by the author, so when something can be executed faithfully in a few lines, prefer CodeLab to one more diagram. Prefer PredictOutput when the reader should COMMIT to what the code prints before seeing it (and CodeLab right after, to let them run it), TerminalSim when nothing really executes and you are replaying CLI output, and Scrubber/TangleText when the model is a formula rather than code. The code is author-written and the reader cannot edit it; each variant runs in its own sandboxed iframe with no DOM, no same-origin access and a hard time budget. Keep each variant under ~30 lines: a lab that needs more setup than a click does not get run.",
  schema: z.object({
    variants: z
      .array(
        z.object({
          label: content().describe(
            "What this variant IS, in the reader's terms — 'As shipped', 'Fixed', 'Strategy B'. Not 'Example 1'.",
          ),
          code: z
            .string()
            .describe(
              "The JavaScript to run. Plain ES2022 in a bare sandbox: no DOM, no network, no imports, no npm packages — `console.log` is how anything becomes visible. Top-level `await` works. Keep it under ~30 lines and make the DIFFERENCE between variants the only thing that changes; incidental differences read as the cause.",
            ),
          note: optionalContent().describe(
            "One line on what to watch for in the output. Don't give away the result.",
          ),
        }),
      )
      .min(2)
      .max(4)
      .describe(
        "The variants to compare, two or three in practice. Two contrasting runs teach; four are a menu.",
      ),
    setup: z
      .string()
      .optional()
      .describe(
        "Shared preamble prepended to EVERY variant — fixtures, helpers, stubs. Put everything the variants have in common here so their own code shows only what differs.",
      ),
    question: optionalContent().describe(
      "The question the comparison answers, e.g. 'Why does the total come out as 0?'. Without it the reader runs two blocks and takes away nothing.",
    ),
    timeout: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        "How long one run may take, in ms, before the sandbox is stopped. Default: 5000.",
      ),
  }),
  example: {
    type: "code-lab",
    props: {
      question: "Why does the total come out as 0?",
      setup:
        "const items = [1, 2, 3];\nconst price = async (n) => n * 10;",
      variants: [
        {
          label: "As shipped",
          note: "Watch the value, not the error — there isn't one.",
          code: "let total = 0;\nitems.forEach(async (i) => {\n  total += await price(i);\n});\nconsole.log(total);",
        },
        {
          label: "Fixed",
          note: "Same work, sequenced.",
          code: "let total = 0;\nfor (const i of items) {\n  total += await price(i);\n}\nconsole.log(total);",
        },
      ],
    },
  },
};
