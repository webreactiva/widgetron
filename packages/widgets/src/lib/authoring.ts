/**
 * The authoring guide — the judgement layer of the AI-generation surface.
 *
 * `widgetManifest` answers "what can I emit and with which props". It cannot
 * answer the questions that actually decide whether a generated guide teaches:
 * which four widgets out of sixty-odd this material wants, where the checks go,
 * what a wrong answer owes the reader, and when the honest move is to refuse to
 * build a guide at all. Left implicit, an agent defaults — and the default is a
 * document with quizzes bolted on.
 *
 * So the judgement ships as data, next to the schemas, and an MCP server can
 * serve it with them (`getAuthoringGuideJSON()`).
 *
 * The premise underneath all of it is the explorable explanation: an
 * interactive model of a concept carried by prose, where the reader states an
 * expectation and then watches reality disagree. Three consequences do most of
 * the work here — prose is not optional (a pile of widgets with no argument
 * running through it is a toy), expectation must come before reality (a reader
 * who never committed has nothing to correct), and the model must be real (a
 * reader who infers a relationship from a widget believes it far harder than
 * anything a paragraph could have told them, so a fabricated one teaches a
 * falsehood efficiently).
 */

/** The shape of the source material, and what that shape wants. */
export interface SourceShape {
  /** The kind of thing the author was handed. */
  shape: string;
  /** How to recognise it. */
  recognise: string;
  /** Why these widgets fit — the pedagogical reason, not a feature list. */
  because: string;
  /** Widget types to reach for. */
  reach: string[];
  /** Check widgets that suit this shape. */
  checks: string[];
  /** Widget types that are usually the wrong answer here. */
  avoid: string[];
}

/** What the author wants to know about the reader → which check answers it. */
export interface CheckMechanic {
  /** The question being asked about the reader's understanding. */
  wantToKnow: string;
  /** The widget type that answers it. */
  widget: string;
  /** How to use it well. */
  note: string;
}

/** A rule with the reason it exists — the reason is the part that transfers. */
export interface AuthoringRule {
  id: string;
  rule: string;
  why: string;
}

/** A symptom in a finished guide, and what it says went wrong upstream. */
export interface FailureMode {
  symptom: string;
  diagnosis: string;
}

export interface AuthoringGuide {
  premise: string;
  /** Sources that arrive looking like a guide and are not one. */
  notAGuide: { shape: string; tell: string; instead: string }[];
  sourceShapes: SourceShape[];
  checkMechanics: CheckMechanic[];
  budget: {
    distinctWidgets: string;
    checks: string;
    perModule: string;
    minutes: string;
    test: string;
  };
  sequencing: AuthoringRule[];
  nonNegotiables: AuthoringRule[];
  failureModes: FailureMode[];
}

/**
 * The guide. Plain data on purpose: serializable, diffable, and testable
 * against the live registry (every widget type named here must exist).
 */
