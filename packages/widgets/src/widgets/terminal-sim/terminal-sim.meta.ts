import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const terminalSimMeta: WidgetMeta = {
  version: 1,
  category: "Reactive",
  summary:
    "A safe, simulated CLI: commands type themselves and print canned output, one per click at the learner's pace.",
  whenToUse:
    "Reach for this to walk a learner through a sequence of shell commands and their expected output without running anything real — install steps, a git flow, a build pipeline. The typewriter reveal and one-command-per-click pacing make a terminal session feel live and followable. Prefer it over FrameStepper when the steps are literal commands with textual output, and over a static code block when sequencing and the feel of execution matter.",
  schema: z.object({
    commands: z
      .array(
        z.object({
          cmd: z.string().describe("The command line the learner sees typed out."),
          output: z
            .string()
            .optional()
            .describe("The canned output printed after the command (supports newlines)."),
        }),
      )
      .min(1)
      .describe("Ordered commands; the learner reveals one per click."),
    windowTitle: z
      .string()
      .optional()
      .describe("Title shown in the terminal window chrome. Default: 'terminal'."),
    prompt: z
      .string()
      .optional()
      .describe("The shell prompt shown before each command. Default: '$'."),
    typingSpeedMs: z
      .number()
      .optional()
      .describe("Per-character typing speed in ms. Default: 28."),
  }),
  example: {
    type: "terminal-sim",
    props: {
      windowTitle: "bash",
      commands: [
        { cmd: "npm install", output: "added 248 packages in 6s" },
        { cmd: "npm run build", output: "✓ built in 1.2s" },
      ],
    },
  },
};
