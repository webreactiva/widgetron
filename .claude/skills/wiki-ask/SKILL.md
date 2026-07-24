---
name: wiki-ask
description: "Answer a question about the codebase from the wiki first, and when the answer isn't there, research the code, answer, and offer to file the answer back into wiki/ as a new page or section — so the wiki grows from what gets asked. Use when: (1) user invokes /wiki-ask, (2) user asks a 'how does X work / where does Y live / why is Z' question about this repo, (3) user says 'pregunta al wiki', 'ask the wiki', 'documenta la respuesta'."
argument-hint: "<question>"
user_invocable: true
---

# wiki-ask — answer, then let the wiki learn

Karpathy's query→file-back, for code. Answer the question; if it wasn't already
in the wiki, offer to add it so the next reader finds it. **Read
[`wiki/CONVENTIONS.md`](../../../wiki/CONVENTIONS.md)** for the template.

```
question ──► search wiki/ (index.md → pages)
                │ found ──► answer + cite page(s)        · DONE
                │ not found
                ▼
            research the code ──► answer + cite path:line
                │
                ▼
            offer to file back ──► section on an existing page
                                   or a new page (right type)
                │ on yes
                ▼
            write page (template) · index.md · log.md entry
            (does NOT advance .state.json — that's wiki-update's job)
```

## Steps

1. **Wiki first.** Search `wiki/` (start at `index.md`, then grep the pages). If
   the answer is there, give it and cite the page(s) — done, nothing to file.
2. **Fall back to the code.** If the wiki doesn't cover it, research the actual
   source, answer from it, and cite the files you read (`path:line`).
3. **Offer to file it back.** When the answer came from the code (step 2), ask
   whether to persist it, and where it fits:
   - extends an existing page → add/replace a **section** there;
   - a genuinely new unit/pattern/comparison → a **new page** of the right type.
   Only write on a yes.
4. **When filing:** use the one template — real, **narrow** `sources:` for what
   you read, today's `updated:`, current `git rev-parse --short HEAD` as
   `synced:`, and `confidence: inferred` if the answer is your reading rather
   than something the code states. Add an ASCII diagram if the answer is a flow.
   Link the new page from the pages it relates to (an unlinked page is an orphan
   nobody finds), add the line to `index.md`, append a `log.md` entry. Do **not**
   touch `.state.json` — filing a page out of band must not advance the repo
   checkpoint.
5. If you wrote anything, run `pnpm wiki:lint`.

## Notes

- Descriptive, not normative: file what the code *does*, not what it *should*.
- Don't file trivia or anything already in `CLAUDE.md` — link instead.
- One question, one focused answer. Filing back is the bonus, not the goal.
- When the wiki didn't have the answer, **say so**: that gap is a finding, and
  naming it is what makes the wiki grow in the right direction.
- Answering never modifies code, and never re-stamps another page's `synced:`.
