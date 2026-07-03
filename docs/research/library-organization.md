# Widgetron — Library Organization & Architecture (Synthesis)

> Recommended, opinionated blueprint for scaffolding **widgetron**: a highly
> customizable, **shadcn/ui + Tailwind CSS v4** component library of interactive
> educational widgets (quizzes, flashcards, steppers, diagrams, terminal
> simulators, charts). Distributed as a **custom shadcn registry** so consumers
> run `npx shadcn add @widgetron/<widget>`.
>
> Companion docs: [`reference-libraries.md`](./reference-libraries.md) (what we
> studied) · [`sources.md`](./sources.md) (every URL) · [`examples/`](./examples)
> (real shadcn `button.tsx`/`utils.ts`/schema + widgetron `registry.json` and a
> widget skeleton).

---

## 0. TL;DR — the top decisions

1. **Distribute as a custom shadcn registry, not an npm package.** Consumers own
   the code; we ship JSON. Build static files with `npx shadcn build` →
   `public/r/*.json`, serve at `https://widgetron.dev/r/{name}.json`, register a
   `@widgetron` namespace so installs read `npx shadcn add @widgetron/quiz`.
2. **Monorepo: pnpm + Turborepo, single docs app `apps/www` holds the registry
   source.** This is the shadcn / magicui / originui consensus. Add `packages/`
   only if we ship a thin wrapper CLI.
3. **Theming = shadcn's Tailwind v4 model: semantic OKLCH CSS variables +
   `@theme inline`.** Components reference *only* semantic tokens
   (`bg-card`, `text-foreground`, `border-border`, `ring`). This is what makes
   them **aseptic**. The **Web Reactiva** brand is an *opt-in* override block
   scoped to `[data-theme="web-reactiva"]` — no component edits.
4. **Component style: CVA for variants + `cn()` merge + `data-slot` on every
   part + Radix `Slot`/`asChild`.** No `forwardRef` (React 19). Single-file for
   simple primitives; per-widget folder for complex interactive widgets.
5. **Responsiveness via Tailwind v4 `@container`, not viewport breakpoints.** A
   widget adapts to the *slot* it sits in. Controls bottom-anchored & full-reach
   when narrow, inline when wide.
6. **Accessibility built on WAI-ARIA APG patterns + roving tabindex +
   `:focus-visible` + `aria-live` + `prefers-reduced-motion`.** Build on Radix
   primitives; reach for `react-aria-components` if we want best-in-class a11y.

---

## 1. Recommended repository structure

pnpm + Turborepo monorepo. The **registry source lives inside the docs app**
(`apps/www/registry/widgetron/`); `shadcn build` turns it into static JSON under
`apps/www/public/r/`. A separate `packages/` is only for a published wrapper CLI.

