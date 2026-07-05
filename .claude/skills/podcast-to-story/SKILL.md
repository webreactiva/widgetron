---
name: podcast-to-story
description: "Convert a podcast episode (ordered .srt transcripts + metadata + highlighted moments) into a Story Studio document — a .story.json in apps/story-studio/content/ that renders as an interactive guide. Fuses the transcripts-to-guide rules (ASR cleanup, Daniel's voice, never invent) with an aggressively-visual module structure, using the widgetron manifest as the output contract. Use when: (1) user invokes /podcast-to-story, (2) user says 'convierte este episodio/transcripción en una guía interactiva / storyline', (3) user wants a .story.json generated from SRT transcripts."
argument-hint: "[--srt=<file-or-folder>] [--podcast=<id|file>] [--slug=<slug>] [--title=<title>] [--lang=es] [--theme=webreactiva] [--episode=<n>] [--length=corta|media|larga] [--emphasis=equilibrado|practica|conceptos|motivacion] [--styles=<id,id,…>] [--cta=link:<url>|email-form|none] [--complement=ask|never|auto]"
user_invocable: true
---

# Podcast → Story (.story.json)

Turns an episode's transcripts into a **Story Studio document**: the envelope
(`meta`, `audio`, `settings`, `story`) whose `story` is a native widgetron
`storyline` node tree. The output is a draft the user reviews in the studio
editor (`pnpm dev:studio` → `/s/<slug>/editar`) — never publish without review.

## The contract: the widget manifest

Before writing ANY node, dump the generation contract and keep it open:

```bash
pnpm --filter @webreactiva/story-studio story manifest /tmp/widget-manifest.json
```

Every widget type there carries `whenToUse` (when to pick it vs siblings), its
props as JSON Schema, and a valid `example` to imitate. Only emit types present
in the manifest. The envelope schema lives in
`apps/story-studio/src/engine/schema.ts` (zod, documented).

## Inputs

- **Transcripts** (required): one `.srt` for the whole episode, or a folder of
  ordered `.srt` files (order = numeric prefix in the filename, ascending,
  possibly non-contiguous — sort numerically; each file ≈ one module).
- **Episode metadata**: show, number, title. Goes in `meta.source` ONLY —
  never into titles, eyebrows or screen copy (the guide must stand alone).
- **Podcast profile** (optional, `--podcast=<id|file>`): the show's voice as
  parameters — hosts, tone, topics, community, signature phrases — in
  `apps/story-studio/content/podcasts/<id>.podcast.md`. Format and usage
  rules: [references/podcast-profile.md](references/podcast-profile.md). With
  a profile loaded the guide may reference the show, hosts and community (in
  their voice); every such reference must be CONTRASTED with the transcript
  (only attribute words to people who speak in this episode; transcript wins
  on conflict, mismatches go to the handoff). Without one, no references.
- **Highlighted moments** ("huellas", optional): timestamps or quotes the user
  wants surfaced — candidates for quotes, quizzes and (future) audio clips.
- **Author settings**: theme, surprises (mid/end) and CTA. These go in
  `settings`, NEVER inline in the story — the engine injects them at build
  time (D-004 in docs/story-studio-decisions.md).

## Ask first (AskUserQuestion, always with a recommended default)

Before outlining, ask — in ONE AskUserQuestion call — whatever of these the
user hasn't already specified. Never block on anything else; defaults are
marked with (Recommended):

1. **Length** — Media: 4–5 modules, ~20 screens (Recommended) · Corta: 3
   modules, ~12 screens · Larga: 6–7 modules, 25+ screens.
2. **Emphasis** — Equilibrado (Recommended) · Práctica/acción (more
   step-cards, checklist, prompts) · Conceptos (more diagrams, glossary,
   quizzes) · Motivación (more quotes, callouts, narrative).
3. **Final CTA** — Link a webreactiva.com (Recommended) · email-form (needs
   `privacyUrl` + `submitEndpoint`) · Otro destino (ask URL) · Sin CTA.
4. **Writing styles** (multiSelect — they mix): Didáctico + voz original
   (Recommended default) · Divertido · Open-loop (se abre una intriga al
   principio y se cierra al final) · Viaje del héroe · Caso práctico ·
   Socrático · Explorable (aprender manipulando) · Expandable (profundidad
   opcional just-in-time) · Sobrio. Definitions, what each one changes and the
   mixing recipe (1 estructura + 1–2 tonos + 1 modo de interacción):
   [references/writing-styles.md](references/writing-styles.md). Read it
   BEFORE outlining when any style beyond the default is chosen, and name the
   applied mix (with one concrete example per style) in the handoff.

