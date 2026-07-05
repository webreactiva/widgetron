# Writing styles (`--styles`, mixable)

The style palette for a generated guide. Styles are NOT exclusive — a guide
combines them, but each must be applied deliberately. Recipe for combining:
**at most ONE structure + one or two tones + at most ONE interaction mode.**
Default mix when the user doesn't choose: `didactico + voz-original`.

Every style below is defined operatively: what it changes in the outline, the
copy and the widget selection. If a chosen style doesn't visibly change the
guide, it wasn't applied.

## Tones — how it sounds

### `didactico`
Teacher-first: every concept lands as *define → example → practice*.
- **Changes**: explicit micro-recaps at module ends; quiz/fill-in feedback
  explains WHY, not just right/wrong; glossary heavily used; nothing assumed
  without a check.
- **Widget bias**: quiz, fill-in-the-blanks, flashcards, checklist, glossary-text.

### `divertido`
Humor as a teaching device, never as decoration.
- **Changes**: dramatizations (group-chat with personality), playful quiz
  feedback, surprises with wink teasers, callouts that land a joke AND a point.
- **Widget bias**: group-chat, surprise, predict-output with trap options.
- **Guardrail**: the joke never replaces the explanation; humor follows the
  podcast's register if a profile is loaded.

### `voz-original`
Faithful to the transcript's voice (and the podcast profile if loaded).
- **Changes**: maximum verbatim retention — the episode's own phrasings,
  muletillas and metaphors survive the cleanup; editorial glue mimics them;
  more `quote` widgets.
- **Widget bias**: quote, prose in the speaker's cadence, group-chat replaying
  real exchanges.
- **Guardrail**: fidelity never beats comprehension. The reader never heard the
  audio, so a verbatim joke, metaphor or aside that only works with the spoken
  delivery must be given context or cut — never left cryptic on the page (SKILL
  content rule 7 + the cold-reader read-back step).

### `sobrio`
Cheat-sheet energy: minimum words, maximum signal.
- **Changes**: short sentences, no anecdotes, aggressive cutting of asides;
  modules get 2–3 screens; endings are actionable lists.
- **Widget bias**: pattern-card, step-cards, checklist, data-chart.
- **Clashes with**: `divertido`, `viaje-del-heroe` (don't mix).

## Structures — how it's ordered

### `open-loop`
Plant a question, doubt or promise on the cover / first screen; keep it alive;
resolve it explicitly at the end (last module, before the CTA).
- **Changes**: cover description poses the loop; mid-guide callouts tease it
  ("aún no puedes responder esto — sigue"); the closing screen answers it
  verbatim and names the loop closed. A final quiz can BE the resolution.
- **Check**: if you delete the last module, the guide must feel unfinished.
- **Title is a loop too**: if the cover/title makes a provocative promise (a
  word like "mienten"), the body must pay it off explicitly, or soften the
  title — a hook the guide never develops reads as bait.

### `viaje-del-heroe`
The reader is the hero; the episode's tool/idea is the sword.
- **Changes**: modules map to the arc — ordinary world (the pain) → call →
  threshold (first contact with the tool) → trials (errors, edge cases) →
  the reward (the win moment) → return with the elixir (applying it to YOUR
  project). Module subtitles carry the arc.
- **Widget bias**: timeline for the arc, terminal-sim/frame-stepper as trials,
  checklist as the elixir brought home.
- **Guardrail**: DECLARE the frame on the cover ("está contada como un viaje en
  cinco actos…") so its vocabulary (umbral, elixir) doesn't jar a reader who
  wasn't told; and avoid metaphor words that collide with tech terms ("elixir"
  vs the Elixir language → use "el botín").

### `caso-practico`
One running example built end-to-end across the whole guide.
- **Changes**: module 1 introduces the case; every module advances the SAME
  artifact (the same API, the same app); no disconnected examples.
- **Widget bias**: code-translation, terminal-sim, step-cards, spot-the-bug on
  the case's own code.
- **Guardrail**: NAME the running example explicitly before the first widget
  that uses it — a reader who never met "the CMS" is lost by module 2 (see the
  cold-reader review). Introduce it on a screen AND in `meta.description`.

### `socratico`
Question first, explanation after — the reader commits before learning.
- **Changes**: each key concept OPENS with a quiz/predict-output/decision-tree
  the reader answers before the explaining screen; explanations reference the
  reader's likely answer ("si has elegido X…").
- **Widget bias**: quiz, predict-output, decision-tree placed BEFORE prose.

## Interaction modes — how it's touched

### `explorable`
Explorable explanation (Bret Victor): learn by manipulating and seeing
consequences, not by reading claims.
- **Changes**: wherever the episode states a relationship, the guide makes it
  draggable/steppable instead of asserting it; text asks the reader to try
  things and predict outcomes.
- **Widget bias**: tangle-text, scrubber, hotspots, frame-stepper,
  compare-slider, interactive flow-diagram/mermaid details.
- **Guardrail**: only relationships actually stated in the episode.

### `expandable`
Expandable explanation (Nutshell, Nicky Case): layered depth, just-in-time and
in-context — the fast path is short, depth is optional and never blocks.
- **Changes**: surface copy stays lean; depth hides behind glossary `[[term]]`
  tooltips, mermaid/flow `details`, timeline expandables, flashcards for the
  curious; a reader skipping every expansion still gets a complete lesson.
- **Widget bias**: glossary-text, mermaid-diagram/flow-diagram with `details`,
  timeline with `description`, hotspots.
- **Check**: read only the collapsed layer — it must stand alone.

## Applying a mix

1. Structure decides the module outline BEFORE drafting screens.
2. Tones decide the copy register of every editorial string.
3. Interaction mode biases widget selection on ties.
4. In the handoff, name the mix used and point to one concrete example of each
   style in the guide (e.g. "open-loop: se abre en portada, se cierra en M7").