```
widgetron/
├── package.json                      # workspace root (pnpm)
├── pnpm-workspace.yaml
├── turbo.json
├── biome.json | eslint + prettier
├── tsconfig.json                     # base; path alias "@/*"
│
├── apps/
│   └── www/                          # Next.js 15 docs site + registry source-of-truth
│       ├── components.json           # shadcn consumer config (style/aliases/tailwind/registries)
│       ├── registry.json             # MASTER registry manifest (hand-authored; lists every item)
│       ├── package.json
│       ├── next.config.ts
│       ├── postcss.config.mjs        # { "@tailwindcss/postcss": {} }
│       │
│       ├── app/
│       │   ├── globals.css           # @import "tailwindcss" + tokens + @theme inline + themes
│       │   ├── layout.tsx            # <ThemeProvider> (next-themes, attribute="class")
│       │   └── (docs)/...            # MDX-driven docs pages, live previews
│       │
│       ├── content/docs/             # MDX docs, one file per widget
│       │   └── widgets/quiz.mdx
│       │
│       ├── registry/                 # ← SOURCE OF TRUTH (what `shadcn build` reads)
│       │   └── widgetron/            # our style namespace (cf. shadcn's "new-york-v4")
│       │       ├── lib/
│       │       │   └── utils.ts                # cn()  -> registry:lib
│       │       ├── hooks/
│       │       │   ├── use-roving-focus.ts     # keyboard nav  -> registry:hook
│       │       │   ├── use-media.ts
│       │       │   └── use-reduced-motion.ts
│       │       ├── ui/                          # SHARED low-level primitives (single file each)
│       │       │   ├── widget-shell.tsx         # <Card>-like aseptic container + controls slot
│       │       │   ├── widget-toolbar.tsx       # role="toolbar" wrapper
│       │       │   ├── stepper-controls.tsx     # reusable prev/next bar
│       │       │   └── progress-dots.tsx
│       │       └── widgets/                     # COMPLEX widgets = one FOLDER each
│       │           ├── quiz/
│       │           │   ├── quiz.tsx             # composed root  -> registry:component
│       │           │   ├── quiz-option.tsx      # radio option (radiogroup pattern)
│       │           │   ├── quiz-controls.tsx    # submit / next (container-query placed)
│       │           │   ├── use-quiz.ts          # state hook  -> registry:hook
│       │           │   └── types.ts
│       │           ├── flashcard/flashcard.tsx  # disclosure pattern; flip via cssVars+css
│       │           ├── stepper/...
│       │           ├── carousel/...
│       │           ├── diagram/...
│       │           ├── terminal/...             # terminal simulator (aria-live output)
│       │           └── chart/...                # Recharts wrappers (chart-1..5 tokens)
│       │
│       ├── registry/examples/        # *-demo.tsx preview files (NOT shipped in JSON)
│       │   ├── quiz-demo.tsx
│       │   └── flashcard-demo.tsx
│       │
│       ├── scripts/
│       │   └── build-registry.mts    # wraps `shadcn build registry.json --output public/r`
│       │
│       └── public/
│           └── r/                     # GENERATED static JSON (DO commit or build in CI)
│               ├── registry.json      # served catalog
│               ├── quiz.json
│               └── flashcard.json
│
├── packages/                          # OPTIONAL — only if shipping a wrapper CLI
│   └── widgetron-cli/                 # `npx widgetron add quiz` -> shadcn add <url>
│
└── docs/research/                     # this research (you are here)
```

**Why this shape (evidence):** shadcn's own repo (`apps/v4` + `packages/shadcn`),
magicui (`apps/www/registry` + `public/r`), and originui all converge on exactly
this: a docs app that *is* the registry source, single-file primitives in
`registry/<style>/ui/`, demos kept **out** of the shipped files, and a build step
emitting static `/r/*.json`. We borrow tremor's/park-ui's **per-widget folder**
only for genuinely multi-file interactive widgets, and (optionally) park-ui's
discipline of a small fixed variant vocabulary + aligned sizing.

### Per-component file layout

| Kind | Layout | Registry `type` |
|---|---|---|
| Simple primitive (button-like, toolbar, progress dots) | **single `.tsx`** in `registry/widgetron/ui/` | `registry:ui` |
| Complex widget (quiz, stepper, carousel, terminal) | **folder** `registry/widgetron/widgets/<name>/` with root `.tsx`, subparts, `use-<name>.ts`, `types.ts` | `registry:block` (or `registry:component` for a single-file widget) |
| Hook | `.ts` in `hooks/` | `registry:hook` |
| `cn()` util | `lib/utils.ts` | `registry:lib` |
| Demos | `registry/examples/<name>-demo.tsx` — rendered by docs, **never inlined into a shipped item** | n/a |
| Docs | `content/docs/widgets/<name>.mdx` | (item `docs` field can carry install-time markdown) |

A widget file always: `"use client"` (interactive) → CVA variants → typed
function component (no `forwardRef`) → `cn()` merge of caller `className` →
`data-slot`/`data-variant`/`data-size` on every rendered part → exports
`{ Widget, widgetVariants }`. See [`examples/flashcard.tsx`](./examples/flashcard.tsx)
and the real shadcn [`examples/button.tsx`](./examples/button.tsx).

---

## 2. Theming & token architecture (aseptic core + opt-in brand)

### Two-layer token model

