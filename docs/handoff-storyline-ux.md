# Handoff — Mejoras UX de storylines + formatos podcaster

**Fecha:** 2026-07-10 · **Sesión origen:** auditoría UX + visión producto + formatos por género.
**Para:** la próxima sesión de Claude Code (y Daniel). Este doc es el punto de entrada; todo lo demás cuelga de aquí.

## 1. Qué se hizo en la sesión origen

Se auditó la experiencia de lectura de las storylines (código + navegación real con Chrome vía DevTools Protocol sobre la guía `vibe-coding-bien`, viewports 390×780 y 1280×800), se diseñó un plan de mejoras en tres horizontes, se elevó a visión de producto para podcasters (análisis 10x) y se investigó el mercado de repurposing para diseñar formatos de presentación por género. Daniel tomó dos decisiones que acotan todo lo demás (ver §3).

## 2. Dónde está cada cosa (referencias completas)

| Qué | Dónde |
|---|---|
| **El artifact** (el documento maestro, 3 partes: auditoría con capturas / visión podcaster / formatos elegidos) | https://claude.ai/code/artifact/a779b569-81c7-4bc9-b320-f13b1ad67bae — para actualizarlo desde otra sesión, pasar esa URL en el parámetro `url` de la herramienta Artifact (si no, se crea una URL nueva) |
| **Análisis 10x podcaster** (scoring impacto/defensibilidad de cada idea: companion audio, SEO episodio, embeds, RSS self-service…) | `.claude/docs/ai/story-studio/10x/session-1.md` |
| **Investigación de mercado + taxonomía de 8 formatos** (la "nevera": expediente true-crime, mapa del debate, caso de negocio, cuaderno de práctica, códice ficción) | `.claude/docs/ai/story-studio/10x/session-2.md` — incluye la DECISIÓN y los next steps |
| **Memoria persistente** (decisión de formatos, para recall automático) | `~/.claude/projects/-Users-daniel-Sites-lab-widgetron/memory/story-formats.md` |
| Código auditado clave | `packages/widgets/src/widgets/storyline/storyline.tsx` (barra de progreso :258-260, rail :286-327 con `hidden sm:block`, resume :179-191 y :263-283, cover :329-350, completed :170-176) · `apps/story-studio/src/engine/resolve.ts` (inyección de cover/sorpresas/CTA) · `apps/story-studio/src/engine/schema.ts:110-123` (envelope `audio.full` + `audio.clips[].transcriptSrc`) · `apps/story-studio/src/engine/srt.ts` (`parseSrt`/`cutRange`) · `apps/story-studio/src/engine/lint.ts` |
| Taxonomía de eventos (ya emitidos, sin receptor) | `docs/analytics.md` |

## 3. Decisiones tomadas (no reabrir sin Daniel)

1. **Formatos nuevos: SOLO dos** — entrevista («la ficha del invitado») y noticias («el briefing jugable»). Los otros seis quedan archivados en session-2.md. Se implementan como **presets de la skill** `podcast-to-story --format=…` (recetas + lint), NO como runtime nuevo.
2. **Inputs garantizados de shows externos**: transcripción + audio por URL (fragmento o episodio completo) + quizás notas de preparación. Las notas alimentan bio/links; la transcripción manda en conflicto. Nada más — no asumir capítulos, RSS estructurado ni metadatos ricos.
3. Anti-scope acordado en el artifact: sin cuentas de usuario/backend de progreso, sin puntos/rankings globales, sin bloquear contenido (modo reto siempre opt-in), sin sonido de UI.

## 4. Qué hacer a partir de ahora (backlog priorizado)

Los ids (M*, A*, S*, F*) son los del artifact — mirar allí el detalle de cada uno antes de implementar.

### Iteración 1 — el contenedor cobra vida (Parte I, todo en `storyline.tsx`)
- [ ] **M1 · Pantalla final de celebración con marcador.** Al 100%: confeti (lazy `canvas-confetti`, patrón del quiz) + resumen de la sesión. Mecánica clave: los `widgetron:event` de los widgets hijos **burbujean** — la storyline escucha en su raíz y cuenta `answered`/`completed` sin tocar ningún widget. Colocarla ANTES del CTA. Labels a `locales/es.ts`, acciones nuevas a `docs/analytics.md`.
- [ ] **M2 · Progreso por módulos.** Barra superior segmentada (un tramo/módulo) + pill «2/5»; dots del rail con estados pendiente/activo/✓. Sustituye el % en píxeles crudos (goal-gradient).

