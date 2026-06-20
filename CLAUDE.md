# Widgetron

A library of **interactive learning widgets** (quizzes, flashcards, diagrams, scrollytelling…) for building "explorable explanation" dispensas. Built on **shadcn conventions + Tailwind CSS v4**. Widgets ship **aseptic** (semantic design tokens only) and can be skinned with an opt-in brand theme. The end goal: generate whole dispensas as JSON from an AI agent.

## Monorepo layout

- `packages/widgets` — `@webreactiva/widgetron`, the library (React 19, TS, Tailwind v4, tsup).
- `apps/playground` — `@webreactiva/playground`, a Vite app to browse/preview every widget (truthful device-frame iframe).
- `docs/` — research on component-library organization + reference libraries.

pnpm workspace · Node ≥22.12 · pnpm 10.30.

## Commands (from repo root)

- `pnpm dev` — run the playground.
- `pnpm -r typecheck` — typecheck every package. **`tsc --noEmit` is the source of truth** — IDE/LSP diagnostics in this repo are often stale (phantom "Cannot find module '@/…'", "Cannot find name 'Array'"); ignore them and trust `tsc`.
- `pnpm --filter @webreactiva/widgetron test` — run the Vitest suite.
- `pnpm build` — build the library with tsup.

## Library structure (`packages/widgets/src`)

- `widgets/<name>/` — each widget: `<name>.tsx`, `index.ts`, `<name>.meta.ts`.
- `primitives/` — shadcn-compatible building blocks: `button`, `icon` (universal, Iconify), `tooltip`.
- `lib/` — `utils` (`cn`), `i18n` (provider + `useLabels`), `formula`, `icons` (inline dependency-free control SVGs), `registry` (JSON layer), `widget-meta` (zod metadata).
- `styles/` — `tokens.css` (aseptic tokens + Web Reactiva brand), `theme.css` (`@theme inline` bridge + animations).
- `locales/` — translation packs (e.g. `es.ts`).
- `index.ts` — the public entry point (everything is exported from here).

## Core conventions (non-negotiable)

- **All library code and copy is English.** No hardcoded Spanish (or any other language) in components or playground demos.
- **Aseptic core + opt-in theme.** Widgets use only semantic tokens (`bg-card`, `text-muted-foreground`, `--primary`, `color-mix`…). Brand styling lives behind `[data-theme="webreactiva"]`. Never hardcode brand colors in a widget.
- **`@/` alias for cross-folder imports** (`@/lib/utils`, `@/primitives/button`), never relative `../`. Same-folder stays `./x`.
- **Composable on shadcn deps**: cva, `cn` (clsx + tailwind-merge), `data-slot`, Radix Slot/`asChild`. Optional deps (`mermaid`, `canvas-confetti`) are lazy-imported.
- **Text is customizable + translatable.** Widget chrome uses `useLabels("<widget>", DEFAULT_LABELS, labels)`; add Spanish to `locales/es.ts`. Don't bake UI strings inline.
- **Icons are universal** via the `Icon` component (Iconify) — not tied to one set. Bare names resolve against the theme's icon set.
- **Mobile-first / container-aware.** Design for mobile→desktop with `@container` queries; place controls within thumb reach.

## JSON config + AI-generation surface

Every widget is also addressable as a serializable node `{ type, version?, props }`. `renderWidget(node)` resolves it via `widgetRegistry`, runs `migrate`/`adapt`, and renders. A whole `storyline` is one node tree — the AI-generation target.

Each widget carries metadata in `<name>.meta.ts` (`WidgetMeta`): `category`, `summary`, **`whenToUse`** (AI-oriented: when to pick this widget vs siblings), a zod `schema`, and a valid `example`. The registry assembles these into the MCP-ready surface:

- `getWidgetManifestJSON()` — every type with `whenToUse` + JSON Schema (zod→JSON Schema) + example.
- `validateWidgetNode(node)` / `validateWidgetTree(node)` — validate generated JSON (recursive, with error paths for self-correction).

## Adding a widget (the recipe)

1. `widgets/<name>/<name>.tsx` — component (aseptic tokens, `useLabels`, `data-slot`, `displayName`, `@/` imports).
2. `widgets/<name>/index.ts` — re-export it.
3. `widgets/<name>/<name>.meta.ts` — `WidgetMeta` (version, category, summary, `whenToUse`, zod `schema`, valid `example`).
4. `lib/registry.tsx` — import the component + meta; add an entry `"<name>": { ...<name>Meta, component: <Component> }` (with `adapt` if props nest nodes/icons).
5. `index.ts` — `export * from "@/widgets/<name>"`.
6. `locales/es.ts` — Spanish labels (if it has UI chrome).
7. `apps/playground/src/catalog.tsx` — add a catalog entry + demo; slot its id into a category.
8. Verify: `pnpm -r typecheck` + `pnpm --filter @webreactiva/widgetron test`.