1. **Primitive tokens** — raw palette values in `@theme` (`--color-brand-500`,
   Tailwind's neutrals). Never referenced by components directly.
2. **Semantic tokens** — role-based names mapped onto primitives in `:root` /
   `.dark` (`--background`, `--foreground`, `--primary`, `--border`, `--ring`,
   `--destructive`, `--card`, `--muted`, `--accent`, `--chart-1..5`). **Components
   consume only these.** Each surface has a matching `-foreground` (the shadcn
   pairing convention) so `bg-primary text-primary-foreground` is always legible.

`@theme inline` binds each semantic token to a Tailwind color utility, so flipping
`.dark` or overriding a token under `[data-theme=…]` re-themes every
`bg-*`/`text-*`/`border-*` utility **at runtime, no rebuild**.

### `apps/www/app/globals.css` (recommended skeleton)

```css
@import "tailwindcss";
@import "tw-animate-css";

/* Manual (class-based) dark mode — the variant shadcn uses. */
@custom-variant dark (&:is(.dark *));

/* Optional: target a named theme from utilities, e.g. theme-web-reactiva:bg-primary */
@custom-variant theme-web-reactiva (&:where([data-theme="web-reactiva"] *));

/* ---- ASEPTIC DEFAULTS (neutral base, OKLCH) ---------------------------- */
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  /* ...chart-* dark values... */
}

/* ---- OPT-IN BRAND: Web Reactiva (only overrides what differs) ---------- */
[data-theme="web-reactiva"] {
  --radius: 0.75rem;
  --primary: oklch(0.62 0.21 256);
  --primary-foreground: oklch(0.99 0 0);
  --ring: oklch(0.62 0.21 256);
  --background: oklch(0.99 0.005 95);
  --foreground: oklch(0.2 0.02 265);
}
[data-theme="web-reactiva"].dark {
  --primary: oklch(0.7 0.18 256);
  --primary-foreground: oklch(0.18 0.02 265);
  --background: oklch(0.18 0.02 265);
  --foreground: oklch(0.96 0.01 95);
}

/* ---- BIND semantic tokens to Tailwind utilities (the magic) ----------- */
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
```

**Usage:** default app is aseptic (neutral). Opting into the brand is one
attribute — `<html data-theme="web-reactiva">` (or scope it to a subtree). Themes
nest and scope because they're plain cascade overrides. Multiple brand themes =
multiple `[data-theme="…"]` blocks (ship each as a `registry:theme` item, see §4).

> **OKLCH, why:** perceptual uniformity (even L/C ramps), wider P3 gamut,
> predictable hover/muted derivation by nudging L/C while holding H, clean alpha
> (`oklch(1 0 0 / 10%)`). shadcn moved all tokens to OKLCH in v4; **tweakcn**
> (tweakcn.com) is a visual editor that exports exactly these blocks — or a
> `registry:theme` JSON you `npx shadcn add`.

---

## 3. Tailwind CSS v4 setup

- **One import:** `@import "tailwindcss";` replaces the three `@tailwind`
  directives. **No `tailwind.config.js`** — config lives in CSS. Template files
  are auto-detected (no `content` array). Use `@config "…";` only if a legacy JS
  config/plugin is unavoidable.
- **`components.json` for v4:** leave `tailwind.config` blank, point
  `tailwind.css` at `app/globals.css`, `cssVariables: true`, `baseColor: neutral`,
  `style: new-york`.
- **Tooling:** PostCSS plugin is `@tailwindcss/postcss`; there's a
  `@tailwindcss/vite` plugin; CLI is `npx @tailwindcss/cli`;
  `npx @tailwindcss/upgrade` automates v3→v4.
- **`@theme` vs `:root`:** put values that should generate **utilities** in
  `@theme` (or bind via `@theme inline`); put runtime-overridable **token values**
  in `:root`/`.dark`/`[data-theme]`.
- **Custom CSS:** `@layer base/components`, `@utility` (replaces v3
  `@layer utilities`, integrates with variants), `@variant` (apply a variant
  inside custom CSS), `@custom-variant` (dark mode + named themes).
- **Browser floor:** Safari 16.4+, Chrome 111+, Firefox 128+ (stay on v3.4 for
  older).

### `components.json` (recommended)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks",
    "utils": "@/lib/utils"
  },
  "registries": {
    "@widgetron": "https://widgetron.dev/r/{name}.json"
  }
}
```

> A **consumer** adds the `@widgetron` namespace to their own `components.json`
> `registries` map, then runs `npx shadcn add @widgetron/quiz`.

---

## 4. shadcn registry setup & distribution

**Authoring:** hand-write `apps/www/registry.json` (`$schema`, `name`,
`homepage`, `items[]`). Each item conforms to the
[registry-item schema](./examples/registry-item.schema.json). Internal imports
use the `@/registry/...` path.

**Building:** `npx shadcn build registry.json --output public/r` inlines each
file's source into the item's `content` and emits self-contained
`public/r/<name>.json`. Run it in CI on every push.

**Hosting:** any static host. With Next.js, items are reachable at
`https://widgetron.dev/r/<name>.json`; the catalog at `/r/registry.json`.

