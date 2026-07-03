import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { content, optionalContent } from "@/lib/widget-meta";

export const ctaMeta: WidgetMeta = {
  version: 1,
  category: "Conversion",
  summary:
    "A call-to-action with two variants: an external link, or an email-capture form with privacy consent.",
  whenToUse:
    "Use for the single conversion moment of a guide — usually the last screen. Choose `link` to send the reader to an external destination (a course, a signup page), or `email-form` to capture an address behind a required privacy-consent checkbox. One CTA per guide keeps the ask clear; reach for Surprise or CalloutBox for softer nudges mid-flow.",
  schema: z.object({
    variant: z
      .enum(["link", "email-form"])
      .describe(
        "Which call-to-action: 'link' opens an external URL, 'email-form' captures an email.",
      ),
    title: content().describe("Headline of the call-to-action."),
    description: optionalContent().describe(
      "Optional supporting line under the title.",
    ),
    buttonLabel: z
      .string()
      .optional()
      .describe("Author copy for the link button (link variant)."),
    url: z
      .string()
      .optional()
      .describe("Destination for the 'link' variant (opens in a new tab)."),
    privacyUrl: z
      .string()
      .optional()
      .describe(
        "Privacy-policy URL — turns the consent label into a link (email-form).",
      ),
    submitEndpoint: z
      .string()
      .optional()
      .describe("Endpoint the 'email-form' variant POSTs { email } to as JSON."),
  }),
  example: {
    type: "cta",
    props: {
      variant: "link",
      title: "Keep going",
      description: "The full course picks up right where this guide ends.",
      buttonLabel: "Start the course",
      url: "https://example.com/course",
    },
  },
};
