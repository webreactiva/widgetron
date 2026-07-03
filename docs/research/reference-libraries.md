# Reference Libraries Studied

How exemplary component libraries organize their repos and approach theming.
Repos were shallow-cloned/inspected first-hand where possible; all URLs are real.
See [`library-organization.md`](./library-organization.md) for the widgetron
recommendation distilled from these, and [`sources.md`](./sources.md) for the
full URL list.

## Summary table

| Library | What it does well | Repo shape | Theming approach | Most useful URLs |
|---|---|---|---|---|
| **shadcn/ui** | The reference. Registry of **copy-in source files** you own; CVA + Radix + Tailwind; the registry format itself is the product. | pnpm + turbo **monorepo**; migrated `apps/www` → **`apps/v4`**; primitives are **single files** in `registry/new-york-v4/ui/`; blocks are folders; demos in `registry/.../examples/`; CLI in `packages/shadcn`. | **Tailwind v4 + semantic OKLCH CSS vars** + `@theme inline`; `.dark` class; `data-slot` on every part; named "styles" (`style-nova.css`) swap whole looks. | [button.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/button.tsx) · [globals.css](https://github.com/shadcn-ui/ui/blob/main/apps/v4/app/globals.css) · [registry.json](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry.json) · [schema.ts](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/schema.ts) · [docs/registry](https://ui.shadcn.com/docs/registry) |
| **tremor** (`tremor-raw`) | Dashboards & **charts** (Recharts); moved to shadcn-style **copy-in**; "no abstraction, classes inline." | **Single package** (not a monorepo); one folder per component `src/components/<Name>/` with **co-located** `*.stories.tsx` + `*.spec.ts` + `changelog.md`; `.storybook/` is the harness. | **Tailwind v4 but `tailwind-variants` (`tv`), NOT cva**; **hard-coded palette classes** (`bg-blue-500`) — *no* semantic token layer (the anti-pattern to avoid); **chart colors live in JS** (`chartColors.ts`). | [Button.tsx](https://github.com/tremorlabs/tremor/blob/main/src/components/Button/Button.tsx) · [chartColors.ts](https://github.com/tremorlabs/tremor/blob/main/src/utils/chartColors.ts) · [button.stories.tsx](https://github.com/tremorlabs/tremor/blob/main/src/components/Button/button.stories.tsx) · [install docs](https://tremor.so/docs/getting-started/installation) |
| **park-ui** | A **theming layer** (`@park-ui/preset`) over **Ark UI** (headless, framework-agnostic); systematic **5-variant** vocabulary + aligned sizing; React/Solid/Vue from one preset. | Bun-workspace **monorepo**; `components/{react,solid,vue}/` thin wrappers; the heart is `packages/preset/` (recipes + Radix-color palettes); stories in `components/react/src/examples/`. | **Panda CSS tokens + recipes** (`defineRecipe`/`defineSlotRecipe`); a `colorPalette` intent system (`solid/subtle/surface/outline/plain`); single radius knob (`l1/l2/l3`); plugin strips Panda defaults. | [preset index.ts](https://github.com/cschroeter/park-ui/blob/main/packages/preset/src/index.ts) · [slider.ts recipe](https://github.com/cschroeter/park-ui/blob/main/packages/preset/src/recipes/slider.ts) · [blue.ts palette](https://github.com/cschroeter/park-ui/blob/main/packages/preset/src/theme/colors/blue.ts) · [theming.mdx](https://github.com/cschroeter/park-ui/blob/main/website/src/content/docs/theming.mdx) |
| **origin-ui / originui** | Huge copy-paste shadcn-compatible set (~563 served items). **Note:** acquired by **Cal.com → "coss ui"**; legacy Radix set preserved in `apps/origin/`, active dev on **Base UI** in `apps/ui/`. | Turbo + Bun **monorepo**; `apps/ui/registry/` source assembled from TS modules; `apps/ui/public/r/` static JSON via `scripts/build-registry.mts` (`shadcn build`). | **Tailwind v4 + CSS-var shadcn theming** (`@theme inline`, `@custom-variant dark`); items can ship extra `cssVars` (`--success`, `--warning`). | [build-registry.mts](https://github.com/origin-space/originui/blob/main/apps/ui/scripts/build-registry.mts) · [registry/index.ts](https://github.com/origin-space/originui/blob/main/apps/ui/registry/index.ts) · [globals.css](https://github.com/origin-space/originui/blob/main/packages/ui/src/styles/globals.css) |
| **kibo-ui** | Custom **shadcn registry** of complex composable components shadcn omits (kanban, gantt, AI chat, code-block, color-picker); reuses shadcn tokens to drop in anywhere. | Turbo + pnpm **monorepo**; **one workspace package per component** in `packages/<name>/`; docs app generates registry JSON **dynamically via route handlers** (`app/r/[component]/route.ts`) — **no `shadcn build`, no committed `/r/*.json`**. | **Tailwind v4**, intentionally **reuses standard shadcn tokens**; component CSS parsed via postcss into the item `css`/`@layer`. | [r/[component]/route.ts](https://github.com/haydenbleasel/kibo/blob/main/apps/docs/app/r/%5Bcomponent%5D/route.ts) · [lib/package.ts](https://github.com/haydenbleasel/kibo/blob/main/apps/docs/lib/package.ts) · [scripts/index.ts (CLI)](https://github.com/haydenbleasel/kibo/blob/main/scripts/index.ts) |
| **magicui** | Animated components for **marketing/landing** (marquee, beams, bento, globe) on **`motion`**; shipped as a shadcn registry; closest template to copy for a Tailwind-v4 registry lib. | pnpm + Turborepo **monorepo**, single Next.js app; **single-file** components in `apps/www/registry/magicui/`; demos in `registry/example/`; static `public/r/*.json` via `scripts/build-registry.mts`. | **Tailwind v4 + oklch CSS vars** (shadcn base); animation via **`motion/react`**; some animations injected via item `cssVars.theme` keyframes; **CVA used sparingly** (only variant-driven components). | [registry.json](https://github.com/magicuidesign/magicui/blob/main/registry.json) · [animated-beam.tsx](https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/animated-beam.tsx) · [build-registry.mts](https://github.com/magicuidesign/magicui/blob/main/apps/www/scripts/build-registry.mts) · [served item](https://magicui.design/r/animated-beam.json) |
| **aceternity ui** | High-impact "wow" marketing components (aurora, spotlight, 3D marquee). **Effectively closed-source** — only registry JSON endpoints + docs are observable. | No public canonical repo; `{site}/registry/<name>.json` + per-component docs pages with CLI + Manual install tabs. | **Tailwind + Framer Motion**; uses `cn()` like shadcn; v3-vs-v4 pinning not confirmable from public docs. | [CLI docs](https://ui.aceternity.com/docs/cli) · [bento-grid.json](https://ui.aceternity.com/registry/bento-grid.json) · [component page](https://ui.aceternity.com/components/bento-grid) |
| **react-aria / react-spectrum** | The **accessibility gold standard**: behavior + a11y decoupled from styling via hooks; 4-layer architecture. | Yarn workspaces + Lerna **monorepo** with hundreds of packages, split by layer: `@react-types/*` → `@react-stately/*` (state, no DOM) → `@react-aria/*` (behavior/ARIA/keyboard) → `@react-spectrum/*` (styled); **`react-aria-components`** = 67 unstyled primitives. | **react-aria-components = UNSTYLED**: state exposed via **render props + `data-*` attributes**; first-party `tailwindcss-react-aria-components` maps states (`pressed:`, `hovered:`) to Tailwind variants. Spectrum 2 uses an in-house `style` macro. | [useButton.ts](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/button/useButton.ts) · [react-aria-components/src](https://github.com/adobe/react-spectrum/tree/main/packages/react-aria-components/src) · [Button.tsx (data-* selectors)](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Button.tsx) · [tailwind plugin](https://github.com/adobe/react-spectrum/tree/main/packages/tailwindcss-react-aria-components) |

## Custom-registry distribution mechanism (how `npx shadcn add <url>` works)

A custom registry is just **static (or dynamically-generated) JSON over HTTP**
conforming to shadcn's two schemas (`registry.json` catalog +
`registry-item.json` per component). The CLI fetches the URL, writes files via
the consumer's `components.json` aliases, installs npm `dependencies`, and
recursively resolves `registryDependencies`.

Two valid serving strategies observed:
- **A — `shadcn build` → static files** (shadcn, originui, magicui):
  `npx shadcn build registry.json --output public/r` **inlines each file's source
  into `content`** and emits self-contained `public/r/<name>.json`. No server
  needed. **← recommended for widgetron.**
- **B — dynamic route handlers** (kibo): `app/r/[component]/route.ts` generates
  item JSON at request time from a `packages/` dir. Same wire format, no build
  step. Use only if a build step is undesirable.

Public URL pattern across all: `{domain}/r/{name}.json`, catalog at
`{domain}/r/registry.json` (aceternity uses `/registry/<name>.json`). Install:
`npx shadcn add https://magicui.design/r/animated-beam.json` (URL) or
`npx shadcn add @aceternity/bento-grid` (namespace registered in `components.json`).

## What to copy for widgetron (the short version)

- **Repo shape & build:** copy **shadcn `apps/v4` + magicui** wholesale —
  monorepo, single-file primitives in `registry/`, demos kept out of shipped
  files, `shadcn build` → static `/r/*.json`, namespaced install.
- **Theming:** copy shadcn's **semantic OKLCH CSS-var + `@theme inline`** model.
  **Avoid tremor's hard-coded palette classes** (kills retheming). For charts,
  prefer CSS-var `--chart-1..5` tokens over tremor's JS color map.
- **Variant discipline:** borrow **park-ui's** small fixed variant vocabulary +
  aligned sizing + single radius knob (implement with CSS vars, not Panda).
- **Complex widgets:** use a **per-widget folder** (tremor/park-ui/kibo) only for
  genuinely multi-file widgets; keep simple primitives single-file (shadcn).
- **Accessibility:** build on **Radix**, or **react-aria-components** for
  best-in-class — its unstyled-primitive + `data-*`-state model composes perfectly
  with a Tailwind v4 CSS-var theme.
