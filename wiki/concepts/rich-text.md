---
title: RichText — the markdown-agnostic text layer
type: concept
applies_to: every author-facing free-text slot
responsibility: How plain strings from JSON become formatted inline content (bold, italic, code, links, breaks, glossary terms) with no markdown dependency.
sources:
  - packages/widgets/src/primitives/rich-text.tsx
synced: d12fb89
related:
  - ./ai-generation-surface.md
  - ../components/widgets.md
---

The JSON generation surface can only send **strings**, so a plain text layer is
what makes formatting actually render instead of showing raw markers. Every
author-facing free-text slot (titles, questions, feedback, message copy, list
items, callout/quote bodies…) renders through `RichText` / `renderRich`:

```tsx
<RichText>{value}</RichText>
```

## What it parses

`**bold**`, `*italic*`, `` `code` ``, `[links](url)`, `\n` breaks, and `[[term]]`
glossary tooltips (resolved via `GlossaryProvider` / `InlineTermContext`;
brackets stripped when there is no provider). Non-string nodes pass through
untouched.

## Why it's built this way

A tiny dependency-free inline parser — no markdown package. It builds **real
elements** (no `dangerouslySetInnerHTML`) and adds **no wrapper element**, so host
`[&_a]` / `[&_code]` styles still apply.

## `plainRich` — the seam where rich text has to become a string

Some slots are strings by definition: an `aria-label`, a `title`, an `sr-only`
description, clipboard text. Passing the raw value through leaks the markers,
and a screen reader announces `**API**` as "star star API star star" — worse
than the plain word the author meant. `plainRich(value, fallback)` runs the same
grammar and flattens it: markers stripped, a link's text kept over its href,
`[[term]]` reduced to the term, newlines collapsed. A node it cannot flatten
yields the fallback; inside an array it contributes nothing, so one React
element among strings does not discard the rest.

It exists because two widgets had independently written
`typeof x === "string" ? x : undefined`, which is the half-measure that leaks.

## Do NOT wrap

Content inside SVG `<text>` (SVG can't render HTML), code shown literally, and
strings carrying their own syntax (`{{slots}}`, a mermaid `chart`).

That first exclusion is a real cost, not a footnote: it is why a Mermaid diagram
cannot have a bold word, a `code` span or a `[[glossary]]` term anywhere in it.
The way out is not to fix SVG but to avoid putting text in it —
[`node-graph`](../components/widgets.md) keeps its boxes and edge labels in HTML
and uses SVG only for the arrows between them. **Text in HTML, geometry in
SVG.**
