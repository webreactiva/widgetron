# @webreactiva/registry

The **shadcn distribution registry** for Widgetron. It lets anyone drop a widget
straight into their own shadcn project — the source is copied in and rewritten to
their aliases — instead of depending on the `@webreactiva/widgetron` npm package.

> Two ways to consume Widgetron, pick per project:
>
> - **npm package** (`@webreactiva/widgetron`) — import components _and_ the JSON
>   config / AI-generation layer (`renderWidget`, `widgetManifest`, zod schemas).
> - **shadcn registry** (this package) — copy the widget source into your repo to
>   own and edit it. Ships the components only, not the JSON/meta layer.

## How it works

`registry.json` is **generated from the widget source** by [`build-registry.mjs`](./build-registry.mjs),
so it never drifts from the code (same spirit as the enriched manifest the library
already derives from its registry). The generator:

- emits one item per widget (`quiz`, `flashcards`, …) plus the shared foundations
  (`widgetron-tokens`, `widgetron-utils`, `widgetron-i18n`, `widgetron-icons`,
  `widgetron-formula`, `widgetron-button`, `widgetron-icon`, `widgetron-tooltip`);
- derives each item's npm `dependencies` and internal `registryDependencies`
  **from its actual imports** — including optional deps (`mermaid`, `canvas-confetti`)
  and cross-widget deps (e.g. `storyline` → `glossary` + `profile-quiz`);
- pulls each widget's `description`/`categories` from its `*.meta.ts`.

## Build

```bash
pnpm --filter @webreactiva/registry generate   # write registry.json from source
pnpm --filter @webreactiva/registry build       # generate + `shadcn build` → public/r/*.json
# or from the repo root:
pnpm registry:build
```

`shadcn build` inlines each file's source into a self-contained
`public/r/<name>.json`, served at `https://widgetron.dev/r/<name>.json`. Host
`public/` on any static host (the output is git-ignored — build it in CI / on deploy).

## Install a widget (consumer side)

```bash
# Prerequisite once per project — the design tokens every widget renders against:
npx shadcn@latest add https://widgetron.dev/r/widgetron-tokens.json

# Then any widget (its lib/primitive deps come along automatically):
npx shadcn@latest add https://widgetron.dev/r/quiz.json
```

Then `@import` the copied tokens into your Tailwind v4 CSS entry:

```css
@import "./styles/widgetron-tokens.css";
@import "./styles/widgetron-theme.css";
```

## Adding a widget

Nothing to do here — add the widget under `packages/widgets/src/widgets/<name>/`
following the library recipe, then re-run `generate`. The new item (with its
derived dependencies) appears in `registry.json` automatically.