**Consuming (all three forms work):**
```sh
npx shadcn@latest add https://widgetron.dev/r/quiz.json   # direct URL
npx shadcn@latest add @widgetron/quiz                     # namespaced (after registry config)
npx shadcn@latest add ./quiz.json                         # local file (offline)
```

### Key item fields (full schema in [`examples/registry-item.schema.json`](./examples/registry-item.schema.json))

| Field | Use in widgetron |
|---|---|
| `type` | `registry:ui` (primitives), `registry:component`/`registry:block` (widgets), `registry:hook`, `registry:lib`, `registry:theme` (brand themes). |
| `dependencies` | npm runtime deps: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `motion`, `recharts`. Supports `pkg@version`. |
| `registryDependencies` | Reference shadcn primitives by **name** (`"button"`, `"card"`) so we don't re-vendor them; reference our own items by **URL** (`https://widgetron.dev/r/lib-widget-utils.json`). Resolved recursively. |
| `files[]` | `path` + `type` (+ `target` for `registry:page`/`registry:file`; supports `@ui/`, `@lib/`, `@hooks/` placeholders). |
| `cssVars` | `theme` (Tailwind v4 `@theme` vars, e.g. an `--animate-flip`), `light`, `dark` — merged into the project's token blocks. How brand themes ship. |
| `css` | Inject `@keyframes`, `@layer`, `@utility`, `@plugin`, and `@media (prefers-reduced-motion)` overrides so animations travel **with** the widget. |
| `categories` | `["education","interactive","theme"]` for organization. |

See the worked widgetron [`examples/registry.json`](./examples/registry.json) —
it ships `lib-widget-utils`, `use-roving-focus`, `quiz`, `flashcard`, and the
`theme-web-reactiva` brand theme.

---

## 5. Responsive & control-placement guidelines

**Principle: container queries, not viewport breakpoints.** A widget's layout
must depend on the **slot it occupies** (it may sit in a 320px sidebar on a 1440px
desktop, or full-bleed on a phone). Mark the widget root `@container/<name>`, then
use `@sm/<name>:` / `@lg/<name>:` / `@max-lg/<name>:` variants.

**Thumb-zone placement (mobile):** ~75% of interactions are thumb-driven; the
bottom-center "green zone" is easy-reach, top corners are hard. So **primary
controls (Prev/Next/Submit) anchor to a bottom bar** and become full-reach when
the slot is narrow. On wide slots they move **inline to the right**.

```html
<section class="@container/widget rounded-xl border border-border p-4">
  <div class="flex flex-col gap-4 @lg/widget:flex-row @lg/widget:items-center @lg/widget:justify-between">
    <div class="flex-1"><!-- question / card / step content --></div>

    <!-- Narrow: sticky bottom bar, full-reach, safe-area padded.
         Wide:   compact, inline, sits to the right. -->
    <div class="flex items-center justify-between gap-2
                @lg/widget:justify-end
                @max-lg/widget:sticky @max-lg/widget:bottom-0
                @max-lg/widget:-mx-4 @max-lg/widget:border-t @max-lg/widget:border-border
                @max-lg/widget:bg-card/90 @max-lg/widget:px-4 @max-lg/widget:pt-3 @max-lg/widget:backdrop-blur
                @max-lg/widget:[padding-bottom:calc(0.75rem+env(safe-area-inset-bottom))]">
      <button class="min-h-11 min-w-11 rounded-lg px-4 @max-lg/widget:flex-1
                     outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">Prev</button>
      <button class="min-h-11 min-w-11 rounded-lg bg-primary px-4 text-primary-foreground @max-lg/widget:flex-1
                     outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">Next</button>
    </div>
  </div>
</section>
```

Placement matrix:

| Device | Interaction | Control placement |
|---|---|---|
| Mobile (one-handed) | thumb, bottom-center | **bottom-anchored bar**, full-width/large buttons, `env(safe-area-inset-bottom)` padding |
| Tablet | two hands / pointer | side or inline rails; larger split layouts |
| Desktop | mouse + keyboard | inline beside content or top **toolbar** (`role="toolbar"`); hover affordances; keyboard shortcuts |

**Touch targets:** working minimum **44×44 CSS px** (`min-h-11 min-w-11`) —
satisfies Apple HIG (44pt) and WCAG 2.5.5 AAA, exceeds the WCAG 2.5.8 AA 24px
floor. Requires `<meta name="viewport" content="viewport-fit=cover">` for safe
areas to activate.

---

## 6. Accessibility checklist

Build on **accessible headless primitives** (Radix; or `react-aria-components`
for best-in-class) and the **WAI-ARIA APG** patterns. Note: the APG has **no
stepper/wizard pattern** — compose it.

