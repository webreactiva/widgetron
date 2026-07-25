---
title: Which assessment widget?
type: decision
options: [quiz, flashcards, fill-in-the-blanks, predict-output, spot-the-bug, profile-quiz]
responsibility: Which "check the reader" widget to reach for, distilled from each widget's whenToUse.
sources:
  - packages/widgets/src/widgets/quiz/quiz.meta.ts
  - packages/widgets/src/widgets/flashcards/flashcards.meta.ts
  - packages/widgets/src/widgets/fill-in-the-blanks/fill-in-the-blanks.meta.ts
  - packages/widgets/src/widgets/predict-output/predict-output.meta.ts
  - packages/widgets/src/widgets/spot-the-bug/spot-the-bug.meta.ts
  - packages/widgets/src/widgets/profile-quiz/profile-quiz.meta.ts
synced: c032ded
related:
  - ../components/widgets/quiz.md
  - ../concepts/ai-generation-surface.md
---

Six widgets check the reader; they differ by *what skill* they test. Distilled
from each meta's `whenToUse` (the source of truth for these calls).

| Widget                | Use it when…                                                        |
| --------------------- | ------------------------------------------------------------------- |
| **quiz**              | graded right/wrong on a **conceptual** question, per-option feedback |
| **predict-output**    | the question is specifically **"what does this code print"**        |
| **spot-the-bug**      | the skill is **finding a defect** — click the flawed line           |
| **fill-in-the-blanks**| the answer belongs **inside a sentence/snippet**, graded in context |
| **flashcards**        | **self-paced recall**, learner self-grades, no single verdict       |
| **profile-quiz**      | you're **segmenting the reader** (level/role/goal), not grading     |

## Quick rules

- Graded + conceptual → **quiz**.
- Code output → **predict-output**; correct code, trace behaviour. Broken code,
  find the bug → **spot-the-bug**.
- Recall: standalone prompt/answer pairs → **flashcards**; complete a sentence →
  **fill-in-the-blanks**.
- Not a test at all — personalize the page → **profile-quiz** (the writer half of
  the profile family; `ProfileGate` reads what it writes).
