# Format preset: `juego` — La partida jugable

The competitive extra pass over an episode: the reader doesn't just read, they
*play a run* with lives on the line. The proven artifact behind it: the hearts
in Duolingo, the streak in a trivia night, the health bar in Kahoot — a finite
resource that turns "answer the question" into "don't die." It suits any
episode whose ideas can be phrased as sharp right/wrong retos.

Set `meta.format: "juego"` in the envelope — `story lint` validates the mold.
All the global rules (never invent, cold reader, cadence, variety, engagement
layer) still apply; this file fixes the STAKES.

## The one mechanic that matters

`settings.lives` is the format. It feeds **exclusively from `quiz`** — the only
widget that scores an answer (`answered { correct }`). So a `juego` is built
around its quizzes: every wrong answer costs a heart, every correct one wins one
back (redemption, capped at `total`), and at **0 lives the finale withholds its
reward** — a game-over screen invites a retry instead of celebrating, and the
confetti waits — while the prose stays fully readable. Nothing ever blocks
reading; only the *payoff* is at stake.

Declare it in the envelope, paired with the `challenge` meter as the visible
score:

```json
"settings": {
  "lives": { "total": 3, "label": "Vidas" },
  "challenge": { "label": "Tu racha" }
}
```

Pick `total` **below the number of quizzes** so a game-over is actually
reachable (3 lives over 5+ retos is a good default). `total` too high and the
run has no teeth; the lint warns you.

## Shape

~12–16 screens · 3–5 modules + cover · **at least 3 `quiz` retos** (the mold's
minimum; realistically one per module plus a boss round). Audio as fragments,
same as any guide.

## The recipe, module by module

1. **Cover** — name the run and its stakes in `meta.title` («Sobrevive al
   episodio: 3 vidas»); `meta.description` sets the rules in one line (how many
   lives, that wrong answers hurt). The first screen of module 1 must still hook
   (global rule): open with the promise, not a warm-up.
2. **Mundo 1 · Calentamiento** — teach a chunk, then gate it with a `quiz` the
   reader can only pass if they read it. Keep the first quiz winnable so the
   loss aversion is felt, not resented.
3. **Mundos intermedios** — each module = one idea + one reto. Alternate the
   teaching widget (a `code-translation`, a `flow-diagram`, a `quote` with
   voice, a `callout-box`) so the variety rule holds, but ALWAYS land on a
   `quiz`. Raise the difficulty across the run.
4. **Boss final** — the hardest `quiz` (or two), pulling ideas from across the
   episode. This is where a careless reader spends their last heart.
5. **Cierre** — `resource-list` + the CTA (from `settings`). The finale is
   already handled by the storyline: a scoreboard + confetti if the reader
   survived, the game-over retry screen if they didn't.

Per-module `emoji` (the stamp) + `outro` still apply — here they double as the
"level cleared" beat between rounds.

## The points/lives contract (state it on the cover)

- **Lives are session-scoped.** A reload is a fresh run — that's the arcade
  feel, not a bug. Say so on the cover so nobody feels cheated by a refresh.
- **Redemption is real.** A reader at 0 lives is not stuck: scrolling back and
  acing any quiz wins a heart and unlocks the finale. The game-over hint says as
  much. Design at least one quiz late enough that a comeback is possible.
- **Points ≠ lives.** The `challenge` meter is the positive score (retos beaten
  over total); lives are the negative resource. Both pinned, both additive.

## Audio rule (format-specific)

Fragments for the quoted moments only, as in any guide — a `juego` is played at
speed. No full-episode audio.

## What the lint checks for this format

- `settings.lives` exists (the format IS the mechanic).
- At least 3 scored `quiz` retos (without retos you can't lose lives).
- Warns if `lives.total` > number of quizzes (game-over barely reachable).
