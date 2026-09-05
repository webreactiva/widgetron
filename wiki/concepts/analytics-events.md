---
title: Analytics events
type: concept
applies_to: interactive widgets
responsibility: The decoupled CustomEvent layer widgets use to emit semantic analytics — always on, inert without listeners, no adapter shipped.
sources:
  - packages/widgets/src/lib/analytics.ts
  - packages/widgets/src/lib/use-widget-events.ts
  - docs/analytics.md
  - packages/widgets/src/widgets/storyline/storyline.tsx
synced: a065d0a
related:
  - ./i18n-labels.md
  - ./pedagogy.md
---

Interactive widgets emit a native `widgetron:event` `CustomEvent` (bubbling,
always-on, inert when nothing is listening). No analytics library is bundled;
hosts subscribe and forward wherever they like (Swetrix, GTM, …).

## The hook

`useWidgetEvents(widget, id)` returns `{ ref, emit }`:

- put `ref` on the widget's root element (events dispatch from there so hosts can
  attribute them by bubbling — e.g. `closest` storyline section);
- call `emit(action, data)` **only inside user-triggered handlers**, never in
  effects. That is what keeps emissions immune to hydration and Strict Mode
  double-invocation.

## The contract

- `action` is snake_case; `data` is JSON-serializable and never carries PII.
  Where a widget holds reader-authored text, the payload carries a **measure of
  it, never the text**: `cta` emits `{ ok }` and not the email; `reflection`
  emits `{ length }` and not the answer, which never leaves `localStorage` on
  the reader's device (`reflection.tsx:118`, and a test asserts the text is
  absent from the event).
- Hosts subscribe via `onWidgetronEvent` (`WIDGETRON_EVENT` constant).
- Storyline tags each module `<section>` with `data-module-index` and emits
  `section_viewed` / `scroll_milestone` / `completed`.

## The layer consumes its own events

Bubbling is not only for hosts. `storyline` listens to the very same events its
children emit, which is why nothing had to be wired for the finale to know how
the session went: it counts `answered`, reads `calibration` for the
confident-and-wrong tally, and takes the shaky module straight off the emitting
element's `closest("[data-module-index]")` (`storyline.tsx`, `a065d0a`). A check
dropped anywhere in a guide participates in the ending without knowing the
storyline exists.

`calibration` is the payload worth a dashboard: `confident-wrong` marks a belief
the reader actively trusts and that does not hold. If one check produces it
across many readers, the guide found a real misconception — and the section that
was supposed to prevent it is what needs rewriting. See
[the pedagogy layer](./pedagogy.md).

Full action inventory and host wiring: `docs/analytics.md`.
