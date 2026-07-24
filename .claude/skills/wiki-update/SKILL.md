---
name: wiki-update
description: "Reconcile the code wiki under wiki/ with what changed in the code since its last sync. The core loop: read the .state.json checkpoint, git diff from it, map changed files to pages via their sources: frontmatter, rewrite the stale sections, handle new/orphan pages, refresh index.md, append log.md, advance .state.json. Use when: (1) user invokes /wiki-update, (2) the post-commit hook warned that code changed, (3) user says 'actualiza el wiki', 'reconcilia el wiki', 'update the wiki', before a big PR."
argument-hint: "[--since=<sha>] [--path=<glob>]"
user_invocable: true
---

# wiki-update — reconcile the wiki with the code

The six-step loop. Reconcile, don't accumulate: the code moved, bring the pages
back in line. **Read [`wiki/CONVENTIONS.md`](../../../wiki/CONVENTIONS.md)** for
the template, the `sources:` / `synced:` mechanics, and the `.state.json`
checkpoint.

```
.state.json last_indexed_commit ─┐
                                 ▼
   git diff <last>..HEAD ──► changed code files (minus .wikiignore)
                                 │  grep each file against pages' sources:
                                 ▼
   affected pages ──► re-read code ──► rewrite stale sections (bump synced:)
                                 │
   new code → propose page   ·   moved/deleted → orphan page
                                 ▼
   index.md  ·  log.md entry  ·  advance .state.json → HEAD  (after verify)
```

## The loop

1. **Detect the change.** Read the checkpoint and diff against it, excluding the
   wiki's own churn:
   ```sh
   last=$(sed -n 's/.*"last_indexed_commit": *"\([a-f0-9]*\)".*/\1/p' wiki/.state.json)
   git diff --name-only "$last" HEAD -- ':(exclude)wiki'
   ```
   (`--since` overrides `$last`.) If empty, say so and stop.
2. **Map changes → pages.** For each changed file, find the pages whose
   `sources:` cover it: `grep -rl "<file>" wiki --include='*.md'`. That list is
   exactly what to touch — no guessing.
3. **Reconcile.** Re-read the *current* code and rewrite only the **stale
   sections** of those pages (not the whole page — preserve human edits). Refresh
   any ASCII diagram whose boxes no longer match the code. The wiki is
   descriptive: if unsure, the code wins. Bump each touched page's `updated:` /
   `synced:`.
4. **New & orphan.** Changed files no page's `sources` cover → propose a new page.
   `sources` pointing at moved/deleted files → mark the page orphaned and fix it.
5. **Refresh `index.md`** for any page added, retitled, or with a changed
   `responsibility`.
6. **Seal.** Append a `log.md` narrative entry, then **advance
   `wiki/.state.json`** `last_indexed_commit` to HEAD — only after step 7 passes.
   Never move it past unverified work.
   ```
   ## <date> · wiki-update
   - <page>: <what changed and why>
   - new: <path>   /   orphan: <path>
   ```
7. **Verify:** `scripts/wiki-lint.sh` (per-page integrity + staleness) and
   `scripts/wiki-coverage.sh` (tracked code no page claims, filtered by
   `wiki/.wikiignore`). Resolve every unclaimed subsystem: add a page or ignore
   it in `.wikiignore` on purpose.

## Notes

- Scope with `--path` when a diff is large; log what you deferred so it doesn't
  read as "covered everything".
- This never runs from a git hook. The hook only *notifies*; a human runs this.
