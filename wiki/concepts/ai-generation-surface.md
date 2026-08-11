---
title: AI generation surface
type: concept
applies_to: the JSON node layer and every widget's meta
responsibility: How the library exposes itself to an AI agent — per-widget zod meta, the enriched manifest, and recursive JSON validation.
sources:
  - packages/widgets/src/lib/registry.tsx
  - packages/widgets/src/lib/widget-meta.ts
synced: 763c574
related:
  - ../flows/render-widget.md
  - ../decisions/assessment.md
  - ./rich-text.md
---

The library is built to be *generated*. Every widget carries the metadata an
agent needs to decide **what** it is, **when** to use it, the exact **shape** of
its props, and a working **example** to imitate.

## Per-widget meta

Each `<name>.meta.ts` exports a `WidgetMeta`:

- `version`, `category`, `summary` — catalog basics.
- **`whenToUse`** — AI-oriented: when to reach for this widget vs its siblings.
  This is the field that drives [decision pages](../decisions/assessment.md).
- `schema` — a **zod** schema of the JSON props (the generation target).
- `example` — a valid node, few-shot material.

`widget-meta.ts` also provides `nodeSchema` and `content()` for props that nest
other widgets (a `ReactNode` in JSON form: string, node, or a list of both).

## The manifest & validation (`lib/registry.tsx`)

- `widgetManifest` / **`getWidgetManifestJSON()`** — every type with `whenToUse`,
  its schema as **JSON Schema** (`z.toJSONSchema(..., { io: "input" })`), and its
  example. This is the MCP-ready surface.
- **`validateWidgetNode(node)`** / **`validateWidgetTree(node)`** — validate
  generated JSON against the zod schema, recursively, with error paths so the
  agent can self-correct. Unknown types are flagged; types without a schema pass
  leniently.

Rendering the validated node is [the render flow](../flows/render-widget.md).
Free-text props must survive as strings — that is why every author-facing slot
goes through [RichText](./rich-text.md).
