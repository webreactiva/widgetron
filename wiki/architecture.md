---
title: Architecture
type: architecture
responsibility: The monorepo map, the library's layers, and how a JSON node becomes a rendered widget.
sources:
  - packages/widgets/src/index.ts
  - apps/playground
  - apps/story-studio
  - package.json
synced: c032ded
related:
  - ./flows/render-widget.md
  - ./concepts/ai-generation-surface.md
  - ./concepts/aseptic-tokens.md
  - ./components/lib.md
---

Widgetron is a library of interactive learning widgets for building "explorable
explanation" dispensas. Widgets ship **aseptic** (semantic tokens only) and can
be skinned with an opt-in brand theme. The end goal: generate whole dispensas as
JSON from an AI agent.

## The monorepo

pnpm workspace, Node ≥22.12.

- **`packages/widgets`** — `@webreactiva/widgetron`, the library (React 19, TS,
  Tailwind v4, tsup). This is what the wiki mostly documents.
- **`apps/playground`** — a Vite app to browse/preview every widget in a truthful
  device-frame iframe.
- **`apps/story-studio`** — the `story` CLI and `.story.json` content that
  compiles storylines from the widget manifest.

## The library layers (`packages/widgets/src`)

- **`widgets/<name>/`** — each widget: `<name>.tsx`, `index.ts`, `<name>.meta.ts`.
  See [components/widgets](./components/widgets.md).
- **`primitives/`** — shadcn-compatible building blocks. See
  [components/primitives](./components/primitives.md).
- **`lib/`** — the non-visual core (registry, i18n, analytics, formula…). See
  [components/lib](./components/lib.md).
- **`styles/`** — `tokens.css` + `theme.css`. See
  [aseptic tokens](./concepts/aseptic-tokens.md).
- **`locales/`** — translation packs. See [i18n & labels](./concepts/i18n-labels.md).
- **`index.ts`** — the public entry point; everything is exported here.

## The JSON node system

Every widget is addressable as a serializable node `{ type, version?, props }`.
`renderWidget(node)` resolves it and renders — see
[the render flow](./flows/render-widget.md). A whole `storyline` is one node
tree, which is the AI-generation target. The metadata that makes this legible to
an agent is the [AI generation surface](./concepts/ai-generation-surface.md).

## Build & commands (from repo root)

- `pnpm dev` — the playground · `pnpm dev:studio` — story-studio.
- `pnpm -r typecheck` — **`tsc --noEmit` is the source of truth** (IDE diagnostics
  here are often stale).
- `pnpm check` — typecheck all + every test suite + library build. Run before
  calling a change done.
- `pnpm build` — tsup emits ESM + d.ts into `dist/`; published `exports` point at
  `dist/` via `publishConfig`, dev `exports` stay on `src/`.
