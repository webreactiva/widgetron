# 10x Analysis: Story Studio como producto para podcasters
Session 1 | Date: 2026-07-09

## Current Value
Pipeline interno que convierte episodios de Web Reactiva (SRT + audio + momentos) en guías interactivas en español: skills `podcast-to-story` (generación con reglas de fidelidad) y `story-librarian` (enriquecimiento con provenance), studio local para revisar/editar, `story render` exporta HTML autocontenido, `story lint` vigila ritmo y repetición, eventos `widgetron:event` emitidos (sin receptor aún). 7 guías publicadas.

## The Question
¿Qué haría que **cualquier podcaster del mundo** quisiera esto para reutilizar sus audios + transcripciones?

## Los activos únicos (el foso)
1. **Contrato de generación por IA**: manifest con `whenToUse` + zod + `validate` + `lint` — un agente puede autorar guías fiables y auto-corregirse. Nadie más tiene un formato de "dispensa interactiva" direccionable por JSON.
2. **Disciplina de provenance**: never-invent + cuatro pozos + cold-reader pass. La voz del podcaster se preserva; la confianza es el producto.
3. **Theming aséptico**: core con tokens semánticos + tema de marca opt-in — cualquier show puede tener su look sin CSS.
4. **El envelope ya modela audio**: `audio.full`, `audio.clips[].transcriptSrc`, helpers `parseSrt`/`cutRange` (`schema.ts:110-123`, `srt.ts`). La visión audio-first tiene cimientos.
5. **Export autocontenido**: `story render` → HTML subible a cualquier hosting. Sin lock-in.

---

## Massive Opportunities

### 1. Modo companion: la guía que se lee con los oídos
**What**: Con `audio.full` + el SRT del episodio: mini-player persistente en la storyline, resaltado karaoke del texto derivado, «leer desde donde escuchas / escuchar desde donde lees» (bidireccional, por timestamps de módulo), y quotes que se reproducen al tocarlas.
**Why 10x**: Convierte la guía en *la mejor forma de consumir el episodio*, no un resumen que compite con él. Nadie tiene esto: los players tienen transcripción plana; las guías no tienen audio. La intersección está vacía.
**Unlocks**: deep links con cue de audio, clips virales, companion mode en el coche/gimnasio.
**Effort**: High (pero por escalera: chips de minuto → quote con voz → sync completo).
**Risk**: derechos de hosting del audio (mitigado: el audio ya es del podcaster; Spreaker URLs ya en uso).
**Score**: 🔥

### 2. De RSS a guía (self-service)
**What**: Pegar la URL del feed RSS → episodios + audio; transcripción automática si no hay SRT; wizard del `podcast profile`; borrador generado por el pipeline actual; revisión en el editor (ya existe); publicar/exportar.
**Why 10x**: Las skills son hoy el producto pero solo Daniel puede ejecutarlas. Esto las convierte en un funnel: cualquier podcaster, una tarde, su primera guía.
**Unlocks**: el paso de herramienta interna a plataforma; pricing por show.
**Effort**: Very High.
**Risk**: coste de transcripción/generación por episodio; calidad sin humano en el loop (mitigado: el editor + lint + validate ya son el control de calidad).
**Score**: 🔥 (estratégica, tras validar 1-2 shows externos a mano)

### 3. El sitio del episodio (SEO/GEO)
**What**: El export deja de ser "un HTML" y pasa a ser *la página canónica del episodio*: schema.org (`PodcastEpisode` + `FAQPage` desde los quizzes + `LearningResource`), OG image por guía/módulo, sitemap, contenido indexable (ya es HTML estático).
**Why 10x**: El dolor nº1 no resuelto del podcasting: el audio es invisible para Google y para los buscadores con IA. Una guía interactiva por episodio es contenido indexable de máxima calidad que ningún "show notes generator" iguala.
**Unlocks**: tráfico orgánico → nuevos oyentes → más guías. El loop de crecimiento del podcaster.
**Effort**: Medium-High (es render-time, no runtime).
**Score**: 🔥

### 4. Plataforma multi-show
**What**: Catálogo por show, tema generado desde el cover art (extraer paleta → tokens), pasaporte por show.
**Why 10x**: Es la forma de que "todos los podcasters" convivan en una infraestructura.
**Effort**: High. **Score**: 🤔 (después de 2-3 shows reales; no antes)

---

## Medium Opportunities

