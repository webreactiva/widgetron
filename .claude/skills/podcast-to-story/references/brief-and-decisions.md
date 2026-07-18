# The brief-first step + decision trees

Direct transcript → `.story.json` is where quality slips: you commit to a shape
before you understand the episode, and the user can't steer until a big JSON
already exists. Fix both with **one cheap artifact first** — a `.brief.md` the
user reads and tweaks in seconds. Every hard decision (format, length, arc,
keyword) is made ONCE, in prose, on the brief — then generation just executes it.

This is the baoyu-infographic idea (extract the structure before rendering),
adapted: the brief is the spec; the JSON is a build from it.

## The brief artifact

Write it to `apps/story-studio/content/<slug>/brief.md` and **show it to the
user before generating anything**. That `<slug>/` folder is the story's
**workspace** — the brief lives there now, and it's where future per-story
artifacts go too (notes, drafts, a playtest report). It sits alongside the
story file (`content/<slug>.story.json`) and, when there are author images, the
public `content/<slug>/assets/` folder (inside the same workspace). Keep the brief to one screen — it's a
decision surface, not an essay. Template:

```markdown
# Brief — <título provisional>

**Fuente:** <show> #<n> · <duración> · <idioma>   ← metadata, no va en el guide

## Tesis en una frase
<La idea central del episodio, en una frase honesta y sin humo.>

## La palabra (R-PALABRA)
**<palabra>** — <por qué es LA palabra apropiable; ✓ si el episodio la dice en voz alta.>

## Arco de enseñanza (NO el orden del audio)
1. <Módulo 1: idea + por qué abre — el gancho/loop que se abre>
2. <Módulo 2: idea>
3. …
- Loop: se abre en el módulo 1 con «<promesa>», se cierra en el último con «<pago>».

## Momentos clave (candidatos a widget)
| Momento (minuto) | Qué es | Widget candidato |
|---|---|---|
| 12:30 | cifra: «73% …» | scroll-stat |
| 18:05 | cita textual de <persona> | quote |
| … | proceso de 4 pasos | flow-diagram / sticky-pan |

## Recomendaciones (rellenadas por los árboles de abajo)
- **Formato:** <default | entrevista | briefing | game> — <motivo en 1 línea>
- **Longitud:** <corta | media | larga> — <motivo>
- **Énfasis:** <equilibrado | práctica | conceptos | motivación> — <motivo>
- **Tema:** podyscroll (por defecto) salvo que el usuario pida otro.

## Huecos detectados
- <concepto que el episodio asume pero no explica → ¿complementar?>

## Riesgos / notas
- <chistes solo-audio, anécdotas del host a generalizar, media sin URL real…>
```

The user confirms or edits the brief; those four **Recomendaciones** then become
the *pre-answered* calibration (the AskUserQuestion round only asks what the user
still leaves open, with the brief's pick as the recommended default). Less
friction: the reader shapes the guide on a page of prose, not by answering cold
questions or reviewing a 500-line JSON.

## Decision tree — FORMAT (pick exactly one)

```
¿Qué es el episodio?
│
├─ 2+ voces y una es un INVITADO cuya historia/perfil es el foco
│     → entrevista        (references/format-entrevista.md)
│
├─ Repaso de VARIAS noticias/temas independientes de la semana
│     → briefing          (references/format-briefing.md)
│
├─ ¿El usuario quiere una 2ª pasada COMPETITIVA/rejugable (vidas/HP)
│   sobre cualquier episodio?
│     → game              (references/format-game.md)
│
└─ Un TEMA ÚNICO que se enseña (monólogo, charla temática)  ← el caso común
      → default (dispensa didáctica)
```
Tie-breakers: an interview that is really a *topic* taught through a guest (not
about the guest) → default, not entrevista. A single news item deep-dived →
default, not briefing. `game` is never automatic — it's an explicit extra pass.

## Decision tree — LENGTH

Length is the "how many slides?" dial — ask it as plainly as a deck's slide
count, and always state the concrete target in the brief (`media — 4 módulos,
~18 pantallas`), not just the label.

```
¿Cuánta materia ENSEÑABLE tiene ( no cuánto dura el audio)?
├─ Una idea fuerte, poco desarrollo            → corta  (3 módulos, ~12 pantallas)
├─ Varias ideas con desarrollo                 → media  (4–5, ~20)   ← default
└─ Muchas ideas densas / ejemplos largos       → larga  (6–7, 25+)
```
A 90-min episode that says one thing is still `corta`. Length follows ideas,
not minutes.

**How to actually hit a length (the levers — the user can dial either way):**

| To make it SHORTER | To make it LONGER |
|---|---|
| Merge related ideas into one module | Split each idea into its own module |
| Cut passive screens (fold a `prose` into the widget it precedes) | Add a practice screen per concept (quiz, checklist, step-cards) |
| One example per idea, the sharpest | Expand an example into its own walkthrough (code-translation, terminal-sim) |
| Drop optional depth (no profile-gate branch) | Add a `profile-gate` branch for a second audience |
| Fewer diagrams — keep the one that carries the structure | More diagrams: one per structure/process/comparison |

Never pad to hit a number: if the episode is a `corta`, a forced `larga` is
water. And never cut below the spine — the arc's beats and the one required
diagram/quiz survive every trim. Length flexes the *development*, not the skeleton.

## Decision tree — EMPHASIS

```
¿Qué pide el contenido?
├─ Pasos accionables, herramientas, "hazlo el lunes"   → práctica
├─ Modelos mentales, distinciones, "entender por qué"  → conceptos
├─ Cambio de mentalidad, historia, ánimo               → motivación
└─ Mezcla equilibrada                                  → equilibrado  ← default
```
Emphasis shifts the widget mix (see widget-guide.md), not the content: práctica
leans on step-cards/checklist/prompt-template, conceptos on diagrams/glossary/
quiz, motivación on quote/callout/narrative.

## When to skip the brief

A tiny episode the user already scoped tightly (flags cover format + length +
emphasis, transcript is short) → a one-paragraph brief inline is enough; don't
over-ceremony it. The brief scales with the ambiguity, not with every run.
