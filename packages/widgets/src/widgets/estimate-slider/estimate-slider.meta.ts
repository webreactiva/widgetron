import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const estimateSliderMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "The reader guesses a number on a slider, commits, and then sees the real value next to their guess.",
  whenToUse:
    "Reach for this when the episode drops a COUNTER-INTUITIVE NUMBER and the lesson is the gap between what the reader assumes and what is true — a percentage, a cost, a duration, a multiplier. Making them commit first is what makes the real figure land; a ScrollStat only shows it. Prefer Scrubber when the reader should explore a model with no single right answer, and Quiz when the choice is between options rather than a point on a range. Use only with a number actually stated in the source.",
  schema: z.object({
    question: content().describe("The question the reader estimates an answer to."),
    min: z.number().describe("Lowest value the slider allows."),
    max: z.number().describe("Highest value the slider allows."),
    step: z.number().optional().describe("Slider granularity. Default: 1."),
    initial: z
      .number()
      .optional()
      .describe("Where the handle starts. Default: the midpoint of the range."),
    answer: z.number().describe("The true value, revealed after the reader commits."),
    tolerance: z
      .number()
      .optional()
      .describe(
        "How far off still counts as close, in value units. Default: 10% of the range.",
      ),
    unit: z
      .string()
      .optional()
      .describe("Suffix appended to every number (e.g. ' %', ' ms', '€')."),
    format: z
      .enum(["integer", "decimal", "currency", "percent", "compact"])
      .optional()
      .describe("Number format. Default: integer."),
    locale: z.string().optional().describe("BCP-47 locale for number formatting."),
    reveal: optionalContent().describe(
      "The payoff: why the real number is what it is. Shown after guessing.",
    ),
    source: optionalContent().describe(
      "Where the number comes from — a study, the episode, a benchmark.",
    ),
    celebrate: z
      .boolean()
      .optional()
      .describe("Fire confetti when the guess lands inside the tolerance. Default: true."),
    confidence: z
      .boolean()
      .optional()
      .describe(
        "Ask the reader how sure they are BEFORE they answer, then read the calibration back. Turn it on for the two or three checks in a guide where a misconception is likely — never on all of them (asked constantly it becomes a tic). Confident-and-wrong is the one outcome a plain check cannot surface, and the one an explanation exists to repair.",
      ),
  }),
  example: {
    type: "estimate-slider",
    props: {
      question:
        "What share of a developer's week actually goes into writing new code?",
      min: 0,
      max: 100,
      step: 5,
      answer: 30,
      tolerance: 10,
      unit: " %",
      reveal:
        "Reading, reviewing, meetings and debugging eat most of the week — which is why **making code readable** pays off more than typing it faster.",
      source: "Source: the episode's own numbers.",
    },
  },
};
