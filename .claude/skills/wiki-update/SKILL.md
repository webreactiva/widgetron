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
pnpm wiki:drift --json
   │  repo axis: commits since .state.json's last_indexed_commit
   │  page axis: pages whose sources: moved past their own synced:
   ▼
   stale[] ──► read ONLY that diff ──► rewrite stale sections (bump synced:)
                                 │
   new code → propose page   ·   moved/deleted → orphan page
                                 ▼
   index.md  ·  log.md entry  ·  advance .state.json → HEAD  (after verify)
```

## The loop

1. **Detect the change.** `pnpm wiki:drift --json` answers both halves at once:
   `repo` (commits since the checkpoint) and `stale[]` (the exact pages whose
   `sources:` moved past their own `synced:`). If nothing is stale and the repo
   is current, say so and stop.
   ```sh
   pnpm wiki:drift --json          # { repo, stale[], skipped[], fresh[] }
   last=$(sed -n 's/.*"last_indexed_commit": *"\([a-f0-9]*\)".*/\1/p' wiki/.state.json)
   git log --oneline "$last"..HEAD
   ```
   (`--since` overrides `$last`.)
2. **Read the diff, not the repo.** `stale[]` already maps changed files to
   pages — no grepping, no guessing. For each stale page read **only** its own
   diff: `git diff <its synced> HEAD -- <its sources>`. The diff is the work.
   Any page in `skipped[]` has a broken contract; fix that first.
3. **Reconcile.** Re-read the *current* code and rewrite only the **stale
   sections** of those pages (not the whole page — preserve human edits). Refresh
   any ASCII diagram whose boxes no longer match the code. The wiki is
   descriptive: if unsure, the code wins. Bump each touched page's `updated:` /
   `synced:`.

   When the change **contradicts** what the page claimed, don't overwrite in
   silence: state what it used to be and what changed it, with the SHA. That is
   the part git tells badly, and it is what the wiki is for. Re-check
   `confidence:` while you are there — a page marked `inferred` whose rationale
   you have now confirmed becomes `high`, and vice versa.
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
7. **Verify:** `pnpm wiki` — integrity, staleness and coverage in one pass. Fix
   every error; resolve every unclaimed subsystem by adding a page or ignoring it
   in `.wikiignore` on purpose.

## Notes

- Scope with `--path` when a diff is large; log what you deferred so it doesn't
  read as "covered everything".
- This never runs from a git hook. The hook only *notifies*; a human runs this.
- **Never re-stamp `synced:` on a page you did not re-read against the code.**
  Touching it "while you're in there" is how the wiki starts lying.
- Never modify code in a wiki pass. Found a bug? Note it on the page and tell the
  user.
- Close by summarising **what the wiki now knows that it didn't** — not a list of
  files. A big commit touching 5-10 pages is the system working.
