---
name: podcast-to-story
description: "Convert a podcast episode (ordered .srt transcripts + metadata + highlighted moments) into a Story Studio document — a .story.json in apps/story-studio/content/ that renders as an interactive guide. Fuses the transcripts-to-guide rules (ASR cleanup, Daniel's voice, never invent) with an aggressively-visual module structure, using the widgetron manifest as the output contract. Use when: (1) user invokes /podcast-to-story, (2) user says 'convierte este episodio/transcripción en una guía interactiva / storyline', (3) user wants a .story.json generated from SRT transcripts."
argument-hint: "[--srt=<file-or-folder>] [--podcast=<id|file>] [--slug=<slug>] [--title=<title>] [--lang=es] [--theme=webreactiva] [--episode=<n>] [--format=entrevista|briefing|game] [--length=corta|media|larga] [--emphasis=equilibrado|practica|conceptos|motivacion] [--styles=<id,id,…>] [--cta=link:<url>|email-form|none] [--complement=ask|never|auto]"
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

## Format presets (`--format`, optional)

Without a format, the output is the default **didactic dispensa** (the
structure rules below). With `--format=<id>` the episode gets a
genre-native shape instead — read the preset BEFORE outlining, set
`meta.format: "<id>"` in the envelope (so `story lint` validates the mold),
and let the preset override the length question (the mold decides):

- `entrevista` — the guest's card, for interview episodes:
  [references/format-entrevista.md](references/format-entrevista.md).
- `briefing` — the playable weekly briefing, for news episodes:
  [references/format-briefing.md](references/format-briefing.md).
- `game` — the playable challenge run with lives/HP, for a competitive
  extra pass over any episode: [references/format-game.md](references/format-game.md).

Everything else in this skill (never invent, cold reader, cadence, fun pass,
engagement layer, validation loop) applies unchanged inside a preset.

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

## Author-supplied images (the local-assets pattern)

When the user hands over a notes folder (Google Docs exported to HTML +
`images/`), the HTML almost always points at **relative paths** to local files
(`images/image1.png`) that have no public URL. Default to the
**self-contained local-assets pattern**, not to base64-in-the-JSON (it bloats
the document) and not to uploading anywhere (the author may not want a third
party to host their material):

1. **Inspect every image first** with the `read` tool. Each one needs a real
   caption + credit before it enters the JSON — never invent them.
2. **Copy** the relevant images into a sibling folder next to the story JSON:
   ```
   apps/story-studio/content/<slug>.story.json
   apps/story-studio/content/<slug>.assets/<semantic-name>.<ext>
   ```
   Rename to **semantic names** (`onion-4-layers.png`, not `image9.png`).
   Crop out images that don't earn a slot (no signal → no entry); the folder
   rides alongside the slug in git, so a junk image is permanent dead weight.
3. **Reference them with absolute paths** in the `figure` widget:
   `src: "/<slug>.assets/<name>.<ext>"`. The dev server (via
   `publicDir: "content"` in `apps/story-studio/vite.config.ts`) serves them
   at the root, and `pnpm story render` copies the whole folder into
   `dist/<slug>/<slug>.assets/` so the export is self-contained. **No base64,
   no external hosting, no `public/` bleed.**
4. **Credit per image**: the author's own diagrams → "Diagrama de las notas
   del episodio" (or your own caption); borrowed figures (e.g. Uncle Bob's
   Clean Architecture onion) → the canonical source. If you can't credit
   confidently, drop the image.
5. **Caption rule (cold reader)**: an image whose caption just repeats the
   screen text above it is dead weight — either it adds new info or it goes.
6. **Pacing impact**: `figure` counts as a static screen. If you insert many
   in a row, the lint will block (no two same-type consecutive, module
   boundaries included) and the cadence warning will fire. Plan the slot as
   one figure per module max, ideally paired with an interactive widget
   (quiz, decision-tree, fill-in) on the other side so the streak breaks.

Skip this whole section if no images were provided — the rest of the
pipeline already handles media-less stories.

## Non-negotiable content rules (inherited from transcripts-to-guide)

1. **Never invent.** No features, commands, numbers or claims that are not in
   the transcript. Editorial glue (module subtitles, quiz feedback) must
   summarize what the episode actually says.
2. **Clean the ASR, keep the voice.** Strip indices/timestamps, join fragments
   into sentences, fix speech-to-text artifacts and known podcast gazapos
   (e.g. "Sagger" → "Swagger"). The result must still sound like Daniel:
   second person, warm, direct, hands-on, zero corporate filler. **No empty
   superlatives** (revolucionario, brutal, increíble) and no grand/transcendent
   tone — the brand is *sin humo*, so is the copy. And **prefer a concrete image
   to an abstraction**: «lo gratis te corta justo cuando volabas» lands, «optimiza
   tu flujo de trabajo» evaporates.
