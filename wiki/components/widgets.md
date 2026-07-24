---
title: Widgets
type: entity
responsibility: The interactive learning widgets — how each is structured, the families they fall into, and where the authoritative list lives.
sources:
  - packages/widgets/src/widgets
  - packages/widgets/src/lib/registry.tsx
updated: 2026-07-24
synced: c032ded
related:
  - ./widgets/quiz.md
  - ../decisions/assessment.md
  - ../flows/render-widget.md
---

The bulk of the library: ~57 widgets, each a self-contained folder. This is a
**module** page — component pages under `widgets/` document individual units.

## Anatomy of a widget

`widgets/<name>/` holds:

- `<name>.tsx` — the component (aseptic tokens, `useLabels`, `data-slot`,
  `displayName`, `@/` imports; free text via `RichText`; analytics via
  `useWidgetEvents` where it has meaningful interactions);
- `index.ts` — re-export;
- `<name>.meta.ts` — the `WidgetMeta` (version, category, summary, `whenToUse`,
  zod schema, example).

It is then wired into `lib/registry.tsx` (with an `adapt` when props nest nodes or
icons) and exported from `src/index.ts`. **The registry is the authoritative
list** of what exists.

## Families (by teaching intent)

- **Assessment** — quiz, flashcards, fill-in-the-blanks, predict-output,
  spot-the-bug, profile-quiz. See [which one when](../decisions/assessment.md).
- **Narrative & scroll** — storyline, scrollytelling, backdrop-section,
  sticky-pan, story-map, frame-stepper, scroll-stat.
- **Media** — audio-clip, radial-audiogram, karaoke-stage, episode-player,
  video-clip, figure.
- **Diagrams & data** — flow-diagram, mermaid-diagram, draw-diagram,
  decision-tree, data-chart, infographic, timeline.
- **Text & motion** — kinetic-headline, decode-headline, tangle-text,
  unmask-strip, prose, section-header, callout-box, quote.
- **Interactive extras** — drag-and-drop, hotspots, compare-slider, scrubber,
  terminal-sim, group-chat, keyword-gate, cta, checklist.

(Grouping is descriptive; each widget's real `category` lives in its meta.)

## Adding one

Follow the recipe in `CLAUDE.md` (component → index → meta → registry →
public export → locale → playground catalog → typecheck+test). This wiki
documents what exists; the recipe is the how-to.
