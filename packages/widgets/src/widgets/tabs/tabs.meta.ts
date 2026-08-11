import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const tabsMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "Equivalent versions of the same content behind a tab strip — the reader opens the one that applies to them.",
  whenToUse:
    "Reach for this when the SAME lesson has several equally valid forms and only one matters to each reader: npm / pnpm / yarn, JavaScript / TypeScript, macOS / Linux / Windows, junior / senior framing. A panel holds any widget, so a tab can carry a whole code-translation. Prefer Tabs over stacking all versions in prose (two thirds of it is noise for everyone), and over ProfileGate when the reader picks per-block rather than the guide personalizing itself from a profile. Do NOT use it to hide content that everyone should read — tabs make what is not open invisible.",
  schema: z.object({
    items: z
      .array(
        z.object({
          label: content().describe("Tab button text — keep it short."),
          icon: z
            .string()
            .optional()
            .describe("Optional icon name shown before the label (e.g. 'terminal')."),
          content: content().describe(
            "What the panel shows — text, or a nested widget node.",
          ),
        }),
      )
      .min(2)
      .describe("The tabs, in display order."),
    defaultIndex: z
      .number()
      .int()
      .optional()
      .describe("Which tab opens first (0-based). Default: 0."),
  }),
  example: {
    type: "tabs",
    props: {
      items: [
        {
          label: "pnpm",
          icon: "package",
          content: {
            type: "terminal-sim",
            props: { commands: [{ cmd:"pnpm add zod", output: "+ zod 3.23.8" }] },
          },
        },
        {
          label: "npm",
          icon: "package",
          content: {
            type: "terminal-sim",
            props: { commands: [{ cmd:"npm install zod", output: "added 1 package" }] },
          },
        },
      ],
    },
  },
};
