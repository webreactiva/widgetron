---
name: wiki-init
description: "Bootstrap the code wiki under wiki/ from the current state of the repository. First pass only: reads the codebase and seeds the page tree (architecture, flows, concepts, components, decisions), writes index.md, the .state.json checkpoint, and the first log entry. Use when: (1) user invokes /wiki-init, (2) wiki/ does not exist yet or has no pages, (3) user says 'crea el wiki', 'inicializa el wiki', 'bootstrap the wiki'."
argument-hint: "[--scope=all|widgets|lib] "
user_invocable: true
---

# wiki-init — bootstrap the code wiki

Seed `wiki/` from the code as it is right now. Run once. After this, day-to-day
updates go through **wiki-update**; questions through **wiki-ask**.

**Read [`wiki/CONVENTIONS.md`](../../../wiki/CONVENTIONS.md) first** — the layout,
the five page types, the one template, the `.state.json` checkpoint and the
ASCII-diagram convention all live there, not here.

```
CODE @ HEAD
   │  survey: manifests, lib/registry, widgets/, primitives/, lib/, apps/
   ▼
map the page tree ── architecture · flows · concepts · components · decisions
   │  one template per page · real sources: · synced: = base sha
   ▼
index.md  +  log.md (first entry)  +  .state.json { last_indexed_commit: HEAD }
   │
   ▼
wiki-lint.sh + wiki-coverage.sh   (must pass before done)
```

## Steps

1. **Guard.** If `wiki/.state.json` exists (or `wiki/` already has pages), stop
   and suggest `wiki-update` — init is not for re-running.
2. **Record the base SHA:** `git rev-parse HEAD`. Its short form is every page's
   `synced:`; its full form is `last_indexed_commit` in `.state.json`.
3. **Map the repo** at the altitude of the taxonomy — do NOT write one page per
   file:
   - `architecture.md` — the monorepo, the layers, the JSON-node system, build.
   - `flows/` — sequences no single file holds (at least `render-widget.md`).
   - `concepts/` — the cross-cutting patterns from `CLAUDE.md`'s conventions.
   - `components/` — one **module** page per subsystem, plus **component** pages
     only for units complex enough to earn one (the rest grow on demand).
   - `decisions/` — "which widget when", seeded from each `whenToUse`.
4. **Every page** gets the template with real `sources:` (verify the paths) and
   the base `synced:`. Add a small **ASCII diagram** to each `flow` /
   `architecture` page — boxes labelled with real file/symbol names (see the
   Diagrams rules in CONVENTIONS). Stay high-altitude; never transcribe code.
5. **Write `index.md`** grouped by type, one line per page (its `responsibility`).
6. **Write the checkpoint & log:**
   - `wiki/.state.json` → `{"version": 1, "last_indexed_commit": "<full sha>"}`
   - `wiki/log.md` first entry:
     ```
     ## <date> · wiki-init
     - seeded N pages across architecture/flows/concepts/components/decisions
     ```
7. **Verify:** `scripts/wiki-lint.sh` and `scripts/wiki-coverage.sh` must pass —
   required keys present, no page born stale, no subsystem left unclaimed (add a
   page or ignore it in `.wikiignore` on purpose).

## Don'ts

- Don't restate `CLAUDE.md`; link to it.
- Don't invent `sources:` paths — grep/verify each.
- Don't fan out to a page per widget on the first pass; modules first.