### 5. Quotes con voz
**What**: `quote` con `clipId` opcional → botón play que reproduce el momento real (los clips ya están modelados en `audio.clips[]`; `make-audio-clip` ya los produce).
**Why 10x**: El momento emocional del episodio, con la voz real, dentro del texto. Es el primer peldaño del companion mode y se puede hacer YA.
**Effort**: Medium. **Score**: 🔥

### 6. Embeds por widget
**What**: Exportar un widget suelto (el quiz, la checklist, el tangle-text) como embed autocontenido para newsletter/Notion/blog, con link de vuelta a la guía completa.
**Why 10x**: El quiz del episodio incrustado en la newsletter es el mejor anuncio posible de la guía. Growth loop con coste marginal cero (el registry ya renderiza cualquier nodo suelto).
**Effort**: Medium. **Score**: 🔥

### 7. Panel de retención para el podcaster
**What**: Receptor de eventos + funnel por módulo y por guía: dónde abandonan, qué quizzes fallan.
**Why 10x**: "Tu audiencia falla el quiz del módulo 3 → ese concepto merece su propio episodio". El podcast por fin tiene analytics de comprensión, no solo de descargas. Feedback loop guía→show.
**Effort**: Medium. **Score**: 👍

### 8. Deep links con cue + QR dicho en antena
**What**: `guia.com/315#m2` abre el módulo 2 con el audio posicionado; QR/short-link para mencionar en el episodio.
**Effort**: Low-Medium (tras companion). **Score**: 👍

### 9. Multi-idioma
**What**: Pass de traducción validado por el mismo manifest (locale packs ya existen); un show en español publica su guía en inglés.
**Why 10x**: multiplica la audiencia del contenido ya pagado. **Effort**: Medium. **Score**: 👍

### 10. Captura de email en el pico emocional
**What**: En la pantalla de celebración (M1 de la Parte I): "recibe tu marcador + la checklist por email" (email-form CTA ya existe).
**Effort**: Low. **Score**: 👍

---

## Small Gems

### 11. Chips de minuto en las quotes
Provenance visible: «dicho en el 23:14». Confianza + ancla para el futuro play. Effort: Low. **Score**: 🔥

### 12. `story lint` audio-aware
Reglas nuevas: módulo sin `timeRange` cuando hay `audio.full`, quote citable sin clip → pending. Se apoya en el lint recién creado. Effort: Low. **Score**: 👍

### 13. Capítulos inversos
La estructura de módulos exporta chapters (podcast chapters / YouTube): el flujo inverso gratis, y un caramelo que los podcasters entienden en 5 segundos. Effort: Low. **Score**: 👍

### 14. "Pregunta al episodio"
La pantalla final recoge la duda del lector (form → email del podcaster): alimenta el siguiente episodio. Cierra el círculo show→guía→show. Effort: Low. **Score**: 🤔

---

## Recommended Priority

### Do Now (validan la tesis audio-first con esfuerzo mínimo)
1. **#11 chips de minuto** — provenance visible, cero riesgo.
2. **#5 quotes con voz** — primer "wow" de audio; los clips ya existen.
3. **#12 lint audio-aware** — el contrato crece con la visión.

### Do Next (el loop de crecimiento)
1. **#3 sitio del episodio (SEO)** — render-time, no toca runtime.
2. **#6 embeds por widget** — distribución.
3. **#7 panel de retención** — el receptor de eventos que la Parte I ya pedía (S4).

### Explore (las apuestas)
1. **#1 companion mode completo** — el diferenciador definitivo; prototipar con un episodio.
2. **#2 RSS self-service** — probar antes a mano con 1-2 podcasts amigos (mismo pipeline, otro perfil) para validar que el formato viaja fuera de WR.
3. **#9 multi-idioma** — cuando haya un caso real.

### Backlog
- #4 plataforma multi-show, #8 deep links+QR (tras companion), #10 email en pico (tras M1), #13 capítulos inversos, #14 pregunta al episodio.

## Questions
### Blockers
- **Q**: ¿El audio de los shows externos estará siempre en un host con URLs directas (Spreaker-style)? Define cuánto companion mode es posible sin hosting propio.
- **Q**: ¿Quién es el segundo podcast? La validación de "esto lo quiere todo podcaster" empieza con uno que no sea WR.

## Next Steps
- [ ] Prototipar quote-con-voz sobre `vibe-coding-bien` con un clip real.
- [ ] Generar una guía de un podcast ajeno (con permiso) usando el pipeline tal cual — medir qué se rompe.
- [ ] Decidir receptor de analytics (Swetrix vs beacon propio) — desbloquea #7 y la medición de la Parte I.
