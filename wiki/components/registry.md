---
title: registry (shadcn distribution)
type: entity
responsibility: The separate package that generates a shadcn registry from the widget source so widgets install with `npx shadcn add`.
sources:
  - packages/registry/build-registry.mjs
  - packages/registry/registry.json
  - packages/registry/components.json
synced: 763c574
related:
  - ../architecture.md
  - ./lib.md
---

`@webreactiva/registry` (private) is the **shadcn distribution registry** — how a
consumer installs individual widgets with `npx shadcn add <url>` instead of the
whole npm package.

Do not confuse it with `lib/registry.tsx`: that is the runtime **JSON node /
render** registry (see [the render flow](../flows/render-widget.md)). Same word,
different job.

## How it works

`build-registry.mjs` reads `packages/widgets/src`, extracts each item's imports,
and resolves internal `@/…` deps to other registry items (the `INTERNAL` map) —
so the registry is **derived from the code**, the same spirit as the enriched
manifest. It writes `registry.json`.

## Derived, but only when someone runs it

This page used to claim the registry "never drifts". It does drift — `763c574`
found `registry.json` sitting at 41 items while `widgets/` held 55 folders, so 22
widgets had been added over months without anyone re-running the generator, and
`npx shadcn add` could not install any of them. Regenerating in that commit was
a one-line fix producing a 628-line diff.

Nothing runs `build-registry.mjs` on commit or in `pnpm check`, so the guarantee
is only as good as the habit. Two smaller symptoms of the same gap: the
`INTERNAL` map has no entry for `@/primitives/rich-text`, `@/lib/confetti`,
`@/lib/use-widget-events`, `@/lib/analytics` or `@/lib/leaflet`, so the generator
prints an "unmapped internal import" warning for nearly every widget and emits
items whose registry dependencies are incomplete — a `shadcn add` of most widgets
would fetch a component whose imports are not shipped alongside it. Both are
noted, not fixed, by the wiki.

- `pnpm registry:build` → `node build-registry.mjs && shadcn build registry.json
  --output public/r`, which emits self-contained `public/r/<name>.json` files for
  `npx shadcn add` (that second step needs network).
- Schemas: `ui.shadcn.com/schema/registry.json` + `registry-item.json`.
