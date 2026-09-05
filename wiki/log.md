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

## 2026-07-31 · wiki-ingest (reconcile → 763c574)

Four commits since the checkpoint, but only one touched code: `763c574` added
six widgets (sort-steps, estimate-slider, reflection, code-diff, tabs,
comparison-table). The other three were the wiki's own toolchain.

- decisions/assessment.md: the biggest change. Six options → ten, and a new
  closing section on **the two that grade nothing** — estimate-slider and
  reflection are in the assessment family precisely because they withhold the
  answer, which is the opposite of what the other eight do. Also folded in
  drag-and-drop, which belonged there before and was missing.
- new: components/widgets/code-diff.md — the one new widget that hides a
  mechanism (LCS line diff, `LCS_CELL_BUDGET` degradation, and *why* the author
  passes two full snippets instead of pre-tagged lines: an agent writes these
  props, and mis-tagged lines produce a diff that renders perfectly and lies).
- components/widgets.md: 57 → 61, families updated, and a new **deterministic
  initial state** section. sort-steps could not shuffle with `Math.random()`
  without tearing hydration; that constraint already governed surprise,
  flashcards and every confetti burst in the library, and no page said so.
- components/registry.md: **contradiction recorded.** The page claimed the
  shadcn registry "never drifts". It had drifted 22 widgets — `registry.json`
  held 41 items against 55 widget folders, so `npx shadcn add` could not install
  any of them. Regenerated in `763c574`. Also noted, not fixed: the generator's
  `INTERNAL` map is missing five `@/…` modules (rich-text, confetti,
  use-widget-events, analytics, leaflet), so most emitted items ship incomplete
  registry dependencies.
- concepts/analytics-events.md: the PII boundary now has a rule and two
  examples — where a widget holds reader-authored text the event carries a
  measure of it, never the text (`cta` → `{ ok }`, `reflection` → `{ length }`).
- re-stamped after re-reading, no substantive change: architecture,
  components/lib, components/playground, concepts/ai-generation-surface,
  concepts/i18n-labels, flows/render-widget, flows/story-pipeline.
- checkpoint advanced to 763c574.

## 2026-08-11 · tooling
- the notifier is now wired at both real work boundaries: `.git/hooks/post-commit`
  (per clone, **symlink** — the copy that was installed here would have stopped
  tracking edits to the script) and a checked-in `SessionStart` hook in
  `.claude/settings.json` (`startup|resume`, same script), so an agent opens the
  session already knowing the wiki is behind.
- nothing on `Stop`/end-of-turn, on purpose: `drift` compares against the working
  tree, so it would fire mid-task on every uncommitted edit, and an ingest pass is
  judgement, not something to queue after each turn. Recorded in
  CONVENTIONS §Wiring the signal.
- no CI check yet — the repo has no `.github/workflows/`; `pnpm wiki --strict` is
  the hook to hang it on when it does.

## 2026-09-05 · wiki-ingest (reconcile)
Five commits since the checkpoint; only two carried code (`683985b`, `a065d0a`)
— the make-it-learnable pedagogy landing in the library. Thirteen pages were
stale against it, plus one gap the wiki had no page for at all.

- **new: concepts/pedagogy.md** — the load-bearing one. Why teaching judgement
  ships in three forms (prose in `docs/`, data in `lib/authoring.ts`, a gate in
  the story lint), why each alone fails, and the obligation that they move
  together. Also the one guard the data has: `authoringGuideWidgetTypes()` +
  its test, because a widget rename would otherwise leave an agent emitting a
  type that no longer resolves and nothing would fail.
- **flows/story-pipeline.md contradicted the code.** It said the lint checks
  "pacing · repetition · variety (advisory)". Since `683985b` it also carries
  eight pedagogy rules, one of which (`wrong-answer-teaches`) is an **error** and
  fails the gate. Corrected, with why that one is the exception.
- **decisions/assessment.md**: ten widgets → twelve (`checkpoint`, `contrast`),
  and a new section on what a check owes the reader whatever the mechanic —
  the wiki previously documented *which* widget to pick and nothing about the
  feedback that makes any of them worth using.
- **components/widgets.md**: ~61 → ~65, plus a section on the four widgets that
  came from a gap rather than a content need, and the note that `code-lab` is
  the only widget in the library that executes code (sandboxed iframe, parent-
  side time budget) — a risk profile no other widget has.
- **components/widgets/quiz.md**: the `confidence` prop, and why the options
  stay locked until the reader stakes a level (after the answer it would be
  hindsight, not calibration).
- **concepts/analytics-events.md**: the layer consumes its own events —
  `storyline` reads `calibration` and `data-module-index` off its children's
  bubbling events, which is why the finale needed no wiring.
- **concepts/ai-generation-surface.md**: `getAuthoringGuideJSON()` as the second
  half of the surface. **components/story-studio.md**: the `story guide` command.
- **components/primitives.md**: `confidence.tsx`, and the observation that a
  primitive here is not only a visual atom.
- reconciled with smaller additions: architecture, components/lib,
  components/playground, concepts/i18n-labels, flows/render-widget.
- checkpoint advanced to a065d0a.

