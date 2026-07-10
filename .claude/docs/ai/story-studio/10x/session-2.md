# 10x Analysis: Formatos de presentación por tipo de podcast
Session 2 | Date: 2026-07-10

Constraints fijadas por el autor: inputs garantizados = transcripción + audio por URL (fragmento o completo) + quizás notas de preparación. Nada más. Segundo podcast: desconocido → los formatos deben cubrir el espectro de géneros.

## Hallazgos de mercado (investigación web, 15 búsquedas EN+ES)

1. **Todas las herramientas de repurposing producen lo mismo**: Castmagic, Podium, Capsho, Swell AI, Podsqueeze → transcripción, show notes, blog post, newsletter, captions, clips/audiogramas. Artefactos planos. Ninguna produce experiencias interactivas por episodio.
2. **La sync audio-texto existe pero presa en players/editores**: Pocket Casts (transcripción sincronizada, premium), Snipd (AI chapters, snips, chat-with-episode), Sonix (player embebible click-to-seek), Descript (karaoke solo en editor). El concepto «podcast karaoke» (Evo Terra) está bautizado y sin construir.
3. **Los shows grandes fabrican su companion a mano**: Serial (mapas, documentos, cartas por episodio), Mel Robbins (workbooks/trackers), The Daily (newsletter), Acquired (páginas con fuentes), Magnus Archives/Night Vale (wikis y transcripts FAN-made). El artefacto nativo de cada género está validado; falta el generador.
4. **El hueco**: episodio → página interactiva, genre-aware, opcionalmente audio-synced. Entre el show-notes-generator y el microsite artesanal no hay nadie.

Dato clave del catálogo propio: `audio-clip` YA tiene transcripción karaoke sincronizada y clicable (su meta lo confirma). `decision-tree` es choose-your-own-path; `profile-quiz` existe y está infrautilizado.

## La matriz (formato = preset de podcast-to-story `--format=`, mismo runtime)

| Tipo | Formato | Artefacto probado | Receta (widgets existentes) | Audio | Gap |
|---|---|---|---|---|---|
| Educativo | **La dispensa** | Web Reactiva | (receta actual) | Completo | — |
| Entrevista | **La ficha del invitado** | Tim Ferriss, Podcast Notes | profile-card portada, group-chat mejor intercambio, quotes con minuto+voz, flashcards "5 ideas", timeline trayectoria, glossary+resource-list (librarian) | Fragmentos | — |
| Tertulia | **El mapa del debate** | nadie (hueco total) | profile-cards posturas, quotes enfrentadas con voz, "¿con quién estás?" por asalto, infographic acuerdos, decision-tree argumento | Fragmento/asalto | **quiz-opinión** (poll sin respuesta correcta, % local) |
| True crime | **El expediente** | Serial, Casefile | timeline espina, hotspots evidencias, scrollytelling reconstrucción, surprise=giros, figure documentos (provenance doble) | Completo (companion) | — |
| Noticias | **El briefing jugable** | The Daily | 5 claves, data-chart, quiz "¿estuviste atento?", resource-list; CORTO, cadencia semanal, catálogo=archivo | Fragmentos titulares | — |
| Negocios | **El caso interactivo** | Acquired, HBR | timeline empresa, data-chart métricas, decision-tree "¿qué habrías hecho tú?" ANTES de revelar al fundador (con su voz), pattern-card lecciones, prompt-template aplicar | Fragmentos encrucijadas | — |
| Bienestar | **El cuaderno de práctica** | Mel Robbins | checklist persistente corazón, fill-in-the-blanks journaling, tangle-text metas, profile-quiz personaliza, audio-clip = el ejercicio | Fragmentos-ejercicio | — |
| Ficción | **El códice del mundo** | fans Magnus/Night Vale | profile-cards personajes, timeline cronología, hotspots mapa, glossary lore, episodio con karaoke, decision-tree remixes | Completo + karaoke | **spoiler-guard** (variante de surprise) |

Total: 8 formatos, 2 widgets nuevos (ambos variantes de piezas existentes). El resto es receta: estructura de módulos + cupos de widgets + regla de audio por formato, validado por el mismo manifest y `story lint`.

Notas de preparación (cuando existan): alimentan estructura (guion previsto) + pozos del librarian (links, invitados, fuentes). La transcripción manda en conflicto (regla existente).

## DECISIÓN (2026-07-10, Daniel)
Solo dos formatos nuevos: **F2 entrevista** y **F5 briefing de noticias**. El resto de la matriz queda en la nevera (este doc es el archivo). Ninguno de los dos necesita widgets nuevos; los gaps quiz-opinión/spoiler-guard quedan aparcados con sus formatos.

Recetas detalladas (módulo a módulo) de los dos elegidos: en la Parte III del artifact de la sesión (y a portar a references/format-*.md de la skill).

## Next steps
- [ ] A1+A2 (chips de minuto + quote con voz) — dependencia real de ambos formatos; único código nuevo.
- [ ] Preset `--format=entrevista` en podcast-to-story → references/format-entrevista.md (portada con profile-card del invitado, group-chat del mejor intercambio, flashcards "5 ideas", glossary+resource-list; 3–5 fragmentos de audio; notas de preparación = bio/links, transcripción manda).
- [ ] Preset `--format=briefing` → references/format-briefing.md (molde fijo ~7 pantallas / 5 claves con widget distinto cada una / quiz "¿estuviste atento?" / fuentes; límite duro de longitud; serie semanal: slug con fecha).
- [ ] `story lint` por formato (briefing que se alarga, entrevista sin ficha).
- [ ] Prototipo honesto: 1 episodio real ajeno de cada tipo, generar ambos, medir qué se rompe.
