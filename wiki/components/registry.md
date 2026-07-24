---
title: registry (shadcn distribution)
type: entity
responsibility: The separate package that generates a shadcn registry from the widget source so widgets install with `npx shadcn add`.
sources:
  - packages/registry/build-registry.mjs
  - packages/registry/registry.json
  - packages/registry/components.json
updated: 2026-07-24
synced: c032ded
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
so the registry is **derived from the code and never drifts**, the same spirit as
the enriched manifest. It writes `registry.json`.

- `pnpm registry:build` → `node build-registry.mjs && shadcn build registry.json
  --output public/r`, which emits self-contained `public/r/<name>.json` files for
  `npx shadcn add` (that second step needs network).
- Schemas: `ui.shadcn.com/schema/registry.json` + `registry-item.json`.
