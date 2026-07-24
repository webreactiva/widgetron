---
title: lib
type: entity
responsibility: The non-visual core — the JSON registry, metadata, i18n, analytics, formula, icons and utilities that widgets share.
sources:
  - packages/widgets/src/lib
updated: 2026-07-24
synced: c032ded
related:
  - ../flows/render-widget.md
  - ../concepts/ai-generation-surface.md
  - ../concepts/analytics-events.md
  - ../concepts/i18n-labels.md
---

Everything under `lib/` that isn't a visible component.

- **`registry.tsx`** — the JSON node layer: `widgetRegistry`, `renderWidget`, the
  manifest and validation. See [the render flow](../flows/render-widget.md) and
  the [AI generation surface](../concepts/ai-generation-surface.md).
- **`widget-meta.ts`** — the `WidgetMeta` type plus `nodeSchema` / `content()`
  helpers for props that nest widgets.
- **`i18n.tsx`** — the labels/locale/icon-set provider. See
  [i18n & labels](../concepts/i18n-labels.md).
- **`analytics.ts`** + **`use-widget-events.ts`** — the CustomEvent layer. See
  [analytics events](../concepts/analytics-events.md).
- **`formula.ts`** — `evaluateFormula` / `formatValue` / `NumberFormat` (locale
  number formatting for data widgets).
- **`icons.tsx`** — inline, dependency-free control SVGs (play/pause etc.),
  distinct from the universal Iconify `Icon`.
- **`confetti.ts`** — lazy `canvas-confetti` for completion rewards.
- **`leaflet.ts`** — lazy Leaflet loader for the `map` widget.
- **`utils.ts`** — `cn` (clsx + tailwind-merge).
