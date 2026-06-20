import { z } from "zod";

import type { WidgetNode } from "@/lib/registry";

/**
 * Metadata that makes each widget legible to an AI agent (e.g. behind an MCP
 * server) so it knows WHAT a widget is, WHEN to reach for it, the exact shape of
 * its JSON props, and a working example to imitate. Co-located with each widget
 * in `<widget>/<widget>.meta.ts` and assembled by the registry into the manifest.
 */
export interface WidgetMeta {
  /** Current schema version (must match the registry entry). */
  version: number;
  /** Catalog grouping, e.g. "Interactive", "Diagrams & data". */
  category: string;
  /** One-line human description (what it is). */
  summary: string;
  /**
   * AI-oriented guidance: WHEN to choose this widget. Write it for an agent
   * deciding which widget fits a teaching moment — name the learning intent it
   * serves and, when useful, contrast it with sibling widgets. 2-4 sentences.
   */
  whenToUse: string;
  /** Zod schema of the widget's JSON props (the generation target). */
  schema: z.ZodType;
  /** A valid example node — few-shot material for the agent. */
  example: WidgetNode;
}

/**
 * A widgetron JSON node (recursive). Used inside schemas for props that nest
 * other widgets. Kept loose on `props` so each widget's own schema does the
 * real validation when that child is checked.
 */
export const nodeSchema: z.ZodType<WidgetNode> = z.lazy(() =>
  z.object({
    type: z.string(),
    version: z.number().optional(),
    props: z.record(z.string(), z.unknown()).optional(),
  }),
);

/**
 * A "content" prop — the JSON form of a React.ReactNode. The agent may supply
 * plain text, a single nested widget node, or a list mixing both. Use this for
 * any prop typed `React.ReactNode` that is meant to hold rich/nested content
 * (e.g. a callout body, a slide). For short text-only props, prefer `z.string()`.
 */
export function content(): z.ZodType {
  const one = z.union([z.string(), nodeSchema]);
  return z.union([one, z.array(one)]);
}

/** Convenience: an optional content prop. */
export function optionalContent(): z.ZodType {
  return content().optional();
}
