---
name: wiki-ingest
description: "Take code into the wiki. Seeds the whole wiki when it does not exist yet; otherwise reconciles it with what changed since the last checkpoint — reads the diff, rewrites the stale sections, handles new and orphan pages, advances the checkpoint. Use when: (1) user invokes /wiki-ingest, (2) the post-commit hook warned the wiki is behind, (3) user says 'actualiza el wiki', 'reconcilia el wiki', 'crea el wiki', 'update/create the wiki', typically when closing a feature."
argument-hint: "[--since=<sha>] [--path=<glob>]"
user_invocable: true
---

# wiki-ingest — take the code into the wiki

One verb, two modes. Which one runs is decided by a file, not by you:

```
wiki/.state.json exists?
   │
   ├── no  ──► SEED    the whole wiki from the code as it is now   (once per repo)
   │
   └── yes ──► RECONCILE  only what changed since the checkpoint   (the daily loop)
```

**Read [`wiki/CONVENTIONS.md`](../../../wiki/CONVENTIONS.md) first** — the layout,
the page types, the one template, `confidence:`, the writing rules and the
`.state.json` contract all live there, not here.

Two boundaries, in both modes: **never modify code** (touch `wiki/**` and nothing
else), and **never re-stamp `synced:` on a page you did not re-read against the
code**.

---

## Mode A · SEED (no `.state.json`)

```
CODE @ HEAD
   │  survey the tree + `git log --oneline` ← the why lives in the history
   ▼
map the page tree ── architecture · flows · concepts · components · decisions
   │  one template per page · narrow sources: · synced: = base sha
   ▼
index.md  ·  log.md (first entry)  ·  .state.json { last_indexed_commit: HEAD }
   ▼
the health checks must pass before you are done
```

1. **Record the base SHA:** `git rev-parse HEAD`. Short form → every page's
   `synced:`; full form → `last_indexed_commit`. Read `git log --oneline` end to
   end: the history explains why the code looks like this and lives in no file.
2. **Map at the altitude of the taxonomy — never one page per file:**
   - `architecture.md` — the map, the layers, the entry points.
   - `flows/` — the sequences that cross files and that no single file tells.
     These are the highest-value pages; do not ship a seed with only one.
   - `concepts/` — the cross-cutting patterns and conventions.
   - `components/` — one **module** page per subsystem. Fine-grained pages only
     for units that hide a mechanism; the rest grow on demand.
   - `decisions/` — "which of these, when", and the discarded alternative.
3. **Every page** uses the template with **narrow, verified** `sources:` — never
   claim a whole app or package. Mark anything you reconstructed rather than read
   with `confidence: inferred`. Give `flow` and `architecture` pages a small
   ASCII diagram.
4. **Write `index.md`** grouped by type, one line per page (its `responsibility`).
5. **Write `.state.json`** and the first `log.md` entry.

Don't leave the seed half-finished: a link to a page you never wrote fails the
lint, and a wiki that fails its own checks on day one teaches everyone to ignore
it.

---

## Mode B · RECONCILE (`.state.json` exists)

Reconcile, don't accumulate: the code moved, bring the pages back in line.

```
pnpm wiki:drift --json
   │  repo axis: commits since the checkpoint
   │  page axis: pages whose sources: moved past their own synced:
   ▼
   stale[] ──► read ONLY that diff ──► rewrite the stale sections (re-stamp synced:)
                                 │
   new code → propose a page  ·  moved/deleted → orphan page
                                 ▼
   index.md  ·  log.md entry  ·  advance .state.json → HEAD  (after verify)
```

1. **Detect.** `pnpm wiki:drift --json` answers both halves: `repo` (commits since
   the checkpoint) and `stale[]` (the exact pages whose `sources:` moved past
   their own `synced:`). Nothing stale and repo current → say so and stop.
   ```sh
   pnpm wiki:drift --json          # { repo, stale[], skipped[], fresh[] }
   last=$(sed -n 's/.*"last_indexed_commit": *"\([a-f0-9]*\)".*/\1/p' wiki/.state.json)
   git log --oneline "$last"..HEAD
   ```
   (`--since` overrides `$last`.)
2. **Read the diff, not the repo.** `stale[]` already maps changed files to pages.
   For each, read **only** its own diff: `git diff <its synced> HEAD -- <its
   sources>`. Anything in `skipped[]` has a broken contract; fix that first.
3. **Reconcile.** Rewrite only the **stale sections** — not the whole page, so
   hand-written notes survive. Refresh any ASCII diagram whose boxes no longer
   match. When the change **contradicts** what the page claimed, don't overwrite
   in silence: say what it used to be and what changed it, with the SHA. That is
   the part git tells badly and the most valuable thing a wiki accumulates.
   Re-check `confidence:` while you are there.
4. **New & orphan.** Changed files no page's `sources` cover → propose a page.
   `sources` pointing at moved/deleted files → fix or retire the page.
5. **Refresh `index.md`** for any page added, retitled, or with a changed
   `responsibility`.
6. **Seal.** Append a `log.md` entry, then advance `.state.json`'s
   `last_indexed_commit` to HEAD — **only after step 7 passes**. Never move it
   past unverified work.

---

## Both modes end here

7. **Verify:** `pnpm wiki` — integrity, staleness and coverage in one pass. Fix
   every error. Resolve every unclaimed subsystem by writing a page or ignoring
   the path in `.wikiignore` on purpose; silence is not an option.

## Notes

- Scope a large diff with `--path`, and **log what you deferred** so it does not
  read as "covered everything".
- This never runs from a git hook. The hook only notifies; a human runs this.
- Found a bug in the code? Note it on the page and tell the user. Don't fix it.
- Close by summarising **what the wiki now knows that it didn't** — not a file
  list. A big commit touching 5-10 pages is the system working.