3. **Content language = episode language** (usually Spanish) and set
   `meta.lang` accordingly — widget chrome translates itself via the locale
   packs. (The English-only rule applies to library code, not to content.)
4. **Verbatim quotes stay verbatim**, attributed via the `quote` widget.
   Provenance always: when the SRT gives you the moment, fill `timestamp`
   («23:14») — and `clip` when a real audio clip exists (rule 5). A quote
   whose minute is known but omitted throws away free credibility.
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
   - **Attribution: once, and only when known.** `attribution` is OPTIONAL.
     Use it when the words belong to an identifiable person — with a
     credential `role` the FIRST time that person is quoted in the guide
     («Alberto Chesa · business analyst»); later quotes from the same voice
     carry just the name, or nothing when context makes the speaker obvious.
     Repeating name + credentials on every quote reads robotic. Never invent
     a speaker and never use awkward neutral labels («La voz de la guía») —
     an unattributed quote reads as editorial emphasis, which is honest.
     What stays a smell: a name whose FIRST appearance gives the reader no
     way to calibrate it ("who is this, why trust them?").
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

   Four whole-guide cousins: a running example must be NAMED before its first
   use (or the reader spends modules reconstructing it); a narrative frame
   (`viaje-del-heroe`…) must be DECLARED so its vocabulary doesn't jar; a
   provocative title must be PAID OFF in the body (or softened); and an idea
   carried only by the host's specific case (their product, their migration,
   their numbers) must be LIFTED to a transferable principle in the second
   person — the anecdote is the source, the takeaway is the lesson. Worked
   before→after examples for every smell above:
   [references/cold-reader-review.md](references/cold-reader-review.md).

## Structure rules (the dispensa shape, aggressively visual)

**The storyline's job is didactic.** It is not a summary of the episode — it
teaches what the episode teaches. Every screen must either explain, make the
reader practice, or make an idea stick; anything that only "covers" content
gets cut or converted into an exercise.

**And it teaches the reader, not the host.** Episodes carry their ideas inside
the speaker's own case — their product, their migration, their client, their
numbers, their Tuesday. That detail is faithful, but faithful-and-useless: the
reader came to learn something they can apply on Monday, not to tour someone
else's projects. So lift the idea *out* of the anecdote — keep the transferable
principle, drop the identifying specifics — and write it in the second person.
«Migré mi producto premium de 2019 y le añadí seguimiento» becomes «lo que más
cuesta de un proyecto grande no es el código, es decidir qué merece la pena».
The host's story is the *source*; the reader's takeaway is the *product*. (This
is not the never-invent rule bending — you still invent nothing; you generalize
a real claim instead of transcribing its wrapper.)

- One `storyline` root; **3–7 modules**, each with `title` + `subtitle` and
  2–5 `screens`. **Recording order is not narration order.** A podcast comes
  out in the sequence things occurred to the speaker — the best idea often
  buried in the middle or dropped as an aside; a guide is authored for a
  reader's attention. Group the transcript by *idea*, then sequence those ideas
  for the strongest teaching arc — by interest and difficulty, not by the
  clock. The `.srt` files (one per module when pre-split) help you *locate*
  content; they don't dictate the order you teach it in. Split, merge and
  reorder across file boundaries whenever a better arc asks for it.
- **The cover is automatic.** The engine injects `meta.title`/`meta.description`
  into the storyline, which renders them as an opening cover section. So:
  write a strong standalone `meta.title` + `meta.description` (no
  show/episode/date), and NEVER open a module with a `section-header` that
  repeats the module's own title — module headers render themselves.
  `section-header` is only for introducing a sub-section mid-module.
- **Open with a hook.** The first screen of module 1 must be interactive or
  built on intrigue — a quiz, decision-tree, tangle-text, or a curiosity-gap
  `quote`/`callout-box` that opens a question the guide will answer. The reader
  gets something to touch (or a question to hold) within the first 60 seconds;
  never open the guide with plain `prose`.
- **Save the best for last; open a loop early.** Resist spending your most
  interesting, most counterintuitive idea in module 1 — front-loading the
  punchline flattens the whole arc and leaves nothing to pull the reader
  through the middle. Instead, name it on the hook as an open question or a
  promise («hay un multiplicador que casi nadie usa — te lo guardo para el
  final»), build the setup through the middle modules, and reveal it in the
  last teaching module so the finale *closes the loop* it opened. That curiosity
  gap is much of what carries a reader who never heard the audio. It's the
  open-loop writing style — reach for it as a default, even when the user
  didn't name it, and *especially* in the `game` format (the boss then closes
  the loop).
