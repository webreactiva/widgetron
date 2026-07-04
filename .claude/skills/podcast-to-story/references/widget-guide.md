# Widget calibration guide

How to spread an episode across widgetron's catalog. The JSON Schema + examples
come from `pnpm story manifest` (always dump it — it is the source of truth);
this file is the *judgment* layer: what signal in a transcript maps to which
widget, and how to keep a guide varied.

## Signal → widget map

Scan the transcript for these signals. Every match is a candidate screen — the
guide should convert MOST of them into their matching widget, not into prose.

| Signal in the episode | Widget | Notes |
|---|---|---|
| A process/pipeline in one straight line | `flow-diagram` | Add `detail` per node → interactive walkthrough |
| Structure that branches, nests or references (trees, configs, architectures) | `mermaid-diagram` | Pick the style per [mermaid-styles.md](mermaid-styles.md) — flowchart, sequence, state, ER, mindmap…; `details` keyed by node id for click-to-explain |
| A conceptual relationship (center+spokes, layers, trade-off, hidden depth…) | `infographic` | Pick the `layout` metaphor: hub, pyramid, iceberg, balance, funnel, cycle, venn, matrix, target — or the napkin-style ones with an `icon` per item: `stairs`, `milestones`, `chevrons` (process ribbon), `roadmap` (winding journey), `pillars` |
| Real numbers compared or a trend | `data-chart` | Only with numbers actually said in the episode |
| Code explained piece by piece | `code-translation` | THE widget for demystifying a snippet |
| "What does this print/do?" | `predict-output` | Code is correct; skill = tracing |
| "There's a mistake here" | `spot-the-bug` | Skill = finding the flawed line |
| A sequence of shell commands | `terminal-sim` | Literal commands + output, one per click |
| A dialogue / two sides arguing / client-server exchange | `group-chat` | Great for dramatized moments of the episode |
| A misconception worth confronting | `quiz` | Per-option feedback quoting the episode's reasoning |
| Recall of a sentence/definition with exact wording | `fill-in-the-blanks` | Blanks inside the real sentence |
| Items that belong to categories | `drag-and-drop` | Classification as the lesson |
| "It depends" advice | `decision-tree` | Different paths → different recommendations |
| Terms/definitions worth memorizing | `flashcards` | Self-paced, ungraded |
| An ordered procedure the reader will DO | `step-cards` | Actions, not events |
| Events/milestones over time | `timeline` | With expandable descriptions |
| A set of peer concepts/tools | `pattern-card` | Icon + title + one-liner each |
| A person or team worth introducing (host, guest, authors) | `profile-card` | Avatar (image or auto-initials), name, role, bio; several people stack into columns. Only with real avatar URLs — initials otherwise |
| A memorable verbatim sentence | `quote` | Attribution required; verbatim only |
| One idea that must pop | `callout-box` | aha / info / warning |
| Jargon used across the guide | storyline `glossary` + `[[term]]` in `glossary-text` | Define once, tooltip everywhere |
| A ready-to-run AI prompt | `prompt-template` | `{{slots}}` editable + copy button |
| "Depends on your level/role" content | `profile-quiz` + `profile-gate` | Personalization pair |
| One evolving graphic narrated in steps | `scrollytelling` | Inside a screen; rare |
| A number the reader should play with | `tangle-text` (inline) / `scrubber` (panel) | Only with real relationships from the episode |
| A highlighted audio moment WITH a real clip URL | `audio-clip` | See media rule below |
| A video the author actually published | `video-clip` | youtube/vimeo id or real src |

## Icons (universal, theme-aware)

Several widgets take an `icon` per item — use them to make screens scannable,
NOT as decoration. Icon-capable slots: `section-header` (header icon),
`pattern-card` cards, `step-cards` steps, `timeline` items, `infographic`
items (drawn inside the shape for `stairs`/`milestones`, legend chip
elsewhere), `frame-stepper` boxes, and the standalone `icon` widget.

- **Prefer bare names** (`"icon": "rocket"`, `"book"`, `"lock"`): they resolve
  against the THEME's icon set (lucide by default, pixelarticons under
  webreactiva, whatever the theme's `design.md` declares via `iconSet:`), so
  the same document restyles with the theme. Stick to common names that exist
  across sets (the lucide vocabulary is the reference).
- **Fully-qualified names** (`"lucide:route"`, `"mdi:database"`) pin one set —
  use only when a specific glyph matters more than theme coherence.
- Emojis render verbatim (no theme resolution) — don't mix emojis and icon
  names within one widget.
- Pick semantic icons (lock for security, link for $ref) and keep one
  consistent vocabulary across the guide.

## Variety rules

- Draw screens from **at least 4 rows-groups** of the map above. A guide that is
  prose + quiz + prose is a failed conversion.
- **At least one diagram widget** (`mermaid-diagram`, `flow-diagram`,
  `infographic`, or `data-chart`) whenever the episode describes any structure,
  process, or comparison — nearly every technical episode does.
- `prose`/`glossary-text` are connective tissue: aim for **under a third** of
  screens. If two text screens are adjacent, one of them probably wants to be a
  widget.
- Interactive check (`quiz`, `fill-in-the-blanks`, `predict-output`,
  `drag-and-drop`) in the **second half**, before the CTA.
- **Never two consecutive screens of the same widget type**, across module
  boundaries too. Two quizzes in a row read as a test, not a lesson; two prose
  screens in a row read as a blog post. Merge or convert one of them.
- Don't double-teach: the same moment should not appear as prose AND as a
  widget. Pick the strongest form (a dramatized `group-chat` beats a paragraph
  retelling the same exchange).
- End with something the reader keeps: `checklist` (persistent) or
  `prompt-template` are strong closers before the injected CTA.

## Media rule (hard)

`audio-clip` and `video-clip` enter the document **only with real URLs provided
by the user** (or produced first with the `make-audio-clip` skill). Never
placeholders, never guessed Spreaker links — the generated guide is definitive,
not a demo. When a moment deserves audio but no clip exists yet: leave the
widget out, and report the exact timestamp range as a pending clip in the
handoff summary. Omit the envelope's `audio` block entirely until sources exist.

## Source-metadata rule (hard)

Show, episode number and date live in `meta.source` — and nowhere else. Never
in titles, eyebrows, subtitles or screen copy. The guide must stand alone as
teaching material; provenance is envelope data.

## Always set

- `story.props.storageKey` = the document slug → the storyline remembers the
  reading position and offers to resume on the next visit.
- `meta.lang` = the episode's language → widget chrome (Module eyebrows, quiz
  buttons, resume bar…) localizes itself via the locale packs.
