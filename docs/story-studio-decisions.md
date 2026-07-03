# Story Studio — registro de decisiones

Registro vivo de decisiones relevantes y desviaciones tomadas durante la ejecución del plan
**motor-storyline-standalone** (`~/Sites/www/sopravolare/docs/plans/motor-storyline-standalone.html`, 3 jul 2026).

Vive en widgetron porque la ejecución ocurre aquí (`apps/story-studio`); el plan principal queda en sopravolare como documento de origen.

Formato: cada entrada indica si es una **decisión** nueva, una **desviación** del plan, o un **pendiente**.

---

## D-001 · Ubicación de este registro
**2026-07-03 · Decisión**

Las decisiones de ejecución se registran en `widgetron/docs/story-studio-decisions.md`, no junto al plan en sopravolare. El plan es el documento de intención; este es el diario de lo que realmente se hace y por qué se aparta.

## D-002 · Empaquetado del HTML autocontenido: aplazado
**2026-07-03 · Decisión (explícita de Daniel)**

La revisión del plan detectó que el mecanismo del bundle de hidratación está subespecificado (inlining de React + widgets + CSS, dependencias lazy `mermaid`/`canvas-confetti`, bundle por guía vs compartido, tamaño). Se decide **ignorarlo de momento** y resolverlo con datos del spike E0/E1.

## D-003 · Persistencia del editor: middleware de Vite en dev, sin `editKey`
**2026-07-03 · Desviación del plan**

El plan proponía un editor en `/s/<slug>/editar#<editKey>` con el hash como secreto dentro del propio `.story.json`. Eso tenía dos problemas: una app Vite estática no tiene dónde persistir la edición, y el secreto viaja dentro del documento que se sirve — no protege nada.

**Decisión** (compatible con el monorepo y con la etapa 100% local):

- La fuente de verdad siguen siendo los archivos `content/*.story.json` del repo (revisables en PR, como quería el plan).
- El servidor de desarrollo de Vite gana un plugin propio (`configureServer`) con una mini-API local:
  - `GET /api/stories` — índice de `content/*.story.json` (alimenta el catálogo).
  - `GET /api/stories/:slug` — carga el documento en el editor.
  - `PUT /api/stories/:slug` — valida con `story validate` y **escribe el archivo en disco** (pretty-printed). Guardar en el editor = modificar el archivo = diff de git.
  - `POST /api/export/:slug` — ejecuta el mismo pipeline que `story render` y devuelve/escribe el HTML autocontenido.
- El editor vive en `/s/<slug>/editar` **solo en `pnpm dev`**. En `vite build` (catálogo publicable) y en el HTML exportado la API de escritura no existe físicamente — no hay superficie que proteger.
- **`editKey` se elimina del envelope.** En localhost no hace falta auth; si el producto se abre a terceros, tocará backend y auth de verdad (el plan ya lo preveía como riesgo — la fila de riesgo "hash" queda obsoleta).
- El engine (`src/engine/`) es el único camino de generación: lo importan el CLI, el plugin de dev y el botón Export. Se mantiene la regla del plan de "un único camino de generación".

## D-004 · Sorpresas y CTA: inyección en ejecución, no en cliente
**2026-07-03 · Decisión (dirección de Daniel) — cierra un hueco del plan**

El plan declaraba `settings.surprises.mid/end` y la "colocación" del CTA sin definir cómo entran en el árbol `story`. Se define así:

- La colocación **se declara en el JSON** (`settings`) y **se materializa en ejecución** por el engine — nunca la calcula el cliente. Un paso determinista `resolveStory(doc)` inserta los nodos en el árbol antes de renderizar; corre dentro de `story render` (y del preview en dev).
- **`mid` = la mitad de los pasos**: con N = total de *screens* del storyline aplanadas en orden de lectura, la sorpresa se inserta como screen nueva tras la screen ⌈N/2⌉, dentro del módulo que contiene ese punto. (Se descarta "módulo central": los módulos varían mucho de longitud; las screens son los pasos reales del lector.)
  - Borde: con N < 3 no hay "mitad" — la sorpresa `mid` se fusiona con `end`.
- **`end`** = screen final del último módulo. Si hay sorpresa `end` y CTA, la sorpresa va antes: **el CTA es siempre la última screen**.
- El CTA admite colocación explícita (`settings.cta.placement: "end" | <índice de screen>`); por defecto `end`.
- `story validate` valida el envelope **y** el árbol ya resuelto con `validateWidgetTree` — lo que se publica es exactamente lo que se validó.
- El HTML exportado lleva el árbol resuelto embebido; el runtime del cliente solo renderiza. El widget `surprise` conserva su interacción de revelado (eso es UI, no colocación).

