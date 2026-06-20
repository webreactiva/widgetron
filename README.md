# Widgetron

Interactive, **theme-agnostic** learning widgets built on shadcn conventions and
Tailwind CSS v4. Ported and elevated from the Astro widgets in `../dispensa`.

The premise (inherited from dispensa): present information **interactively,
reliably, in an orderly, attractive way**, and let the learner _use_ each widget
to reinforce what it teaches. The north star is the
[explorable explanation](https://en.wikipedia.org/wiki/Explorable_explanation):
documents the reader manipulates and learns from by seeing consequences
(TangleText, Scrubber, the interactive diagrams). Process moments use **discreet,
`prefers-reduced-motion`-aware animations** (the `--animate-wgt-*` tokens) to
reinforce the message without distracting.

## Principles

- **Aseptic core, brand on top.** Widgets reference only semantic design tokens
  (shadcn's `background`, `foreground`, `primary`, `border`, … plus
  `success/warning/info` and `--wgt-*`). They ship neutral. A brand is an
  **opt-in** `[data-theme]` override block — `webreactiva` is included, but
  widgets are never tied to it.
- **Composable.** Built on shadcn's dependency stack (Radix `Slot`/`asChild`,
  `cva`, `cn`, `data-slot`) and internal primitives, so it drops into any shadcn
  project and stays customizable via `className`.
- **Responsive by container, not viewport.** Layout and control placement adapt
  to the widget's own width (Tailwind v4 `@container`), so a widget behaves
  correctly inside any column. Interaction controls stay thumb-reachable on
  mobile.
- **English everywhere** (code, props, docs).
- **Customizable + translatable copy.** Every user-facing string has English
  defaults, a per-instance `labels` prop, and a global `WidgetronProvider`
  (`labels` + `locale`) — swap a whole dictionary to localize the library.
- **Universal, theme-driven icons.** A single `Icon` component renders any icon
  from any set indexed by [Iconify](https://icones.js.org) (`lucide:*`, `mdi:*`,
  `tabler:*`, `ph:*`, `pixelarticons:*`, …) by string name. **Bare** names
  (`<Icon icon="server" />`) resolve against the active theme's icon set — the
  base theme uses `lucide`, the Web Reactiva theme uses `pixelarticons` — so the
  same markup renders the right icon style per theme (set via
  `WidgetronProvider iconSet=…`). `SectionHeader` and content props accept icon
  names too. The library has **no** bundled icon dependency — internal chrome
  uses tiny inline SVGs.
- **Tested.** Vitest + Testing Library cover the formula engine, i18n merge, and
  interactive widgets (`pnpm test`).

## Structure

```
widgetron/
├─ packages/
│  └─ widgets/                  @webreactiva/widgetron — the library
│     └─ src/
│        ├─ lib/utils.ts        cn()
│        ├─ primitives/         shadcn-compatible building blocks (Button, …)
│        ├─ styles/
│        │  ├─ tokens.css       design tokens: aseptic :root + [data-theme] brands
│        │  ├─ theme.css        Tailwind v4 @theme bridge + dark variant
│        │  └─ index.css        convenience entry
│        └─ widgets/<name>/     one folder per widget (<name>.tsx + index.ts)
├─ apps/
│  └─ playground/               Vite preview: viewport (mobile/tablet/desktop)
│                               + theme (base / Web Reactiva) + dark switchers
└─ docs/research/               "library agent" findings (architecture blueprint,
                                reference libraries, sources)
```

## Develop

```bash
pnpm install
pnpm dev          # playground at http://localhost:5173
pnpm typecheck    # tsc across the workspace
pnpm build:playground
```

## Theming a consumer app

```css
@import "tailwindcss";
@import "@webreactiva/widgetron/styles";   /* tokens + @theme bridge */
```

```html
<html data-theme="webreactiva">  <!-- opt into the brand; omit for neutral -->
<html class="dark">              <!-- dark mode -->
```

