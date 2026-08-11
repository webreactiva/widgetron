---
title: CodeDiff
type: entity
siblings: [code-translation, compare-slider, predict-output]
responsibility: Before/after code in one unified block — the widget computes the line diff itself instead of asking the author to mark it up.
sources:
  - packages/widgets/src/widgets/code-diff/code-diff.tsx
  - packages/widgets/src/widgets/code-diff/code-diff.meta.ts
  - packages/widgets/src/widgets/code-diff/index.ts
synced: 763c574
related:
  - ../widgets.md
  - ../../concepts/ai-generation-surface.md
---

Most widgets in the library are presentational — they lay out what the author
already decided. CodeDiff is one of the few that *computes* something, which is
why it earns its own page.

## The author hands over two versions, not a diff

The obvious API would be a list of lines each tagged `add` / `remove` /
`context`. It was rejected because of who writes the props: the generation
surface is JSON produced by an agent, and hand-tagging every line is exactly the
kind of bookkeeping a model gets subtly wrong — an off-by-one in the tags
produces a diff that renders perfectly and lies. Passing `before` and `after` as
two complete snippets is impossible to get half-right: either the code is
correct or it obviously is not.

The cost is an algorithm inside the widget.

## The algorithm

`diffLines()` (exported, and tested directly) is a textbook line-level longest
common subsequence:

```
before ─split─► a[]        lcs[i][j] = length of the LCS of a[i…] and b[j…]
after  ─split─► b[]              │
                                 ▼
      walk i,j from 0:  a[i] === b[j]      ──► context, i++ j++
                        lcs[i+1][j] >= lcs[i][j+1] ──► remove, i++
                        otherwise                  ──► add,    j++
                                 │
                                 ▼
                        DiffLine[] { kind, text, from?, to? }
```

`from` and `to` are the line numbers on each side, and each is present only where
it means something — a removed line has no line number in the "after" file. That
is what lets the gutter show two independent columns instead of one lying one.

The DP table is `O(n·m)`, which is free for a teaching snippet and not free for a
file. `LCS_CELL_BUDGET` (40 000 cells) caps it: past that the widget degrades to
"everything removed, then everything added" rather than getting slow. That output
is still *correct*, just uninformative — a deliberate choice over an unbounded
table or a thrown error, since a widget that hangs the page is worse than one
that shows a blunt diff.

## Unified, never side-by-side

There is no split view and no prop to ask for one. Two columns of code cannot
both stay readable at a phone's width — the layout the library treats as the
default, not the fallback — and the reader's eye follows one flow better than two
correlated ones. A wide container gets the same single column, just less cramped.

Code renders **verbatim**: unlike nearly every other author-facing slot, neither
`before` nor `after` passes through `RichText`, because backticks and asterisks
in source are source, not markup. Only `notes` (the plain-language "why") and
`filename` are rich text.