**Baseline (every widget)**
- [ ] Primary controls are native `<button>`; targets ≥ **44×44 CSS px**.
- [ ] Visible **`:focus-visible`** ring, ≥3:1 contrast; never bare `outline:none`.
- [ ] Fully keyboard-operable; logical Tab order; **Escape** closes overlays and returns focus to the trigger.
- [ ] Honors **`prefers-reduced-motion`** (swap transforms for opacity, or none).
- [ ] On mobile, primary action in the bottom green zone, safe-area padded.
- [ ] Responsiveness driven by `@container`, not viewport.
- [ ] Dynamic status announced via **`aria-live`**.

**Per widget**
- [ ] **Quiz (single answer)** — `radiogroup` labeled by the question; options `role="radio"` + `aria-checked`; **roving tabindex**; arrow keys move-and-select (wrap); Space checks; feedback in `aria-live="polite"`; move focus to feedback/next on reveal. Multi-select → grouped **checkboxes** (not radios).
- [ ] **Flashcard** — **Disclosure** pattern: flip is a `button` with `aria-expanded` + `aria-controls`; Space/Enter toggles; reveal announced via live region; flip animation simplified under reduced motion.
- [ ] **Stepper / Wizard** — step indicator is an `<ol>` with `aria-current="step"`; Next/Prev native buttons disabled + `aria-disabled` at ends; on advance move focus to the new step heading (`tabindex="-1"`) and announce "Step X of N" via `aria-live`.
- [ ] **Carousel** — container `aria-roledescription="carousel"` + `role="region"`/`group` with a name; slides `role="group"` + `aria-roledescription="slide"`; **play/pause first in tab order** with a *changing label* (not `aria-pressed`); auto-rotation **pauses on hover AND focus**, resumes only on explicit action; `aria-live="off"` while rotating, `"polite"` when static.
- [ ] **Feed (infinite scroll)** — `role="feed"` > `role="article"`; each `aria-labelledby`+`aria-describedby`, `aria-posinset`/`aria-setsize` (`-1` if unknown); `aria-busy` during loads; Page Up/Down between articles, Ctrl+Home/End to exit.
- [ ] **Diagram / Chart** — provide a text/data-table equivalent; interactive points are focusable buttons with names; don't encode meaning in color alone; entrance animations respect reduced motion.
- [ ] **Terminal simulator** — output area is an `aria-live="polite"` region; offer an instant-print fallback under reduced motion; input is a real focusable control.

**Keyboard contract (composite widgets):** roving tabindex (one Tab stop), arrow
keys traverse + wrap, Home/End to extremes, Space/Enter activate, Escape dismisses
overlays, Page Up/Down for large steps / feed traversal.

---

## 7. Recommended dependencies

| Purpose | Package |
|---|---|
| Class merge | `clsx`, `tailwind-merge` (the `cn()` pair) |
| Variants | `class-variance-authority` |
| Primitives / composition | `radix-ui` (unified 2026 package: `import { Slot } from "radix-ui"`) — or `react-aria-components` for a11y-first |
| Icons | `lucide-react` |
| Animation | `motion` (successor to framer-motion) — gate behind `prefers-reduced-motion` |
| Charts | `recharts` (use `--chart-1..5` tokens) |
| Dark mode | `next-themes` (`attribute="class"`) |
| Styling | `tailwindcss@4`, `@tailwindcss/postcss`, `tw-animate-css` |

---

## 8. Build order (suggested)

1. Scaffold monorepo (pnpm + Turborepo) + `apps/www` Next.js 15.
2. `globals.css` (aseptic tokens + `@theme inline` + dark variant) and
   `components.json`.
3. `lib/utils.ts` (`cn()`), the `use-roving-focus` / `use-reduced-motion` hooks,
   and shared `ui/` primitives (`widget-shell`, `stepper-controls`).
4. First two widgets end-to-end: **quiz** (radiogroup) and **flashcard**
   (disclosure) — they exercise the full pattern (CVA, data-slot, container
   queries, a11y, registry item with `cssVars`/`css`).
5. `registry.json` + `scripts/build-registry.mts` → `public/r/*.json`; wire CI.
6. Add the **Web Reactiva** `registry:theme` item; verify opt-in via
   `data-theme`.
7. Remaining widgets (stepper, carousel, diagram, terminal, charts).
8. Docs site (MDX + live previews from `registry/examples/`).
