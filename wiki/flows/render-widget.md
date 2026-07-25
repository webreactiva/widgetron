---
title: Render a widget node
type: flow
trigger: renderWidget(node) is called with a { type, version?, props } node — directly, via WidgetNodeView, or recursively for a nested node.
responsibility: How a serializable JSON node becomes a rendered React element — registry lookup, migrate, adapt, render.
sources:
  - packages/widgets/src/lib/registry.tsx
synced: c032ded
related:
  - ../concepts/ai-generation-surface.md
  - ../concepts/rich-text.md
  - ../components/lib.md
---

The single path every widget takes from JSON to pixels. Lives entirely in
`lib/registry.tsx`.

```
renderWidget(node)            node = { type, version?, props }
      │
      ▼
widgetRegistry[type] ──miss──► console.warn + return null
      │ hit
      ▼
migrate(props, from)          if node.version < entry.version
      │
      ▼
adapt(props)                  icon-name → <Icon>  ·  nested node → renderWidget ⟲
      │
      ▼
<Component {...props} />
```

## The steps

1. **Lookup.** `widgetRegistry[node.type]`. Unknown type → `console.warn` and
   render `null` (nothing breaks; the rest of the tree still renders).
2. **Migrate.** `from = node.version ?? entry.version`. If the node is older than
   the registry's current version and the entry has a `migrate`, upgrade the
   props first — so old AI-generated JSON keeps working.
3. **Adapt.** If the entry has an `adapt`, transform JSON-only props into React
   props. Two conversions recur:
   - **icon-name strings → `<Icon>`** via `asIcon` (only strings matching
     `ICON_NAME_RE`, e.g. `"rocket"` / `"lucide:rocket"`; emojis pass through).
   - **nested nodes → rendered widgets** via `asContent` → `isNode` →
     `renderWidget` (recursive). This is how a `storyline`'s screens or a
     `callout`'s body can themselves be widgets.
4. **Render.** `<Component {...props} />`.

Because most props are plain data and a string *is* a `ReactNode`, the JSON shape
mirrors each widget's TypeScript props almost exactly — that is what makes the
library authorable by hand or by an LLM.

## Related surface

`WidgetNodeView` renders a node or a list of nodes declaratively. Validation
(`validateWidgetNode` / `validateWidgetTree`) and the manifest live in the same
file — see the [AI generation surface](../concepts/ai-generation-surface.md).