Override any token (globally or scoped) to retheme every widget at once — no
widget edits.

## Widgets

| Widget | Kind | Status |
|---|---|---|
| Quiz / ScenarioQuiz | interactive | ✅ |
| Flashcards | interactive | ✅ |
| Checklist | interactive (persists) | ✅ |
| SpotTheBug | interactive (debug by clicking) | ✅ |
| TangleText | reactive (formula engine) | ✅ |
| Scrubber | reactive (sliders → live outputs) | ✅ |
| FrameStepper | reactive (timeline scrubber) | ✅ |
| TerminalSim | reactive (typewriter CLI) | ✅ |
| CalloutBox | static (aha/info/warning) | ✅ |
| StepCards · PatternCard · FlowDiagram | static | ✅ |
| CodeTranslation | static (container-query) | ✅ |
| SectionHeader · Prose | static (titles & descriptions) | ✅ |
| Icon | universal icon (Iconify) | ✅ |
| DataChart | data (bar/hbar/line SVG) | ✅ |
| Infographic | 10 SVG metaphor layouts | ✅ |
| MermaidDiagram | rendered diagrams + zoom/details | ✅ |
| DecisionTree | interactive (branching paths) | ✅ |
| FillInTheBlanks | interactive (fill blanks + check) | ✅ |
| Timeline | expandable milestones | ✅ |
| CompareSlider | interactive (before/after sweep) | ✅ |
| PredictOutput | interactive (predict → reveal) | ✅ |
| DragAndDrop | interactive (match / categorize) | ✅ |
| Hotspots | annotated figure (clickable points) | ✅ |
| GroupChat | reader-paced animated dialogue | ✅ |
| Scrollytelling | **composition** (sticky-graphic) | ✅ |

> **Compositional patterns** orchestrate other widgets rather than being atomic.
> **Scrollytelling** (sticky graphic + scroll-driven steps, IntersectionObserver,
> no scroll-snap) is built. A guided **Tour** is the next composition.

## JSON config & AI generation

Every widget is renderable from a serializable, **versioned** node — the format
an LLM generates to author a dispensa:

```ts
import { renderWidget, type WidgetNode } from "@webreactiva/widgetron";

const node: WidgetNode = {
  type: "quiz",
  version: 1,
  props: { question: "…", options: [{ text: "…", correct: true, feedback: "…" }] },
};

renderWidget(node); // → <Quiz … />
```

- The JSON `props` mirror each widget's TypeScript props almost exactly (a string
  is a valid `ReactNode`), so the schema is "just the prop types".
- `renderWidget` resolves the type in `widgetRegistry`, **migrates** older
  versions, adapts JSON-only props (icon names → `<Icon>`, **nested nodes** →
  rendered widgets), then renders.
- Compositions nest: a `scrollytelling` node's steps each carry a `content` node
  and a `sticky` node — the whole `requestScrolly` demo in the playground is one
  JSON tree.
- `widgetManifest` lists every `{ type, version }` for tooling/prompts.

The playground groups widgets by category, has a **language switch** (EN/ES)
that toggles the i18n labels live (ready-made `esLabels` pack ships in the
library), and previews each widget inside a **real iframe** sized to the chosen
viewport — so "Mobile · 390px" is a truthful 390px device (media + container
queries evaluate against the frame), not a shrunken desktop.

`mermaid` is an optional dependency loaded via dynamic `import()`, so it is
code-split and only fetched when a `MermaidDiagram` actually renders.

## Roadmap

1. Remaining first-class widgets (advanced + data/diagram batches).
2. `packages/registry` — generate a shadcn registry (`registry.json`) so widgets
   install via `npx shadcn add @widgetron/<name>` (relative imports rewritten to
   `@/` aliases at build time).
3. `tsup` build for the publishable npm package.
4. Formative compositions (assemble widgets into a "dispensa").
