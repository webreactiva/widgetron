---
title: AI generation surface
type: concept
applies_to: the JSON node layer and every widget's meta
responsibility: How the library exposes itself to an AI agent — per-widget zod meta, the enriched manifest, and recursive JSON validation.
sources:
  - packages/widgets/src/lib/registry.tsx
  - packages/widgets/src/lib/widget-meta.ts
synced: d12fb89
related:
  - ../flows/render-widget.md
  - ../decisions/assessment.md
  - ./rich-text.md
  - ./pedagogy.md
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

The `example` is not decoration either: `test/manifest.test.ts` validates every
one against its own schema *and* renders it, so an example that drifts from its
widget fails the suite rather than misleading an agent.

## The half the schemas cannot carry

The manifest answers *what can I emit, and with which props*. It is silent on the
questions that decide whether the result teaches: which four widgets out of
sixty-odd this material wants, where the checks go, what a wrong answer owes the
reader. Left implicit, an agent defaults — and the default is a document with
quizzes bolted on.

Since `683985b` that judgement ships too, as **`getAuthoringGuideJSON()`**
(`lib/authoring.ts`): source-shape → widgets with an `avoid` list, check-intent →
mechanic, the composition budget, the sequencing rules and the non-negotiables.
It is plain serializable data with no imports, so an MCP server hands it over
next to the manifest and `pnpm story guide` dumps it to a file. The reasoning,
and the obligation to keep it in step with the lint, is
[the pedagogy layer](./pedagogy.md).

Rendering the validated node is [the render flow](../flows/render-widget.md).
Free-text props must survive as strings — that is why every author-facing slot
goes through [RichText](./rich-text.md).
