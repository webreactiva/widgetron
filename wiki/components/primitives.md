---
title: Primitives
type: entity
responsibility: The shadcn-compatible building blocks every widget composes on — button, universal icon, tooltip, and the RichText text layer.
sources:
  - packages/widgets/src/primitives
synced: a065d0a
related:
  - ../concepts/rich-text.md
  - ../concepts/pedagogy.md
---

Small, reusable pieces under `primitives/`, composable on the same shadcn
conventions as the widgets (cva, `cn`, `data-slot`, Radix `Slot`/`asChild`).

- **`button.tsx`** — the cva-driven button; supports `asChild` via Radix Slot.
- **`icon.tsx`** — the **universal** `Icon` (Iconify), not tied to one set. Bare
  names resolve against the theme's icon set (see
  [i18n & labels](../concepts/i18n-labels.md)). Registered for the JSON layer via
  `icon.meta.ts`.
- **`tooltip.tsx`** — Radix-based tooltip.
- **`rich-text.tsx`** — `RichText` / `renderRich`, the markdown-agnostic text
  layer. Its own page: [RichText](../concepts/rich-text.md).
- **`confidence.tsx`** — the calibration layer behind every scored widget's
  opt-in `confidence` prop (`ConfidenceScale`, `CalibrationNote`,
  `calibrationOf`). It is here rather than in a widget because three of them
  share it and none owns it; why it exists at all is
  [the pedagogy layer](../concepts/pedagogy.md).

Note the split: this folder is not only "visual atoms". `confidence.tsx` ships a
small pedagogical mechanic, which is what a primitive is for — a thing several
widgets need and none should own.

`index.ts` re-exports them; the public entry re-exports `@/primitives`.
