# Format preset: `entrevista` — La ficha del invitado

The companion piece for an interview episode. The proven artifact behind it:
Tim Ferriss' transcript + show-notes pages (850+ episodes) and the fact that
third parties (Podcast Notes) make a living structuring OTHER people's
interviews. This preset industrializes that page.

Set `meta.format: "entrevista"` in the envelope — `story lint` validates the
mold. All the global rules (never invent, cold reader, cadence, variety…)
still apply; this file only fixes the STRUCTURE and the audio strategy.

## Shape

~15 screens · 4 modules + cover · audio as 3–5 fragments (never the full
episode — the unit of value of an interview is the moment).

## Inputs this format leans on

- **Transcript** (required, as always): the only source of quotes and claims.
- **Prep notes** (optional but natural here): the host's preparation doc —
  guest bio, links, planned questions. Use them for the guest's bio and the
  resource links; **the transcript wins on any conflict** and mismatches go
  to the handoff.
- **Audio fragments**: the 3–5 best moments, cut with `make-audio-clip`
  FIRST (real URLs only — global media rule).

## The recipe, module by module

1. **Cover** — the conversation's promise in `meta.title` (what the reader
   will take away, not "interview with X"); `meta.description` sells it in
   two lines. The FIRST screen of module 1 must still hook (global rule) —
   here the natural hook is the guest herself:
   - `profile-card` of the guest right at the top of module 1: who they are
     and why listen (bio from prep notes, CONTRASTED with the transcript).
2. **M1 · El personaje** — make the reader care about the voice:
   - `timeline` of the guest's trajectory when the conversation is
     biographical (milestones must appear in transcript or prep notes);
   - their presentation `quote` with minute chip and voice (first fragment).
3. **M2 · La conversación** — the best exchange, dramatized:
   - `group-chat` re-creating the sharpest back-and-forth (host question,
     guest answer, host reply — verbatim-faithful, cleaned of ASR noise);
   - 2–3 key `quote`s with voice (the remaining fragments);
   - one `callout-box` (variant aha) landing the central idea.
4. **M3 · Las ideas** — active recall:
   - `flashcards` «las N ideas que se llevó» (3–5 cards);
   - a comprehension `quiz`;
   - `glossary` (storyline prop) for every name, book or tool dropped in
     passing — the unglossed-reference smell hits interviews hardest.
5. **M4 · Para seguir** — the guest keeps working for the show:
   - `resource-list` with the guest's links and everything mentioned (prep
     notes are the natural well; story-librarian enriches later);
   - CTA (from `settings`, as always).

Per-module `emoji` + `outro` and the engagement rules from SKILL.md apply as
in any guide.

## Audio rule (format-specific)

Fragments, not the episode: each chosen moment gets its `quote` with
`timestamp` + `clip`. A moment that deserves audio but has no clip yet is
reported in the handoff with its timestamp range — never a placeholder.

## What the lint checks for this format

- A `profile-card` exists (an interview without the guest's card is the
  format's cardinal sin).
- At least 2 `quote`s (the interview must speak in the guest's voice).
