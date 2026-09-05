---
title: Quiz
type: entity
siblings: [flashcards, fill-in-the-blanks, predict-output, spot-the-bug, profile-quiz]
responsibility: Single-question multiple-choice with instant per-option feedback and an optional celebration.
sources:
  - packages/widgets/src/widgets/quiz/quiz.tsx
  - packages/widgets/src/widgets/quiz/quiz.meta.ts
  - packages/widgets/src/widgets/quiz/index.ts
synced: a065d0a
related:
  - ../../decisions/assessment.md
  - ../../concepts/analytics-events.md
  - ../../concepts/pedagogy.md
---

A graded right/wrong check for one conceptual question. The reference example of a
component-level entity page.

## Props (from the schema)

- `question` — the prompt.
- `options` — `{ text, correct?, feedback? }[]`, at least 2; exactly one should
  set `correct: true`. `feedback` is revealed per option after answering.
- `scenario?` — context block shown above the question.
- `celebrate?` — fire confetti on a correct answer (default `true`,
  reduced-motion-safe, reader-triggered only).
- `allowRetry?` — allow retrying after answering (default `true`).
- `confidence?` — ask how sure the reader is *before* they answer (default
  `false`); see below.

## Behaviour

Commit one answer → per-option feedback appears; a correct pick pays off with a
completion moment + optional confetti. **Revealing the correct answer on a wrong
pick is intentional** — the miss teaches, the retry recovers; it is not a bug.

Free text (`question`, `feedback`) renders through
[RichText](../../concepts/rich-text.md); interactions emit
[analytics](../../concepts/analytics-events.md).

## `feedback` on a wrong option is not optional

`story lint` fails a guide whose wrong options carry none
(`wrong-answer-teaches`), and what it should say is the belief behind the
option — "you read `[]` as empty, therefore falsy" — not a restatement of the
right answer. A check that says "not quite" and stops has spent the reader's
attention and returned nothing.

## Confidence

With `confidence`, the options stay **locked** until the reader picks a level.
That ordering is the whole feature: a confidence given after the answer is
hindsight, not calibration. The four quadrants are read back afterwards and only
one gets the loud treatment — confident-and-wrong, a belief actively in use that
does not hold. The event payload gains `confidence` and `calibration`, and the
`storyline` finale tallies them. Two or three checks per guide, never all of
them; the lint warns past three. See
[the pedagogy layer](../../concepts/pedagogy.md).

## When to pick it vs siblings

See [which assessment widget](../../decisions/assessment.md). In short: use Quiz
for a graded, conceptual right/wrong with per-option explanations.
