---
title: Primitives
type: entity
responsibility: The shadcn-compatible building blocks every widget composes on — button, universal icon, tooltip, and the RichText text layer.
sources:
  - packages/widgets/src/primitives
synced: c032ded
related:
  - ../concepts/rich-text.md
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

`index.ts` re-exports them; the public entry re-exports `@/primitives`.
