---
name: wiki-lint
description: "Check the wiki's health and report what to fix. Default: runs the deterministic checks (integrity, staleness, coverage) and explains what each finding means. With --deep, also reads the pages as a body of text to catch what no script can — contradictions, expired claims, concepts cited with no page, pages that only restate signatures, undocumented subsystems, wrong confidence. Proposes; fixes nothing without a yes. Use when: (1) user invokes /wiki-lint, (2) user says 'revisa el wiki', 'audita el wiki', '¿está bien el wiki?', 'review the wiki', (3) periodically, every few weeks."
argument-hint: "[--deep] [--fix-trivial] [--path=<glob>]"
user_invocable: true
---

# wiki-lint — is the wiki sound, and is it still true?

Two layers under one verb. The first is a machine; the second is a reading.

```
       pnpm wiki          ← deterministic: git only, no LLM, no judgement
   integrity · staleness · coverage
            │
            ├── default ──► explain the findings · propose fixes
            │
            └── --deep  ──► read the pages themselves, six lenses:
                            contradiction · expired · orphan concept
                            density · gap · confidence
                                     │
                                     ▼
                        prioritized findings + a proposed fix each
```

**Read [`wiki/CONVENTIONS.md`](../../../wiki/CONVENTIONS.md)** — the schema, the
writing rules and the `confidence:` contract live there.

It **proposes, it does not rewrite.** Reconciling with the code is
`wiki-ingest`'s job; this pass finds what needs reconciling.

## Default pass

1. Run `pnpm wiki` (add `--json` when you need to consume it, `-v` for
   file-by-file). Everything it reports is already decided — **list it, don't
   re-derive it**.
2. Explain each finding in plain terms: what it means, why it matters, and the
   fix. Distinguish the two scales: **errors** are a broken wiki (exit 1);
   **staleness and coverage are debt**, not breakage.
3. Watch for the trap the machine cannot see on its own: **a green coverage with
   an over-broad `sources:` is a false green**, not coverage. Read the
   `over-broad` warnings and the coverage total together, always.

## `--deep` pass

Also read the wiki **as a body of text** — the pages, not the code. Scope with
`--path` on a large wiki and say what you skipped. Six lenses:

- **Contradiction** — two pages asserting incompatible things. Name both, and
  which one the code supports.
- **Expired claim** — true once, not now. Verify against the code before calling
  it: cite `path:line`.
- **Orphan concept** — a term used across pages with no page of its own; the wiki
  is assuming a reader who already knows it.
- **Density** — a page that only restates signatures, prop lists or exports. It
  breaks "the wiki holds what the code cannot say" and should be rewritten or
  merged. Also flag pages that no longer fit in two screens.
- **Gap** — a subsystem nobody explains, or an obvious question with no answer.
  Cross-check coverage, including the false green above.
- **Confidence** — `high` on a claim you cannot find in the code, or `inferred`
  on something now confirmed. Getting this field wrong is worse than omitting it.

## Output

4. **A prioritized list.** One line per finding: what, where, why it matters, and
   the proposed fix. Order by how much damage it does to a reader who trusts the
   page. Say plainly when a finding is a judgement call.
5. **Fix nothing without a yes** — except trivia (a broken link, a missing
   `index.md` line, an obviously wrong `type:`), and only with `--fix-trivial`.
   List those separately from the proposals.
6. **Log a `--deep` pass** in `wiki/log.md`:
   ```
   ## <date> · wiki-lint --deep
   - N findings (M critical) · <one line on the state of the wiki>
   ```
   Do **not** touch `.state.json` and do **not** re-stamp any `synced:` — a review
   verifies nothing against the code on its own. A default pass needs no entry.

## Notes

- A finding you cannot back with a page quote or a `path:line` is an opinion. Say
  so, or drop it.
- **"No findings" is a real, valuable outcome.** Don't manufacture work.
- Never modify code. Found a bug? Note it and tell the user.
- Suggested cadence: the default pass whenever; `--deep` every few weeks, or when
  an answer from `wiki-query` smells incomplete.