export const authoringGuide: AuthoringGuide = {
  premise:
    "A guide is an interactive model of an idea carried by prose, where the reader commits to an expectation and then watches reality disagree. The prose carries the claim; the widgets are where the reader tests it. Before choosing a single widget, settle three things from the material: what the reader should be able to DO afterwards that they cannot do now; what people reliably GET WRONG about this (this is the most valuable thing you will extract, and it becomes the spine); and what you are honestly leaving out. A guide with nothing to correct is a reference document, and it should be one.",

  notAGuide: [
    {
      shape: "Reference",
      tell: "An API surface, a config table, a glossary, a list of flags. The reader will LOOK THINGS UP, not study.",
      instead:
        "A narrative is in their way. Say so, and offer a single-page vocabulary spread — `anatomy` over the artifact, `comparison-table` for the options, `glossary-text` for the terms — instead of a storyline. If there is a real guide hiding in it, it is the WHY behind the reference, not the reference.",
    },
    {
      shape: "How-to",
      tell: "A runbook — 'do these eight steps to deploy'. The reader has a task and is in a hurry.",
      instead:
        "Numbered steps beat a scroll story: `step-cards` or `checklist`. A guide only earns its place if they have to UNDERSTAND the thing, not do it once — usually the failure the runbook is dodging.",
    },
  ],

  sourceShapes: [
    {
      shape: "A process or sequence",
      recognise:
        "A request lifecycle, a CI/CD pipeline, an algorithm, a protocol, an agent loop. Ordered, with causality between the steps.",
      because:
        "The lesson is the ORDER and what each step depends on, so the reader has to reconstruct it rather than read it. Give them one concrete run before the abstract diagram — an abstraction they have no instance for is a definition, not an abstraction.",
      reach: ["flow-diagram", "frame-stepper", "step-cards", "terminal-sim", "timeline"],
      checks: ["sort-steps", "predict-output", "quiz"],
      avoid: ["anatomy", "comparison-table", "compare-slider"],
    },
    {
      shape: "A structure or artifact",
      recognise:
        "A prompt, a URL, an HTTP response, a config file, a JSON payload, a file format, a function signature. It has parts, not steps.",
      because:
        "The reader must name the parts and recognise them again in the wild, so show the whole thing and let them inspect it in place. Quote it verbatim — a paraphrased artifact is one they will not recognise when they open the real file.",
      reach: ["anatomy", "hotspots", "code-translation", "code-diff"],
      checks: ["spot-the-bug", "drag-and-drop", "fill-in-the-blanks"],
      avoid: ["flow-diagram", "sort-steps"],
    },
    {
      shape: "A decision or trade-off",
      recognise:
        "REST vs GraphQL, monolith vs services, buy vs build. Two defensible answers and a set of criteria.",
      because:
        "Nothing here is 'correct' — the skill is knowing which criterion decides it for YOUR case. Reveal the criteria one at a time; a table dumped whole gets skimmed.",
      reach: ["comparison-table", "decision-tree", "compare-slider", "tabs", "contrast"],
      checks: ["quiz", "reflection", "drag-and-drop"],
      avoid: ["predict-output", "code-lab", "sort-steps"],
    },
    {
      shape: "A quantitative relationship",
      recognise:
        "Latency, cost, scaling, tokens, memory, conversion. A number that moves with another number.",
      because:
        "The reader has a rough numeric model they have never tested. Put the numbers where they can be moved — but only if you can DEFEND the formula, because a relationship discovered from a slider is believed far more strongly than one asserted in a paragraph.",
      reach: ["tangle-text", "scrubber", "data-chart", "scroll-stat"],
      checks: ["estimate-slider", "predict-output"],
      avoid: ["anatomy", "sort-steps"],
    },
    {
      shape: "A piece of code",
      recognise: "One function, one module, one hot loop.",
      because:
        "Prediction lands hardest here, because code has exactly one answer and the reader's model either produces it or does not. Then let them RUN it: readers take more from operating a mechanism than from watching it animate.",
      reach: ["code-translation", "code-diff", "code-lab", "frame-stepper"],
      checks: ["predict-output", "spot-the-bug"],
      avoid: ["comparison-table", "infographic"],
    },
    {
      shape: "A whole codebase",
      recognise: "A repo the reader has to be able to work in.",
      because:
        "Their goal is to open the repo and not be lost, which makes the code the subject — not the project's history, not its test suite. Cover the module map, the core data structure everything passes around, one real execution with the actual function names, and the one or two places it could have gone another way (that is where prediction belongs). Show real code, quoted verbatim.",
      reach: ["flow-diagram", "anatomy", "code-translation", "frame-stepper", "mermaid-diagram"],
      checks: ["predict-output", "spot-the-bug", "sort-steps"],
      avoid: ["infographic", "scroll-stat"],
    },
    {
      shape: "A system architecture",
      recognise: "Boxes, arrows and layers — what talks to what, and through what.",
      because:
        "Six nodes revealed at once is a picture the reader skims. Reveal them one at a time and let each answer one question, so the diagram is built rather than shown.",
      reach: ["scrollytelling", "flow-diagram", "mermaid-diagram", "sticky-pan", "hotspots"],
      checks: ["quiz", "sort-steps", "drag-and-drop"],
      avoid: ["code-lab", "tangle-text"],
    },
    {
      shape: "A transformation",
      recognise: "Source → AST, spec → code, markdown → HTML, before → after.",
      because:
        "The interesting part is what SURVIVES each stage and what is invented, which only shows when both sides are on screen together.",
      reach: ["code-diff", "compare-slider", "code-translation", "frame-stepper"],
      checks: ["predict-output", "sort-steps"],
      avoid: ["comparison-table"],
    },
    {
      shape: "A conceptual distinction",
      recognise:
        "State vs derived, sync vs async, compile-time vs runtime, authn vs authz. Two things people conflate.",
      because:
        "Conflation is not fixed by a definition — the reader has to sort real examples and be told the dimension that separates them.",
      reach: ["contrast", "comparison-table", "callout-box", "glossary-text"],
      checks: ["drag-and-drop", "quiz"],
      avoid: ["flow-diagram", "code-lab"],
    },
    {
      shape: "A belief that does not hold",
      recognise:
        "A benchmark that surprised the team, a profiler result, a postmortem, 'everyone thinks X'.",
      because:
        "This is the strongest material there is, and it wants the reader to commit before the reveal. Once they have read the answer, asking them to predict it is theatre.",
      reach: ["contrast", "surprise", "quote"],
      checks: ["predict-output", "estimate-slider", "quiz"],
      avoid: ["prose", "section-header"],
    },
    {
      shape: "Non-technical material",
      recognise:
        "History, hiring, rhetoric, policy, process design, a business decision.",
      because:
        "There is no programmable model here, and the format's gravity pulls towards inventing one. Refuse it: decomposition, comparison and contrast carry this material perfectly well.",
      reach: ["anatomy", "comparison-table", "contrast", "timeline", "quote"],
      checks: ["drag-and-drop", "reflection", "quiz"],
      avoid: ["tangle-text", "scrubber", "code-lab", "predict-output"],
    },
  ],

  checkMechanics: [
    {
      wantToKnow: "Does their mental model produce the right output?",
      widget: "predict-output",
      note: "The strongest mechanic there is, and the first to reach for. Reading an explanation produces a convincing feeling of understanding that survives right up until you have to predict something. Must come BEFORE the explanation.",
    },
    {
      wantToKnow: "Is their sense of scale right?",
      widget: "estimate-slider",
      note: "Drags a rough numeric model into the open next to the real value. Be generous with `tolerance` — you are testing an order of magnitude, not arithmetic. Only with a number you can source.",
    },
    {
      wantToKnow: "Can they recognise the concept in real material?",
      widget: "spot-the-bug",
      note: "Recognition in situ is a different skill from knowing the definition — a reader can define a race condition and not see one in forty lines. Explain the innocent lines too.",
    },
    {
      wantToKnow: "Can they tell two confusable things apart?",
      widget: "drag-and-drop",
      note: "The best mechanic for concepts people conflate. Name the dimension that separates the zones in `explanation`, or they sort correctly and learn no criterion.",
    },
    {
      wantToKnow: "Do they understand the process?",
      widget: "sort-steps",
      note: "Reconstructing a sequence is much harder than reading one. With `low`/`high` it becomes a ranking — ordering by a property (coupling, cost, blast radius) rather than by time.",
    },
    {
      wantToKnow: "Can they generate the explanation, not just recognise it?",
      widget: "reflection",
      note: "Recognition is cheap and feels exactly like knowledge. Add `keys` so the reader sees which ideas they left out — that read-back is the whole point. Its best variant is COUNTEREXAMPLE: state a rule the reader believes ('caching always helps') and ask them to find where it breaks. Excellent for teaching the limits of a rule, which is usually the part that is missing.",
    },
    {
      wantToKnow: "Is it genuinely a choice between named options?",
      widget: "quiz",
      note: "Right when the concept really is a discrimination between alternatives. It is also the default every generator collapses into — if every check in a guide is a quiz, you defaulted rather than chose. Its best variant is DIAGNOSE: put the symptoms in `scenario` and ask 'what would you investigate first?' — very effective for operational knowledge, where the skill is triage rather than recall.",
    },
    {
      wantToKnow: "Can they complete it in context, with the right word?",
      widget: "fill-in-the-blanks",
      note: "For material where the exact wording carries the meaning and a standalone option would lose the sentence around it.",
    },
    {
      wantToKnow: "Can they recall it cold, at their own pace?",
      widget: "flashcards",
      note: "Self-graded recall for vocabulary and definitions. Weakest evidence of the set — it is practice, not a check.",
    },
    {
      wantToKnow: "Can they still say it three modules later?",
      widget: "checkpoint",
      note: "The consolidation pause, and the natural place for the check that reaches BACK. Place one every three or four modules.",
    },
  ],

  budget: {
    distinctWidgets:
      "4–7 distinct widget types in a guide. Using more of the catalog is not coverage, it is noise — and it reads as a demo of the library rather than an argument.",
    checks:
      "4–6 checks, at least one of them a prediction, placed early. Set `confidence` on two or three of them at most; asked constantly it becomes a tic and readers stop reading it.",
    perModule:
      "The default number of widgets in a module is ONE, plus the prose that carries it. A module using six is almost always three modules.",
    minutes:
      "8–12 minutes. A 12-minute guide that teaches three things beats a 40-minute one that mentions twelve. Say what you left out.",
    test: "For every widget ask: what would the reader fail to understand if this were a paragraph? No answer means make it a paragraph. Interactivity costs attention the argument needs, and it has to buy something back.",
  },

  sequencing: [
    {
      id: "spine-first",
      rule: "Write the modules as plain sentences — each with its goal and the check that ends it — before emitting a single widget.",
      why: "If that list does not read like an argument, no amount of interactivity will rescue it, and markup is the most expensive place to discover it. Fix the sequence here, where fixing is cheap. If you cannot write a module's goal in one sentence, it is doing two things and it is two modules.",
    },
    {
      id: "concrete-first",
      rule: "One real, concrete instance before the general diagram.",
      why: "An abstraction the reader has no instance for is not an abstraction, it is a definition — and definitions do not transfer.",
    },
    {
      id: "reveal-dont-dump",
      rule: "If a diagram has six nodes, the reader meets them one at a time.",
      why: "A finished picture gets skimmed; a picture being built gets read. This is what `scrollytelling`, `frame-stepper` and `sticky-pan` are for.",
    },
    {
      id: "predict-before-explain",
      rule: "The prediction goes before the reveal, always.",
      why: "Once the reader has read the answer, their prediction is worthless — the check has become a formality that costs attention and returns nothing.",
    },
    {
      id: "consolidate",
      rule: "A `checkpoint` every three or four modules.",
      why: "Long explanations without consolidation let the reader stack new concepts on a broken base, and the collapse happens later where nobody can trace it.",
    },
    {
      id: "interleave",
      rule: "Most checks follow their teaching; at least one must reach back two or three modules.",
      why: "A check sitting directly under the thing it tests measures whether the idea is still in working memory — cheap to pass and nearly worthless as evidence. A check that reaches back measures whether it is retrievable, which is what you were building.",
    },
    {
      id: "difficulty-is-a-budget",
      rule: "Make the KNOWLEDGE frictionless and the SKILL effortful — in the same guide.",
      why: "When you are installing a fact or a structure, difficulty is pure cost: spend the reader's working memory on the idea, not on decoding your sentences. When you are building a skill — recognising, predicting, deciding — difficulty IS the mechanism, so make them produce an answer rather than pick one. Explaining what a TTL is should be frictionless; the check on what a TTL costs you should not be.",
    },
    {
      id: "cadence",
      rule: "Never more than about four passive screens in a row.",
      why: "Attention decays without an act. This is also the one place where a widget with no pedagogical claim (a `figure`, a `quote`) still earns its slot.",
    },
  ],

  nonNegotiables: [
    {
      id: "wrong-answers-teach",
      rule: "Every check explains itself, and every plausible wrong option names the belief behind it.",
      why: "'Incorrect' tells a reader they failed. 'You picked that because you are thinking of X, and here is where that model breaks' tells them what to change. A check that says wrong and stops has spent the reader's attention and returned nothing — it is worse than no check. Write the explanation FIRST and work backwards to the question; if the explanation is thin, the question is not worth asking.",
    },
    {
      id: "no-filler-options",
      rule: "If you cannot name why someone would pick an option, delete it.",
      why: "Three real options beat four with a decoy. And keep them the same length: when the right answer is the long hedged one and the decoys are curt, readers pick on shape rather than meaning and the check stops measuring anything.",
    },
    {
      id: "never-fabricate-a-model",
      rule: "A `tangle-text` or `scrubber` formula must be defensible; cite where the numbers come from.",
      why: "A reader who discovers a relationship by moving a number believes it far more strongly than anything you wrote in a paragraph, so an invented formula teaches a falsehood efficiently. Simplify all you like; do not fake it. If you cannot defend the formula, use `comparison-table` instead.",
    },
    {
      id: "build-from-the-source",
      rule: "Verify the specific claims — dates, numbers, causal order, and above all anything that arrives as a satisfying story.",
      why: "A guide asserts things confidently and gives the reader no way to check, so a plausible fabrication does more damage here than in ordinary prose. Where the source is thin, say it is thin instead of filling the gap. Naming the source costs one line and lets the reader go further.",
    },
    {
      id: "points-are-a-mirror",
      rule: "Scoring rewards committing to an answer and being honest about confidence — never clicking around.",
      why: "This format is normally defined AGAINST gamification; the light layer of stamps, meters and lives exists because it makes the confident-and-wrong case visible, which is the single most useful thing a check can surface. If a guide would be worse with the progress chrome removed, fix the guide.",
    },
    {
      id: "honest-scope",
      rule: "Say what the guide does not cover, in the finale.",
      why: "A guide that pretends to be complete is worse than a short one that knows it is short — the reader stops looking for the part you left out.",
    },
    {
      id: "match-the-source",
      rule: "Write in the language of the source, and use the same word for the same thing throughout.",
      why: "Silent synonyms are one of the most reliable ways to lose a reader. If the material is nomenclature-heavy, put an `anatomy` of the vocabulary early and then never drift from it.",
    },
    {
      id: "titles-name-the-subject",
      rule: "The cover title and every module title say what the thing IS, in the words the reader would use.",
      why: "They opened this to learn a specific thing. 'How the scheduler picks the next job' is a title; 'Three versions of the truth' is a headline, and it makes the reader work out what the module is even about before they can decide to read it. Save the writing for the prose — a module called 'What a TTL costs you' is allowed to be boring.",
    },
    {
      id: "voice",
      rule: "Write like someone who has been burned by this in production, explaining it to a colleague.",
      why: "Concrete numbers over adjectives; name the trade-off rather than selling the technique; it is good, actually, to say when the thing being taught is a bad idea. Avoid 'in this guide we will explore', 'let's dive in', enthusiasm standing in for specificity, and any sentence that would survive being deleted.",
    },
  ],

  failureModes: [
    {
      symptom: "The guide reads as a document with quizzes bolted on.",
      diagnosis:
        "Nothing transforms and nothing is tested — there is no persistent representation the reader watches change. Reach for `scrollytelling`, `frame-stepper` or `sticky-pan`, or accept that this material is a reference.",
    },
    {
      symptom: "Every check is a `quiz`.",
      diagnosis: "You defaulted instead of choosing. Re-read the mechanic table: the question you are asking about the reader picks the widget.",
    },
    {
      symptom: "The reader is told 'not quite' and nothing else.",
      diagnosis: "Missing per-option feedback and the explanation. This is the most common and most expensive failure in the format.",
    },
    {
      symptom: "Six widgets in one module.",
      diagnosis: "You are demonstrating the library, not teaching. That module is three modules, or five of those widgets are paragraphs.",
    },
    {
      symptom: "A `scrubber` or `tangle-text` whose formula you cannot defend.",
      diagnosis: "Delete it. A fabricated model teaches falsehoods more efficiently than prose ever could.",
    },
    {
      symptom: "The ending is a score.",
      diagnosis: "The finale should say what to revisit and where to go next. The number is a mirror, not the payoff.",
    },
    {
      symptom: "The reader can finish without ever being wrong.",
      diagnosis: "The checks are too easy to be worth their attention. At least one should target a belief the reader actually holds.",
    },
    {
      symptom: "Every check sits directly under the thing it tests.",
      diagnosis: "You measured fluency, not retention. Move one check — or one `checkpoint` item — two modules downstream.",
    },
    {
      symptom: "The correct option is visibly the longest one.",
      diagnosis: "The reader can pick on shape without reading. Match the options in word count.",
    },
    {
      symptom: "The guide opens by explaining, for readers who think they know this already.",
      diagnosis:
        "Open cold instead: a `predict-output` or `contrast` before the first explanation, so the guide starts by breaking a belief rather than building one.",
    },
  ],
};

/** Every widget type the guide recommends anywhere — used to keep it honest. */
export function authoringGuideWidgetTypes(): string[] {
  const types = new Set<string>();
  for (const shape of authoringGuide.sourceShapes) {
    for (const t of [...shape.reach, ...shape.checks, ...shape.avoid]) types.add(t);
  }
  for (const m of authoringGuide.checkMechanics) types.add(m.widget);
  return [...types].sort();
}

/**
 * The guide in serializable form, for an MCP server to hand an agent alongside
 * `getWidgetManifestJSON()`. It is already plain data; this is the stable name
 * to call, and a defensive copy so a consumer cannot mutate the shared object.
 */
export function getAuthoringGuideJSON(): AuthoringGuide {
  return JSON.parse(JSON.stringify(authoringGuide)) as AuthoringGuide;
}
