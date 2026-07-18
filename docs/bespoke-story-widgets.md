# Bespoke story widgets — one-off components per storyline

Widgetron ships a **fixed catalog**: the registry (`packages/widgets/src/lib/registry.tsx`)
is the only source of renderable types, `renderWidget()` warns and renders
nothing for unknown types, and `validateWidgetTree()` rejects them. That is the
right default — the catalog is the AI-generation contract — but some episodes
have a teaching moment no general-purpose widget serves:

- A git episode wants a **commit-graph toy**: click commits, drag a branch
  pointer, watch a rebase replay.
- An HTTP episode wants a **latency simulator**: a request racing across a
  network diagram as you toggle cache/CDN/keep-alive.
- «El Humo» (productividad) could have used a **smoke meter** the reader cranks
  as they self-assess their week.

The ask: let an AI agent design a **special one-off component** for one story,
and have it render inside that storyline — without turning every episode's
whim into a permanent library widget.

First rule: **prove the catalog doesn't cover it.** Most "special" needs are a
composition (`scrubber` + `data-chart`, `hotspots` over a `figure`,
`scrollytelling` with nested nodes) or a near-miss of an existing widget's
`whenToUse`. A bespoke component is the exception, not a shortcut past reading
the manifest.

## What the architecture already provides

Three existing facts make this much cheaper than it sounds:

1. **The registry is an open, public object.** `widgetRegistry` is exported
   from the package entry, and `renderWidget` / `validateWidgetNode` /
   `validateWidgetTree` read it **at call time**. Assigning a new entry (full
   `WidgetMeta` + component) makes the type render *and* validate with zero
   library changes. Only `widgetManifest` is a snapshot taken at import — and
   that is fine: the manifest is the *generation* contract, and bespoke
   components are generated, not picked from it. They should **not** pollute
   the manifest other stories generate against.
2. **`story render` already compiles TSX per story.** The pipeline
   (`apps/story-studio/src/render/build.ts`) writes a fresh `main.tsx` into
   `.render/<slug>/` and runs an inner Vite + React build per guide. Adding one
   more generated import is not a new mechanism.
3. **The CLI runs under `tsx`** (`story validate`, `story lint`), which
   compiles the library's TSX today. It can compile a story's TSX just as
   well, and the dev studio (Vite) can pick story-scoped files up with
   `import.meta.glob`.

So the question is not "how do we execute custom code" — the render pipeline
is a compiler already. The question is **where the source lives, how it gets
registered, and what keeps it honest**.

## The options

| | Option | Power | Safety | Integration (tokens, RichText, events, i18n) | Cost |
|---|---|---|---|---|---|
| a | Composition-only (nested nodes) | Low — no new behavior | Total | Perfect | **Zero — it exists today** |
| b | Story-scoped generated TSX, compiled into the story dist | Full | Review + typecheck + lint | Perfect (same runtime, same tokens) | Small loader + conventions |
| c | Sandboxed runtime (iframe / web component with generated HTML/JS) | High | Strong isolation | Poor — loses tokens, RichText, event bubbling, i18n | Runtime + a second styling story |
| d | `custom-block` escape hatch with a curated mini-DSL | Medium | High | Good | **A private framework to maintain** |

### a) Composition-only

Already shipped: `content()` props (`surprise`, `scrollytelling`, `hotspots`,
`compare-slider`, `profile-gate`…) nest arbitrary widget nodes, so an agent can
assemble surprisingly specific screens from JSON alone. Ceiling: no new state,
no new interaction logic — a commit-graph toy is out of reach. This is not the
answer to the ask, but it is the mandatory **first stop** before reaching for
anything below.

### b) Story-scoped generated TSX (recommended)

The component's source lives **next to the story it serves**
(`content/<slug>.components/`), is registered into `widgetRegistry` at load
time, and is compiled by the *existing* per-story Vite build into that story's
dist. From the tree's point of view it is a normal node; `validateWidgetTree`
validates it against the zod schema its meta ships. The story and its
component version **together** — when the story's dist is frozen, so is the
component; when widgetron's public API changes, `story render`'s typecheck
breaks loudly instead of silently.