The `--length`, `--emphasis`, `--styles`, `--cta` and `--complement` flags
pre-answer these; only ask what the flags leave open.

## Gaps and complementary content (`--complement`, default `ask`)

While outlining, flag **gaps**: a concept the episode assumes but never
explains, a prerequisite the target reader may lack, an example that gets cut
short. Then, per the flag:

- `ask` (default): list the detected gaps in the calibration question round —
  "¿Añado contenido complementario que no está en el episodio para cubrirlos?"
  with options per gap or all/none.
- `never`: transcript-only; gaps are just reported in the handoff.
- `auto`: fill them without asking.

Complementary screens are allowed ONLY through this gate, must be didactic
glue (a definition, a missing prerequisite, a completed example — no new
claims about the episode's subject matter beyond safe general knowledge), and
the handoff summary must list every complementary screen added, so the author
can review them first.

## Non-negotiable content rules (inherited from transcripts-to-guide)

1. **Never invent.** No features, commands, numbers or claims that are not in
   the transcript. Editorial glue (module subtitles, quiz feedback) must
   summarize what the episode actually says.
2. **Clean the ASR, keep the voice.** Strip indices/timestamps, join fragments
   into sentences, fix speech-to-text artifacts and known podcast gazapos
   (e.g. "Sagger" → "Swagger"). The result must still sound like Daniel:
   second person, warm, direct, hands-on, zero corporate filler.
3. **Content language = episode language** (usually Spanish) and set
   `meta.lang` accordingly — widget chrome translates itself via the locale
   packs. (The English-only rule applies to library code, not to content.)
4. **Verbatim quotes stay verbatim**, attributed via the `quote` widget.
5. **Never invent media.** `audio-clip`/`video-clip` and the envelope's
   `audio` block enter the document only with REAL URLs the user provided (or
   clips produced first with `make-audio-clip`). No placeholders — the output
   is definitive, not a demo. A moment that deserves audio but has no clip yet
   is reported as a pending clip (with its timestamp range) in the handoff.
6. **No source metadata in content.** Episode number and date live in
   `meta.source`; they never appear in titles, eyebrows or screens. Naming the
   show, hosts or community is allowed ONLY when a podcast profile is loaded
   (`--podcast`) and the transcript backs the reference.
7. **It must stand alone for a non-listener.** The reader never heard the
   audio; anything that only lands with the spoken delivery is a bug, and the
   fix is to ADD context, not delete the content (faithful-but-uncontextualized
   still fails). The recurring smells, all caught by the read-back (step 6):
   - **Ownerless quote.** A first-person `quote` with no `attribution` reads as
     "who is saying this — me, the author, an expert?" and the reader can't
     calibrate it. A name with no `role` fails the same way ("who is Daniel
     Primo, why trust him?"). Every quote needs an owner; with no `--podcast`
     profile to license a name, use a neutral source label (`attribution: "La
     voz del episodio"` + a `role` that gives the stance) so it is clearly a
     real line from the source; with a profile, give a real credential `role`
     (a person's stance, not the show name).
   - **Unanchored metaphor / nickname.** A vivid name lifted from the audio
     ("el ojo de Sauron" for a level) must be EXPLAINED the first time it
     appears, or it is just a wink only listeners get.
   - **Sourceless numbers.** A chart or stat needs a word of provenance, and if
     the figures are partial or don't add up, say why on the screen.
   - **Unglossed external reference.** A tool, product or "el matiz de X"
     dropped by name gets a one-line gloss the first time (or a `[[glossary]]`
     term).
   - **Audio-only joke / aside.** Give it context, mark it clearly as a joke,
     or cut it (clarity beats `voz-original`).
   - **Widget with no set-up.** An interactive check (quiz, `decision-tree`)
     needs the idea it tests stated on a PRIOR screen, without spoiling the
     answer.
   - **Provenance leak.** No "en el vídeo / en el episodio / en su caso" in the
     body — rewrite to 2nd person or "en el ejemplo".

   Three whole-guide cousins: a running example must be NAMED before its first
   use (or the reader spends modules reconstructing it); a narrative frame
   (`viaje-del-heroe`…) must be DECLARED so its vocabulary doesn't jar; and a
   provocative title must be PAID OFF in the body (or softened). Worked
   before→after examples for every smell above:
   [references/cold-reader-review.md](references/cold-reader-review.md).

## Structure rules (the dispensa shape, aggressively visual)

**The storyline's job is didactic.** It is not a summary of the episode — it
teaches what the episode teaches. Every screen must either explain, make the
reader practice, or make an idea stick; anything that only "covers" content
gets cut or converted into an exercise.

- One `storyline` root; **3–7 modules**, each with `title` + `subtitle` and
  2–5 `screens`. Derive modules from the transcript's natural arc (or one per
  `.srt` file when the folder is pre-split).
- **The cover is automatic.** The engine injects `meta.title`/`meta.description`
  into the storyline, which renders them as an opening cover section. So:
  write a strong standalone `meta.title` + `meta.description` (no
  show/episode/date), and NEVER open a module with a `section-header` that
  repeats the module's own title — module headers render themselves.
  `section-header` is only for introducing a sub-section mid-module.
- **Prefer interaction over prose — and spread the catalog.** Read
  [references/widget-guide.md](references/widget-guide.md) (signal → widget
  map + variety rules) alongside the manifest. Hard minimums: screens from at
  least 4 widget groups; **at least one diagram widget** (`mermaid-diagram`,
  `flow-diagram`, `infographic` or `data-chart`) when the episode describes
  any structure, process or comparison; `prose`/`glossary-text` under a third
  of screens; **never two consecutive screens of the same widget type**
  (module boundaries included) — if two adjacent moments want the same widget,
  merge them or convert one.
- **At least one `quiz` in the second half** — readers should act before the CTA.
- **Always set `storageKey`** on the storyline (= the slug) so the guide
  remembers the reading position and offers to resume.
- **Audio moments**: only with real clips. Produce them FIRST with the
  `make-audio-clip` skill (repo web-reactiva-2244): it cuts 2–3 min with
  ffmpeg, transcribes, fixes typos, uploads to the Spreaker "Audioclips" show
  and catalogs `{clip_id}.{md,srt}` in Drive. Then reference its Spreaker
  `download_url` as `src` and register it in `audio.clips[]`. For inline cues,
  cut + rebase the episode SRT with the engine helpers (`parseSrt`/`cutRange`
  in `apps/story-studio/src/engine/srt.ts`). Without a real URL: no audio
  widget, no `audio` block — report the candidate range instead.
- **Surprises and CTA live in `settings`** — pick the reveal content from the
  moments (a `prompt-template`, a `quote`, a `video-clip`); the CTA needs its
  mandatory links (`url` for `link`, `privacyUrl` + `submitEndpoint` for
  `email-form`) or validation will refuse the document.

## Process

1. **Discover & order** transcripts; report the ordered list.
2. **Ask the calibration questions** (section above) in one AskUserQuestion
   call, skipping any the user already answered.
3. **Read the manifest** (command above), the envelope schema,
   `references/widget-guide.md` (includes the icon rules), and when relevant
   `references/mermaid-styles.md` (pick the right diagram style, not always a
   flowchart) and `references/writing-styles.md` (if any style beyond the
   default mix was chosen).
4. **Outline**: modules with titles/subtitles + the widget chosen for each
   screen and WHY (one line each). Show the outline to the user before writing
   JSON if the scope is large or ambiguous.
5. **Draft** `apps/story-studio/content/<slug>.story.json`. For long episodes,
   draft modules in parallel with subagents — each gets its transcript chunk,
   the manifest path, the rules above, and returns only its module object.
6. **Read-back as a cold reader** (do NOT skip). Reread the whole draft as
   someone who never heard the audio: every screen must explain, make the reader
   practice, or make an idea stick ON ITS OWN. Hunt the seven smells in content
   rule 7 (ownerless quotes, unanchored metaphors, sourceless numbers, unglossed
   names, audio-only jokes, un-set-up widgets, provenance leaks) and fix them by
   ADDING context, trading `voz-original` fidelity for clarity. For the rigorous
   version — you wrote it, so you have the curse of knowledge and auto-fill the
   gaps a real reader can't — extract ONLY the reader-facing text (strip
   `meta.source`, ids and the transcript; e.g. dump every visible string per
   screen in order) and hand THAT to a fresh subagent role-playing the target
   reader, forbidden from reading any file, told to flag every point it gets
   lost, every quote whose speaker it can't name, every widget that lands
   without set-up. Its confusion list is your fix list. This pass catches what
   fidelity + variety + validation miss. Worked before→after examples for each
   smell: [references/cold-reader-review.md](references/cold-reader-review.md).
7. **Validate and self-correct** until clean:
   ```bash
   pnpm --filter @webreactiva/story-studio story validate <slug>
   ```
   Errors come with node paths (`storyline.modules[2].screens[1].quiz → …`);
   fix exactly what they point at.
8. **Preview**: `pnpm dev:studio` → `http://localhost:5173/s/<slug>` (player)
   and `/s/<slug>/editar` (editor). Hand off to the user for review.
9. **Export** only when the user asks: `pnpm story render <slug>` →
   `apps/story-studio/dist/<slug>/` (self-contained, uploadable anywhere).
