# Format preset: `briefing` — El briefing jugable

The companion piece for a news / current-affairs episode. The proven artifact
behind it: The Daily's weekly newsletter (NYT). Short, fixed mold, built for
a weekly cadence — the value is the SERIES, not the piece.

Set `meta.format: "briefing"` in the envelope — `story lint` validates the
mold (a briefing that grows long stops being a briefing). Global rules still
apply; this file fixes the mold and the series mechanics.

## Shape (fixed mold — hard limits)

**~7 screens · ≤9 screens total · ~5 min.** 3 modules. The contract with the
reader is «5 minutos y estás al día»; every screen beyond the mold breaks it.

## The recipe

1. **Cover, minimal** — `meta.title` names the edition («La semana en 5
   claves»); `meta.description` ONE line. No long paragraph: the promise IS
   the brevity.
2. **M1 · Las claves** — one screen per key story (3–5 keys), each with a
   DIFFERENT widget and minimal prose:
   - the data key → `data-chart`;
   - the statement key → `quote` with the voice of the headline (timestamp +
     clip when a fragment exists);
   - the process key → a small `flow-diagram`;
   - the rest → `callout-box`.
   The global no-repeat rule already forces the variety; the mold makes it
   the point.
3. **M2 · El reto** — a `quiz` «¿estuviste atento?» (1–3 questions about the
   keys, nothing outside them).
4. **M3 · Fuentes y cierre** — `resource-list` with the week's links + the
   subscription CTA (from `settings`).

Per-module `emoji` + `outro` still apply (short ones — the mold is tight).

## Series mechanics

- **Slug carries the edition**: `briefing-2026-07-10` (or the show's own
  numbering). `storageKey` = slug, as always — each edition remembers its
  own progress, the catalog's «Continuar» pulls the reader back, and the
  passport turns editions into a visible streak.
- Same mold every week: the reader learns the shape, generation cost drops,
  and it becomes the natural test bench for the automated pipeline.

## Audio rule (format-specific)

Fragments for the headline quotes only. No full-episode audio — a briefing
is read at speed.

## What the lint checks for this format

- Total screens ≤ 9 («briefing que se alarga»).
- A `quiz` exists (the reto is the mold's payoff).
