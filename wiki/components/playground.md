---
title: Playground
type: entity
responsibility: The Vite app that previews every widget in a truthful device frame — the place a new widget is verified by eye.
sources:
  - apps/playground/src
synced: a065d0a
related:
  - ./widgets.md
  - ../architecture.md
---

A browsing app for the library: pick a widget, see it render. It exists because
a widget can typecheck, pass its tests and still be wrong — cramped on a phone,
unreadable in the brand theme, an animation that does not actually move.

## The device frame is the point

`ViewportFrame.tsx` renders each demo inside a real **iframe** at a real device
width, not a CSS-scaled box. That distinction matters for this library
specifically: widgets are built mobile-first with `@container` queries, and a
container query only reports the truth when the container is genuinely that
size. A transform-scaled preview would report the desktop width and quietly
render the wrong layout — the exact bug the playground exists to catch.

## Where the catalog lives

`catalog.tsx` holds one entry and one demo per widget, grouped into categories.
It is **step 7 of adding a widget** and the easiest to forget: the widget works,
its tests pass, and it is invisible here until someone adds the entry. Nothing
enforces it — `catalog.tsx` is a hand-maintained list, not derived from the
registry, so a widget can exist in the library and be missing from the
playground without any check failing.

`code-lab` is the demo that most needs this frame rather than a screenshot: it
only proves anything when someone actually presses Run on both variants and
watches the outputs differ.

`openspec-peaks.ts` supplies sample data for the data-driven demos so the
previews show something plausible instead of empty states.
