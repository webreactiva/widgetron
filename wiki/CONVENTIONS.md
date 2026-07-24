# Wiki conventions — the schema file

This is the single source of truth for how the code wiki is structured and
maintained. The three skills (`wiki-init`, `wiki-update`, `wiki-ask`) all read
from here; do not restate these rules inside them.

The wiki is an **LLM-maintained knowledge base derived from the code**. It is
**descriptive, never normative** — when the wiki and the code disagree, the
code wins and the wiki gets corrected. It **complements `CLAUDE.md`**, never
restates it: the wiki carries the *why* and the cross-cutting flows that no
single file holds; conventions/rules live in `CLAUDE.md` and are linked, not
copied.

## Layout

```
wiki/
  CONVENTIONS.md     # this file — the schema, not a page
  .state.json        # repo checkpoint: {"version":1,"last_indexed_commit":"<sha>"}
  .wikiignore        # git pathspecs of code that never counts for coverage
  index.md           # map · one line per page (from each page's `responsibility`)
  log.md             # append-only, chronological narrative of every run
  architecture.md    # architecture/synthesis: the map and the layers
  flows/             # flow pages: end-to-end sequences
  concepts/          # concept pages: cross-cutting patterns & conventions
  components/        # entity pages: modules (coarse) → components (fine)
  decisions/         # decision pages: "which widget when" comparisons
```

`CONVENTIONS.md`, `.state.json`, `.wikiignore`, `index.md` and `log.md` are **not
pages** (no frontmatter); everything else is a page and carries the template below.

## The five page types

| `type`         | what it is                                | example                              |
| -------------- | ----------------------------------------- | ------------------------------------ |
| `architecture` | the map and the layers                    | `architecture.md`                    |
| `flow`         | an end-to-end sequence                    | `flows/render-widget.md`             |
| `entity`       | a unit of code (module or component)      | `components/widgets/quiz.md`         |
| `concept`      | a cross-cutting pattern or convention     | `concepts/aseptic-tokens.md`         |
| `decision`     | a "which X when" comparison               | `decisions/assessment.md`            |

A **module** is just an `entity` at a coarser altitude — resolved by nesting
(`components/widgets.md` links down to `components/widgets/quiz.md`), not a new
type. A **responsibility** is a *field*, not a type.

## The one template (every page)

```markdown
---
title:            # human name
type:             # entity | concept | flow | decision | architecture
responsibility:   # ONE sentence: what this page is responsible for (feeds index.md)
sources:          # code paths this page documents — the link to git
  - packages/widgets/src/widgets/quiz/quiz.tsx
updated:          # YYYY-MM-DD of the last reconcile
synced:           # short SHA this page was last reconciled against
related:          # links to sibling pages (optional)
  - ./flashcards.md
---

<!-- body: stay high-altitude, do NOT transcribe the code -->
```

Each type adds at most **one** key: `flow` a `trigger:`, `decision` an
`options:`, `entity` a `siblings:`. That is the whole schema — one template,
not seventeen.

Two fields do the heavy lifting:

- **`sources:`** is the inverted index. `wiki-update` maps a changed file to the
  pages that document it by grepping `sources:`. Keep it accurate: a page whose
  `sources` point at moved/deleted files is the #1 cause of drift.
- **`synced:`** is per-page staleness. If any of a page's `sources` changed
  after its `synced` SHA, the page is stale — that is exactly what the hook and
  lint detect.

## Cross-links & language

- Plain markdown links only: `[text](./other.md)`. No wikilinks.
- English, like the rest of the repo.
- Group `index.md` by page type; each line is the page's `responsibility`.

## State & log

The **repo-level checkpoint** lives in `wiki/.state.json`:

    {"version": 1, "last_indexed_commit": "<full sha>"}

`last_indexed_commit` means "every commit up to here is reflected in the wiki".
`wiki-update` reads it to compute the diff base and advances it to HEAD *only
after* the touched pages verify; `wiki-init` writes it; `wiki-ask` does **not**
move it (it files individual pages out of band). Read it with:

    sed -n 's/.*"last_indexed_commit": *"\([a-f0-9]*\)".*/\1/p' wiki/.state.json

`log.md` is the human-readable **narrative** — append-only, one entry per run:

    ## 2026-07-24 · wiki-update
    - quiz.md: quiz.tsx gained the keyword-gate prop
    - new: components/widgets/radial-audiogram.md

Per-page `synced:` is the page-level freshness marker; `.state.json` is the
repo-level one. They answer different questions — keep both.

## Diagrams

Use small **ASCII diagrams** in a fenced code block wherever they clarify
structure faster than prose — request lifecycles, data flows, state machines,
decision trees. Especially on `flow` and `architecture` pages, and in the skills
that describe a process.

- Label boxes with **real symbol / file names** so the diagram stays verifiable
  like the rest of the page.
- Keep them small and dependency-free — boxes and arrows only. A diagram that
  needs horizontal scrolling is two diagrams.
- A diagram supplements prose, never replaces it: the page must still read if the
  diagram is removed.

## Health checks

Deterministic, plain `git` + `grep`/`awk`, no LLM. The post-commit hook runs the
first two after every commit; run lint yourself after any `wiki-*` edit.

- **`scripts/wiki-drift.sh`** — staleness: commits (and code files) since
  `.state.json`'s `last_indexed_commit`, excluding `.wikiignore` patterns. "Has
  the code moved past the wiki?"
- **`scripts/wiki-coverage.sh`** — coverage: tracked code that **no** page's
  `sources` claims, filtered by **`wiki/.wikiignore`**. "Is all the code in the
  wiki?" Resolve each cluster by adding a page (usually a module page) or, if it
  is genuinely out of scope, by ignoring it in `.wikiignore` — a conscious call,
  not silence.
- **`scripts/wiki-lint.sh`** — per-page integrity: required keys present,
  `sources` that still exist, and per-page **staleness** (a `source` changed
  after the page's `synced` SHA).
