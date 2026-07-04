# Mermaid styles for storylines

The `mermaid-diagram` widget renders ANY Mermaid source (`chart`), themed
automatically from the live CSS tokens (colors resolve from the active
`[data-theme]` — never hardcode colors in the chart). Extras: `details[]`
(click a node id → explanation panel; write explicit ids like `a[Label]`) and
`zoomable` for big graphs. Mermaid is lazy-loaded: using it costs nothing on
guides that don't.

Pick the STYLE by what the moment is — don't default to a top-down flowchart:

| Style | Source starts with | Use when the episode describes… |
|---|---|---|
| Flowchart (TD/LR) | `flowchart TD` / `flowchart LR` | Branching/merging processes, decisions, structures with references. `LR` reads better for pipelines; `TD` for hierarchies. Supports subgraphs and dotted edges (`-.->`) — great for `$ref`-style links. |
| Sequence | `sequenceDiagram` | Two or more actors exchanging messages in order — client/server, API calls, a conversation with a system. The lifeline notation IS the lesson. |
| State | `stateDiagram-v2` | Something that lives in states with transitions — a request lifecycle, a job queue, a UI. |
| ER | `erDiagram` | Data models: entities, attributes, cardinalities ("un User tiene muchos Posts"). |
| Class | `classDiagram` | OO structures, interfaces, inheritance — e.g. the shape of generated client code. |
| Journey | `journey` | A user's experience through steps with satisfaction scores — episodes about UX or process pain. |
| Timeline | `timeline` | Chronology of events/eras. Prefer the `timeline` WIDGET when items need expandable detail; use mermaid's when you want the compact visual strip. |
| Mindmap | `mindmap` | A topic radiating subtopics — episode overviews, brainstorm recaps. |
| Quadrant | `quadrantChart` | Positioning things on two axes ("esfuerzo vs impacto"). Prefer infographic `matrix` for a hand-placed 2x2 of 4 items; quadrant for many plotted points. |
| Pie | `pie` | Simple share-of-total with real numbers. Prefer `data-chart` for bar/line comparisons. |
| Git graph | `gitGraph` | Branching/merging strategies in episodes about git workflows. |
| Gantt | `gantt` | Phases over calendar time — planning episodes. |

## Rules

- One idea per diagram; 5–12 nodes. If it needs more, split into two screens
  or move detail into `details[]` instead of node labels.
- Node labels 1–4 words, in the episode's language; `details[].description`
  carries the long explanation (it renders rich text).
- Use explicit node ids (`spec[...]`, `user[...]`) whenever you pass `details`.
- `zoomable: true` only for genuinely large graphs (ER models, mindmaps).
- Don't duplicate a straight `A → B → C` in mermaid — that's `flow-diagram`'s
  job (see widget-guide). Mermaid earns its place when edges branch, loop,
  or carry actors/state.
