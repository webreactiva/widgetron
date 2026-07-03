# Sources

All URLs consulted during research (2026-06-20), grouped by topic, with one-line
notes. Verbatim example files saved under [`examples/`](./examples).

## shadcn/ui — architecture, registry, CLI

- https://ui.shadcn.com/docs — Overview; "distribution system for code," open-code / own-your-components philosophy.
- https://ui.shadcn.com/docs/registry — Registry overview; framework-agnostic distribution.
- https://ui.shadcn.com/docs/registry/getting-started — Directory layout, `shadcn build`, output to `public/r/*.json`, serving.
- https://ui.shadcn.com/docs/registry/registry-json — `registry.json` fields + real example.
- https://ui.shadcn.com/docs/registry/registry-item-json — Item fields, registryDependency formats, target placeholders.
- https://ui.shadcn.com/docs/registry/examples — Verbatim item examples (block, theme, lib, hook, font, base, css `@utility`/`@keyframes`/`@plugin`, envVars).
- https://ui.shadcn.com/docs/registry/namespace — Namespaces (`@acme/item`), `components.json` `registries`, `add @ns/item`.
- https://ui.shadcn.com/schema/registry.json — Canonical root registry JSON schema.
- https://ui.shadcn.com/schema/registry-item.json — Canonical item JSON schema (full `type` enum incl. registry:base/font/item). Saved as [`examples/registry-item.schema.json`](./examples/registry-item.schema.json).
- https://ui.shadcn.com/docs/components-json — Full `components.json` reference incl. `registries`.
- https://ui.shadcn.com/docs/cli — `init`/`add`/`build` options; URL & namespace add usage.
- https://ui.shadcn.com/docs/changelog — 2025/2026 timeline: Tailwind v4 (Feb 2025), Registry Index/namespaces (Sep 2025), unified Radix UI (Feb 2026).
- https://ui.shadcn.com/docs/changelog/2025-02-tailwind-v4 — "Every primitive has a data-slot"; forwardRef removed; HSL→OKLCH.
- https://ui.shadcn.com/docs/tailwind-v4 — data-slot migration, `group-data-[slot=…]`, `@theme inline`, OKLCH, `tw-animate-css`, `new-york` default.
- https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/button.tsx — Real button.tsx (CVA + cn + Slot + data-slot). Saved as [`examples/button.tsx`](./examples/button.tsx).
- https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/lib/utils.ts — Real `cn()`. Saved as [`examples/utils.ts`](./examples/utils.ts).
- https://github.com/shadcn-ui/ui/blob/main/apps/v4/app/globals.css — Tailwind v4 `@theme inline` + OKLCH token theming.
- https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry.json — Master registry (411 items).
- https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/registry/schema.ts — zod registry item schema / type enum.
- Corroboration: https://www.freecodecamp.org/news/how-to-set-up-a-registry-in-shadcn/ · https://tailkits.com/blog/shadcn-registry/ · https://tailkits.com/blog/shadcn-local-file-support/ · https://www.openstatus.dev/blog/shadcn-component-registry · https://ui.shadcn.com/docs/changelog/2024-08-npx-shadcn-init — direct-URL / local-file / namespaced `add`.

## Tailwind CSS v4

- https://tailwindcss.com/docs/functions-and-directives — `@import`, `@theme`/`@theme inline`, `@utility`, `@variant`, `@custom-variant`, `@apply`, `@layer`, `@config`, `@reference`, `--spacing()`/`--alpha()`.
- https://tailwindcss.com/docs/theme — Tokens as CSS vars, namespace table, `@theme` vs `:root`, override/replace, sharing themes.
- https://tailwindcss.com/docs/upgrade-guide — `@tailwind`→`@import`, dropping tailwind.config.js, `@config`, `@utility` migration, PostCSS/Vite/CLI, browser support.
- https://tailwindcss.com/docs/dark-mode — `dark:` default (media) + class/data-attribute `@custom-variant dark` overrides; FOUC-safe toggle.
- https://tailwindcss.com/docs/responsive-design — Container queries: `@container`, `@sm:`…`@7xl`, `@max-*`, ranges, named containers, cq units.
- https://tailwindcss.com/docs/adding-custom-styles — `@layer base/components`, `@utility` (simple/complex/functional), `@variant`, arbitrary values.
- https://tailwindcss.com/blog/tailwindcss-v4 — v4 headline: new engine, CSS-first config, tokens-as-CSS-vars, cascade layers, built-in container queries, OKLCH/P3.

## Theming (shadcn / tweakcn / OKLCH)

