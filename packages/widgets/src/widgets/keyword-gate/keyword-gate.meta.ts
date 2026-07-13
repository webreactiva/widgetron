import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const keywordGateMeta: WidgetMeta = {
  version: 1,
  category: "Interactive",
  summary:
    "A gate that reveals a reward once the reader types the guide's keyword from memory (active recall).",
  whenToUse:
    "Use once per guide, right before the final reward, to make the reader retrieve THE word the episode elevated — typing it from memory consolidates it far better than any multiple-choice. Put the payoff (an outtake, a bonus prompt, a next-episode tease — any widget) in `reward`. Set `answer` to that word and lean on `normalize` so articles/accents/case don't lock anyone out; `hintAfterSeconds` escalates to a hint then a ghost so nobody stalls. Add `skipLabel` + `invite` for a cold reader who hasn't heard it — the reward opens anyway, preceded by the invite (e.g. an audio-clip of the word + a link). Prefer Surprise when there's nothing to recall and the reveal is just a click; prefer Quiz for graded comprehension. It emits `keyword_attempt` — the guide's recall metric.",
  schema: z.object({
    prompt: content().describe(
      "The ask shown above the input — e.g. 'The episode left one word. Type it.'",
    ),
    answer: z
      .union([z.string(), z.array(z.string())])
      .describe(
        "The accepted keyword, or several accepted spellings. Compared after normalization unless `normalize` is false.",
      ),
    reward: content().describe(
      "The payload revealed once the gate opens — plain text or any nested widget node (an audio-clip outtake, a prompt-template bonus, a cta…).",
    ),
    normalize: z
      .boolean()
      .optional()
      .describe(
        "Case/accent/article-insensitive matching (lowercase, strip accents, drop a leading article el/la/the…). Default: true.",
      ),
    hintAfterSeconds: z
      .number()
      .optional()
      .describe(
        "Idle seconds before the hint appears, then the same again before the answer shows as a ghost in the field. 0 disables both. Default: 5.",
      ),
    hint: optionalContent().describe(
      "The hint, shown after `hintAfterSeconds` of no typing — nudge toward the word without giving it away.",
    ),
    skipLabel: optionalContent().describe(
      "Skip-button label (e.g. 'I haven't heard it'). Omit to hide the skip path; when set, the reward opens without answering.",
    ),
    invite: optionalContent().describe(
      "Shown above the reward when opened via skip — the invite for a cold reader (e.g. an audio-clip of the word being said + a link to the episode).",
    ),
    celebrate: z
      .boolean()
      .optional()
      .describe("Fire confetti when the reader types the word correctly. Default: true."),
  }),
  example: {
    type: "keyword-gate",
    props: {
      prompt: "The episode left one word behind. Type it.",
      answer: "the smoke",
      hint: "Starts with S — it's exactly what you fought in the final boss.",
      skipLabel: "I haven't heard it",
      reward: {
        type: "callout-box",
        props: {
          variant: "aha",
          children:
            "You typed it from memory — that's the episode consolidated. See you in the next one.",
        },
      },
    },
  },
};
