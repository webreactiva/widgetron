import { z } from "zod";

/**
 * The Story Studio document envelope. The `story` field is a native widgetron
 * WidgetNode tree (what `renderWidget()` consumes); the envelope only adds
 * document-level metadata, audio sources and author policy (surprises, CTA).
 *
 * Node-safe module: no widgetron runtime imports, so it can run inside the
 * Vite dev-server plugin and the CLI without loading any React component.
 * Full tree validation (which needs the widget registry) lives in validate.ts.
 */

/** Minimal mirror of widgetron's WidgetNode (structure-validated here; each
 * node's props are validated against its real zod schema in validate.ts). */
export interface WidgetNode {
  type: string;
  version?: number;
  props?: Record<string, unknown>;
}

export const nodeSchema: z.ZodType<WidgetNode> = z.lazy(() =>
  z.object({
    type: z.string(),
    version: z.number().optional(),
    props: z.record(z.string(), z.unknown()).optional(),
  }),
);

export const ctaSettingsSchema = z
  .object({
    kind: z.enum(["link", "email-form"]).describe("CTA variant."),
    placement: z
      .union([z.literal("end"), z.number().int().positive()])
      .optional()
      .describe(
        'Where the CTA lands: "end" (default, the very last screen) or a 1-based index of the screen after which it is inserted (counted over the original flattened screens).',
      ),
    title: z.string().min(1).describe("The CTA heading (author copy)."),
    description: z.string().optional().describe("Supporting line under the title."),
    buttonLabel: z.string().optional().describe("Button copy override."),
    url: z
      .url()
      .optional()
      .describe("External destination. REQUIRED when kind=link."),
    privacyUrl: z
      .url()
      .optional()
      .describe("Privacy-policy link for the consent checkbox. REQUIRED when kind=email-form."),
    submitEndpoint: z
      .url()
      .optional()
      .describe("Where the email lands (webhook/provider). REQUIRED when kind=email-form."),
  })
  .superRefine((cta, ctx) => {
    if (cta.kind === "link" && !cta.url) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: 'a "link" CTA requires an external `url`',
      });
    }
    if (cta.kind === "email-form") {
      if (!cta.privacyUrl) {
        ctx.addIssue({
          code: "custom",
          path: ["privacyUrl"],
          message:
            'an "email-form" CTA requires `privacyUrl` (the consent checkbox links to it)',
        });
      }
      if (!cta.submitEndpoint) {
        ctx.addIssue({
          code: "custom",
          path: ["submitEndpoint"],
          message:
            'an "email-form" CTA requires `submitEndpoint` (where the email lands)',
        });
      }
    }
  });

export const surprisesSettingsSchema = z.object({
  mid: nodeSchema
    .optional()
    .describe("Widget node revealed mid-story (after screen ⌈N/2⌉). With fewer than 3 screens it merges into `end`."),
  end: nodeSchema
    .optional()
    .describe("Widget node appended as a closing screen (before the CTA, if any)."),
});

export const storyDocumentSchema = z.object({
  version: z.literal(1),
  meta: z.object({
    title: z.string().min(1),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "kebab-case slug expected"),
    lang: z.string().optional().describe('BCP-47, e.g. "es" or "en".'),
    theme: z
      .string()
      .optional()
      .describe('Any available [data-theme] name, e.g. "webreactiva".'),
    description: z.string().optional(),
    source: z
      .object({ type: z.string() })
      .catchall(z.unknown())
      .optional()
      .describe('Provenance, e.g. { type: "podcast", show: "wrp", episode: 315 }.'),
  }),
  audio: z
    .object({
      full: z.string().min(1).optional().describe("Full-episode source (URL or path)."),
      clips: z
        .array(
          z.object({
            id: z.string().min(1),
            src: z.string().min(1),
            start: z
              .number()
              .nonnegative()
              .optional()
              .describe("Fragment start (seconds in src) — src may be the full episode."),
            end: z.number().nonnegative().optional().describe("Fragment end (seconds in src)."),
            transcriptSrc: z.string().min(1).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  settings: z
    .object({
      surprises: surprisesSettingsSchema.optional(),
      cta: ctaSettingsSchema.optional(),
    })
    .optional(),
  story: nodeSchema,
});

export type StoryDocument = z.infer<typeof storyDocumentSchema>;
export type CtaSettings = z.infer<typeof ctaSettingsSchema>;

export interface EnvelopeValidation {
  valid: boolean;
  errors: string[];
  /** The parsed document when valid. */
  document?: StoryDocument;
}

/** Validate the envelope only (no widget registry involved — node-safe). */
export function validateEnvelope(input: unknown): EnvelopeValidation {
  const result = storyDocumentSchema.safeParse(input);
  if (result.success) {
    return { valid: true, errors: [], document: result.data };
  }
  return {
    valid: false,
    errors: result.error.issues.map((issue) => {
      const path = issue.path.length ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    }),
  };
}
