import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const checkpointMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "A consolidation pause: the things the reader should now be able to say out loud, each one self-rated.",
  whenToUse:
    "Place one every three or four modules, and before any module that builds on the ones before it. A long explanation without a pause lets the reader stack new concepts on a base they never checked, and the collapse shows up modules later where nobody can trace it. Reach BACK here: a checkpoint that only restates the module it follows measures working memory; one that asks for something from two modules ago measures whether the idea is retrievable at all, which is what you were trying to build. Prefer Checkpoint over Checklist when the reader should verify their own understanding mid-guide (Checklist is the keepsake they act on after it), and over Quiz when there is no single right answer to grade, only a sentence they can or cannot produce.",
  schema: z.object({
    items: z
      .array(
        z.object({
          text: content().describe(
            "One thing the reader should be able to say out loud, phrased as the explanation itself ('why a low hit rate makes a cache nearly worthless') rather than a topic ('hit rates'). If it can't be said in a sentence, it isn't one item.",
          ),
          revisit: optionalContent().describe(
            "Where to go back to if they can't say it — a module name or section title. Shown only when the reader answers 'not yet', which is the moment it is useful.",
          ),
        }),
      )
      .min(2)
      .max(6)
      .describe(
        "The things to consolidate, 2–5 in practice. More than that stops being a checkpoint and becomes a summary the reader skims.",
      ),
    title: optionalContent().describe(
      "Override the heading. Default: 'Before you move on, you should be able to explain'.",
    ),
    hint: optionalContent().describe("Override the instruction line under the heading."),
  }),
  example: {
    type: "checkpoint",
    props: {
      items: [
        {
          text: "Why a **low hit rate** makes a cache nearly worthless — you pay the lookup on every read and get the benefit on almost none.",
          revisit: "Module 2, the miss path",
        },
        {
          text: "What a TTL actually buys you, and what it costs in correctness.",
          revisit: "Module 3",
        },
        {
          text: "Which of your own reads tolerate stale data, and which never can.",
        },
      ],
    },
  },
};
