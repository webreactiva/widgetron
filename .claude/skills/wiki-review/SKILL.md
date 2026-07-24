---
name: wiki-review
description: "Review the health of the code wiki's CONTENT — what the deterministic checks cannot see: pages that contradict each other, claims that expired, concepts cited everywhere with no page, pages that only restate signatures, subsystems nobody explains, and `confidence: high` on code that no longer says that. Returns a prioritized findings list with a proposed fix for each; fixes nothing without confirmation. Use when: (1) user invokes /wiki-review, (2) the wiki has grown past ~20 pages or a few weeks have passed, (3) user says 'revisa el wiki', 'audita el wiki', 'está el wiki bien?', 'review the wiki', 'wiki lint'."
argument-hint: "[--path=<glob>] [--fix-trivial]"
user_invocable: true
---

# wiki-review — audit what the machine cannot check

`pnpm wiki` decides everything decidable: keys, links, dead sources, staleness,
coverage. This skill covers the rest — whether the wiki is still *true*, *useful*
and *coherent*. **Read
[`wiki/CONVENTIONS.md`](../../../wiki/CONVENTIONS.md)** first; the schema, the
writing rules and the `confidence:` contract live there.

It **proposes, it does not rewrite.** Reconciling with code is `wiki-update`'s
job; this pass finds what to reconcile.

```
pnpm wiki --json          ← the mechanical baseline (errors + warnings)
   │
   ▼
read the pages themselves ── six lenses ──┐
   contradiction · expired · orphan concept · density · gap · confidence
   │                                       │
   ▼                                       ▼
prioritized findings  ──►  proposed fix per finding  ──►  ask before touching
   │
   ▼
log.md entry:  ## <date> · wiki-review — N findings
```

## Steps

1. **Baseline.** Run `pnpm wiki --json`. Everything it reports is already
   decided — list it, don't re-derive it. Your job starts where it stops.
2. **Read the pages.** Not the code: the wiki, as a body of text. Scope with
   `--path` if it is large, and say what you skipped.
3. **Apply the six lenses:**
   - **Contradiction** — two pages asserting incompatible things. Name both, and
     which one the code supports.
   - **Expired claim** — a statement that was true and no longer is. Verify
     against the code before calling it: cite `path:line`.
   - **Orphan concept** — a term used across several pages with no page of its
     own (the wiki assumes a reader who already knows it).
   - **Density** — a page that only restates signatures, prop lists or exports.
     It violates "the wiki holds what the code cannot say" and should be
     rewritten or merged. Also flag pages that no longer fit in two screens.
   - **Gap** — a subsystem nobody explains, or an obvious question with no
     answer. Cross-check the `coverage` output: a green coverage with an
     over-broad `sources:` entry is a **false green**, not coverage.
   - **Confidence** — `confidence: high` on a claim you cannot find in the code,
     or `inferred` on something now confirmed. Getting this field wrong is worse
     than leaving it off.
4. **Return a prioritized list.** One line per finding: what, where, why it
   matters, and the proposed fix. Order by how much damage it does to a reader
   who trusts the page. Say plainly when a finding is a judgement call.
5. **Fix nothing without a yes** — except trivia: a broken link, a missing
   `index.md` line, an obviously wrong `type:`. With `--fix-trivial`, apply those
   and list them separately from the proposals.
6. **Log it.** Append to `wiki/log.md`:
   ```
   ## <date> · wiki-review
   - N findings (M critical) · <one line on the state of the wiki>
   ```
   Do **not** touch `.state.json` and do **not** re-stamp any `synced:` — a review
   verifies nothing against the code on its own.

## Notes

- A finding you cannot back with either a page quote or a `path:line` is an
  opinion. Say so, or drop it.
- "No findings" is a real, valuable outcome. Don't manufacture work.
- Never modify code. If you find a bug, note it and tell the user.
- Suggested cadence: every few weeks, or when the wiki passes ~40 pages.
