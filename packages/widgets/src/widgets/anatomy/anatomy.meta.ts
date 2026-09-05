import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const anatomyMeta: WidgetMeta = {
  version: 1,
  category: "Diagrams & data",
  summary:
    "One artifact decomposed into named, clickable parts — a prompt, a URL, a JSON payload, a config, a command.",
  whenToUse:
    "Reach for this when the source is a STRUCTURE rather than a process: something with parts the reader has to name and recognise again — a prompt, a URL, an HTTP response, a JSON payload, a config file, a shell command, a function signature. Two things it buys over a labelled list: the reader sees where each part physically sits in the whole, and they leave with the vocabulary — so put one early in nomenclature-heavy material and then use the same word for the same thing for the rest of the guide. Prefer Anatomy over Hotspots when the artifact is TEXT (Hotspots needs an image), over CodeTranslation when the reader should explore the parts in any order rather than read a numbered walkthrough, and over FlowDiagram when the thing has parts, not steps. Its natural check is a spot-the-bug or a drag-and-drop over the same artifact a module later.",
  schema: z.object({
    parts: z
      .array(
        z.object({
          label: content().describe(
            "The part's NAME — the word you will keep using for it for the rest of the guide. Short and reusable ('System prompt', 'Query string', 'TTL'), not a description.",
          ),
          text: z
            .string()
            .optional()
            .describe(
              "The literal fragment of the artifact this part is, rendered verbatim (whitespace kept, no markdown). Quote it EXACTLY as the reader will meet it — a paraphrased artifact is one they will not recognise when they open the real file. Omit only when the artifact is conceptual rather than textual.",
            ),
          note: content().describe(
            "What this part does, and what breaks without it. One or two sentences — the reader is holding the whole artifact in their head while reading it.",
          ),
        }),
      )
      .min(2)
      .describe(
        "The parts IN THE ORDER THEY APPEAR in the artifact — the widget assembles the artifact from them, so the order is the artifact.",
      ),
    label: optionalContent().describe(
      "What the artifact is, e.g. 'A production system prompt' or 'One product-page request'.",
    ),
    layout: z
      .enum(["lines", "inline"])
      .optional()
      .describe(
        "How the parts assemble: 'lines' (default) puts one part per line — prompts, config, JSON, code; 'inline' runs them together as one continuous string — a URL, a shell command, a header, a log line.",
      ),
    mono: z
      .boolean()
      .optional()
      .describe(
        "Render the artifact in monospace. Default: true. Set false for prose-shaped artifacts (a job ad, a commit message, a bug report).",
      ),
    hint: optionalContent().describe(
      "Override the instruction line. Default: 'Pick a part to inspect it.'",
    ),
  }),
  example: {
    type: "anatomy",
    props: {
      label: "One request URL",
      layout: "inline",
      parts: [
        {
          label: "Scheme",
          text: "https://",
          note: "Not decoration: it decides whether the query string below is encrypted in transit. On `http://` every part to the right is readable by anything on the path.",
        },
        {
          label: "Host",
          text: "api.example.com",
          note: "What DNS resolves and what the TLS certificate must match. A mismatch here is the error people misread as 'the API is down'.",
        },
        {
          label: "Path",
          text: "/v2/products/42",
          note: "The resource. `v2` is in the path rather than a header because it has to be cacheable — a CDN keys on the URL, not on your headers.",
        },
        {
          label: "Query string",
          text: "?fields=price,stock",
          note: "Changes the response body, so it is part of the cache key. This is where a well-meaning `?t=1699` cache-buster quietly gives every reader their own cache entry.",
        },
      ],
    },
  },
};