Trade-off to be honest about: generated code runs in reader browsers. The
mitigation is not sandboxing — it is that the dist is built **locally, from
reviewed source, importing only the widgetron public API**, exactly like the
rest of the guide. The security boundary is the same one the whole
podcast-to-story flow already relies on: author review before publishing, plus
mechanical guardrails (below). If widgetron ever accepts third-party stories
built server-side from untrusted uploads, this option must be re-evaluated —
that product does not exist today.

### c) Sandboxed runtime

An iframe/web-component with generated HTML/CSS/JS isolates faults, but it
forfeits everything that makes a widget feel native: no semantic tokens (CSS
variables don't cross a `srcdoc` iframe), no `RichText`/glossary, no
`widgetron:event` bubbling into the storyline's challenge meter, its own copy
of any runtime it needs, and a second theming story to maintain. And since our
dists are built and reviewed locally, the isolation buys little that review
doesn't already. Reject.

### d) Mini-DSL escape hatch

A `custom-block` widget interpreting a curated layout/behavior DSL is the
worst of both worlds: below its ceiling, plain composition (a) already works;
above it, you keep growing the DSL until it is a bad programming language the
library must version and document forever. Reject.

## Recommendation and phased plan

**Phase 0 — now, zero code.** Document composition as the official first
answer. The podcast-to-story skill gains one sentence: before proposing a
bespoke component, the agent must name the two nearest catalog widgets and why
their `whenToUse` doesn't fit (this goes in the handoff).

**Phase 1 — the minimal loader (option b).**

- **Convention over API.** Each bespoke component is one file,
  `content/<slug>.components/<name>.tsx`, exporting a component and a full
  `WidgetMeta` (schema + example included). Its type is namespaced
  `x-<name>` (e.g. `x-commit-graph`) so a glance at any tree distinguishes
  catalog from bespoke, and no future library widget can collide with it.
- **A tiny `registerWidget(type, entry)` helper** in the library (a guarded
  assignment into `widgetRegistry` that rejects non-`x-` types and duplicate
  registrations). Strictly optional — assignment works today — but it makes
  the contract greppable and keeps bespoke types out of the manifest by
  construction.
- **Three load points, one glob pattern:**
  - CLI (`story validate` / `story lint` / pre-render validation): before
    validating, dynamically import every `content/<slug>.components/*.tsx`
    for that slug. `tsx` compiles them; a compile error is a validation error.
  - Dev studio (Player/Editor): `import.meta.glob("../../content/*.components/*.tsx")`,
    awaited for the active slug before `validateStoryDocument`.
  - `story render`: the generated `main.tsx` gains one import + register line
    per component file found, before `renderWidget(story)` — the inner Vite
    build does the rest, and the component's code ships only in that story's
    dist.
- **Guardrail lint** (new `story lint` rules, source-level, cheap greps): see
  the checklist below. Mechanical rules catch the low-hanging violations;
  review catches the rest.

**Phase 2 — the promotion path.** The `.components/` folder is a **staging
area**, not a second library. When a bespoke component earns reuse (a second
story wants it), it gets promoted through the normal "adding a widget" recipe
in CLAUDE.md — meta, registry, locales, playground catalog, tests — and the
story's node swaps `x-commit-graph` for the new catalog type. Watching what
accumulates in `.components/` is free product research on what the catalog is
missing.

**Explicitly deferred:** cross-story sharing of bespoke components (that is
what promotion is for), hot-reload of component source in the dev editor, and
any server-side execution story.

## How a story references its bespoke component

Nothing changes in the `.story.json` format — the node is a normal node:

```
apps/story-studio/content/
  git-sin-miedo.story.json
  git-sin-miedo.components/
    commit-graph.tsx        ← component + meta + register, one file
  git-sin-miedo.assets/     ← (existing pattern: same slug-scoped layout)
```

Inside the story tree:

```json
{
  "type": "x-commit-graph",
  "props": {
    "commits": [
      { "id": "a1f9", "parent": null, "label": "init" },
      { "id": "b2c3", "parent": "a1f9", "label": "feat: cart" }
    ],
    "branch": "main",
    "caption": "Drag `main` back one commit and watch the *working tree*."
  }
}
```

And the component file's skeleton (the shape the generator emits):

```tsx
import * as React from "react";
import { z } from "zod";
import {
  cn, RichText, emitWidgetronEvent, registerWidget, type WidgetMeta,
} from "@webreactiva/widgetron";

const schema = z.object({ /* … the JSON props above … */ });

function CommitGraph(props: z.infer<typeof schema>) { /* … */ }

const meta: WidgetMeta = {
  version: 1,
  category: "Bespoke",
  summary: "…",
  whenToUse: "Bespoke to git-sin-miedo — do not reuse; promote instead.",
  schema,
  example: { type: "x-commit-graph", props: { /* … */ } },
};

registerWidget("x-commit-graph", { ...meta, component: CommitGraph });
```

## Fit with the generation pipeline

The podcast-to-story flow gains one gated step, mirroring `--complement`:

1. **Gate** (`--bespoke=ask|never|auto`, default `ask`): while outlining, if
   the agent believes a moment needs a bespoke component, it must present the
   need, the two nearest catalog widgets it rejected and why, and a one-line
   spec. `never` keeps the guide catalog-only.
2. **Generate**: write `content/<slug>.components/<name>.tsx` against the
   skeleton above and reference `x-<name>` in the tree like any node.
3. **Validate**: the existing loop already does the work —
   `story validate <slug>` now compiles the TSX (type errors surface here) and
   validates the node against the component's own zod schema with the same
   self-correction error paths; `story lint` runs the guardrail rules on the
   source.
4. **Playtest**: `story-playtester` drives it in a real browser like any other
   screen — mobile viewport, touch targets, does the toy actually teach.
5. **Handoff**: every bespoke component is listed prominently (name, need,
   rejected alternatives, source path) — the author reviews the *source*, not
   just the JSON, before `story render`. This review is the security boundary.

## Guardrails checklist for generated components

Mechanically enforceable (candidates for `story lint` source rules):

- [ ] **Imports only** from `react`, `zod` and `@webreactiva/widgetron` (the
      public entry — never `@/…` internals, never new dependencies).
- [ ] **No network, no escape hatches**: no `fetch`/`XMLHttpRequest`/
      `WebSocket`, no `dangerouslySetInnerHTML`, no `eval`/`new Function`,
      no `document.cookie`/storage writes outside the widget's own keys.
- [ ] **Aseptic styling only**: semantic token classes (`bg-card`,
      `text-muted-foreground`, `--primary`, `color-mix`…); no hex/rgb
      literals, no brand colors, no `[data-theme]` selectors.
- [ ] **Type is `x-`-prefixed** and registered exactly once, in its own file.

Review-enforced (the handoff checklist):

- [ ] All source code and internal copy in **English**; every reader-facing
      string arrives via **props** (the story JSON carries the content
      language), and free-text props render through **`<RichText>`**.
- [ ] Ships a full **`WidgetMeta`** (zod schema + valid example) so
      `validateWidgetTree` really validates it.
- [ ] Meaningful interactions emit **`widgetron:event`** via
      `emitWidgetronEvent` — snake_case actions, JSON-safe data, no PII, only
      from user-triggered handlers (never effects).
- [ ] **Reduced-motion-safe**: any animation behind
      `prefers-reduced-motion`; completion celebration (if any) only on a
      reader-triggered completion.
- [ ] **Mobile-first**: container-aware layout, ≥44px touch targets, controls
      within thumb reach.
- [ ] **No persistence surprises**: state is local unless the story's
      `storageKey` pattern is deliberately followed.

## Non-goals

- Bespoke components never appear in `getWidgetManifestJSON()` — the manifest
  stays the catalog-only generation contract.
- No runtime plugin loading: components are compiled into the story dist at
  `story render` time, never fetched.
- No versioning/migration machinery for bespoke types: the component and its
  story live and freeze together; "migration" is editing both in one commit.
