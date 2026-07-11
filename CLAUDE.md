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
- `pnpm build` — build the library with tsup (ESM + d.ts into `dist/`, styles copied; published `exports` point at `dist/` via `publishConfig`, dev `exports` stay on `src/`).
- `pnpm check` — the full guarantee: typecheck all + every test suite (widgets + story-studio, including the `story render` e2e) + library build. Run it before calling any change done.

## Library structure (`packages/widgets/src`)

- `widgets/<name>/` — each widget: `<name>.tsx`, `index.ts`, `<name>.meta.ts`.
- `primitives/` — shadcn-compatible building blocks: `button`, `icon` (universal, Iconify), `tooltip`, `rich-text` (`RichText`/`renderRich` — the markdown-agnostic text layer).
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
- **Markdown-agnostic text.** Every author-facing free-text slot (titles, descriptions, questions, feedback, chat/message copy, list items, callout/quote/prose bodies…) renders through `RichText` (`@/primitives/rich-text`) — wrap it: `<RichText>{value}</RichText>`. The JSON generation surface can only send **strings**, so this is what makes `**bold**`, `*italic*`, `` `code` ``, `[links](url)`, `\n` breaks and `[[term]]` glossary tooltips (resolved via `GlossaryProvider`/`InlineTermContext`; brackets stripped without one) actually format instead of showing raw markers; non-string nodes pass through untouched. It's a tiny dependency-free inline parser (no markdown package, builds real elements — no `dangerouslySetInnerHTML`) and adds no wrapper element, so host `[&_a]`/`[&_code]` styles still apply. Do **not** wrap: content rendered inside SVG `<text>` (SVG can't render HTML), code shown literally, or strings carrying their own syntax (`{{slots}}`, mermaid `chart`).
- **Semantic analytics events.** Interactive widgets emit a native `widgetron:event` CustomEvent (bubbling, always-on, inert without listeners) via the internal `useWidgetEvents` hook — `ref` on the root, `emit(action, data)` **only inside user-triggered handlers** (never effects, so hydration and Strict Mode can't double-fire). Actions are snake_case; `data` is JSON-serializable and never carries PII. Storyline emits `section_viewed`/`scroll_milestone`/`completed` and tags each module `<section>` with `data-module-index`. Hosts subscribe via `onWidgetronEvent` and forward to Swetrix/GTM/wherever — no adapters shipped. See `docs/analytics.md`.
- **Reward completion.** Interactive widgets that can be "finished" (quiz answered right, checklist fully ticked) pay it off — a completion message plus an optional confetti burst via the lazy `canvas-confetti` (`celebrate` prop, default on, reduced-motion-safe, and only on a reader-triggered completion, never on hydration of an already-done state).
- **Icons are universal** via the `Icon` component (Iconify) — not tied to one set. Bare names resolve against the theme's icon set.
- **Mobile-first / container-aware.** Design for mobile→desktop with `@container` queries; place controls within thumb reach.

## JSON config + AI-generation surface

Every widget is also addressable as a serializable node `{ type, version?, props }`. `renderWidget(node)` resolves it via `widgetRegistry`, runs `migrate`/`adapt`, and renders. A whole `storyline` is one node tree — the AI-generation target.

Each widget carries metadata in `<name>.meta.ts` (`WidgetMeta`): `category`, `summary`, **`whenToUse`** (AI-oriented: when to pick this widget vs siblings), a zod `schema`, and a valid `example`. The registry assembles these into the MCP-ready surface:

- `getWidgetManifestJSON()` — every type with `whenToUse` + JSON Schema (zod→JSON Schema) + example.
- `validateWidgetNode(node)` / `validateWidgetTree(node)` — validate generated JSON (recursive, with error paths for self-correction).

## Adding a widget (the recipe)

1. `widgets/<name>/<name>.tsx` — component (aseptic tokens, `useLabels`, `data-slot`, `displayName`, `@/` imports; route every reader-facing free-text slot through `<RichText>`; if it has meaningful interactions, emit analytics with `useWidgetEvents` and document the actions in `docs/analytics.md`).
2. `widgets/<name>/index.ts` — re-export it.
3. `widgets/<name>/<name>.meta.ts` — `WidgetMeta` (version, category, summary, `whenToUse`, zod `schema`, valid `example`).
4. `lib/registry.tsx` — import the component + meta; add an entry `"<name>": { ...<name>Meta, component: <Component> }` (with `adapt` if props nest nodes/icons).
5. `index.ts` — `export * from "@/widgets/<name>"`.
6. `locales/es.ts` — Spanish labels (if it has UI chrome).
7. `apps/playground/src/catalog.tsx` — add a catalog entry + demo; slot its id into a category.
8. Verify: `pnpm -r typecheck` + `pnpm --filter @webreactiva/widgetron test`.
