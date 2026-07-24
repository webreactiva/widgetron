---
title: Analytics events
type: concept
applies_to: interactive widgets
responsibility: The decoupled CustomEvent layer widgets use to emit semantic analytics — always on, inert without listeners, no adapter shipped.
sources:
  - packages/widgets/src/lib/analytics.ts
  - packages/widgets/src/lib/use-widget-events.ts
  - docs/analytics.md
updated: 2026-07-24
synced: c032ded
related:
  - ./i18n-labels.md
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
- Hosts subscribe via `onWidgetronEvent` (`WIDGETRON_EVENT` constant).
- Storyline tags each module `<section>` with `data-module-index` and emits
  `section_viewed` / `scroll_milestone` / `completed`.

Full action inventory and host wiring: `docs/analytics.md`.
