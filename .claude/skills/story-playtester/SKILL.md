---
name: story-playtester
description: "Playtest and review a Story Studio guide (or any widgetron storyline) like a real reader: static lint pass, then drive it in a real browser via the chrome-devtools MCP (mobile viewport first), measure the engagement mechanics (cover promise, pixels to first interaction, passive streaks, module send-offs, finale payoff, semantic resume, challenge meter) and return a ranked findings report with screenshots. Use whenever: (1) /story-playtester <slug> is invoked, (2) a .story.json was just generated or edited (it is the pre-handoff step of podcast-to-story), (3) the user says 'prueba la guía', 'revisa la storyline', 'analiza los resultados con chrome devtools', 'does the guide hook?', or wants ANY quality review of generated story content — even if they don't say 'playtest'."
argument-hint: "[slug] [--desktop-only|--mobile-only] [--keep-progress]"
user_invocable: true
---

# Story Playtester

Plays a `.story.json` the way a cold reader on a phone would, and reports
where the guide loses them. It NEVER edits the story — the output is a
findings report; fixes belong to the author (via the `podcast-to-story`
rules: hook, payoff cadence, fun pass, cold-reader smells, format molds).

Why a browser pass when the lint already exists: the lint sees the JSON;
only rendering reveals real heights (a 4-screen streak of tall diagrams
reads worse than the count suggests), real thumb reach, whether the payoff
moments actually fire, and console errors.

## Inputs

- **Slug** (required): a document in `apps/story-studio/content/<slug>.story.json`.
  Without an argument, list the available slugs and ask.
- Everything else is derived. No other user questions.

## Process

### 1. Static pass first (cheap, no browser)

```bash
pnpm --filter @webreactiva/story-studio story validate <slug>
pnpm --filter @webreactiva/story-studio story lint <slug> --score
```

Keep the findings and the score partitura. If `meta.format` is set, the lint
already validated the format mold (briefing length/quiz, entrevista
profile-card/quotes) — the browser pass confirms or dismisses with pixels.
If validation FAILS, stop and report: a playtest against a broken build is
noise.

### 2. Launch and connect

- Studio: `pnpm dev:studio` in the background (Vite; note the port — it
  takes 5173 unless something else holds it). Player URL: `/s/<slug>`.
- Browser: the `chrome-devtools` MCP tools. If `new_page` fails with
  "browser is already running", an orphaned automation Chrome holds the
  profile — it is safe to `pkill -f "chrome-devtools-mcp/chrome-profile"`
  (that profile is the MCP's own, never the user's personal browser).
- Viewport **390×780 first** (`resize_page`) — the primary audience reads on
  a phone. Repeat the key checks at 1280×800 unless `--mobile-only`.
- **Protect the user's real progress**: this storyline persists under
  `wgt-storyline:<slug>` in localStorage. Read it BEFORE playing; if it has
  meaningful progress that isn't yours, note it and either restore it after
  or play in an isolated browser context. When testing resume, use the
  bar's "Continuar" — never "Empezar desde arriba" (it deletes the save).

### 3. Play, in reading order

Same deterministic route every run, so two playtests are comparable:
cover → scroll through modules → play one challenge → finale → reload for
resume → mobile nav. Screenshot (jpeg, quality ~70) at every ✱.

Run the measurement snippet early —
[scripts/measure.js](scripts/measure.js) via `evaluate_script` — it returns
pixels-to-first-interaction, the widget census, passive streaks in px,
outro/stamp counts and total scroll height in one call. The checklist of
what to judge at each stop, with thresholds and the reasoning behind them:
[references/review-checklist.md](references/review-checklist.md). Read it —
it is the review's actual content; this file is only the harness.

Gotchas learned the hard way:
- In the **playground** (not the studio) demos render inside iframes —
  query `iframe.contentDocument`, not `document`.
- Clipboard: `readText()` needs document focus and usually fails from the
  MCP — verify the copy by the button flipping to its "copied" label
  (the label only flips inside the promise's `.then`).
- The debounced position save takes ~250ms — wait ≥300ms after a scroll
  before reading localStorage.
- Answer a quiz WRONG first, then right: both feedback paths matter, and
  only the correct one should feed the challenge meter.
- **Scroll-driven widgets** (`kinetic-headline`, `decode-headline`,
  `draw-diagram`, `unmask-strip`, `sticky-pan`, `story-map`) only play their
  effect while the reader actually scrolls through them — drive them by
  scrolling, never judge them from a snap-jump, and expect them static under
  reduced motion (that's correct, not a bug).
- **`scroll-stat`** counts up (JS) when it enters view and rests at the REAL
  number. If it ever shows **0** at rest, that's a real bug to report — the
  number must always be readable.
- **`map` / `story-map`**: if tiles render as a broken **L-shaped blob**, the
  host is missing `import "leaflet/dist/leaflet.css"` — report it as a setup
  bug, not a content problem. A `map` should be static (no scroll hijack);
  `story-map` should `flyTo` between stops as you scroll the pane.

### 4. Report (the deliverable — never edit the story)

Structure, always in this order:

1. **Verdict line**: does the guide hook, sustain, and pay off? One sentence.
2. **Metrics table**: px to first interaction · worst passive streak
   (screens AND px) · prose share · total px vs the cover's promised
   minutes · cover/finale/resume/nav/console checks ✓/✗.
3. **Findings ranked by reader impact**, each tied to the rule it violates
   (hook, cadence, fun pass, a cold-reader smell, format mold) and to the
   module/screen — so the author can fix by rule, not by taste.
4. Screenshot paths (save under the session scratchpad).
5. **Cleanup note**: confirm you removed the test progress
   (`localStorage.removeItem('wgt-storyline:<slug>')`) unless
   `--keep-progress` or the save belonged to the user.

## Boundaries

- Read-only on content: findings go to the report, fixes go through the
  author/podcast-to-story.
- The static lint already covers repetition/quotas — don't re-derive them
  by hand; disagree with the lint only when pixels prove it wrong.
- Kill the dev server you started when done.