- https://ui.shadcn.com/docs/theming — `components.json` (`cssVariables`, `baseColor`), semantic token list, background/foreground pairing, `--radius` scale, `@theme inline`, OKLCH.
- https://ui.shadcn.com/docs/dark-mode and https://ui.shadcn.com/docs/dark-mode/next — `next-themes` `ThemeProvider` (`attribute="class"`), layout wiring.
- https://tweakcn.com — Visual no-code theme editor/generator; live preview; export CSS vars or a `registry:theme` JSON; OKLCH/HSL.
- https://github.com/jnsahaj/tweakcn — tweakcn is open-source; for shadcn/ui on Tailwind v4.
- Corroboration: https://www.shadcnblocks.com/docs/blocks/theming · https://deepwiki.com/shadcn-ui/ui/7.1-tailwind-css-integration · https://shadcnstudio.com/blog/shadcn-cli-v4-registry-base-and-registry-font/ — OKLCH token format, registry cssVars, install flow.

## Reference libraries (repo org + theming)

- https://github.com/shadcn-ui/ui — Monorepo (`apps/v4`, `packages/shadcn`); single-file primitives in `registry/new-york-v4/ui/`.
- https://github.com/tremorlabs/tremor — Single package; per-component folder with co-located stories/specs; `tailwind-variants`; hard-coded palette; JS chart colors. Install: https://tremor.so/docs/getting-started/installation · blocks: https://blocks.tremor.so
- https://github.com/cschroeter/park-ui — Bun monorepo; `@park-ui/preset` (Panda recipes + Radix-color palettes); Ark UI; 5-variant system. Theming: https://github.com/cschroeter/park-ui/blob/main/website/src/content/docs/theming.mdx
- https://github.com/origin-space/originui — Now "coss ui" (Cal.com); legacy in `apps/origin/`, active Base UI in `apps/ui/`; static `/r/*.json` via `shadcn build`.
- https://github.com/haydenbleasel/kibo — Per-component workspace packages; registry JSON generated dynamically via Next route handlers. Site: https://www.kibo-ui.com
- https://github.com/magicuidesign/magicui — Monorepo; single-file components; `motion`; static `/r/*.json`. Served item: https://magicui.design/r/animated-beam.json
- https://ui.aceternity.com/docs/cli — Aceternity install (`shadcn add <url>` / `@aceternity/<name>`); registry: https://ui.aceternity.com/registry/bento-grid.json
- https://github.com/adobe/react-spectrum — A11y gold standard; layered monorepo (`@react-types` → `@react-stately` → `@react-aria` → `@react-spectrum`); `react-aria-components` unstyled. Hook: https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/button/useButton.ts · Tailwind plugin: https://github.com/adobe/react-spectrum/tree/main/packages/tailwindcss-react-aria-components

## Responsive / thumb zones / touch targets

- https://www.lukew.com/ff/entry.asp?1927 — LukeW: large-screen reachability; bottom placement; Facebook bottom-tab results; Reachability cost.
- https://www.lukew.com/ff/entry.asp?1085 — LukeW: touch-target sizes; Apple 44px; ~8–10mm convergence.
- https://www.smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users/ — Thumb-zone green/yellow/red model; ~75% thumb use.
- https://www.smashingmagazine.com/2020/02/design-mobile-apps-one-hand-usage/ — One-hand usage; bottom nav as gold standard.
- https://alistapart.com/article/how-we-hold-our-gadgets/ — Hoober: 49%/36%/15% grip data.
- https://developer.apple.com/design/human-interface-guidelines/accessibility — Apple HIG; 44×44pt minimum (corroborated via search).
- https://developer.mozilla.org/en-US/docs/Web/CSS/env — `env()` safe-area insets; `viewport-fit=cover`; fallbacks.
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — WCAG 2.5.8: 24×24px AA + exceptions; relation to 2.5.5 (44px AAA).

## Accessibility — WAI-ARIA APG & motion

- https://www.w3.org/WAI/ARIA/apg/patterns/ — Index of all patterns (no stepper/wizard pattern exists).
- https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ — Tabs: tablist/tab/tabpanel, roving tabindex, auto vs manual activation.
- https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ — Carousel: roledescription, play/pause first, pause on hover/focus, live-region rules.
- https://www.w3.org/WAI/ARIA/apg/patterns/radio/ — Radio Group: arrows select-on-move, Space, roving tabindex (quiz).
- https://www.w3.org/WAI/ARIA/apg/patterns/accordion/ — Accordion: heading>button, aria-expanded/controls.
- https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/ — Disclosure: single button + aria-expanded (flashcard flip / show-answer).
- https://www.w3.org/WAI/ARIA/apg/patterns/feed/ — Feed: role=feed/article, posinset/setsize, aria-busy, Page Up/Down.
- https://www.w3.org/WAI/ARIA/apg/patterns/slider/ — Slider: valuenow/min/max/text, arrows/Home/End/PageUp; prefer native input.
- https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible — Keyboard-vs-mouse focus ring; don't remove outlines.
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion — Reduce/no-preference; opacity-over-transform best practice.
