# Cold-reader review — worked examples

The read-back pass (SKILL step 6) with real before→after fixes. You wrote the
guide, so you have the **curse of knowledge**: you auto-fill gaps a first-time
reader can't. This catalog is what to hunt and how to fix it — every example is
a real defect a blind reader caught in a generated guide.

## How to run it

1. **Self read-back**: reread the whole draft as someone who never heard the
   audio. For each screen ask: *would this make sense on its own?* Fix by ADDING
   context, never by deleting the content.
2. **Blind-agent audit (rigorous)**: extract ONLY the reader-facing text —
   strip `meta.source`, ids and the transcript — and hand it to a fresh subagent
   role-playing the target reader, forbidden from reading any file, told to flag
   every point it gets lost, every quote whose speaker it can't name, every
   widget that lands without set-up. Its confusion list is your fix list. A
   simple extractor: walk the `story`/`settings.surprises`/`settings.cta`
   subtrees and print every visible string per screen, in order, with the widget
   `type` — nothing from `meta.source`.

## The catalog (smell → real before → fix)

### 1. Ownerless / uncredentialed quote
A `quote` the reader can't attribute — no owner, or a name with no credential —
can't be calibrated ("is this me, the author, an expert?").
- **Before**: `{ "children": "…si depende solo de mí, estoy más en el nivel 5…" }` (no `attribution`).
- **Before (name, no role)**: `{ "attribution": "Daniel Primo" }` → "who is he, why trust him?"
- **Fix, no profile**: neutral label so it's clearly a real line from the source, not a floating thought: `{ "attribution": "La voz del episodio", "role": "sobre su propio criterio" }`.
- **Fix, profile loaded** (`--podcast`): a real credential — `{ "attribution": "Daniel Primo", "role": "creador de Web Reactiva" }` (a role is a *person's* stance, not the show name "Web Reactiva Premium").
- For a written post's own thesis lines, a neutral `"La voz de la guía"` (or an unattributed pull-quote) beats a bare name.

### 2. Unanchored metaphor / nickname
A vivid name lifted from the audio, used as if known.
- **Before**: level 5 = "el ojo de Sauron", used in the module title, the infographic and a quote — never explained.
- **Fix (anchor on first use)**: "Lo llamamos la cima bajo el ojo de Sauron: lo ves todo funcionar desde arriba, pero ya no bajas a mirar el código por dentro." Then don't mutate it into a new un-explained turn ("abrir el ojo").

### 3. Sourceless numbers
A chart or stat with no provenance reads as "flotando en el vacío" — worse when it's the first hard evidence.
- **Before**: a `data-chart` of 85 / 51 / 41 %, no source. (`data-chart` has no caption prop.)
- **Fix**: follow it with a sibling `callout-box` (variant `info`) citing the real source — "Datos del informe *The New SDLC With Vibe Coding* (Google — Osmani et al., 2026)…". When a number widget can't carry provenance, a neighbouring callout does.
- If figures are partial or don't add up, say why **on the screen**: "…el nivel 2 aquí ni se llegó a medir —por eso los porcentajes no suman cien—."

### 4. Unglossed external reference (and mis-categorised ones)
A tool, product, benchmark or org dropped by name.
- **Before**: "un V0, un Lovable" · "Terminal Bench 2.0" · "un estudio de METR" · "tira de una skill".
- **Fix (one-line gloss the first time)**: "generadores de app por chat como V0 o Lovable" · "Terminal Bench 2.0 (un ranking público de agentes en tareas de terminal)" · "METR (un laboratorio que mide el impacto de las herramientas de IA)" · "una skill (una capacidad especializada que le enchufas al agente)".
- **Accuracy**: don't miscategorise — "OpenRouter" is a *model router*, not an agentic framework. Label each named tool as what it is.

### 5. Audio-only joke / aside
A wink whose delivery you can't hear.
- **Before**: "Dicen que hay un nivel 6. Es la bomba nuclear." (cryptic).
- **Fix (own the joke + tie it to the content)**: "Si el 5 es dejar de leer, el chiste inevitable es imaginar un 'nivel 6': soltarlo todo… una bomba nuclear de la que nadie sabe qué esperar —hoy más broma que realidad—." Marking it AS a joke turns the crypticness into the point.

### 6. Widget with no set-up
An interactive check whose idea was never taught.
- **Before**: a `decision-tree` asking "¿de quién es la responsabilidad última?" in a module about a survey — the idea (your safe level depends on who's responsible) never stated.
- **Fix**: precede it with a screen that states the idea (a bridging `quote` + a subtitle that frames it), WITHOUT spoiling the branches. Don't double-teach.

### 7. Provenance leak
Backstage references to the source format.
- **Before**: "En el vídeo, Claude Code…" · "En su caso, lo visual…".
- **Fix**: "En el ejemplo, Claude Code…" · rewrite to 2nd person "Si tu flaco es lo visual…".

## Structural cousins (whole-guide, not one screen)

### 8. A running example must be NAMED up front (`caso-practico`)
- **Before**: the guide leaned on building a CMS (María, `/content`, front-matter traps) but never introduced the case → the reader spent four modules reconstructing what was being built.
- **Fix**: an early screen that declares it ("toda la guía sigue un caso real: planificar un CMS a medida…") + a clause in `meta.description`. Name it before the first widget that uses it.

### 9. Declare the narrative frame + avoid tech-colliding metaphors (`viaje-del-heroe`, etc.)
- **Before**: "umbral / arma / elixir" with no heads-up; "elixir" collided with the Elixir language for a dev reader.
- **Fix**: declare the frame on the cover ("está contada como un viaje en cinco actos…") and swap the colliding word ("elixir" → "el botín").

### 10. Pay off the title's promise (or soften it)
- **Before**: title "Los agentes de IA mienten…" but no module ever develops "mienten".
- **Fix (pay it off without inventing)**: an early screen reframing the hook with the guide's real thesis — "La IA no miente a propósito, pero te devuelve código que *parece* correcto…". Or soften the title to match the body.

### 11. Translated source: adapt jargon, no Spanglish coinages
- **Before**: "reskillizarme".
- **Fix**: "reciclarme profesionalmente". Gloss anglicisms inline or in the `glossary` ("dev rel", "tech-adjacent"), and prefer the Spanish term when it exists.

## Reminder
`[[term]]` tooltips only fire inside a `glossary-text` widget (callout/group-chat
render markdown-plain and would show the literal brackets). To make a glossary
term clickable, put its `[[mention]]` in a `glossary-text` screen.
