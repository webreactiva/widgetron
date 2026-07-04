# @webreactiva/widgetron

Interactive, theme-agnostic learning widgets (quizzes, flashcards, diagrams, scrollytelling, storylines…) built on shadcn conventions and Tailwind CSS v4. Widgets ship **aseptic** — semantic design tokens only — and can be skinned with an opt-in brand theme.

## Install

```sh
pnpm add @webreactiva/widgetron react react-dom
```

`react`/`react-dom` (18.3+ or 19) are peer dependencies. Two widgets lazy-load optional dependencies you only install if you use them:

- `mermaid` — required by `<MermaidDiagram>`.
- `canvas-confetti` — completion celebrations (quiz, checklist…); silently skipped when absent.

The published package is plain ESM + type declarations (`dist/`) — no TypeScript setup, aliases or bundler config needed on your side.

## Styles (Tailwind CSS v4 required)

Widget markup uses Tailwind utility classes against semantic tokens, so the **consumer's** Tailwind build must generate them. In your global CSS:

```css
@import "tailwindcss";
@import "@webreactiva/widgetron/styles";
@source "../node_modules/@webreactiva/widgetron";
```

- `@import "@webreactiva/widgetron/styles"` brings the token definitions (aseptic defaults + the `@theme inline` bridge + animations). `styles/tokens.css` and `styles/theme.css` are also exported individually.
- `@source` points Tailwind at the package so it emits every class the widgets use (the path is relative to the CSS file; adjust to reach your `node_modules`).

There is deliberately no precompiled global CSS: your Tailwind build only generates what the widgets actually use, and host utilities merge cleanly (`cn` is clsx + tailwind-merge).

### Theming

Everything renders with aseptic semantic tokens by default. Opt in to a brand skin by setting `data-theme` on any ancestor:

```html
<html data-theme="webreactiva">
```

Never hardcode brand colors in a widget — brand styling lives behind `[data-theme="…"]` blocks (see `styles/tokens.css`).

## Usage

```tsx
import { WidgetronProvider, Quiz, esLabels } from "@webreactiva/widgetron";

<WidgetronProvider locale="es" labels={esLabels}>
  <Quiz question="2 + 2?" options={[{ label: "4", correct: true }, { label: "5" }]} />
</WidgetronProvider>
```

`WidgetronProvider` supplies locale, label overrides and the Iconify icon set. All widget chrome is translatable; Spanish ships as `esLabels`.

## JSON surface (AI generation)

Every widget is addressable as a serializable node `{ type, version?, props }`:

```tsx
import { renderWidget, getWidgetManifestJSON, validateWidgetTree } from "@webreactiva/widgetron";

renderWidget({ type: "quiz", props: { question: "…", options: [/* … */] } });
```

- `getWidgetManifestJSON()` — every type with an AI-oriented `whenToUse`, JSON Schema (zod-derived) and a valid `example`.
- `validateWidgetNode(node)` / `validateWidgetTree(node)` — validate generated JSON recursively, with error paths for self-correction.

## Analytics

Interactive widgets emit a bubbling `widgetron:event` CustomEvent (no adapters, inert without listeners):

```ts
import { onWidgetronEvent } from "@webreactiva/widgetron";

const off = onWidgetronEvent((e) => sendToYourAnalytics(e.detail));
```

## Development (this monorepo)

Inside the workspace the package `exports` point at `src/` (no build step during dev; apps alias the internal `@/` prefix). Publishing rewrites them to `dist/` via `publishConfig` — `pnpm build` runs tsup (ESM + d.ts + styles copy).

```sh
pnpm --filter @webreactiva/widgetron test   # Vitest suite (jsdom)
pnpm --filter @webreactiva/widgetron build  # dist/
```
