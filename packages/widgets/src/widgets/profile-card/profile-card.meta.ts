import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content } from "@/lib/widget-meta";

export const profileCardMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "People cards — avatar (image or auto-initials), name, role and bio; several people stack into container-aware columns.",
  whenToUse:
    "Use to present people — the episode's host, a guest, the team behind a project. Each person gets an avatar (image URL, or initials on a theme accent when there is none), a name (optionally linked), a short role line and a bio. With one person it renders a single card; with several, `layout: 'grid'` (default) stacks them into responsive columns and `layout: 'list'` keeps one horizontal card per row for longer bios. Prefer PatternCard for concepts/features (not people) and Quote when the point is something the person SAID rather than who they are.",
  schema: z.object({
    people: z
      .array(
        z.object({
          name: z.string().min(1).describe("The person's name."),
          avatar: z
            .string()
            .optional()
            .describe(
              "Avatar image URL. Falls back to initials when omitted or on load error.",
            ),
          initials: z
            .string()
            .optional()
            .describe("Initials override; default: derived from the name."),
          role: content()
            .optional()
            .describe("Short reference line — role, show, company."),
          bio: content().optional().describe("Bio blurb."),
          href: z
            .url()
            .optional()
            .describe("Optional link (personal site, profile) on the name."),
        }),
      )
      .min(1)
      .describe("The people to show, in order."),
    layout: z
      .enum(["grid", "list"])
      .optional()
      .describe(
        "'grid' (default): vertical cards in responsive columns. 'list': one horizontal card per row.",
      ),
  }),
  example: {
    type: "profile-card",
    props: {
      people: [
        {
          name: "Ada Lovelace",
          role: "Episode guest",
          bio: "Wrote the first published algorithm — a century before hardware could run it.",
          href: "https://example.com/ada",
        },
        {
          name: "Grace Hopper",
          role: "Compiler pioneer",
          bio: "Believed programming should read like language, then built the tools to prove it.",
        },
      ],
    },
  },
};
