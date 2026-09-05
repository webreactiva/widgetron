---
title: The pedagogy layer
type: concept
applies_to: every check widget, the AI generation surface, and the story lint
responsibility: Why the library carries teaching judgement as shipped artifacts, and the three places that judgement has to stay in sync.
sources:
  - packages/widgets/src/lib/authoring.ts
  - packages/widgets/src/primitives/confidence.tsx
  - docs/pedagogy.md
synced: f571f65
related:
  - ./ai-generation-surface.md
  - ../decisions/assessment.md
  - ../flows/story-pipeline.md
  - ./rich-text.md
---

The library can render sixty-odd widgets and validate every prop of every one of
them. Until `683985b` it could not say anything about whether a guide built from
them **teaches** — and the gap was not cosmetic. A generated storyline could pass
`validateWidgetTree`, pass the pacing lint, and still be a document with quizzes
bolted on: valid, well-paced, and worthless. Nothing in the codebase disagreed
with it, because nothing in the codebase held an opinion.

That opinion now ships, and this page is about why it ships in three forms rather
than one.

## The premise it rests on

A guide is an *explorable explanation*: an interactive model of an idea, carried
by prose, where the reader states an expectation and then watches reality
disagree. Two consequences drive most of the code:

- **Expectation before reality.** A reader who never committed to anything has
  nothing for reality to correct, and reading an explanation produces a
  convincing feeling of understanding right up until you have to predict
  something. This is why `predict-output`, `estimate-slider` and `contrast` are
  treated as a spine rather than as three widgets among many.
- **The model must be real.** A reader who moves a slider and infers a
  relationship believes it far harder than any paragraph could manage — so an
  invented formula teaches a falsehood *efficiently*. That asymmetry is the
  reason the lint asks a `scrubber` or `tangle-text` where its numbers came
  from, and the reason the guide tells an agent to reach for a
  `comparison-table` when it cannot defend one.

The full reasoning is prose in `docs/pedagogy.md`; the wiki does not restate it.

## Three forms, one doctrine

```
docs/pedagogy.md            prose        for people
        │
        ├── lib/authoring.ts             data     for agents   (getAuthoringGuideJSON)
        │      shipped beside the manifest · `story guide` dumps it
        │
        └── engine/lint.ts (pedagogy §)  a gate   for CI
               the checkable half only
```

The split is deliberate and load-bearing. Prose alone is advice, and advice loses
to a generator's defaults. Data alone cannot be enforced. A gate alone cannot
carry a reason, and the reason is the part that transfers — which is why every
rule in `authoringGuide` is a `{ rule, why }` pair, and a test fails if a `why`
is shorter than a sentence (`test/authoring.test.ts`).

The obligation this creates: **the three must move together.** A rule added to
the lint with no entry in the guide is a rule an agent will trip over without
knowing why.

## The one guard the data has

`authoringGuide` names widget types in prose-shaped strings, which is exactly the
kind of reference that rots silently — a renamed widget would leave an agent
being told to emit a type that no longer resolves, and nothing would fail.
`authoringGuideWidgetTypes()` exists only to make that checkable, and
`test/authoring.test.ts` pins every name to the live registry. Same test also
rejects a shape that both recommends and warns against the same widget.

## What the widgets gained

The doctrine needed affordances the catalog did not have, so several widgets
grew one. The pattern is the same in each case — the widget already had the
interaction, and was throwing away the pedagogically interesting half:

- **Confidence** (`primitives/confidence.tsx`, opt-in on `quiz`,
  `predict-output`, `estimate-slider`). The reader stakes how sure they are
  *before* answering — after would be hindsight, not calibration — and the four
  quadrants are read back. Only one of them is interesting: **confident and
  wrong** is a belief actively in use that does not hold, which is precisely
  what an explanation exists to repair, and it is invisible without asking.
  It reaches hosts as `calibration` in the `answered` payload, and the
  `storyline` finale names it (`a065d0a`).
