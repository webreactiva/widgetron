---
title: Quiz
type: entity
siblings: [flashcards, fill-in-the-blanks, predict-output, spot-the-bug, profile-quiz]
responsibility: Single-question multiple-choice with instant per-option feedback and an optional celebration.
sources:
  - packages/widgets/src/widgets/quiz/quiz.tsx
  - packages/widgets/src/widgets/quiz/quiz.meta.ts
  - packages/widgets/src/widgets/quiz/index.ts
updated: 2026-07-24
synced: c032ded
related:
  - ../../decisions/assessment.md
  - ../../concepts/analytics-events.md
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

## Behaviour

Commit one answer → per-option feedback appears; a correct pick pays off with a
completion moment + optional confetti. **Revealing the correct answer on a wrong
pick is intentional** — the miss teaches, the retry recovers; it is not a bug.

Free text (`question`, `feedback`) renders through
[RichText](../../concepts/rich-text.md); interactions emit
[analytics](../../concepts/analytics-events.md).

## When to pick it vs siblings

See [which assessment widget](../../decisions/assessment.md). In short: use Quiz
for a graded, conceptual right/wrong with per-option explanations.
