---
title: Widgets
type: entity
responsibility: The interactive learning widgets — how each is structured, the families they fall into, and where the authoritative list lives.
sources:
  - packages/widgets/src/widgets
  - packages/widgets/src/lib/registry.tsx
synced: a065d0a
related:
  - ./widgets/quiz.md
  - ./widgets/code-diff.md
  - ../decisions/assessment.md
  - ../flows/render-widget.md
  - ../concepts/pedagogy.md
---

The bulk of the library: ~65 widgets, each a self-contained folder. This is a
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
  spot-the-bug, sort-steps, estimate-slider, reflection, checkpoint, contrast,
  profile-quiz. See [which one when](../decisions/assessment.md).
- **Narrative & scroll** — storyline, scrollytelling, backdrop-section,
  sticky-pan, story-map, frame-stepper, scroll-stat.
- **Media** — audio-clip, radial-audiogram, karaoke-stage, episode-player,
  video-clip, figure.
- **Diagrams & data** — flow-diagram, mermaid-diagram, draw-diagram,
  decision-tree, data-chart, infographic, timeline, comparison-table.
- **Text & motion** — kinetic-headline, decode-headline, tangle-text,
  unmask-strip, prose, section-header, callout-box, quote, code-translation,
  [code-diff](./widgets/code-diff.md), tabs.
- **Interactive extras** — drag-and-drop, hotspots, anatomy, compare-slider,
  scrubber, code-lab, terminal-sim, group-chat, keyword-gate, cta, checklist.

(Grouping is descriptive; each widget's real `category` lives in its meta.)

## The four that came from outside

`contrast`, `checkpoint`, `anatomy` and `code-lab` (`683985b`) are the only
widgets in the library that were not designed from a content need but from a
**gap**: the `make-it-learnable` skill's vocabulary was mapped onto the catalog
and these four had no equivalent. That provenance shows in their shape — each
one carries a teaching move rather than a layout, and the reasoning lives in
[the pedagogy layer](../concepts/pedagogy.md).

`code-lab` is the one with a genuinely different risk profile: it **executes**
author-written JavaScript, where every other widget only renders content. Each
variant runs in its own iframe sandboxed to `allow-scripts` — no same-origin
access, no DOM, no cookies — with a parent-side time budget that blanks the
frame, which is the only way to interrupt script in a frame we do not own
(`code-lab.tsx`). The upstream skill ran the same mechanic inline because
browsers block sandboxed frames on `file://`; a guide served over HTTP has no
such constraint, so widgetron took the isolation.

## Deterministic initial state

Three widgets start in a state the reader did not choose — sort-steps scrambles
its steps, surprise picks a variant, flashcards orders a deck — and none of them
may reach for `Math.random()` while rendering: server and client would disagree
and hydration would tear. `sort-steps.tsx:57` is the worked example — a mulberry32
PRNG with a constant seed, plus a guard that swaps two items when the "shuffle"
happens to land on the answer. Same input, same starting order, every render and
every environment.

The same instinct runs through the reward side: confetti and completion banners
fire only on an interaction the reader actually performed, never on the hydration
of an already-finished state (`checklist.tsx`, `reflection.tsx`, `sort-steps.tsx`
all keep a ref for exactly this).

## Adding one

Follow the recipe in `CLAUDE.md` (component → index → meta → registry →
public export → locale → playground catalog → typecheck+test). This wiki
documents what exists; the recipe is the how-to.
