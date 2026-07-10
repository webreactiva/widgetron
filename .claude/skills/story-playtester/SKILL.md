---
name: story-playtester
description: "Playtest a Story Studio guide like a real reader: launch the studio, play the .story.json in a real browser (mobile viewport first), measure engagement mechanics (pixels to first interaction, passive streaks, cover promise, finale payoff, resume) and return a findings report with screenshots. Use when: (1) user invokes /story-playtester <slug>, (2) as step 8.5 of podcast-to-story before the handoff, (3) user asks 'prueba/playtestea la guía', 'does the guide hook?', or wants a UX pass over a generated story."
argument-hint: "[slug] [--desktop-only|--mobile-only]"
user_invocable: true
---

# Story Playtester

Plays a `.story.json` the way a cold reader on a phone would, and reports
where the guide loses them. It NEVER edits the story — the output is a
findings report; fixes belong to the author (via the `podcast-to-story`
rules: hook, payoff cadence, fun pass).

## Inputs

- **Slug** (required): a document in `apps/story-studio/content/<slug>.story.json`.
  Without an argument, list the available slugs and ask.
- Everything else is derived. No user questions beyond the slug.

## Process

1. **Static pass first (cheap, no browser):**
   ```bash
   pnpm --filter @webreactiva/story-studio story validate <slug>
   pnpm --filter @webreactiva/story-studio story lint <slug> --score
   ```
   Keep the lint findings and the score partitura — the playtest confirms or
   dismisses them with real pixels.

2. **Launch the studio** if not already running: `pnpm dev:studio`
   (Vite, default `http://localhost:5173`). The player URL is `/s/<slug>`.

3. **Play it on mobile first** (the primary audience): drive Chrome via the
   `chrome-devtools` MCP tools (or the `dev-browser` skill), viewport
   **390×780**. Then repeat the key checks at **1280×800** unless
   `--mobile-only`.

4. **Measure, in reading order** (take a screenshot at each ✱):
   - ✱ **Cover promise**: do the time/modules/challenges badges, module index
     and Start button render? Does the description clamp?
   - **Pixels to first interaction**: scroll distance from the top of module 1
     to the first interactive widget (quiz, decision-tree, checklist,
     tangle-text, surprise…). The hook rule wants it inside the first screen.
   - **Passive streaks**: longest run of screens without anything to touch,
     in screens AND pixels (a 4-screen streak of tall diagrams reads worse
     than the count suggests).
   - **Prose density**: rough share of viewport-heights that are plain text.
   - **Module send-offs**: does each module close with its outro + stamp?
   - **Play one challenge** (answer a quiz — one right, one wrong) and open a
     surprise if present.
   - ✱ **Finale payoff**: confetti, scoreboard, stamp collection, copy-result
     button. Press the copy button and verify the clipboard text.
   - **Resume**: reload mid-guide → the resume bar must name the module and
     the minutes left; accept it and confirm the scroll lands right.
   - **Mobile nav**: the floating pill opens the bottom sheet index with
     module states and "min left".
   - **Estimated total time** vs. what the cover badge promises.

5. **Report** (the deliverable — never edit the story):
   - A short verdict line: does the guide hook, sustain, and pay off?
   - A metrics table: px to first interaction · worst passive streak ·
     prose share · estimated minutes · cover/finale/resume/nav checks ✓/✗.
   - Findings ranked by reader impact, each tied to the rule it violates
     (hook, cadence, fun pass, cold-reader smell) and to the module/screen.
   - Screenshot paths (save them under the session scratchpad).

## Notes

- Deterministic beats exhaustive: same route every run (cover → scroll →
  quiz → finale → reload), so two playtests of the same story are comparable.
- The static lint already covers repetition/quotas — don't re-derive them by
  hand; the browser pass is for what only rendering reveals (real heights,
  real thumb reach, real payoff moments).
- If the studio fails to boot or the slug 404s, stop and report that — a
  playtest against a broken build is noise.
