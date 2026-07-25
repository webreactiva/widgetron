---
title: i18n & labels
type: concept
applies_to: widget chrome (UI strings)
responsibility: How every user-facing widget string is customizable and translatable across three merge layers.
sources:
  - packages/widgets/src/lib/i18n.tsx
  - packages/widgets/src/locales/es.ts
synced: c032ded
related:
  - ./analytics-events.md
---

Every user-facing string in a widget is customizable and translatable. Widget
chrome uses `useLabels("<widget>", DEFAULT_LABELS, labels)`; UI strings are never
baked in inline.

## Three layers, merged (later wins)

1. built-in English defaults — each widget exports its `DEFAULT_*_LABELS`;
2. global overrides from `<WidgetronProvider labels={...} locale="..." iconSet="..." />`;
3. per-instance `labels={...}` prop on the widget.

Label values may be strings, React nodes, or **functions** (for interpolation /
pluralization), so a single dictionary can localize the whole library.

## Locale & icon set

`WidgetronProvider` also sets a BCP-47 `locale` (used for number formatting, see
`lib/formula`) and an `iconSet` — the default Iconify collection for bare icon
names, itself part of the theme (base uses `lucide`, the Web Reactiva theme uses
`pixelarticons`). Spanish copy lives in `locales/es.ts` (`esLabels`).
