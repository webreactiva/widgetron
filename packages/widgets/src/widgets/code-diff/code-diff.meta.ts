import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const codeDiffMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "Before and after code in one unified block: every added and removed line marked, with plain-language notes.",
  whenToUse:
    "Reach for this when the lesson is a CHANGE to code — a refactor, a bug fix, a migration, 'how I write it now vs. how I wrote it then'. The widget computes the diff itself: pass the two full versions and it marks what moved. Prefer CodeDiff over CodeTranslation when the point is what changed rather than what the code does, and over CompareSlider when the two sides are code rather than images.",
  schema: z.object({
    before: z.string().describe("The code as it was."),
    after: z.string().describe("The code as it should be."),
    filename: content()
      .optional()
      .describe("File name / path shown in the header (e.g. 'src/app.ts')."),
    notes: z
      .array(content())
      .optional()
      .describe("Plain-language bullets explaining why the change matters."),
    lineNumbers: z
      .boolean()
      .optional()
      .describe("Show the before/after line-number gutter. Default: true."),
  }),
  example: {
    type: "code-diff",
    props: {
      filename: "src/users.ts",
      before:
        "async function getUsers() {\n  const res = await fetch('/api/users')\n  return res.json()\n}",
      after:
        "async function getUsers() {\n  const res = await fetch('/api/users')\n  if (!res.ok) throw new Error(`Users: ${res.status}`)\n  return res.json()\n}",
      notes: [
        "A failed request used to return the error page's JSON as if it were users.",
        "Throwing on `!res.ok` moves the failure to where it can be handled.",
      ],
    },
  },
};
