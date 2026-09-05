# Pedagogy — how a guide is built, and why

Widgetron's catalog answers *what can I render*. This answers the question that
actually decides whether a generated guide teaches anything: **which four
widgets out of sixty-odd does this material want, where do the checks go, and
what does a wrong answer owe the reader.**

It exists because that judgement used to live nowhere. The schemas describe
props, the [story lint](../apps/story-studio/src/engine/lint.ts) polices rhythm,
and between them an agent could emit a perfectly valid, perfectly paced document
with quizzes bolted on. So the judgement now ships three ways, and they are the
same doctrine in three forms:

| form | where | for |
| --- | --- | --- |
| Prose | this file | people |
| Data | `authoringGuide` in `packages/widgets/src/lib/authoring.ts`, served by `getAuthoringGuideJSON()` | agents, alongside `getWidgetManifestJSON()` |
| A gate | the pedagogy rules in `apps/story-studio/src/engine/lint.ts` | CI |

Keep them in sync. A rule nobody can check is advice, and advice loses.

---

## The premise

A guide is an [explorable explanation](https://en.wikipedia.org/wiki/Explorable_explanation):
an interactive model of an idea, carried by prose, where the reader states an
expectation and then watches reality disagree. Three consequences follow, and
they are the whole design brief.

**Prose is not optional.** An explorable is a simulation *plus guidance*. A pile
of widgets with no argument running through it is a toy. The prose carries the
claim; the widget is where the reader tests it. This is why the lint caps the
prose quota rather than the widget count — connective text is a floor, not a
ceiling.

**Expectation, then reality.** Both halves are load-bearing. A reader who never
committed to anything has nothing for reality to correct, and reading an
explanation produces a convincing feeling of understanding that survives right
up until you have to predict something. This is why `predict-output`,
`estimate-slider` and `contrast` are the spine of the format and not decoration.

**The model must be consistent.** A reader who moves a number in a `scrubber`
and infers a relationship believes it far more strongly than anything a
paragraph could have told them. Simplify freely; never fabricate. An invented
formula teaches a falsehood *efficiently*.

One corollary the literature is blunt about: explorables are defined **against**
gamification. Widgetron has stamps, meters, lives and confetti, and they are
deliberately tied to the moves that are pedagogically worth rewarding —
committing to an answer before the reveal, being honest about confidence,
finishing a module. Nothing rewards clicking around. **If a guide would be worse
with the progress chrome removed, fix the guide.**

There is also a subject-matter bias worth naming so you can refuse it: this
format skews hard towards things with a programmable model, which pulls
everything towards the quantitative. For material with no honest model — hiring,
rhetoric, a business decision, history — do not invent one. `anatomy`,
`comparison-table`, `contrast` and `drag-and-drop` carry it perfectly well, and
`tangle-text` and `scrubber` should stay in the box.

---

## Before choosing a single widget

Read the source properly — the whole file, the actual code, the real repo. A
guide built on a skim teaches a skim. Then settle three things:

1. **What should the reader be able to DO afterwards** that they cannot do now?
   Not "know about X" — *do* what?
2. **What do people get wrong about this?** This is the most valuable thing you
   will extract. It becomes the spine of the guide, the prediction checks, and
   the belief every wrong option names.
3. **What are you honestly leaving out?** A 12-minute guide that teaches three
   things beats a 40-minute one that mentions twelve. Say so in the finale.

If the source has no misconception in it anywhere — nothing surprising, nothing
counter-intuitive — say so. **A guide with nothing to correct is a reference
document, and it should be one.**

### Two sources that look like guides and are not

- **Reference** — an API surface, a config table, a glossary, a list of flags.
  The reader will *look things up*, not study, and a narrative is in their way.
  Offer a single-page vocabulary spread instead: `anatomy` over the artifact,
  `comparison-table` for the options, `glossary-text` for the terms.
- **A how-to** — a runbook, "do these eight steps to deploy". The reader has a
  task and is in a hurry. `step-cards` or `checklist` beat a scroll story.

Both can still hide a real guide: the *why* behind the reference, the failure
the runbook is dodging. Say which you think it is **before** building, not after.

---

## The shape of the source picks the widgets

The full table lives in `authoringGuide.sourceShapes` (with an `avoid` list per
shape, which is the half people skip). The short version:

| the source is… | reach for | check with |
| --- | --- | --- |
| a **process** — request lifecycle, CI/CD, an algorithm | `flow-diagram` (straight), `node-graph` (branches/loops), `frame-stepper` | `sort-steps`, `predict-output` |
| a **structure** — a prompt, a URL, a JSON payload, a config | `anatomy`, `hotspots`, `code-translation` | `spot-the-bug`, `drag-and-drop` |
| a **trade-off** — REST vs GraphQL, buy vs build | `comparison-table`, `decision-tree`, `contrast` | `quiz`, `reflection` |
| a **quantitative relationship** — latency, cost, scaling | `tangle-text`, `scrubber`, `data-chart` | `estimate-slider` |
| a **piece of code** | `code-translation`, `code-diff`, `code-lab` | `predict-output`, `spot-the-bug` |
| a **whole codebase** | `node-graph` (module map), `anatomy` (core type), `frame-stepper` (one real run) | `predict-output`, `spot-the-bug` |
| an **architecture** | `scrollytelling`, `node-graph`, `mermaid-diagram` | `quiz`, `sort-steps` |
| a **transformation** — source→AST, spec→code | `code-diff`, `compare-slider` | `predict-output` |
| a **conceptual distinction** — state vs derived | `contrast`, `comparison-table` | `drag-and-drop` |
| a **belief that does not hold** | `contrast`, `surprise` | `predict-output`, `estimate-slider` |
| **non-technical** material | `anatomy`, `comparison-table`, `timeline` | `drag-and-drop`, `reflection` |

For a codebase specifically, the reader's goal is almost always *to be able to
work in it*, which makes the code the subject — not the project's history, not
its test suite. Cover the module map, the core data structure everything passes
around, one real execution with the actual function names in order, and the one
or two places it could have gone another way (that last one is where prediction
belongs). Quote the code **verbatim**: a guide that paraphrases its code is a
guide about a codebase the reader will not recognise when they open it.

---

## The budget

A good guide uses **4–7 distinct widget types** and **4–6 checks**. Using more of
the catalog is not thoroughness, it is noise — and it reads as a demo of the
library rather than an argument.

The default number of widgets in a module is **one**, plus the prose that carries
it. A module using six is almost always three modules.

The test for every single one:

> *What would the reader fail to understand if this were a paragraph instead?*

No answer means make it a paragraph. Interactivity costs attention the argument
needs, and it has to buy something back.

---

## Sequencing

- **Concrete before abstract.** One real trace before the general diagram. An
  abstraction the reader has no instance for is not an abstraction, it is a
  definition.
- **Reveal, don't dump.** If a diagram has six nodes, the reader meets them one
  at a time — `scrollytelling`, `frame-stepper`, `sticky-pan`. A finished picture
  gets skimmed; a picture being built gets read.
- **Prediction before explanation, always.** Once they have read the answer,
  their prediction is worthless.
- **Consolidate every three or four modules** with a `checkpoint`, or the reader
  stacks new concepts on a base nobody checked and the collapse happens later,
  where nobody can trace it.
- **Interleave at least one check.** A check sitting directly under the thing it
  taught measures whether the idea is still in working memory — cheap to pass,
  and close to worthless as evidence. A check in module six that needs something
  from module two measures whether it is *retrievable*, which is what you were
  trying to build. Most checks should follow their teaching (the reader needs the
  win); at least one must reach back, and `checkpoint` is the natural place.

### Difficulty is a budget, and the setting changes mid-guide

Two different jobs, opposite settings, and the common mistake is applying one of
them to the whole guide.

When you are installing **knowledge** — a fact, a name, how something is
arranged — difficulty is pure cost. Spend the reader's working memory on the
idea, not on decoding your sentences.

When you are building a **skill** — recognising, predicting, deciding,
debugging — difficulty *is* the mechanism. Retrieval that costs something is what
makes it stick, so make the reader produce an answer rather than recognise one,
and close the loop immediately.

A module explaining what a TTL *is* should be frictionless. The check on what a
TTL *costs you* should make the reader work. Same guide, opposite settings.

---

## Checks: what you want to know picks the mechanic

A check is never "question plus four answers". It is an engine for confronting a
mental model, and it always has the same four beats:

```
situation → the reader acts → evaluation → feedback
```

Only the middle beat changes. **The question you are asking about the reader
picks the widget** — not the shape of the content:

| what you want to know | widget |
| --- | --- |
| does their mental model produce the right output? | `predict-output` |
| is their sense of scale right? | `estimate-slider` |
| can they recognise it in real material? | `spot-the-bug` |
| can they tell two confusable things apart? | `drag-and-drop` |
| do they understand the order? | `sort-steps` |
| can they order by a *property*? | `sort-steps` with `low`/`high` |
| can they generate the explanation? | `reflection` with `keys` |
| is it genuinely a choice between named options? | `quiz` |
| can they still say it three modules later? | `checkpoint` |

`quiz` is right when the concept really is a discrimination between named
alternatives. It is also the mechanic every generator collapses into: **if every
check in a guide is a quiz, you defaulted rather than chose**, and the lint says
so.

### A wrong answer must teach

This is the most expensive failure in the format, and the lint makes it an
**error**.

"Not quite" tells a reader they failed. *"You picked that because you are
reading `[]` as empty-therefore-falsy — emptiness and truthiness are different
questions, and every object is truthy"* tells them what to change. A check that
says wrong and stops has spent the reader's attention and returned nothing for
it; it is worse than no check.

So:

- Write the explanation **first**, then work backwards to a question that makes
  it land. If the explanation is thin, the question is not worth asking.
- Give every *plausible wrong* option a `feedback` that names the belief behind
  it. If you cannot name why someone would pick an option, it is filler —
  delete it. **Three real options beat four with a decoy.**
- Keep the options within a few words of the same length. When the right answer
  is the long hedged one and the decoys are curt, readers pick on shape rather
  than meaning and the check stops measuring anything. The lint checks this too.
- `spot-the-bug` gets this backwards on purpose: put an explanation on the
  *innocent* lines someone would reasonably suspect. That is where most of the
  teaching in a spot check happens.

### Confidence, and why it earns its slider

`quiz`, `predict-output` and `estimate-slider` take an opt-in `confidence` prop.
The reader stakes how sure they are **before** answering — asked afterwards it is
hindsight, not calibration. Four outcomes, and only two are interesting:

|  | correct | wrong |
| --- | --- | --- |
| **confident** | fine | **the valuable one** |
| **unsure** | worth locking in | expected |

Confident-and-wrong means a belief the reader actively trusts and that does not
hold. That is exactly the thing an explanation exists to fix, and it is invisible
without asking. It reaches your analytics as
`calibration: "confident-wrong"` (see [analytics.md](./analytics.md)).

Use it on the **two or three** checks where a misconception is likely, not on
every check — asked constantly it becomes a tic and people stop reading it. The
lint warns past three.

The `storyline` finale reads the pattern back: if any answer was wrong while the
reader said they were certain, it says so by name. That is the most useful line
on the page — far more than the score, which is a mirror.

### The ending is the last teaching move

Not a scoreboard. Beside the stamps and the challenge count, the finale names
the confidence pattern and lists **the modules where an answer went wrong**, as
buttons that scroll back to them. A guide that ends on a number tells the reader
how they did; one that ends on "these two are worth a second pass" tells them
what to do next. Say what the guide does not cover in the `outro` node while you
are there.

---

## The non-negotiables

**Build from the source, not from memory.** Verify the specific claims you are
about to teach — dates, numbers, causal order, and above all anything that
arrives as a satisfying story. A guide asserts things confidently and gives the
reader no way to check, so a plausible fabrication does more damage here than in
ordinary prose. Where the source is thin, say it is thin instead of filling the
gap. Naming the source costs one line and lets the reader go further.

**Never fabricate a model.** A `tangle-text` or `scrubber` formula must be
defensible, and its `note` should say where the numbers come from — the lint
asks for one. If you cannot defend the formula, use `comparison-table` instead.

**Honest scope.** Say what the guide does not cover. A guide that pretends to be
complete is worse than a short one that knows it is short, because the reader
stops looking for the part you left out.

**Match the source's language, and use the same word for the same thing.**
Silent synonyms are one of the most reliable ways to lose a reader. For
nomenclature-heavy material, put an `anatomy` of the vocabulary early and then
never drift from it.

**Voice.** Write like someone who has been burned by this in production,
explaining it to a colleague. Concrete numbers over adjectives. Name the
trade-off rather than selling the technique — it is good, actually, to say when
the thing being taught is a bad idea. Avoid "in this guide we will explore",
"let's dive in", enthusiasm standing in for specificity, and any sentence that
would survive being deleted.

**Titles name the subject, they do not perform.** The reader opened this to learn
a specific thing; the cover title and every module title should say what that
thing is, in the words they would use. "How the scheduler picks the next job" is
a title. "Three versions of the truth" is a headline, and it makes the reader
work out what the module is even about. Save the writing for the prose.

---

## Failure modes

| symptom | what went wrong |
| --- | --- |
| the guide is a document with quizzes bolted on | nothing transforms — the reader never tests anything |
| every check is a `quiz` | you defaulted; re-read the mechanic table |
| the reader is told "not quite" and nothing else | missing per-option `feedback` |
| six widgets in one module | you are demonstrating the library, not teaching |
| a `scrubber` whose formula you cannot defend | delete it; a fabricated model teaches falsehoods well |
| the ending is a score | the finale should say what to revisit and where to go next |
| the reader can finish without ever being wrong | the checks are too easy to be worth their attention |
| every check sits directly under the thing it tests | you measured fluency, not retention — interleave one |
| the correct option is visibly the longest one | the reader can pick on shape without reading |
| it opens by explaining, for readers who think they know this | open cold: a `predict-output` or `contrast` *before* the first explanation, so the guide starts by breaking a belief instead of building one |

---

## What the lint checks

`story lint` turns the checkable half of this into a gate. Errors fail; warnings
are advice you should have a reason to ignore.

| rule | severity | what it catches |
| --- | --- | --- |
| `wrong-answer-teaches` | error | a wrong option with no `feedback` |
| `option-shape` | warning | the correct option is visibly the longest |
| `mechanic-variety` | warning | every check is the same widget |
| `prediction` | warning | nothing asks the reader to commit before a reveal |
| `checkpoint` | warning | a long guide that never consolidates |
| `confidence-budget` | warning | the confidence slider asked too often to mean anything |
| `honest-model` | warning | a movable model that never says where its formula came from |
| `contrast-stacking` | warning | a `contrast` re-revealing a gap the check before it just produced |

The rest of the rules — variety, cadence, prose quota, module length — police
rhythm, and predate this document. Both halves have to pass.

---

## Where the primitives came from

This doctrine is the `make-it-learnable` skill's, absorbed into Widgetron rather
than bolted onto it: its 21 primitives were mapped onto the catalog, the four
with no equivalent were built (`contrast`, `checkpoint`, `anatomy`, `code-lab`),
the pedagogical affordances the catalog was missing were added to the widgets
that already existed (confidence calibration, ranking, keyed reflections,
explanations on the innocent lines of a spot check), and the reasoning became
`authoringGuide` plus the lint rules above.

The mapping is below so the claim is auditable rather than asserted.

| primitive | widgetron | note |
| --- | --- | --- |
| `l-section` | `storyline` modules | `title` + `subtitle` + `outro` |
| `l-stack` | layout | composition, not pedagogy |
| `l-split` | `code-translation` | code beside its explanation |
| `l-stage` | `scrollytelling` sticky pane | the persistent representation |
| `scroll-story` | `storyline` | the narrative runtime |
| `l-scene` | `scrollytelling` steps | one beat per step |
| `l-stepper` | `frame-stepper` | discrete, reversible |
| `l-branch` | `decision-tree` | the explanation forks |
| `l-focus` | `frame-stepper` `active` | say where to look |
| `l-reveal` | `surprise` | information when it earns its place |
| `l-layer` | — | **gap, see below** |
| `l-anatomy` | **`anatomy`** | new |
| `l-compare` | `comparison-table` | criteria × options |
| `l-transform` | `code-diff`, `compare-slider` | A becomes B |
| `l-flow` | **`node-graph`** | new — boxes in HTML, arrows in measured SVG |
| `l-trace` | `frame-stepper`, `terminal-sim` | one concrete execution |
| — | `flow-diagram` | a straight line with no real edges; not what `l-flow` is |
| `l-state` | `frame-stepper` per-frame `badges` | make the invisible visible |
| `l-whatif inline` | `tangle-text` | Bret Victor's *Tangle* |
| `l-whatif` panel | `scrubber` | sliders → live outputs |
| `l-sandbox` | — | **gap, see below** |
| `l-lab` | **`code-lab`** | new |
| `l-quiz` (7 modes) | `predict-output`, `quiz`, `spot-the-bug`, `drag-and-drop`, `sort-steps` (+ `low`/`high`), `reflection` (+ `keys`), `estimate-slider` | all seven |
| `l-contrast` | **`contrast`** | new |
| `l-checkpoint` | **`checkpoint`** | new |
| `l-finish` | `storyline` finale | stamps, meter, outro node |
| `confidence` | `confidence` prop on the three scored widgets | new |

### One row of this table used to be wrong

It first read `l-flow → flow-diagram, mermaid-diagram`, and that mapping does not
hold. `flow-diagram` is a flex row of boxes with an arrow *icon* between them:
no real edges, no second dimension, no way to draw the miss path back from the
cache to the API. `mermaid-diagram` can draw the graph, but it renders every
label inside SVG `<text>` — and SVG cannot render HTML, so those labels lose
markdown, `code`, `[[glossary]]` tooltips, links, the theme's typography, and
the reflow a longer translation needs. Neither is `l-flow`.

What `l-flow` actually does is a **hybrid**, and that is the part worth taking:
the nodes stay HTML on a CSS grid and only the geometry joining them is SVG,
computed from the boxes' measured positions after layout. Wording changes move
the boxes and the arrows follow. `node-graph` is that, with two changes —
edge labels are HTML chips on the curve rather than SVG `<text>` (so they keep
RichText too), and the structure is also written out as a server-rendered
visually-hidden list, because geometry needs measurement and a screen reader
never gets any.

The general lesson, which is now a rule in the library: **put text in HTML and
geometry in SVG.** `plainRich()` exists for the seam between them — the places
where a rich string must become a plain one (an `aria-label`, an `sr-only`
description) and shipping the raw markers would have a screen reader announce
"star star API star star".

Two primitives were deliberately **not** ported, and it is worth saying why
rather than leaving a silent gap:

- **`l-layer`** ("one drawing, several questions" — toggling dimensions of a
  diagram on and off). Widgetron has no stage-parts protocol for a diagram to
  opt elements into named layers. `frame-stepper` covers the common case, one
  question per frame, and `hotspots` covers the rest.
- **`l-sandbox`** (the reader edits and runs their own code). `code-lab` covers
  the pedagogically stronger half — fixed variants the author chose, which is
  what makes the comparison teach — without shipping an editor. Where a reader
  really must edit, embed a real playground.

One thing the skill does that Widgetron cannot inherit: `build_lesson.py` refuses
to build on a broken cross-reference, because those fail *silently* in a browser
— the page still renders, it just stops teaching. Widgetron's equivalents are
`validateWidgetTree()` (structure), `story lint` (rhythm and the pedagogy rules
above), and the `story-playtester` skill, which drives a finished guide in a real
browser. Use all three. Shipping a guide nobody opened is how a guide with a dead
diagram gets shipped.
