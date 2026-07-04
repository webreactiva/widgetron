# Podcast profile (`<id>.podcast.md`)

The per-podcast "system prompt": one markdown file that captures the show's
voice as parameters, the same way a theme's `design.md` captures its look — and
(via `sources:`) the show's canonical external wells. Lives in
`apps/story-studio/content/podcasts/<id>.podcast.md`; loaded with
`--podcast=<id|path>`. The live example is `podcasts/wrp.podcast.md`.

Two skills read this file: **podcast-to-story** uses the voice + reference
rules below; **story-librarian** additionally uses the `sources:` block as one
of its trusted wells for enrichment.

## Format

Frontmatter (YAML subset, two levels max — same discipline as `design.md`)
with the parameters, then a free markdown body with the extended voice guide.
The frontmatter is the contract; the body is nuance.

```markdown
---
name: <id>                  # kebab-case, matches the filename
show: "Nombre del podcast"
family: "Marca paraguas"     # optional
lang: es
web: "https://…"
hosts:
  <key>: "Nombre — rol, cómo se presenta en antena"
audience: "Quién escucha y cómo se llama la comunidad"
tone: "3–6 adjetivos operativos"
topics: "Temas recurrentes"
community:
  <key>: "Canales y rituales (retos, secciones, grupo…)"
signature:
  intro: "Frase de apertura habitual"
  outro: "Frase de cierre habitual"
sources:                       # optional — canonical wells for story-librarian
  web: "https://…"
  blog: "https://…/blog"
  newsletter: "https://…"
  catalog: "huellas"           # this show's family is in the WR huellas index
---

# Guía extendida de voz
Cómo suena / qué evitar, con ejemplos.

## Fuentes
Los enlaces perennes de la casa (blog, newsletter, comunidad) que SIEMPRE se
pueden citar, y qué NO enlazar. Es la parte "nuance" del contrato `sources:`.
```

## How the skill uses it

- **Voice calibration**: tone, person, humor level and vocabulary of ALL
  editorial glue (subtitles, quiz feedback, checklist hints, CTA copy) follow
  the profile.
- **References become allowed**: with a profile loaded, the guide MAY name the
  show, the host(s) and the community — quote attributions, the CTA, a
  surprise teaser in the house style. Without a profile, stick to the strict
  no-references rule.
- **The transcript always wins.** Every profile-derived reference must be
  contrasted with the episode's transcript before use:
  - Attribute lines only to people who actually speak in THIS episode. A host
    listed in the profile but absent from the transcript gets no quotes.
  - Mention rituals/sections (retos, saludos, grupo) only if this episode
    supports them or they are timeless community facts from the profile.
  - On any conflict (name, claim, tone) the transcript is the source of truth;
    list the mismatch in the handoff so the author can fix the profile.
- Episode number and date STILL live only in `meta.source` — the profile
  legitimizes identity references, not per-episode metadata in content.

## Sources for enrichment (`sources:`, optional)

Consumed by **story-librarian**, not by podcast-to-story. It declares the
show's canonical, evergreen wells so per-podcast enrichment is reproducible and
on-brand. All keys are optional; two levels max, same discipline as the rest.

- `web` / `blog` / `newsletter` — real, evergreen URLs the guide may always
  link to (they don't depend on any single episode).
- `catalog: "huellas"` — signals the show's family is searchable in the Web
  Reactiva **huellas** index. When present, story-librarian may pull *related*
  moments (real `parentUrl` + timestamp) from that catalog as `resource-list`
  items, defaulting to `--source=internal`.
- The `## Fuentes` body section is the nuance: annotate which links are always
  safe to cite and which to avoid.

Rules that still hold: only **real** URLs go here (never invent one), and a
canonical well legitimizes an evergreen link — it does NOT authorize inventing
an episode-specific claim. story-librarian treats these as candidates and, like
every other well, only emits URLs it can stand behind.
