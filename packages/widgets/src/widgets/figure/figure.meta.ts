import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { optionalContent } from "@/lib/widget-meta";

export const figureMeta: WidgetMeta = {
  version: 1,
  category: "Media",
  summary:
    "An image with an optional caption and source credit — a captioned figure.",
  whenToUse:
    "Use to drop a standalone image into the reading flow with a caption and, when needed, a source credit and a link back to where it came from. Reach for it for diagrams, screenshots, charts-as-images, or any illustrative picture the author supplies as a URL. Prefer Hotspots when the image needs clickable annotations, and CompareSlider for a before/after wipe. Images are referenced by URL — there is no asset upload — so only use real URLs the author provided.",
  schema: z.object({
    src: z
      .string()
      .describe(
        "Image URL. There is no asset upload — reference the image by URL.",
      ),
    alt: z
      .string()
      .describe(
        "Alt text describing the image for screen readers. Use an empty string only for purely decorative images.",
      ),
    caption: optionalContent().describe("Caption shown under the image."),
    credit: optionalContent().describe(
      "Source / attribution line, shown muted under the caption. Use it to credit where the image came from.",
    ),
    href: z
      .string()
      .optional()
      .describe("Link to the image's source; the image opens it in a new tab."),
    aspect: z
      .string()
      .optional()
      .describe(
        "CSS aspect ratio to crop the frame to, e.g. '16/9'. Omit to size to the image's natural ratio.",
      ),
    fit: z
      .enum(["contain", "cover"])
      .optional()
      .describe(
        "How the image fills the frame when `aspect` is set. Default: 'cover'.",
      ),
  }),
  example: {
    type: "figure",
    props: {
      src: "https://example.com/round-trip.png",
      alt: "A request travels from the browser to the server and back",
      caption: "The round trip every page load makes.",
      credit: "Source: **Web Reactiva**",
      aspect: "16/9",
    },
  },
};
