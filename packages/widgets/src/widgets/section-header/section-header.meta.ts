import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const sectionHeaderMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "A section header: an optional eyebrow, a larger display title, and optional description / body.",
  whenToUse:
    "Use to open a new section of a lesson — give it a title, an optional eyebrow (section number or category), and a lead description that frames what follows. Reach for it to create visual hierarchy and signal a topic shift; prefer Prose for ordinary running paragraphs and CalloutBox to spotlight a single idea rather than introduce a whole section.",
  schema: z.object({
    title: content().describe("The section title (larger display type)."),
    icon: z
      .string()
      .optional()
      .describe(
        "Optional leading icon. Iconify icon name, e.g. 'lucide:server', or a bare name resolved by the theme.",
      ),
    description: content()
      .optional()
      .describe("Optional supporting description / lead text below the title."),
    eyebrow: z
      .string()
      .optional()
      .describe(
        "Small label shown above the title (e.g. a section number or category).",
      ),
    level: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .optional()
      .describe("Heading level for the title element. Default: 2."),
    align: z
      .enum(["left", "center"])
      .optional()
      .describe("Horizontal alignment. Default: 'left'."),
    actions: content()
      .optional()
      .describe("Optional actions (e.g. nested widgets) shown alongside the title."),
    children: content()
      .optional()
      .describe("Extra body content rendered under the description."),
  }),
  example: {
    type: "section-header",
    props: {
      eyebrow: "Module 2",
      title: "How the browser fetches a page",
      description:
        "Before we touch any code, let's trace the round trip a request makes from address bar to rendered pixels.",
      icon: "lucide:globe",
    },
  },
};
