---
name: podcast-to-story
description: "Convert a podcast episode (ordered .srt transcripts + metadata + highlighted moments) into a Story Studio document — a .story.json in apps/story-studio/content/ that renders as an interactive guide. Fuses the transcripts-to-guide rules (ASR cleanup, Daniel's voice, never invent) with an aggressively-visual module structure, using the widgetron manifest as the output contract. Use when: (1) user invokes /podcast-to-story, (2) user says 'convierte este episodio/transcripción en una guía interactiva / storyline', (3) user wants a .story.json generated from SRT transcripts."
argument-hint: "[--srt=<file-or-folder>] [--slug=<slug>] [--title=<title>] [--lang=es] [--theme=webreactiva] [--episode=<n>]"
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
- **Episode metadata**: show, number, title, full-audio URL (Spreaker).
- **Highlighted moments** ("huellas", optional): timestamps or quotes the user
  wants surfaced — candidates for audio clips, quotes and quizzes.
- **Author settings** (ask if missing): theme, surprises (mid/end) and CTA
  (kind + copy + urls). These go in `settings`, NEVER inline in the story —
  the engine injects them at build time (D-004 in docs/story-studio-decisions.md).

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

## Structure rules (the dispensa shape, aggressively visual)

- One `storyline` root; **3–7 modules**, each with `title` + `subtitle` and
  2–5 `screens`. Derive modules from the transcript's natural arc (or one per
  `.srt` file when the folder is pre-split).
- **Prefer interaction over prose.** For each teaching moment pick the widget
  whose `whenToUse` matches the intent: process → `flow-diagram`/`step-cards`;
  misconception → `quiz` or `predict-output`; comparison → `compare-slider`;
  vocabulary → `glossary` (top-level `glossary` prop + `[[term]]` in
  `glossary-text`); memorable sentence → `quote`; copy-ready prompt →
  `prompt-template`. Use `prose`/`glossary-text` as connective tissue, not as
  the default.
- **At least one `quiz` in the second half** — readers should act before the CTA.
- **Audio moments**: when a highlighted moment deserves sound, add an
  `audio-clip` screen. Produce the actual clip with the `make-audio-clip`
  skill (repo web-reactiva-2244): it cuts 2–3 min with ffmpeg, transcribes,
  fixes typos, uploads to the Spreaker "Audioclips" show and catalogs
  `{clip_id}.{md,srt}` in Drive. Reference its Spreaker `download_url` as
  `src` and register the clip in the envelope's `audio.clips[]`. For inline
  cues, cut + rebase the episode SRT with the engine helpers
  (`parseSrt`/`cutRange` in `apps/story-studio/src/engine/srt.ts`).
- **Surprises and CTA live in `settings`** — pick the reveal content from the
  moments (a `prompt-template`, a `quote`, a `video-clip`); the CTA needs its
  mandatory links (`url` for `link`, `privacyUrl` + `submitEndpoint` for
  `email-form`) or validation will refuse the document.

## Process

1. **Discover & order** transcripts; report the ordered list.
2. **Read the manifest** (command above) and the envelope schema.
3. **Outline**: modules with titles/subtitles + the widget chosen for each
   screen and WHY (one line each). Show the outline to the user before writing
   JSON if the scope is large or ambiguous.
4. **Draft** `apps/story-studio/content/<slug>.story.json`. For long episodes,
   draft modules in parallel with subagents — each gets its transcript chunk,
   the manifest path, the rules above, and returns only its module object.
5. **Validate and self-correct** until clean:
   ```bash
   pnpm --filter @webreactiva/story-studio story validate <slug>
   ```
   Errors come with node paths (`storyline.modules[2].screens[1].quiz → …`);
   fix exactly what they point at.
6. **Preview**: `pnpm dev:studio` → `http://localhost:5173/s/<slug>` (player)
   and `/s/<slug>/editar` (editor). Hand off to the user for review.
7. **Export** only when the user asks: `pnpm story render <slug>` →
   `apps/story-studio/dist/<slug>/` (self-contained, uploadable anywhere).
