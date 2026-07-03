import { validateWidgetTree } from "@webreactiva/widgetron";

import { validateEnvelope, type StoryDocument, type WidgetNode } from "./schema";
import { resolveStory } from "./resolve";

/**
 * Full document validation: envelope (zod) + author rules + the RESOLVED
 * widget tree against every widget's real schema (recursive, with error
 * paths for agent self-correction). What ships is exactly what was validated.
 *
 * Imports the widget registry, so it runs in the browser (editor), in Vitest,
 * and under `tsx` (CLI) — but not inside the esbuild-bundled vite.config.
 */
export interface StoryValidation {
  valid: boolean;
  errors: string[];
  document?: StoryDocument;
  /** The tree with surprises + CTA injected (what render ships). */
  resolved?: WidgetNode;
}

export function validateStoryDocument(input: unknown): StoryValidation {
  const envelope = validateEnvelope(input);
  if (!envelope.valid || !envelope.document) return envelope;

  const doc = envelope.document;
  const errors: string[] = [];

  const hasInjections =
    doc.settings?.surprises?.mid !== undefined ||
    doc.settings?.surprises?.end !== undefined ||
    doc.settings?.cta !== undefined;
  if (hasInjections && doc.story.type !== "storyline") {
    errors.push(
      `story: surprises/CTA settings need a "storyline" root (got "${doc.story.type}") — the engine injects them as screens`,
    );
  }

  const resolved = resolveStory(doc);
  errors.push(...validateWidgetTree(resolved).errors);

  return { valid: errors.length === 0, errors, document: doc, resolved };
}
