import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const iconMeta: WidgetMeta = {
  version: 1,
  category: "Foundations",
  summary:
    "Renders any icon from any Iconify set by string name, with no per-icon imports.",
  whenToUse:
    "Use whenever you need a standalone icon — a visual marker beside a heading, a small inline glyph, a decorative accent. Name icons fully-qualified as `set:name` (e.g. `mdi:database`, `lucide:rocket`) for a specific glyph, or pass a bare name to resolve it against the theme's default set. Reach for it as the low-level building block; most higher-level widgets that take an `icon` prop already render this under the hood.",
  schema: z.object({
    icon: z
      .string()
      .describe(
        "Iconify icon name. Use `set:name` (e.g. `mdi:database`) for an exact icon, or a bare name (e.g. `home`) to resolve against the theme's default set.",
      ),
    set: z
      .string()
      .optional()
      .describe(
        "Override the theme's default icon collection when `icon` is a bare name, e.g. `tabler`, `ph`.",
      ),
  }),
  example: {
    type: "icon",
    props: {
      icon: "lucide:rocket",
    },
  },
};
