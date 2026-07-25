---
title: Aseptic tokens & theming
type: concept
applies_to: every widget's styling
responsibility: Why widgets use only semantic design tokens, and how the opt-in Web Reactiva brand theme layers on top without touching a component.
sources:
  - packages/widgets/src/styles/tokens.css
  - packages/widgets/src/styles/theme.css
  - packages/widgets/src/styles/index.css
synced: c032ded
related:
  - ../architecture.md
---

The non-negotiable styling rule: **aseptic core + opt-in theme**.

- **Aseptic** means widgets use only *semantic* tokens — `bg-card`,
  `text-muted-foreground`, `--primary`, `color-mix(...)` — never a hardcoded
  brand color.
- **Opt-in theme** means brand styling lives entirely behind
  `[data-theme="webreactiva"]`; a widget never knows about it.

## Where it lives

- `styles/tokens.css` — the aseptic token set plus the Web Reactiva brand values.
- `styles/theme.css` — the `@theme inline` bridge (maps tokens to Tailwind v4)
  plus the shared animations.

## In practice

Design mobile-first and container-aware with `@container` queries; place controls
within thumb reach. Swapping the theme re-skins every widget at once because none
of them reference brand colors directly. The full rule set is in `CLAUDE.md` —
this page is the *why*, not the checklist.
