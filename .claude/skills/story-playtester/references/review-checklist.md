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
