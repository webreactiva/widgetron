---
title: Story Studio
type: entity
responsibility: The app that turns a .story.json document into a publishable interactive guide — its engine, its CLI, its local authoring editor.
sources:
  - apps/story-studio/src/cli.ts
  - apps/story-studio/src/dev-api.ts
  - apps/story-studio/src/app
  - apps/story-studio/src/engine/schema.ts
  - apps/story-studio/src/engine/theme.ts
  - apps/story-studio/src/engine/srt.ts
  - apps/story-studio/src/themes
synced: f5cb894
related:
  - ../flows/story-pipeline.md
  - ../architecture.md
  - ../concepts/ai-generation-surface.md
---

`@webreactiva/story-studio` is where a widget library becomes a *product*: it
takes a `.story.json` document, validates it, and ships it as a standalone
interactive guide. It is the consumer that proves the
[AI generation surface](../concepts/ai-generation-surface.md) works — the
storyline node tree an agent generates is exactly what this app renders.

## The document envelope

A story is a **`WidgetNode` tree plus a thin envelope**. The tree is native
widgetron (what `renderWidget()` consumes); the envelope adds only what a
document needs and a widget cannot carry: metadata, audio sources, and *author
policy* (surprises, the CTA). `apps/story-studio/src/engine/schema.ts` is the zod
definition; `content/<slug>.story.json` are the real documents.

## The invariant that shapes the whole app

```
engine/core.ts        no widgetron, no React imports  ─┬─► Vite dev-server plugin
  schema · resolve · srt · theme                       ├─► the CLI (tsx)
                                                       └─► the browser
engine/validate.ts    imports the widget registry  ────► browser · Vitest · CLI
                                                        but NOT vite.config
```

`core.ts` is **node-safe on purpose**: it must run inside the Vite config's
esbuild bundle, where importing the React component registry would explode.
Anything needing the registry — full tree validation against every widget's real
schema — lives in `validate.ts` instead. Break that split and the dev server
stops booting, with an error that points nowhere near the cause.

## Four things it does

`pnpm story <command>` (`src/cli.ts`, run through `tsx`):

- **`validate <slug>`** — envelope + the resolved tree against every widget's
  schema.
- **`lint <slug> [--score]`** — the *pacing* gate: rhythm, repetition, variety.
  See [the pipeline](../flows/story-pipeline.md) for why it is separate.
- **`render <slug>`** — emits `dist/<slug>/`, a self-contained folder ready to
  upload anywhere.
- **`theme <design.md>`** — compiles a design document into theme CSS
  (`src/engine/theme.ts`, output in `src/themes/`). Design decisions are written
  in prose and become tokens, instead of being hand-maintained twice.
- **`manifest`** — dumps the widget manifest, the generation contract the
  authoring skills consume.

## The write path is dev-only, by decision

The editor (`src/app/pages/Editor.tsx`) saves through a Vite **dev-server** API
(`src/dev-api.ts`, decision D-003): it mutates `content/<slug>.story.json` on
disk, so the source of truth stays in the repo and **every edit is reviewable as
a plain git diff**. The consequence is deliberate: `vite build` output and
exported guides carry no write surface at all, which is why the app has no
auth and no edit key to leak.

`src/engine/srt.ts` parses subtitle files (`parseSrt`, `cutRange`), which is how
transcript-derived content reaches a story.
