# Wiki log

Append-only, chronological. Each `wiki-ingest` / `wiki-query` /
`wiki-lint --deep` run adds an entry. Entries before 2026-07-25 use the previous
verb names (`wiki-init`/`wiki-update`/`wiki-ask`/`wiki-review`) — history is not
rewritten. The latest `synced:` line is the checkpoint the next diff starts
from.

## 2026-07-24 · wiki-init
synced: c032ded
- seeded 12 pages across architecture / flows / concepts / components / decisions
- architecture: architecture.md
- flows: render-widget.md
- concepts: aseptic-tokens, ai-generation-surface, rich-text, analytics-events, i18n-labels
- components: widgets (module), widgets/quiz (component), primitives, lib
- decisions: assessment
- next: component pages grow on demand via wiki-update / wiki-ask

## 2026-07-24 · wiki-update (coverage pass)
synced: c032ded
- added scripts/wiki-coverage.sh + wiki/.wikiignore (repo→wiki coverage axis)
- new: components/registry.md (@webreactiva/registry was unclaimed)
- aseptic-tokens.md: claimed styles/index.css
- coverage now clean; plumbing (config, lockfiles, tests, root meta) ignored via .wikiignore

## 2026-07-24 · tooling
- state moved to wiki/.state.json (repo checkpoint); log.md is now narrative-only
- added scripts/wiki-drift.sh (staleness from .state.json); hook runs drift + coverage
- adopted ASCII-diagram convention (CONVENTIONS §Diagrams); demo on flows/render-widget.md

## 2026-07-25 · wiki-update
- architecture: `pnpm wiki` and its three checks now exist as repo commands
  (package.json gained wiki/wiki:drift/wiki:coverage/wiki:lint in the f5cb894 series).
- architecture: the monorepo listed three packages and there are four —
  `packages/registry` was missing from the map, which is also why
  components/registry.md was an orphan. Fixed both with one link.
- deferred (debt, not breakage): architecture's `sources:` still claim
  `apps/playground` (7 files) and `apps/story-studio` (20 files) wholesale.
  Narrowing them is right but opens 27 uncovered files that need their own module
  pages — a bigger pass than this reconcile, deliberately not started here.

## 2026-07-25 · wiki-review
- 8 findings (2 critical) · the wiki is internally sound and honest, but it is a
  library wiki: the whole `apps/` half of the monorepo is undocumented.
- applied (approved): dropped architecture's over-broad `apps/playground` and
  `apps/story-studio` sources. Coverage went from a false green to the truth —
  27 unclaimed files in 2 clusters.
- critical: `apps/story-studio` (19 files — an engine with schema/resolve/lint/
  validate/render plus a CLI) is documented by one sentence; and `storyline`,
  cited by 4 pages as *the* AI-generation target, has no page.
- density: `components/widgets/quiz.md` carries a "Props (from the schema)"
  section — the exact transcription CONVENTIONS forbids.
- confidence: 0 of 13 pages use the field, including claims of intent that were
  never read in the code.
- no contradictions found between pages.

## 2026-07-25 · wiki-ingest
Closed the critical gap the review found: the whole `apps/` half of the monorepo
was undocumented while coverage read green.
- new: components/story-studio.md — the app, its CLI surface, and the invariant
  that shapes it (`engine/core.ts` is node-safe so it can run inside the Vite
  config's esbuild bundle; anything needing the widget registry lives in
  `validate.ts`). Also why the write path is dev-server-only (D-003).
- new: flows/story-pipeline.md — envelope → resolve (deterministic injection of
  surprises/CTA, D-004) → tree validation → pacing lint → static build (D-002).
  Records the two rules that are invisible in any single file: *what ships is
  exactly what was validated*, and why `lint` is deliberately not part of
  `validate` (schemas cannot see rhythm).
- new: components/playground.md — why the preview is a real iframe and not a
  scaled box (`@container` only tells the truth at a real width), and that
  `catalog.tsx` is hand-maintained: a widget can exist and be missing there with
  no check failing.
- architecture: now links all three, so none is born an orphan.
- .wikiignore: `apps/*/index.html` (Vite entry plumbing) — a conscious call.
- checkpoint unchanged: no new commits, this pass closed coverage debt.
- result: 16 pages, coverage complete with narrow sources — the first honest
  green. The previous one was a false green hiding 27 files.
