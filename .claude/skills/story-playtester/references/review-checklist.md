# Review checklist — what to judge, with thresholds and why

Each stop names the rule it enforces (from podcast-to-story) so findings can
cite it. Judge against the READER's experience, not the JSON's intent.

## ✱ Cover (the contract — M4)

- Badges render: estimated minutes, module count, challenge count. The
  minutes badge must be believable against the real scroll height (see
  Honesty check below).
- Module index present and clickable; **Empezar** lands exactly on module 1.
- Description clamps at 2 lines with «Leer más» when longer. A wall of text
  on the cover is a finding (fun pass: "does the cover make a promise?").
- The title sells what you'll know/do — not the episode's topic label.
  "Entrevista con X" or a bare noun phrase is a finding.

## Hook (first 60 seconds — S1a)

- First screen of module 1 is interactive or intrigue (quiz, decision-tree,
  tangle-text, group-chat drama, curiosity-gap quote/callout). Plain prose
  first = finding, severity high.
- Metric: **px from module 1 top to the first interactive widget**. There is
  no magic number, but if it exceeds ~2 viewport-heights (≈1600px at 390×780)
  the reader scrolled a full minute before touching anything.

## Sustain (the middle — S1b, cadence)

- **Worst passive streak** in screens AND px. The lint warns at >4 screens;
  pixels catch what it can't — 3 tall diagrams can be worse than 5 short
  callouts. There is NO hard threshold: a dense topic can legitimately carry
  a long passive stretch when every screen earns its place. Report the
  metric, then judge it against the material — it's a finding only when the
  stretch actually sags (repetitive, skimmable, or padding), not merely
  because it's long.
- Prose share: rough fraction of scroll height that is plain text. Over a
  third reads as an article, not a guide.
- Module send-offs (M8): every module closes with its outro + a distinct
  emoji. Repeated emoji or missing outros = finding (low severity, but the
  passport depends on the set).
- Widget variety: the census should span ≥4 groups; two identical adjacent
  widgets is a lint error that should never survive to this point — if you
  see one, the static pass was skipped.

## Play one challenge (feedback quality)

- Answer WRONG first: the feedback must teach, not just say "no". Then
  answer RIGHT: confetti + explanation.
- If `settings.challenge` is set (M11): the meter must NOT move on the wrong
  answer and must move on the right one, and its label must read as the
  content's own metaphor, not a generic score.
- Widget set-up (cold-reader smell): the idea a quiz tests must appear on a
  PRIOR screen. A quiz answerable only by guessing = finding.
- **The wrong answer's feedback must name the belief behind that option**, not
  restate the right answer. "Casi, la respuesta es B" is a finding: the reader
  learns they failed and nothing else, and the check has spent their attention
  for nothing. `story lint` catches a *missing* feedback; only a human reading
  it catches an *empty* one.
- **Options readable on shape**: if the correct one is visibly the longest or
  the only hedged one, a reader can pick it without reading. Finding.
- If a check sets `confidence`, take the "certain + wrong" path deliberately —
  it is the one the whole feature exists for. The calibration note must land as
  useful ("this is the belief worth rewriting"), never as a scold. And count
  them: more than three confidence prompts in a guide is a tic.
- If a `code-lab` is present, RUN both variants. The outputs must actually
  differ, and the difference must be the point the module is making — two
  variants that print the same thing is a finding.
- A `contrast` must be reached with its reality still hidden. If the same gap
  was already revealed by the check just before it, that is a finding: the
  second telling is the weaker one.

## Does it teach? (the pedagogy pass)

Judged over the whole read, not at one stop. The lint checks what is
mechanical; these need a person who just read it. Full reasoning:
`docs/pedagogy.md`.

- **Was I ever wrong?** A guide the reader finishes without a single wrong
  answer had checks too easy to be worth their attention. At least one should
  target a belief a reader plausibly holds.
- **Did I commit to anything before being told?** Find the first
  `predict-output` / `estimate-slider` / `contrast` and note how far in it is.
  If every explanation lands before any commitment, the guide is a document.
- **Did any check reach back?** If every check sits directly under the module
  that taught it, the guide measured working memory, not retention. One should
  need something from two modules earlier — the `checkpoint` is the usual place.
- **Could a widget have been a paragraph?** For each one, ask what the reader
  would have failed to understand otherwise. No answer = finding. The reverse
  is a finding too: a paragraph doing work a widget would do better.
- **Is any movable model undefended?** For `tangle-text` / `scrubber`, does the
  note say where the numbers come from? A relationship the reader discovers by
  dragging is believed harder than one asserted in prose, so an invented one is
  the most expensive error in the guide.
- **Would the guide be worse with the progress chrome removed?** Hide the
  meter, stamps and lives in your head and reread. If the reason to keep going
  was the score, the content is the problem.

## ✱ Finale (the payoff — M1/M6/M9)

- Confetti on arrival (real scroll, not hydration), scoreboard reflects the
  session (challenges you actually passed), stamp collection shows earned
  vs dimmed correctly.
- «Copiar mi resultado»: click it; verify by the label flipping to
  «¡Copiado!». The CTA (outro) renders AFTER the finale — celebrated first,
  pitched second.
- Keepsake check (fun pass): the last content screen before the finale
  should be a checklist/prompt-template, not trailing prose.

## Resume (M10)

- Scroll to mid-guide, wait ≥300ms, reload. The bar must NAME the module
  («Te quedaste en "X"») and the minutes left. «Continuar» must land back
  inside the same module at roughly the same depth.
- Verify the stored JSON has `module`/`frac` (semantic), not just `top`.

## ✱ Mobile nav (M3)

- The floating pill (bottom, thumb zone) opens the bottom-sheet index with
  per-module states and "te quedan ~N min". Targets ≥44px.
- Desktop pass: rail dots show states and stamps; keyboard arrows walk
  modules.

## Honesty check (the promise vs the pixels)

- Total scroll px ÷ (promised minutes) — a "~3 min" guide of 15.000px is
  lying. For `format: briefing` the contract is strict: it should FEEL like
  5 minutes; if your own walkthrough took visibly longer, finding.
- For `format: entrevista`: the guest's profile-card is the first thing
  after the cover promise; quotes carry attribution + role a stranger can
  calibrate ("who is this and why trust them").

## Console and errors

- Zero errors/warnings in the console across the whole run
  (`list_console_messages` with types error/warn). Any `[widgetron]` unknown
  widget warning means the JSON emitted a type outside the manifest —
  severity max, the screen rendered as nothing.
