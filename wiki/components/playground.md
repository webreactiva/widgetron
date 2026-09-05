---
title: Playground
type: entity
responsibility: The Vite app that previews every widget in a truthful device frame — the place a new widget is verified by eye.
sources:
  - apps/playground/src
  - apps/playground/e2e
  - apps/playground/playwright.config.ts
synced: d2f4037
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
watches the outputs differ. `node-graph` is the one that most needs the *real
width*: its arrows are computed from the boxes' measured positions, so a
transform-scaled preview would draw them against the wrong geometry — the same
class of lie the iframe exists to prevent.

## The browser pass lives here too

`e2e/` is the suite for the checks jsdom **structurally** cannot make, and the
playground hosts it because the playground is already the honest host: it builds
the library, renders every widget, and puts each demo in a device-frame iframe.
That last part is not a testing trick — it is the shipping configuration, and it
is the only place the library's second-realm behaviour is exercised at all.

Two failure classes live behind that wall, and both shipped before the suite
existed. jsdom reports **every element as 0×0 at 0,0**, so a widget that draws
from its own measured layout (`node-graph`) can pass its whole unit file with
the geometry unverified. And jsdom **collapses every document into one realm**,
so a widget that talks to a frame it owns (`code-lab`) can attach its listener
to the wrong window and nothing anywhere says so — the run just never finishes.

Its first green run also found what nothing was watching: every Mermaid diagram
in the playground was failing to render. See
[the widgets module page](./widgets.md) for that one.

What the suite gates on is **same-origin** failures. The first version kept an
allowlist of third-party hosts to ignore, and it grew on every run — each entry
being something the suite had quietly stopped watching. Origin is the line that
does not move: a webfont, an icon API, a basemap tile or a demo image is a
dependency rather than code under test, so those are reported and never fatal.

`pnpm e2e` is deliberately **outside `pnpm check`**: it needs a browser binary,
and a contributor without one would watch the entire guarantee go red for a
reason unrelated to their change. The trade is that it has to be reached for
deliberately — CLAUDE.md names the triggers (measurement, realms, sandboxes,
lazy dependencies). `PLAYWRIGHT_CHROMIUM_PATH` points it at a system Chromium;
`reuseExistingServer` is off on purpose, because a suite that tests a build will
otherwise happily report on the previous one.

`openspec-peaks.ts` supplies sample data for the data-driven demos so the
previews show something plausible instead of empty states.
