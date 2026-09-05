---
title: Which assessment widget?
type: decision
options: [quiz, flashcards, fill-in-the-blanks, predict-output, spot-the-bug, sort-steps, estimate-slider, reflection, drag-and-drop, checkpoint, contrast, profile-quiz]
responsibility: Which "check the reader" widget to reach for, distilled from each widget's whenToUse.
sources:
  - packages/widgets/src/widgets/quiz/quiz.meta.ts
  - packages/widgets/src/widgets/flashcards/flashcards.meta.ts
  - packages/widgets/src/widgets/fill-in-the-blanks/fill-in-the-blanks.meta.ts
  - packages/widgets/src/widgets/predict-output/predict-output.meta.ts
  - packages/widgets/src/widgets/spot-the-bug/spot-the-bug.meta.ts
  - packages/widgets/src/widgets/sort-steps/sort-steps.meta.ts
  - packages/widgets/src/widgets/estimate-slider/estimate-slider.meta.ts
  - packages/widgets/src/widgets/reflection/reflection.meta.ts
  - packages/widgets/src/widgets/drag-and-drop/drag-and-drop.meta.ts
  - packages/widgets/src/widgets/profile-quiz/profile-quiz.meta.ts
  - packages/widgets/src/widgets/checkpoint/checkpoint.meta.ts
  - packages/widgets/src/widgets/contrast/contrast.meta.ts
synced: a065d0a
related:
  - ../components/widgets/quiz.md
  - ../concepts/ai-generation-surface.md
  - ../concepts/pedagogy.md
---

Twelve widgets check the reader; they differ by *what skill* they test.
Distilled from each meta's `whenToUse` (the source of truth for these calls).

The framing matters more than the table: **the mechanic is picked by what you
want to know about the reader**, not by the shape of the content. Ask the
question first — "does their model produce the right output?", "can they tell
these two apart?" — and the widget follows. A guide where every check is a
`quiz` defaulted rather than chose, and `story lint` says so
(`mechanic-variety`).

| Widget                | Use it when…                                                        |
| --------------------- | ------------------------------------------------------------------- |
| **quiz**              | graded right/wrong on a **conceptual** question, per-option feedback |
| **predict-output**    | the question is specifically **"what does this code print"**        |
| **spot-the-bug**      | the skill is **finding a defect** — click the flawed line           |
| **fill-in-the-blanks**| the answer belongs **inside a sentence/snippet**, graded in context |
| **flashcards**        | **self-paced recall**, learner self-grades, no single verdict       |
| **drag-and-drop**     | the skill is **classification** — which items belong in which group  |
| **sort-steps**        | the skill is **sequence** — which step comes before which            |
| **estimate-slider**   | the reader's **intuition about a number** is the thing to correct    |
| **reflection**        | only the reader knows the answer — **their** codebase, their week    |
| **checkpoint**        | consolidating — can they still **say** it, three modules later       |
| **contrast**          | there is no question to ask, only a **belief to break**              |
| **profile-quiz**      | you're **segmenting the reader** (level/role/goal), not grading     |

## Quick rules

- Graded + conceptual → **quiz**.
- Code output → **predict-output**; correct code, trace behaviour. Broken code,
  find the bug → **spot-the-bug**.
- Recall: standalone prompt/answer pairs → **flashcards**; complete a sentence →
  **fill-in-the-blanks**.
- Structure, several items at once: grouped into buckets → **drag-and-drop**;
  laid out in one line whose order matters → **sort-steps**.
- Not a test at all — personalize the page → **profile-quiz** (the writer half of
  the profile family; `ProfileGate` reads what it writes).

## What a check owes the reader, whatever the mechanic

Being told "not quite" and nothing else spends the reader's attention and returns
nothing for it, which makes such a check worse than no check at all. So every
wrong option carries `feedback` that names **the belief behind it** — not a
restatement of the right answer — and `story lint` fails the build when one does
not (`wrong-answer-teaches`, the family's only error-level rule). The
corresponding slots elsewhere: `explanation` on `sort-steps` and
`drag-and-drop`, `keys` on `reflection`, and an explanation on the *innocent*
lines of `spot-the-bug`, which is where most of that check's teaching happens.

Three of them (`quiz`, `predict-output`, `estimate-slider`) also take an opt-in
`confidence`: the reader stakes how sure they are before answering, and
confident-and-wrong — the one quadrant worth naming — is read back at the
finale. Two or three per guide, never all of them. See
[the pedagogy layer](../concepts/pedagogy.md).

## The two that grade nothing

**estimate-slider** and **reflection** (added in `763c574`) sit in this family
without producing a verdict, and that is deliberate — they are the two moments
where being told the answer first would destroy the lesson.

An estimate-slider makes the reader stake a position on a number before showing
the real one; the widget grades nothing, it just puts guess and truth on the same
track. What updates an intuition is having committed to the wrong one, which is
why the "close enough" tolerance is cosmetic and the real payoff is the `reveal`
text. Reach for it when a figure from the source material is counter-intuitive;
use `scroll-stat` when the number should simply land, and `scrubber` when there
is a model to explore rather than one true value.

A reflection asks for the one answer the library cannot check — *your* swallowed
error, *your* Monday. Recognizing an answer among options and composing one from
nothing are different skills, and only the second is what a guide is ultimately
for. Its `modelAnswer` appears strictly after the reader saves, so it can be
compared against rather than copied from. One or two per guide, at a module's
close; more than that and it becomes homework.