### Iteración 2 — móvil y retorno
- [ ] **M3 · Navegación móvil**: pill flotante inferior («2/5 · título») → bottom sheet con índice y estado ✓ (el rail actual es `hidden sm:block`; en móvil no hay NADA). Targets ≥44px.
- [ ] **M5 · Catálogo que recuerda**: `Catalog.tsx` lee `wgt-storyline:<slug>` → «Continuar · 60%» / «Completada ✓» / «~12 min»; botón Empezar/Continuar/Repasar.

### Iteración 3 — la dependencia de los formatos (el único código nuevo de la Parte III)
- [ ] **A1 · Chips de minuto en `quote`** («dicho en el 23:14», prop opcional; timestamps salen de los SRT).
- [ ] **A2 · Quote con voz**: la chip reproduce el fragmento (URL en `audio.clips[]`; `audio-clip` ya tiene player con transcripción karaoke clicable — reusar, versión compacta). Los clips reales se producen con la skill `make-audio-clip` (repo web-reactiva-2244).

### Iteración 4 — los dos presets de formato (escritura de skill, no código)
- [ ] **F2 · `--format=entrevista`** → `.claude/skills/podcast-to-story/references/format-entrevista.md`. Receta módulo a módulo en el artifact (Parte III): portada+profile-card del invitado, group-chat del mejor intercambio, quotes con minuto y voz, flashcards «las 5 ideas», glossary + resource-list, 3–5 fragmentos de audio.
- [ ] **F5 · `--format=briefing`** → `references/format-briefing.md`. Molde fijo ~7 pantallas: 5 claves (widget distinto cada una), quiz «¿estuviste atento?», fuentes. Límite duro de longitud; regla de serie (slug con fecha).
- [ ] **Lint por formato** en `apps/story-studio/src/engine/lint.ts` (briefing que se alarga, entrevista sin ficha de invitado).
- [ ] **Prototipo honesto**: un episodio real de un show ajeno de cada tipo (falta elegirlos con Daniel) — generar ambos y medir qué se rompe fuera de Web Reactiva.

### Pendiente sin planificar (no perder)
- Parte I restante: M4 (portada con promesa: tiempo estimado + índice + botón Empezar), M10 (resume semántico `{módulo, screen}` en vez de px), M6–M9 (sellos, surprise 2.0, transiciones con voz, resultado compartible), M11–M14.
- Parte II: S4/B3 (elegir receptor de analytics — Swetrix vs beacon propio — desbloquea la medición de todo), A3 (companion mode completo), B1 (SEO del export), B2 (embeds por widget), C1 (RSS self-service — validar antes a mano con 1-2 shows amigos).
- Skills: S1 (reglas de gancho + «fun pass» en podcast-to-story), S2 (skill `story-playtester` que automatiza la auditoría con dev-browser).
- Preguntas abiertas: ¿quién es el segundo podcast? · ¿receptor de analytics?

## 5. Cómo verificar (reglas de la casa)

- `pnpm check` antes de dar nada por hecho (typecheck + tests + e2e `story render` + build).
- `pnpm --filter @webreactiva/story-studio story lint <slug>` para contenido; `story validate` para el envelope.
- Preview: `pnpm dev:studio` → `http://localhost:5173/s/<slug>`.
- KPIs definidos en el artifact: tasa de finalización (`completed`/aperturas), supervivencia al 50% (funnel `scroll_milestone`), interacciones por sesión.

## 6. Trampas conocidas (aprendidas en la sesión origen)

- **dev-browser en este Mac**: el Chromium de Playwright crashea (SIGABRT/crashpad en macOS 13). Workaround que funciona: lanzar el Chrome del sistema con `--remote-debugging-port=9222 --user-data-dir=<scratch>` y conectar con `dev-browser --connect http://localhost:9222`.
- La storyline scrollea en su propio contenedor (`[data-slot="storyline"]`), no en el body — cualquier automatización/screenshot debe scrollear ese elemento.
- Los diagnósticos del IDE mienten en este repo; `tsc --noEmit` es la verdad (regla de CLAUDE.md).
- No emitir eventos desde effects (doble-fire en Strict Mode); solo en handlers de usuario — regla ya establecida en `docs/analytics.md`.
