import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const frameStepperMeta: WidgetMeta = {
  version: 1,
  category: "Reactive",
  summary:
    "A state-timeline scrubber: a fixed stage of boxes and/or code, plus ordered frames that highlight parts and show a caption.",
  whenToUse:
    "Reach for this to teach a process that unfolds over discrete steps — a request flowing through services, an algorithm mutating state, lines of code executing in order. Each frame highlights boxes and/or code lines and narrates what just happened, so the learner steps or autoplays through the motion instead of reading a paragraph about it. Prefer it over TerminalSim when the steps are conceptual stage-and-highlight (not literal shell commands), and over GroupChat when the actors are components rather than people in a dialogue.",
  schema: z.object({
    frames: z
      .array(
        z.object({
          caption: z.string().describe("What this frame is showing; announced to screen readers."),
          active: z
            .array(z.string())
            .optional()
            .describe("Box ids to highlight on this frame."),
          lines: z
            .array(z.number())
            .optional()
            .describe("1-based code line numbers to highlight on this frame."),
          badges: z
            .record(z.string(), z.string())
            .optional()
            .describe("Small data badges to attach to boxes, keyed by box id."),
        }),
      )
      .min(1)
      .describe("Ordered frames; the learner steps or autoplays through them."),
    boxes: z
      .array(
        z.object({
          id: z.string().describe("Unique id, referenced by frame `active`/`badges`."),
          label: z.string().describe("Box label shown to the learner."),
          icon: z
            .string()
            .optional()
            .describe(
              "Iconify icon name, e.g. 'lucide:server', or a bare name resolved by the theme.",
            ),
        }),
      )
      .optional()
      .describe("A row of boxes that frames can highlight."),
    code: z
      .string()
      .optional()
      .describe("A code block (split on `\\n`) whose lines frames can highlight."),
    autoplayMs: z
      .number()
      .optional()
      .describe("Autoplay interval between frames in ms. Default: 2000."),
  }),
  example: {
    type: "frame-stepper",
    props: {
      boxes: [
        { id: "client", label: "Client", icon: "lucide:laptop" },
        { id: "server", label: "Server", icon: "lucide:server" },
        { id: "db", label: "Database", icon: "lucide:database" },
      ],
      frames: [
        { caption: "The client sends a request.", active: ["client", "server"] },
        {
          caption: "The server queries the database.",
          active: ["server", "db"],
          badges: { db: "12ms" },
        },
        { caption: "The response returns to the client.", active: ["server", "client"] },
      ],
    },
  },
};