- **One word to carry away (R-PALABRA).** Pick THE word the episode elevates —
  a concrete, *appropriable* noun the reader keeps («El Humo» ✓), never a generic
  descriptor («el multiplicador» ✗) — and set it in `meta.keyword`. Prefer a word
  the episode already says out loud; if you have to coin one, that's a signal the
  episode wasn't mono-idea (say so in the handoff, don't force it). The word
  appears at least **three times, always the exact same form**: presented on the
  first module, defined where it's developed (a `[[glossary]]` term is ideal), and
  remachada at the close — in the `game` format that close is the `keyword-gate`
  before the reward (see format-game). A reader who can retype it tomorrow got the
  episode.
- **Payoff cadence.** Avoid long stretches without a reader interaction —
  `story lint` warns past 4 passive screens (`cadence`). Treat the number as
  a smell, not a law: a dense topic can carry a longer passive stretch when
  every screen earns its place — judge the material's density and the
  transcript's own rhythm, not just the count. When a stretch genuinely
  sags, UPGRADE a passive screen (prose → quiz, flashcards, decision-tree,
  checklist…) instead of adding filler.
- **Stamp + send-off per module.** Give every module an `emoji` (a single
  emoji matching its theme — the stamp the reader earns and collects in the
  finale; make the set varied, never repeat one) and an `outro`: ONE line with
  voice that closes the module's idea and nudges into the next («Ya piensas en
  niveles. El siguiente módulo es donde se gana el sueldo») — it renders after
  a "Módulo N ✓" seal. The last module's outro points at the finale/CTA
  instead. Same never-invent rules as any other copy.
- **Challenge mode (optional).** When the episode has a central progress
  metaphor (a meter, a level, a delta), name it in
  `settings.challenge.label` (e.g. «Tu delta de garantías») — the engine
  injects a themed meter that fills as the reader beats interactions. Skip it
  when no metaphor is native to the content; never force one.
- **Reader profile (optional — only when the episode clearly serves two
  audiences).** If the transcript addresses both a newcomer and someone
  already doing the thing, open module 1 with a `profile-quiz` (ONE question,
  e.g. «¿Ya trabajas con agentes?»; the question `id` and option `value`s are
  the keys `profile-gate` matches) and branch 2–3 screens with
  `profile-gate`: the novice branch gets the prerequisite/extended-glossary
  screens, the veteran branch a shortcut or advanced aside — BOTH branches
  built from the same transcript (a gate redistributes content, it never
  invents). Set `profile: true` on the storyline (or a storage key to
  remember the answer). The guide must still read complete for a reader who
  skips the question — gate the optional depth, never the spine.
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
  Every wrong option's `feedback` must **teach** (why it's wrong, or what's true
  instead), never just mark it incorrect — a miss is a teaching moment.
- **Set `storageKey`** on the storyline (= the slug) so the guide remembers the
  reading position and offers to resume — **except in the `game` format.** A
  game's contract is «reload = fresh run» (arcade feel), and the resume bar
  shares the top edge with the lives HUD, so setting `storageKey` on a game
  hides the hearts on every reload and fights the format. Omit it there.
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

   Then run the **fun pass** — the engagement checklist, next to the smells:
   - Does the cover make a promise (what you'll know/be able to do, roughly
     what it costs), not just name a topic?
   - Does the first screen hook (something to touch or a question to hold)?
   - Does every module contain at least one challenge (quiz, decision-tree,
     checklist, tangle-text…)?
   - Does the ending pay off — a keepsake screen (checklist, prompt-template)
     before the CTA, not a trailing prose?
   - **Is the LAST screen the best screen (R-PEAK-END)?** Readers retain peaks
     and endings, not middles. If your strongest, most counterintuitive material
     is buried mid-guide, reorder it toward the close or raise the finale reward
     until the answer is yes.

   Fix by upgrading screens, never by adding length.
7. **Validate, lint and self-correct** until clean:
   ```bash
   pnpm --filter @webreactiva/story-studio story validate <slug>
   pnpm --filter @webreactiva/story-studio story lint <slug>
   ```
   Validation errors come with node paths
   (`storyline.modules[2].screens[1].quiz → …`); fix exactly what they point
   at. The lint enforces the pacing rules above (repetition, prose quota,
   cadence, quiz placement); fix errors, judge warnings.
8. **Preview**: `pnpm dev:studio` → `http://localhost:5173/s/<slug>` (player)
   and `/s/<slug>/editar` (editor).
   Then **playtest before handing off**: run the `story-playtester` skill on
   the slug — it plays the guide in a real browser (mobile viewport) and
   reports hook/cadence/payoff problems that only rendering reveals. Apply its
   fix list, then hand off to the user for review with the playtest verdict.
9. **Export** only when the user asks: `pnpm story render <slug>` →
   `apps/story-studio/dist/<slug>/` (self-contained, uploadable anywhere).
