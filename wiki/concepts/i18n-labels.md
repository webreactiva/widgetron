---
title: i18n & labels
type: concept
applies_to: widget chrome (UI strings)
responsibility: How every user-facing widget string is customizable and translatable across three merge layers.
sources:
  - packages/widgets/src/lib/i18n.tsx
  - packages/widgets/src/locales/es.ts
synced: d2f4037
related:
  - ./analytics-events.md
---

Every user-facing string in a widget is customizable and translatable. Widget
chrome uses `useLabels("<widget>", DEFAULT_LABELS, labels)`; UI strings are never
baked in inline.

## Three layers, merged (later wins)

1. built-in English defaults — each widget exports its `DEFAULT_*_LABELS`;
2. global overrides from `<WidgetronProvider labels={...} locale="..." iconSet="..." />`;
3. per-instance `labels={...}` prop on the widget.

Label values may be strings, React nodes, or **functions** (for interpolation /
pluralization), so a single dictionary can localize the whole library.

## Locale & icon set

## One flat bag per widget, and what that costs when packs mix

The per-instance `labels` prop is a flat object, and `useLabels` merges it over
the defaults by key. That is fine while one widget owns one pack — and it breaks
the moment a widget composes a second one. `confidence` is shared by `quiz`,
`predict-output` and `estimate-slider`, and forwarding the host's whole bag to it
meant both packs competed for the same keys: `PredictOutputLabels.question`
("What will this print?") won over `ConfidenceLabels.question` ("how sure are
you?"), and the scale asked the wrong question with nothing failing (`d2f4037`).

The fix was structural rather than a rename: a composed pack is **nested**
(`labels={{ confidence: {…} }}`) so the two namespaces cannot collide at all.
The provider path never had the problem — `esLabels.confidence` was already its
own namespace — which is the tell that the flat per-instance bag was the odd one
out. Any future shared pack should nest the same way.

A label may also be a **function**, which is how a graph's screen-reader
sentence localises: `nodeGraph.edge(from, to, label)` builds "Browser → API: …"
per language rather than concatenating fragments in the component.

The three-layer merge is also what let the pedagogy chrome ship translated on
day one: `confidence`, `contrast`, `checkpoint`, `anatomy` and `codeLab` are just
five more namespaces in `esLabels`, and the storyline's confidence read-out is a
label function like any other (`a065d0a`). A widget that bakes a string inline
would have been the one gap in a Spanish guide.

`WidgetronProvider` also sets a BCP-47 `locale` (used for number formatting, see
`lib/formula`) and an `iconSet` — the default Iconify collection for bare icon
names, itself part of the theme (base uses `lucide`, the Web Reactiva theme uses
`pixelarticons`). Spanish copy lives in `locales/es.ts` (`esLabels`).
