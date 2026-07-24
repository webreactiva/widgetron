---
title: RichText — the markdown-agnostic text layer
type: concept
applies_to: every author-facing free-text slot
responsibility: How plain strings from JSON become formatted inline content (bold, italic, code, links, breaks, glossary terms) with no markdown dependency.
sources:
  - packages/widgets/src/primitives/rich-text.tsx
updated: 2026-07-24
synced: c032ded
related:
  - ./ai-generation-surface.md
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

## Do NOT wrap

Content inside SVG `<text>` (SVG can't render HTML), code shown literally, and
strings carrying their own syntax (`{{slots}}`, a mermaid `chart`).
