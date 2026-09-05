import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const contrastMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "Expectation → reality → why: stages the gap between what people assume and what is actually true.",
  whenToUse:
    "Reach for this when the lesson IS the gap between a belief and reality — after a benchmark, a profiler run, a production incident, or a design decision that went the unobvious way. It is the move an explorable explanation rests on: a reader who never stated an expectation has nothing for reality to correct. Prefer Contrast over CalloutBox when the surprising fact only lands next to the wrong assumption it replaces, and over Quiz/PredictOutput when there is no question to ask, only a belief to break (those two generate the same shape from the reader's own wrong answer, so don't stack a Contrast right after one). `why` is where the teaching happens — without it this is just a fun fact.",
  schema: z.object({
    expected: content().describe(
      "The belief the reader is likely to hold going in. State it in the reader's own words, generously — a strawman teaches nothing, and the reader has to recognise their own model in it.",
    ),
    actual: content().describe(
      "What is actually the case. Concrete and specific: a number, a behaviour, an order of events — not 'it's more complicated than that'.",
    ),
    why: optionalContent().describe(
      "The explanation for the gap. Effectively required: the contrast without it is a fun fact, and the reader leaves with a corrected answer but the same broken model. Write this FIRST, then work backwards to the expectation it corrects.",
    ),
    expectedLabel: optionalContent().describe(
      "Override the eyebrow over `expected`, e.g. 'What the team predicted'. Default: 'What most people assume'.",
    ),
    actualLabel: optionalContent().describe(
      "Override the eyebrow over `actual`, e.g. 'What the profiler says'. Default: 'What actually happens'.",
    ),
    gate: z
      .boolean()
      .optional()
      .describe(
        "Hold `actual` and `why` behind a button so the reader commits to the expectation first. Default: true. Set false only when the same gap was just revealed by a check the reader already answered.",
      ),
    source: optionalContent().describe(
      "Where the real figure or behaviour comes from — a benchmark, a study, the episode. One line, and it lets the reader go further.",
    ),
  }),
  example: {
    type: "contrast",
    props: {
      expectedLabel: "What the team assumed",
      expected: "The JSON parsing is what makes the endpoint slow.",
      actualLabel: "What the profiler said",
      actual: "**94% of the time** was in N+1 queries. Parsing was 3 ms.",
      why: "Parsing is CPU work on data already in memory; each query is a round trip. Sixty round trips beat any amount of CPU — which is why *profile before you optimize* is not a slogan, it's the only way to find this.",
      source: "Measured on the product listing endpoint, 2024.",
    },
  },
};
