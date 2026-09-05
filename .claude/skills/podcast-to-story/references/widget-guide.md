# Widget calibration guide

How to spread an episode across widgetron's catalog. The JSON Schema + examples
come from `pnpm story manifest` (always dump it — it is the source of truth);
this file is the *judgment* layer: what signal in a transcript maps to which
widget, and how to keep a guide varied.

Two companions, both machine-readable, both worth dumping before you write:

- `pnpm story guide` — the library's own pedagogy as data (`getAuthoringGuideJSON()`):
  source-shape → widgets, check-intent → mechanic, the composition budget, the
  sequencing rules and the non-negotiables. Prose version: [`docs/pedagogy.md`](../../../../docs/pedagogy.md).
- `pnpm story lint` — enforces the checkable half. Its pedagogy rules are listed
  under [Teaching rules](#teaching-rules-what-the-lint-enforces) below.

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
| A CHANGE to code: refactor, fix, before/after | `code-diff` | Pass both full versions — it computes the diff. `notes` carry the plain-language why |
| "What does this print/do?" | `predict-output` | Code is correct; skill = tracing. It must come BEFORE the explanation — once the reader has read the answer, asking them to predict it is theatre. Pair it with a `code-lab` right after so they can run it |
| "There's a mistake here" | `spot-the-bug` | Skill = finding the flawed line. Exactly ONE line sets `buggy: true` (with its `explanation` on that line) — validation rejects it otherwise |
| A sequence of shell commands | `terminal-sim` | Literal commands + output, one per click |
| A dialogue / two sides arguing / client-server exchange | `group-chat` | Great for dramatized moments of the episode |
| A misconception worth confronting | `quiz` | Per-option feedback quoting the episode's reasoning. On the two or three where the belief runs deepest, add `confidence: true` — confident-and-wrong is the one outcome a plain check cannot surface |
| A belief the episode BREAKS — "everyone thinks X, actually Y" | `contrast` | expected → actual → why, gated so the reader commits first. `why` is not optional: without it you have a fun fact. Never right after a quiz that already made the same point |
| An artifact with named parts (a prompt, a URL, a config, a JSON payload, a command) | `anatomy` | The parts assemble into the real artifact, clickable, one note each. Quote it VERBATIM. Put it early in jargon-heavy material, then never drift from the words it taught |
| A bug beside its fix, or two strategies over the same input | `code-lab` | The reader RUNS both and compares the output — sandboxed iframe, no DOM, no network. Prefer it to one more diagram when the mechanism can be executed in a few lines. `setup` holds everything the variants share |
| The end of a stretch where several ideas have stacked up | `checkpoint` | Things the reader should now be able to SAY, self-rated, each with somewhere to go back to. One every three or four modules; make at least one item reach back two modules |
| Recall of a sentence/definition with exact wording | `fill-in-the-blanks` | Blanks inside the real sentence |
| Items that belong to categories | `drag-and-drop` | Classification as the lesson. `explanation` must name the DIMENSION that separates the zones — a board that turns green and says nothing leaves no criterion for next time |
| An ordered procedure whose ORDER is the lesson | `sort-steps` | The reader rebuilds the sequence; author writes `items` already correct. `explanation` carries the why. With `low`/`high` it becomes a RANKING — ordering by a property (coupling, cost, risk) instead of by time |
| A counter-intuitive NUMBER the reader will get wrong | `estimate-slider` | They guess on a slider, commit, then see the real value. Only with a number actually said. `confidence: true` when their sense of scale is the thing being corrected |
| A question only the reader can answer (their code, their week) | `reflection` | Open answer, saved on their device; `modelAnswer` appears only after they commit. One or two per guide, at a module's close. Add `keys` (2–4 ideas + a generous regex each) so they see which pieces they left out — that read-back is the point |
| "It depends" advice | `decision-tree` | Different paths → different recommendations |
| Several options weighed across the same criteria | `comparison-table` | Booleans → check/cross, values verbatim; `highlight` the recommended column |
| The same lesson in several equivalent forms (npm/pnpm/yarn, JS/TS) | `tabs` | Panels hold any widget. Never for content everyone must read — what is closed is invisible |
| Terms/definitions worth memorizing | `flashcards` | Self-paced, ungraded |
| An ordered procedure the reader will DO | `step-cards` | Actions, not events |
| Events/milestones over time | `timeline` | With expandable descriptions |
| A set of peer concepts/tools | `pattern-card` | Icon + title + one-liner each |
| A person or team worth introducing (host, guest, authors) | `profile-card` | Avatar (image or auto-initials), name, role, bio; several people stack into columns. Only with real avatar URLs — initials otherwise |
| A memorable verbatim sentence | `quote` | Verbatim only; NEVER ownerless — a first-person quote with no `attribution` leaves the reader unsure who speaks. Attribute it; with no profile use a neutral source label (`attribution: "La voz del episodio"` + a `role` for the stance) |
| One idea that must pop | `callout-box` | aha / info / warning |
| Jargon used across the guide | storyline `glossary` + `[[term]]` in any text slot | Define once, tooltip everywhere — RichText resolves `[[term]]` in prose, captions, checklist items, quiz feedback… |
| A ready-to-run AI prompt | `prompt-template` | `{{slots}}` editable + copy button |
| "Depends on your level/role" content | `profile-quiz` + `profile-gate` | Personalization pair |
| One evolving graphic narrated in steps | `scrollytelling` | Inside a screen; rare |
| A number the reader should play with | `tangle-text` (inline) / `scrubber` (panel) | Only with real relationships from the episode |
| A highlighted audio moment WITH a real clip URL | `audio-clip` | See media rule below |
| A video the author actually published | `video-clip` | youtube/vimeo id or real src |
| A single striking number the reader should FEEL (a %, a multiplier, a count) | `scroll-stat` | Whole **positive** integers only — it counts up from 0 on scroll. `meter` for a bar (`max` when not a 0–100 %). One hero figure; use `data-chart` to compare several |
| A bespoke line sketch that gains from drawing itself in (trend line, arrow, curve, bracket) | `draw-diagram` | Raw SVG `d` paths in a `viewBox`. Does NOT satisfy the "at least one diagram" rule below — that still needs infographic/flow/mermaid/data-chart |
| A short, punchy claim / thesis / section opener to LAND | `kinetic-headline` | Plain text only (no markdown/`[[term]]`), word-by-word reveal on scroll. Seasoning — at most one per module |
| A reveal / punchline / the villain's name, with suspense | `decode-headline` | Plain text, scrambles then resolves. A special move; never repeat it in a guide |
| An ordered sequence read left-to-right (steps, before→after→result, a mini gallery) | `sticky-pan` | Pins and pans horizontally on scroll; 3–6 panels (text and/or real images). Text-only panels are centered statement cards. Max ONE pinned scene per guide |
| ONE real place that matters (where it happened, a venue) | `map` | Real `[lat,lng]` only (see geo rule). Static, no scroll hijack. Host app must import `leaflet/dist/leaflet.css` |
| A journey across TWO+ real places | `story-map` | Guided tour; flies between stops on scroll. Counts as a pinned scene (max one); real coords only; needs leaflet.css |
| A real photograph that deserves a moment of arrival | `unmask-strip` | Wipes in behind a clip-path edge on scroll. Real image URL only (see media rule). Use `figure` for a plain illustrative image |

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
- **At most ONE pinned scene per guide**, counting `backdrop-section`,
  `sticky-pan` and `story-map` together. Each one hijacks the scroll to run its
  effect; stacking them exhausts the reader and dulls the move.
- **Display headlines are seasoning.** `kinetic-headline` and `decode-headline`
  are occasional beats (a couple across a whole guide, at most one `decode`).
  Reach for `section-header` for a normal titled heading — a guide where every
  module opens with an animated headline reads as a gimmick.

## Teaching rules (what the lint enforces)

Variety keeps a guide readable; these decide whether it teaches. Full reasoning
in [`docs/pedagogy.md`](../../../../docs/pedagogy.md) and, as data, in
`pnpm story guide`.

- **A wrong answer must teach — this is a lint ERROR.** Every wrong option needs
  `feedback` that names the belief behind it ("estás leyendo `[]` como vacío y
  por tanto falsy…"), not a restatement of the right answer. A check that says
  "casi" and stops has spent the reader's attention and returned nothing; it is
  worse than no check. Write the feedback FIRST, then the question — if the
  explanation is thin, the question is not worth asking.
- **Three real options beat four with a decoy.** If you cannot name why someone
  would pick an option, delete it. And keep the options within a few words of
  the same length: when the right answer is the long hedged one, readers pick on
  shape rather than meaning (`option-shape`).
- **Pick the mechanic from what you want to know**, not from the content's
  shape: `predict-output` for "does their model produce the right output",
  `drag-and-drop` for "can they tell two confusable things apart", `sort-steps`
  for "do they understand the order", `estimate-slider` for "is their sense of
  scale right", `reflection` for "can they generate it". A guide where every
  check is a `quiz` defaulted rather than chose (`mechanic-variety`).
- **At least one check asks for a commitment before the reveal** —
  `predict-output`, `estimate-slider` or `contrast`, placed EARLY (`prediction`).
  If the audience already believes they know the topic, open cold with one,
  before the first explanation: start by breaking a belief, not building one.
- **A `checkpoint` every three or four modules** (`checkpoint`), and make at
  least one of its items reach BACK two modules. A check sitting directly under
  what it taught measures working memory, not retrieval.
- **`confidence: true` on two or three checks at most** (`confidence-budget`).
  Asked constantly it becomes a tic; used sparingly it surfaces the
  confident-and-wrong reader, which is the most useful thing a check can find.
- **A model the reader can move must be one you can defend.** `tangle-text` and
  `scrubber` need a `note` saying where the numbers come from (`honest-model`).
  A relationship discovered by dragging a number is believed far harder than one
  asserted in a paragraph, so an invented formula teaches a falsehood
  efficiently. If you cannot defend it, use `comparison-table`.
- **Difficulty is a budget and the setting changes.** Installing a fact should be
  frictionless — spend the reader's working memory on the idea. Building a skill
  should cost them something — make them produce an answer rather than pick one.
  Same guide, opposite settings.

## Media & real-world rule (hard)

`audio-clip` and `video-clip` enter the document **only with real URLs provided
by the user** (or produced first with the `make-audio-clip` skill). Never
placeholders, never guessed Spreaker links — the generated guide is definitive,
not a demo. When a moment deserves audio but no clip exists yet: leave the
widget out, and report the exact timestamp range as a pending clip in the
handoff summary. Omit the envelope's `audio` block entirely until sources exist.

The same "no invented media" rule governs the scroll-driven visual widgets:

- **`unmask-strip`** needs a **real image URL** (same bar as `figure`). No stock
  placeholders. No image → don't use it.
- **`map` / `story-map`** need **real coordinates for places the episode actually
  names**. Never geolocate a metaphor or invent a route — if the episode has one
  real place, use a single `map`; if it names two-plus real places on a journey,
  `story-map`; if it names none, use neither.
- Any guide that renders a `map` or `story-map` requires the host app to
  `import "leaflet/dist/leaflet.css"` (Story Studio's Player and the `story
  render` pipeline already do this automatically when the tree contains one).

## Source-metadata rule (hard)

Show, episode number and date live in `meta.source` — and nowhere else. Never
in titles, eyebrows, subtitles or screen copy. The guide must stand alone as
teaching material; provenance is envelope data.

## Always set

- `story.props.storageKey` = the document slug → the storyline remembers the
  reading position and offers to resume on the next visit.
- `meta.lang` = the episode's language → widget chrome (Module eyebrows, quiz
  buttons, resume bar…) localizes itself via the locale packs.
- `meta.theme` = `"podyscroll"` by default — the product's own brand and Story
  Studio's default. Only pick another (`"webreactiva"`, a compiled brand) when
  the user explicitly asks for it.

## Engagement layer

What the storyline runtime rewards (full rules in SKILL.md — this is the
calibration cheat-sheet):

- **Per module**: `emoji` (the stamp — varied set, never repeat one) and
  `outro` (one line with voice that closes the idea and nudges forward). The
  runtime stamps the rail/TOC, collects the set in the finale and shows it in
  the reader's passport.
- **`settings.challenge.label`**: only when the episode has a native progress
  metaphor (a meter, a level, a delta). It becomes a themed meter fed by the
  reader's beaten interactions. Never force one.
- **The cover is a contract**: time, module index and challenge count are
  computed from the tree — a strong `meta.title`/`meta.description` is all
  the authoring it needs (description clamps at 2 lines; front-load it).
- **`surprise.variants[]`**: 1–2 alternative payloads of the same spirit as
  `content` — the reveal picks one at random (variable reward). Use for the
  settings surprises too.
- **`quote.timestamp`** (+ `clip` when a real cut exists): the minute chip is
  provenance; a quote with `timestamp` but no `clip` in a document that has
  an `audio` block is flagged by `story lint` as pending audio work.
- **`variant: "thread"` is NOT for generation** — it's an experimental
  reader-side presentation of the same JSON; never emit it.
