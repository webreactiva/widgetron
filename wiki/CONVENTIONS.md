# Wiki conventions — the schema file

This is the single source of truth for how the code wiki is structured and
maintained. The three skills all read from here; do not restate these rules
inside them.

**Three verbs**, borrowed from the pattern this wiki is built on:

| verb | what it does |
| ---- | ------------ |
| **`wiki-ingest`** | take code in — seeds the wiki if empty, otherwise reconciles the diff since the checkpoint |
| **`wiki-query`** | answer a question, and file the answer back if it is worth keeping |
| **`wiki-lint`** | is the wiki sound? `pnpm wiki` for what a machine can decide, `--deep` for what needs reading |

The deterministic engine (`scripts/wiki/`) sits underneath those verbs; you
should not have to think about it to use the wiki.

The wiki is an **LLM-maintained knowledge base derived from the code**. It is
**descriptive, never normative** — when the wiki and the code disagree, the
code wins and the wiki gets corrected. It **complements `CLAUDE.md`**, never
restates it: the wiki carries the *why* and the cross-cutting flows that no
single file holds; conventions/rules live in `CLAUDE.md` and are linked, not
copied.

Two boundaries are never crossed:

- **A wiki pass never modifies code.** It touches `wiki/**` and nothing else. If
  it finds a bug along the way it notes it on the page and tells the user.
- **`synced:` is never re-stamped without re-reading the page against the code.**
  That field is the only guarantee the wiki is not lying; faking it turns the
  wiki into noise shaped like truth.

## The rule that decides whether a page earns its place

> **The wiki holds what the code cannot say.**

Yes: the *why*, the invariants, the flows that cross files, the discarded
alternatives, the history of a decision, the places where three things must
change together, what breaks in practice.

No: signatures, prop lists, export enumerations, option tables. `tsc`, the
`*.meta.ts` files and `getWidgetManifestJSON()` already say that, and duplicating
it guarantees it rots. When you need to point at code, **link**:
`packages/widgets/src/lib/registry.tsx:439`.

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

The toolchain that enforces this schema lives outside `wiki/`, in
`scripts/wiki/` (`drift` · `coverage` · `lint`, behind `pnpm wiki`) plus the
post-commit notifier `scripts/wiki-hook.sh`. When the scripts and this file
disagree, **this file wins** and the scripts get fixed.

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
synced:           # short SHA this page was last reconciled against
confidence:       # high | inferred — optional, absent means high
related:          # links to sibling pages (optional)
  - ./flashcards.md
---

<!-- body: stay high-altitude, do NOT transcribe the code -->
```

Five required keys, three optional. **That is the whole schema** — one template,
not seventeen, and no per-type variants to remember.

A page may carry any other key it finds useful (`trigger:` on a flow,
`options:` on a decision, `siblings:` on an entity). The parser keeps them and
the lint ignores them: they are notes for the reader, not contract. A key only
joins the schema when something actually reads it.

There is deliberately **no date field**. `synced:` already answers the question
that matters — *how old is this knowledge?* — and answers it better: run
`git show -s --format=%cs <synced>` and you get the date of the commit the page
was verified against, not the day someone typed into the frontmatter.

Three fields do the heavy lifting:

- **`sources:`** is the inverted index. It is what lets `wiki:drift` map a
  changed file back to the pages that document it, so `wiki-ingest` never has to
  guess. Keep it accurate: a page whose `sources` point at moved/deleted files is
  the #1 cause of drift. Be
  **specific** — a `sources:` entry that claims a whole app or package makes
  coverage read green for code nobody ever wrote up, and `wiki:lint` warns about
  exactly that. Globs are allowed (`.../widgets/*/*.meta.ts`); a wildcard-free
  directory means `dir/**`.
- **`synced:`** is per-page staleness. If any of a page's `sources` changed
  after its `synced` SHA, the page is stale — that is exactly what the hook and
  `wiki:drift` detect.
- **`confidence:`** separates *read* from *deduced*. `high` (the default, so it
  can be omitted) means "I read this in the code". `inferred` means "this is my
  reading and it may be wrong" — use it for intent, rationale and history you
  reconstructed rather than found. A wiki that does not mark the difference stops
  being trustworthy within two months. Prefer asking the user over guessing; when
  you do guess, say so here.

## Cross-links & language

- Plain markdown links only: `[text](./other.md)`. **No wikilinks** — widgetron
  uses `[[term]]` for RichText glossary terms and the two would collide.
- English, like the rest of the repo.
- Group `index.md` by page type; each line is the page's `responsibility`.
- Link generously. `wiki:lint` reports pages nothing links to, and an orphan page
  is usually a page nobody will ever find.

## Writing a page

- Open with what it is and why it exists. Never "this document describes…".
- **Prose over bullet lists.** Six bullets of three words each is usually a
  paragraph nobody wrote.
- Point at code with `path:line`, not by transcribing it.
- A page that does not fit in two screens is usually two pages.
- When a change **contradicts** what a page claimed, do not silently overwrite:
  say what it used to be and what changed it, with the SHA. That is the part git
  does not tell well, and it is the most valuable thing a wiki accumulates.
- On a `decision` page the valuable half is **the discarded alternative and
  why**. If neither the code nor the commit messages hold it, ask the user
  instead of inventing it — or mark the page `confidence: inferred`.

## State & log

The **repo-level checkpoint** lives in `wiki/.state.json`:

    {"version": 1, "last_indexed_commit": "<full sha>"}

`last_indexed_commit` means "every commit up to here is reflected in the wiki".
`wiki-ingest` reads it to compute the diff base and advances it to HEAD *only
after* the touched pages verify — and writes it in the first place when seeding.
`wiki-query` and `wiki-lint` never move it: they file or audit out of band, and
cannot claim the whole repo is indexed. Read it with:

    sed -n 's/.*"last_indexed_commit": *"\([a-f0-9]*\)".*/\1/p' wiki/.state.json