## D-005 · W1 reducido a `surprise`, `quote`, `cta` (ejecutado)
**2026-07-03 · Desviación del plan — "dale a todo" de Daniel**

La fase W1 del plan proponía 6 widgets nuevos, pero la revisión contra el código encontró solapes, así que **no se construyeron duplicados**:

- `youtube-embed` propuesto → **ya existía `video-clip`** (embed privacy-friendly, click-to-load YouTube/Vimeo).
- `prompt-copy` propuesto → **ya existía `prompt-template`** (prompt copy-ready con slots editables y botón de copiar).
- `autodiagnostic` propuesto → **`profile-quiz`** (+ `profile-provider`/`profile-gate`) cubre "quiz → perfil que personaliza el resto". Si en el futuro hace falta un resultado-recomendación tipo informe, se decidirá *extender vs. crear* entonces.

Se construyeron los tres restantes siguiendo la receta completa (meta + registry + exports + `locales/es.ts` + catálogo del playground + tests).

## D-006 · Ejecución E0–E4 en una pasada (2026-07-03)
**2026-07-03 · Decisiones tomadas durante la implementación**

- **Frontera npm con un solo shim**: story-studio consume `@webreactiva/widgetron` por sus entrypoints públicos (`exports` del package.json, que ya apuntaban a `src`). El único alias en su Vite/tsconfig es el `@/` INTERNO de la librería, imprescindible para transpilar su fuente; el código de la app nunca lo usa. Es la versión práctica de la "regla de independencia" del plan.
- **`nodeSchema` duplicado a propósito** en `engine/schema.ts` (6 líneas): el paquete no expone un entrypoint sin React, y el engine debe correr dentro del plugin de Vite (node puro). El split es `engine/core.ts` (node-safe: schema, resolve, srt, theme) vs `engine/validate.ts` (importa el registry; corre en navegador, Vitest y tsx).
- **CTA con `title` obligatorio** en el envelope: un CTA sin copy renderiza vacío; mejor que falle `story validate` a que el motor invente copy en inglés.
- **Placement numérico del CTA** se cuenta sobre las screens ORIGINALES aplanadas (la inyección de `mid` nunca lo desplaza); fuera de rango = clamp a `end`. `mid` = tras la screen ⌈N/2⌉; N<3 fusiona con `end`; el CTA siempre cierra.
- **Export = carpeta autocontenida** `dist/<slug>/` (index.html con shell estático legible + assets con base relativa), no archivo único: los deps lazy (mermaid, katex…) salen como chunks que el navegador solo descarga si la guía los usa (~2,5 MB en disco, no en red). El single-file queda con D-002. En local "descargar" = escribir en `dist/` (sin zip, sin dependencia extra).
- **Sin dependencia YAML**: el frontmatter de `design.md` se parsea con un subset propio (2 niveles, `tokens:`/`dark:`); tokens desconocidos → warning (guardia de typos) contra la lista extraída de `styles/tokens.css`.
- **CLI con `tsx`** (devDep): permite que `story validate` cargue el registry TSX completo. Comando extra **`story manifest`** — vuelca `getWidgetManifestJSON()` para la skill generadora.
- **PUT del editor valida solo el envelope en node**; la validación completa del árbol corre en el navegador (mismo `validateStoryDocument`) antes de habilitar Save/Export. Editor solo en `import.meta.env.DEV`.
- **Skill `/podcast-to-story`** creada en `widgetron/.claude/skills/` fusionando transcripts-to-guide (limpieza ASR, voz, nunca inventar, orden por prefijo numérico) + estructura dispensa agresivamente visual, con `story manifest` como contrato. El idioma del CONTENIDO sigue al episodio (es), `meta.lang` activa los label packs.

## P-002 · Huecos que siguen abiertos
**2026-07-03 · Pendiente**

- Analytics de E5 sin herramienta definida ni mecanismo de inyección en HTML exportado servido desde hosts ajenos.
- Sin historia de regeneración de guías ya exportadas cuando widgetron cambie (bundle congelado).
- E2 real (WRP 315 con audio de verdad) pendiente: el `.story.json` de muestra usa URLs placeholder de Spreaker.
- Prerender SSR (`renderToString`) sin medir — el MVP es shell + hidratación, como recomendaba el propio plan.