- **`explanation` on `sort-steps` and `drag-and-drop`.** Both graded the reader
  and then said nothing. A board that turns green teaches no criterion to sort
  by next time.
- **`keys` on `reflection`.** An open answer with no read-back leaves the reader
  unsure what they missed; the keys show which ideas the answer touched. Never
  scored, never blocking, and the analytics carry counts only — the text still
  never leaves the device.
- **Explanations on the *innocent* lines of `spot-the-bug`.** A reader who
  suspects a line deserves to be told why it is fine. Most of the teaching in a
  spot check happens there, and until `683985b` the widget rendered only the
  buggy line's note.

## Where it is enforced

Eight rules in `engine/lint.ts`, listed in `docs/pedagogy.md`. Seven are
warnings; one is an error, and the asymmetry is the point.

`wrong-answer-teaches` fails the gate when a wrong option carries no `feedback`.
Being told "not quite" and nothing else spends the reader's attention and returns
nothing for it — a check like that is worse than no check, because it costs the
same and teaches less. It could be made an error safely because the twelve
existing guides already satisfied it across 33 quizzes; the rule ratchets a
standard the content had already reached rather than declaring a new one.

The seven warnings deliberately fire on real content today (23 findings across
those same guides: no checkpoints, no commitment before a reveal, one guide whose
five checks are all the same mechanic). A pedagogy gate that reported clean on
its first run would only mean it was measuring nothing.

## One row of the mapping was wrong

The map from the skill's 21 primitives onto the catalog claimed `l-flow` was
covered by `flow-diagram` and `mermaid-diagram`. It was not, and the correction
is instructive rather than clerical: `l-flow` is a **hybrid** — HTML boxes, SVG
arrows measured from them — and neither existing widget is that. `node-graph`
was built to close it, and `docs/pedagogy.md` now carries the corrected row plus
why the two candidates each fail.

The lesson generalises past that one widget and is now a library rule: **text in
HTML, geometry in SVG**, with `plainRich()` for the seam where a rich string has
to become a plain one. See [RichText](./rich-text.md).

## A rule is only as good as its false positives

The `condescension` rule is the clearest case the repo has of a check being
narrowed by evidence rather than by taste, and it is worth keeping.

Its first draft flagged `simplemente`, `basta con` and `es fácil`. Run over the
fourteen existing guides it produced five findings, and **all five were the rule
being wrong**: `simplemente` usually means "merely"; `basta con` appears quoted
("el hype insiste en que basta con gastar más tokens") and negated ("no basta
con que parezca que va bien") far more often than dismissively; and "es fácil
confundirlos porque uno viene del otro" is empathy — it acknowledges the
difficulty rather than denying it. The condescending form is "easy to [task the
reader must do]", not "easy to [get this wrong]", and no regex separates those.

So the list is now only phrases nobody writes innocently, it finds nothing in
the corpus, and `test/lint.test.ts` both proves it still fires and pins the five
false positives so they cannot creep back. The general lesson: run a new lint
rule over the real content before shipping it, and treat every finding as a
question about the rule first and the content second.

## Provenance

The doctrine is not original to widgetron. Most of it is the `make-it-learnable`
skill's, absorbed in `683985b` rather than vendored; the writing half — why
before what, metaphors that name their limit, the intelligent-and-unfamiliar
reader, no condescension — came later from the two **`eli5`** skills
(`f571f65`), after a question about whether "big pictures and few words" was
already covered turned out to be answerable with "no, and it is not in
make-it-learnable either". The half of Cloudflare's eli5 about editing existing
prose is deliberately absent: this layer generates guides rather than reviewing
someone else's writing. Its 21 primitives were mapped onto
the catalog, the four with no equivalent were built (`contrast`, `checkpoint`,
`anatomy`, `code-lab`), and the two deliberately left unported are named with
their reasons in `docs/pedagogy.md`. The mapping table there is meant to be
audited, not trusted.