`log.md` is the human-readable **narrative** — append-only, one entry per run:

    ## 2026-07-24 · wiki-ingest
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

Deterministic, `git` only, no LLM. One CLI, three questions:

```bash
pnpm wiki              # all three, human report — silent parts stay silent
pnpm wiki:drift        # is the wiki behind the code?
pnpm wiki:coverage     # is all the code in the wiki?
pnpm wiki:lint         # is the wiki internally sound?
```

Flags: `--json` (machine-readable, for the skills), `--strict` (exit 1 on any
finding — CI), `-v` (list every file instead of a summary).

- **`drift`** — staleness on **both** axes. Repo: commits and code files since
  `.state.json`'s `last_indexed_commit`, excluding `.wikiignore`. Page: for each
  page, whether any of its `sources` changed since its own `synced` SHA. It
  compares against the **working tree**, so uncommitted edits count too.
- **`coverage`** — tracked code that **no** page's `sources` claims, filtered by
  **`wiki/.wikiignore`**. Resolve each cluster by adding a page (usually a module
  page) or, if it is genuinely out of scope, by ignoring it in `.wikiignore` — a
  conscious call, not silence.
- **`lint`** — integrity: required keys, valid `type` / `confidence`, a `synced`
  that is a real commit, sources that still match a tracked file, over-broad
  sources, broken markdown links (body **and** `related:`, plus `index.md`'s
  own), orphan pages, and pages missing from `index.md`. It also warns once the
  wiki grows past `INDEX_SCALE_LIMIT` pages — see below.

### Retrieval, and when index-first stops working

`wiki-query` reads `index.md` and drills down. That works while the one-line
summaries still *discriminate*; past enough pages, a dozen of them look equally
plausible for the same question and the index only lists instead of ranking.
The pattern this wiki is built on puts that ceiling around "~hundreds of pages"
and reaches for a search engine there.

We have no search layer, and at this size we do not need one — but "we'll notice
when we do" is not a plan, so the lint carries the tripwire: past
`INDEX_SCALE_LIMIT` (`scripts/wiki/lib.mjs`) it asks for a decision. The cheap
answer when that day comes is BM25 over page bodies, recomputed per run — no
stored index to go stale, no dependency, same `git`-only footprint. Embeddings
would mean infrastructure and are a different conversation.

Exit codes: a plain run fails (1) only on **lint errors** — a broken wiki.
Staleness and coverage are debt, not breakage; use `--strict` to fail on those
too. The post-commit hook (`scripts/wiki-hook.sh`) runs `drift` and `coverage`
only, never fails a commit, and never calls an LLM.

What a machine cannot check — contradictions between pages, claims that expired,
concepts cited with no page, pages that only restate signatures, missing
subsystems — is the job of **`wiki-lint --deep`**, which reads the pages as text
and proposes rather than edits.

## Porting this to another repo

The engine is repo-agnostic: `scripts/wiki/*.mjs` reads only `git`, this file's
schema and `wiki/.wikiignore`. To reuse the system elsewhere, copy
`scripts/wiki/`, `scripts/wiki-hook.sh`, the three skills and this file, then
change exactly four things:

1. **`wiki/.wikiignore`** — the paths that never count as documentable code in
   that repo (tests, lockfiles, build config, generated assets).
2. **The `wiki` scripts in `package.json`** — or call
   `node scripts/wiki/wiki.mjs` directly if the project has no package manager
   convention. Nothing else in the engine assumes pnpm.
3. **`WORKSPACE_ROOT_RE` in `scripts/wiki/lib.mjs`** — it recognises
   `apps/<name>` and `packages/<name>` as workspace roots to flag over-broad
   `sources:`. A non-monorepo wants a different pattern, or none.
4. **The examples in this file** — the page-type table, the template and the
   "what the code already says" list name widgetron's own files. Swap them for
   that repo's equivalents; the *rules* around them travel unchanged.

The five page types, the one template, the three verbs and both health axes are
domain-independent by design. Nothing above assumes React, TypeScript or a
monorepo.
