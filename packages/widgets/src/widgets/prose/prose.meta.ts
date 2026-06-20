import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const proseMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "A static typographic container for free-form text: headings, paragraphs, lists, inline code, links.",
  whenToUse:
    "Reach for this for ordinary running explanation — the connective text between interactive widgets, with proper typographic styling for headings, lists, links and inline code. It is the default text widget; prefer SectionHeader to introduce a new section, CalloutBox to spotlight a single idea, and CodeTranslation when explaining code line by line. Author content via `children` (plain text or nested nodes).",
  // NOTE: the component also accepts a raw `html` string (dangerouslySetInnerHTML),
  // but it is intentionally NOT exposed here — generated/untrusted content must
  // never reach raw-HTML injection. `html` stays a code-only escape hatch for
  // trusted human authors.
  schema: z.object({
    children: content()
      .optional()
      .describe("Rich text content: paragraphs, headings, lists, links, code."),
    size: z
      .enum(["sm", "base", "lg"])
      .optional()
      .describe("Base text size. Default: 'base'."),
  }),
  example: {
    type: "prose",
    props: {
      children:
        "A request travels over the network, the server does its work, and the response comes back. Most of the time you feel as 'slow' is spent waiting on that round trip, not on rendering.",
    },
  },
};
