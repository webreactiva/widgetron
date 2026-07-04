import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const resourceListMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "A titled list of external links — 'keep exploring', further reading, or references.",
  whenToUse:
    "Use to gather outbound links into one block: further reading, references, related episodes, tools, or docs. Each item carries a kind icon, an optional source and qualifier, and a blurb. Reach for it to close a module or a guide with where-to-go-next, or to cite sources. It is the home for material that comes from OUTSIDE the source content, so only put real URLs the author provided or that were retrieved from a real catalog — never invent links. Prefer Cta for a single primary conversion, and ProfileCard when the links are people.",
  schema: z.object({
    title: optionalContent().describe(
      "Optional heading, e.g. 'Keep exploring' or 'References'.",
    ),
    items: z
      .array(
        z.object({
          label: content().describe("The resource title (the linked text)."),
          href: z.string().describe("Destination URL (opens in a new tab)."),
          description: optionalContent().describe(
            "Optional one-line blurb under the title.",
          ),
          kind: z
            .enum([
              "article",
              "episode",
              "video",
              "docs",
              "tool",
              "book",
              "repo",
              "link",
            ])
            .optional()
            .describe("Resource kind — picks the leading icon. Default: 'link'."),
          source: z
            .string()
            .optional()
            .describe("Where it lives — a site or show name, e.g. 'Web Reactiva'."),
          meta: z
            .string()
            .optional()
            .describe(
              "A short qualifier — reading time, episode number, a timestamp…",
            ),
        }),
      )
      .min(1)
      .describe("The resources to list, in order."),
    layout: z
      .enum(["list", "cards"])
      .optional()
      .describe(
        "'list' (default): stacked rows. 'cards': responsive auto-fit grid.",
      ),
  }),
  example: {
    type: "resource-list",
    props: {
      title: "Keep exploring",
      items: [
        {
          label: "How the web loads a page",
          href: "https://example.com/round-trip",
          kind: "article",
          source: "Web Reactiva",
          meta: "8 min",
          description: "The request/response round trip, start to finish.",
        },
        {
          label: "The episode this guide is based on",
          href: "https://example.com/episode-315",
          kind: "episode",
          source: "Web Reactiva Premium",
          meta: "Ep. 315",
        },
      ],
    },
  },
};
