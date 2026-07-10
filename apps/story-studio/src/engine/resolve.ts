import type { CtaSettings, StoryDocument, WidgetNode } from "./schema";

/**
 * Materialize author policy into the story tree (decision D-004): surprises
 * and the CTA are DECLARED in `settings` and INJECTED here, deterministically,
 * at build/validate time — the client only ever renders an already-resolved
 * tree. Placement semantics:
 *
 *   - `mid`  → inserted as a new screen after screen ⌈N/2⌉, where N is the
 *     total number of screens flattened across modules in reading order.
 *     With N < 3 there is no meaningful middle: it merges into `end`.
 *   - `end`  → appended as the last screen of the last module.
 *   - CTA    → the storyline's `outro` slot, rendered after the built-in
 *     completion finale (the reader is celebrated first, pitched second),
 *     unless `placement` is a 1-based screen index (counted over the ORIGINAL
 *     flattened screens, so `mid` insertion never shifts it).
 */
export function resolveStory(doc: StoryDocument): WidgetNode {
  const story = structuredClone(doc.story) as WidgetNode;
  if (story.type !== "storyline") return story; // reported by validate.ts

  // The document's own metadata becomes the course cover: the storyline
  // renders `title`/`description` as an opening section, so authors never
  // duplicate meta.title inside the tree.
  const props = (story.props ??= {});
  props.title ??= doc.meta.title;
  if (doc.meta.description) props.description ??= doc.meta.description;

  // Challenge mode: declared in settings, injected like surprises/CTA (D-004).
  if (doc.settings?.challenge) props.challenge ??= doc.settings.challenge.label;

  // Game mode: `settings.lives` is the signature of the `juego` format,
  // injected the same way. An explicit `story.props.lives` wins (`??=`).
  if (doc.settings?.lives)
    props.lives ??= {
      total: doc.settings.lives.total,
      label: doc.settings.lives.label,
    };

  const surprises = doc.settings?.surprises;
  const cta = doc.settings?.cta;
  if (!surprises?.mid && !surprises?.end && !cta) return story;
  const modules = props.modules as Array<{ screens?: WidgetNode[] }> | undefined;
  if (!Array.isArray(modules) || modules.length === 0) return story;
  for (const m of modules) m.screens ??= [];

  const totalScreens = modules.reduce((n, m) => n + m.screens!.length, 0);

  // Positional insertions, in original flattened coordinates. Applied from the
  // highest position down so earlier splices don't shift later ones.
  const insertions: Array<{ afterScreen: number; node: WidgetNode }> = [];
  let midMergesToEnd = false;

  if (surprises?.mid) {
    if (totalScreens < 3) {
      midMergesToEnd = true;
    } else {
      insertions.push({
        afterScreen: Math.ceil(totalScreens / 2),
        node: surprises.mid,
      });
    }
  }

  let ctaAtEnd = false;
  let ctaNode: WidgetNode | undefined;
  if (cta) {
    ctaNode = buildCtaNode(cta);
    const placement = cta.placement ?? "end";
    if (placement === "end" || placement >= totalScreens) {
      ctaAtEnd = true;
    } else {
      insertions.push({ afterScreen: placement, node: ctaNode });
    }
  }

  insertions.sort((a, b) => b.afterScreen - a.afterScreen);
  for (const { afterScreen, node } of insertions) {
    let before = 0;
    for (const m of modules) {
      const screens = m.screens!;
      if (afterScreen <= before + screens.length) {
        screens.splice(afterScreen - before, 0, structuredClone(node));
        break;
      }
      before += screens.length;
    }
  }

  const lastScreens = modules[modules.length - 1].screens!;
  if (midMergesToEnd) lastScreens.push(structuredClone(surprises!.mid!));
  if (surprises?.end) lastScreens.push(structuredClone(surprises.end));
  if (ctaAtEnd && ctaNode) props.outro = ctaNode;

  return story;
}

/** The envelope's CTA policy becomes a plain presentational `cta` node. */
function buildCtaNode(cta: CtaSettings): WidgetNode {
  const props: Record<string, unknown> = {
    variant: cta.kind,
    title: cta.title,
  };
  if (cta.description) props.description = cta.description;
  if (cta.buttonLabel) props.buttonLabel = cta.buttonLabel;
  if (cta.url) props.url = cta.url;
  if (cta.privacyUrl) props.privacyUrl = cta.privacyUrl;
  if (cta.submitEndpoint) props.submitEndpoint = cta.submitEndpoint;
  return { type: "cta", props };
}
