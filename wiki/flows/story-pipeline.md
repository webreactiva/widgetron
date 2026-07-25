---
title: From .story.json to a published guide
type: flow
trigger: `pnpm story validate|lint|render <slug>` — or the dev editor saving a story, which runs the same envelope check.
responsibility: The path a story document takes — envelope check, deterministic injection, tree validation, pacing gate, static build.
sources:
  - apps/story-studio/src/engine/core.ts
  - apps/story-studio/src/engine/resolve.ts
  - apps/story-studio/src/engine/validate.ts
  - apps/story-studio/src/engine/lint.ts
  - apps/story-studio/src/render/build.ts
synced: f5cb894
related:
  - ../components/story-studio.md
  - ./render-widget.md
  - ../concepts/ai-generation-surface.md
---

Four stages, and the order is the whole point: nothing reaches a reader that was
not validated *after* it was assembled.

```
content/<slug>.story.json
      │
      ▼
validateEnvelope()         zod: metadata · audio · author policy   (node-safe)
      │
      ▼
resolveStory()             INJECT surprises + CTA into the tree    (D-004)
      │                    deterministic · build time · never in the client
      ▼
validateWidgetTree()       every node against its real widget schema
      │                    ← needs the registry, so it lives in validate.ts
      ▼
lintStoryDocument()        pacing · repetition · variety            (advisory)
      │
      ▼
story render → dist/<slug>/   static shell + hydration + theme CSS  (D-002)
```

## Why injection happens before validation

Surprises and the CTA are **declared** in `settings`, not written into the tree
by the author, and `resolveStory` materializes them at build/validate time
(decision D-004). Placement is deterministic: `mid` lands after screen ⌈N/2⌉ of
the flattened reading order (and merges into `end` when N < 3, since three
screens have no meaningful middle); the CTA takes the storyline's `outro` slot so
the reader is celebrated first and pitched second.

The consequence is the rule worth remembering: **what ships is exactly what was
validated**. The client only ever renders an already-resolved tree — it never
injects anything at runtime, so a reader cannot see a screen that no schema
check ever saw.

## Why `lint` is not part of `validate`

`validateStoryDocument` checks the envelope and every widget's schema. It says
nothing about **rhythm**: a story with five `prose` screens in a row, zero
diagrams and two modules validates perfectly clean and is a bad guide.

Those pacing rules used to live only as a generation contract inside the
authoring skill — a promise the generator made to itself. `engine/lint.ts` turns
that promise into a check that runs in the CLI and in CI. Its categories come
from the **live widget manifest**, so the taxonomy cannot drift away from the
library. Errors fail the gate; warnings are advisory.

## The build

`story render <slug>` emits `dist/<slug>/` as a self-contained folder — static
shell (title and module index in the HTML itself) plus a client hydration bundle
and the theme CSS, with a relative base so it uploads anywhere. Full
`renderToString` prerender and single-file inlining are deferred on purpose
(decision D-002); see `docs/story-studio-decisions.md`.

Once hydrated, each node follows [the render flow](./render-widget.md).
