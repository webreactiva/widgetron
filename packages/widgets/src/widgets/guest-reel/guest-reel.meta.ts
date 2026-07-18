import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";

export const guestReelMeta: WidgetMeta = {
  version: 1,
  category: "Text & layout",
  summary:
    "A horizontal scroll-snap reel with the best things the guest said — each card a regular quote.",
  whenToUse:
    "Use to close an interview module with 3–5 of the guest's best quotes — a thumb-friendly horizontal reel on mobile. Each card is a regular quote (monogram, minute, optional audio clip). Prefer a single quote when only one line matters, and interview-transcript for a full exchange.",
  schema: z.object({
    guest: z.string().describe("The guest whose words these are (required)."),
    guestRole: z
      .string()
      .optional()
      .describe("Their role or context, e.g. 'Staff engineer'."),
    quotes: z
      .array(
        z.object({
          text: z.string().describe("The quoted words."),
          timestamp: z.string().optional().describe("Episode moment, e.g. '12:40'."),
          clip: z
            .object({
              src: z.string().describe("Audio URL."),
              start: z.number().optional(),
              end: z.number().optional(),
              transcriptSrc: z.string().optional(),
            })
            .optional()
            .describe("Audio of the quoted moment."),
        }),
      )
      .min(1)
      .describe("3–5 of the best things they said (required)."),
  }),
  example: {
    type: "guest-reel",
    props: {
      guest: "Laura G.",
      guestRole: "Staff engineer",
      quotes: [
        {
          text: "A finished side project is worth more than five half-learned frameworks.",
          timestamp: "12:40",
        },
        {
          text: "Seniority isn't knowing more. It's leaving fewer fires burning when you go.",
          timestamp: "38:51",
        },
      ],
    },
  },
};
