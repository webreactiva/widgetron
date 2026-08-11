---
name: wiki-query
description: "Answer a question about this codebase from the wiki first, and when the wiki doesn't cover it, research the code, answer, and offer to file the answer back as a page or section — so the wiki grows from what people actually ask. Use when: (1) user invokes /wiki-query, (2) user asks 'how does X work / where does Y live / why is Z like this' about this repo, (3) user says 'pregunta al wiki', 'ask the wiki', 'documenta la respuesta'."
argument-hint: "<question>"
user_invocable: true
---

# wiki-query — answer, and let the wiki learn

Answer the question. If the wiki did not have it, offer to add it, so the next
reader finds it. This is what makes the wiki grow **where people actually go**
instead of where the index looks empty.

**Read [`wiki/CONVENTIONS.md`](../../../wiki/CONVENTIONS.md)** for the template.

```
question ──► search wiki/  (index.md → the pages it points to)
                │ found ──► answer + cite the page(s)          · DONE
                │ not found
                ▼
            research the code ──► answer + cite path:line
                │
                ▼
            offer to file it back ──► a section on an existing page
                                      or a new page of the right type
                │ only on a yes
                ▼
            write the page · link it from its siblings · index.md · log.md
            (never advances .state.json — that is wiki-ingest's job)
```

## Steps

1. **Wiki first.** Start at `index.md`, then the pages it points to. If the answer
   is there, give it and cite the page(s) — done, nothing to file.
2. **Fall back to the code.** Research the actual source, answer from it, and cite
   what you read as `path:line`.
3. **Say the wiki had a gap.** When the answer came from the code, name that
   explicitly — the gap is a finding, and naming it is what points the wiki in the
   right direction.
4. **Offer to file it back**, and where it fits: a **section** on an existing page
   when it extends one, a **new page** of the right type when it is genuinely its
   own unit, pattern or comparison. Write only on a yes.
5. **When filing:** the one template, with **narrow** `sources:` for what you
   actually read, `git rev-parse --short HEAD` as `synced:`, and
   `confidence: inferred` when the answer is your reading rather than something
   the code states. Add an ASCII diagram if it is a flow. **Link the new page from
   the pages it relates to** — an unlinked page is one nobody will find — then add
   its line to `index.md` and an entry to `log.md`.
6. If you wrote anything, run `pnpm wiki:lint`.

## Notes

- Descriptive, not normative: file what the code *does*, not what it *should*.
- Don't file trivia, and don't restate the repo's own contributor rules — link.
- Never touch `.state.json`: filing a page out of band cannot claim the whole repo
  is indexed. Never re-stamp another page's `synced:`. Never modify code.
- The wiki says where to start looking, not where to stop. For inventory
  questions ("every way we do X"), do not accept an answer that rests only on the
  wiki's silence.
