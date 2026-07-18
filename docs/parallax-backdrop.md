# Parallax backdrop — full-screen graphic under scrolling prose

Design doc for a storyline section where a graphic **fills the whole reading
viewport as a background layer** and the text **passes over it** in a block as
the reader scrolls — the classic "sticky graphic + scrolling prose" pattern
(NYT full-bleed scrollytelling), including backdrops that are **typographic
compositions** built from the episode's own words. Research only; nothing here
is implemented yet.

## The one constraint that shapes everything

Storyline is **self-contained: it owns its scroll viewport** (`overflow-y-auto`
on the `data-slot="storyline"` root, default `h-[600px]`, `h-[80vh]` in Story
Studio). Every mechanic below must work *inside that pane*, not against the
window. Concretely:

- `position: fixed` is out — it positions against the window, escaping the
  pane (and the playground's device frame). The backdrop would sit over the
  whole host page.
- `background-attachment: fixed` is out — same reason, plus it has been broken
  on mobile Safari/Chrome forever.
- `100vh` / `100svh` are wrong for "full screen" — full screen means **full
  pane**. The right unit is `100cqh` with the storyline root declared as a size
  container (`container-type: size`; it already has an explicit height, so
  this is safe), matching the repo's container-aware convention. Fallback:
  `100%` chains or a measured `el.closest('[data-slot=storyline]')` height.
- `position: sticky` is in — it sticks against the nearest scroll container,
  which is exactly the storyline pane. This is already how the progress bar,
  HUD, dot rail and the existing Scrollytelling widget pin themselves.
- `IntersectionObserver` with `root: el` is in — the storyline's own
  reveal-on-scroll already works this way.
- CSS scroll-driven animations (`animation-timeline: view()`) are in — the
  timeline tracks the **nearest ancestor scroll container**, so they follow
  the pane's scroll with zero JS.

One more storyline-specific wrinkle: module sections apply `px-6 py-14` and
screens are capped at `max-w-2xl` (widened to `max-w-5xl` for wide widgets via
the `has-[[data-slot=…]]` hook in `screenWidth`). A full-bleed backdrop screen
needs a **breakout**: extend that same hook (`has-[[data-slot=backdrop-section]]:max-w-none`)
plus negative margins on the widget root to cancel the section padding. This
is a two-line storyline change, not a redesign.

## The reading experience (mobile-first)

On a phone this pattern is *better* than side-by-side scrollytelling — there
is no side. The spec:

1. The reader scrolls into the section. The backdrop (image / diagram / word
   composition) sticks and fills the pane edge to edge. A scrim keeps it
   legible territory.
2. The prose arrives as **cards scrolling over the backdrop**: a readable
   block (`max-w-prose`, `bg-card/85` + `backdrop-blur`, rounded, padded),
   one per step, separated by generous empty scroll distance (`~70–90cqh` per
   step) so the backdrop gets moments alone on screen.
3. Each step can **advance the backdrop state** (graphic-sequence technique):
   swap the image, highlight a hotspot region, light up different words of
   the composition. Crossfade only — `motion-safe:animate-wgt-fade-in`, the
   exact mechanism Scrollytelling already uses.
4. Optionally the backdrop **drifts** slightly with scroll progress (a
   translate/scale of a few percent — the actual "parallax"). This is polish,
   not structure: with reduced motion, or in browsers without scroll-driven
   animations, the section is identical minus the drift.
5. When the last step scrolls past, the backdrop unsticks and normal modules
   resume.

Desktop is the same experience with more air: the text cards can sit centered
(default) or offset to one side (`align: "start" | "center" | "end"`) so more
of the backdrop stays visible. No separate desktop layout — one column of
cards over one backdrop, at every width. That keeps the mobile experience the
*primary* one instead of a degraded fallback, which is where classic
two-column scrollytelling always suffers.

Text-over-image legibility is non-negotiable: always render a scrim between
backdrop and cards, built from semantic tokens
(`bg-gradient-to-b from-background/60 via-background/20 to-background/60` or a
`color-mix` equivalent) — never a hardcoded black overlay, so it holds in both
themes and under the brand skin.

## Architecture options

**A. Extend the existing `scrollytelling` widget with a `variant: "backdrop"`.**
It already has the step model, the IO step-tracking, the registry `adapt`, and
AI-facing meta. But the schema would fork into two shapes (side-column node vs
full-bleed backdrop union + scrim + parallax knobs), the `whenToUse` would
have to explain two different reading experiences, and the side-by-side
variant's mobile layout (graphic pinned on top) is a genuinely different
pattern. One widget, two personalities — a muddier generation target.

**B. New sibling widget `backdrop-section` (category: Compositions).** ~120
lines, same step skeleton as Scrollytelling (the IO block is 15 lines;
duplicating it is cheaper than extracting a shared hook for two call sites).
It is a normal screen: drops into any module's `screens`, works standalone,
needs only the registry recipe plus the one-line `screenWidth` breakout in
storyline. `whenToUse` splits cleanly: *Scrollytelling = one evolving graphic
beside the text; BackdropSection = the graphic IS the scene and the text
passes over it.*

**C. A storyline module type** (e.g. `modules[].backdrop`). Deepest change:
storyline's render loop grows a second module shape, the meta schema forks,
and the pattern becomes unusable outside storyline. Storyline's contract today
is beautifully dumb — "modules hold screens, screens are any widgets" — and
every prior feature (gating, lives, challenge) stayed at that altitude.

**Recommendation: B.** A standalone `backdrop-section` widget. It follows the
repo's own precedent (figure vs hotspots vs compare-slider are siblings with
sharp `whenToUse` boundaries, not one widget with modes), keeps storyline
untouched except the full-bleed hook, and gives the AI generator an
unambiguous node to reach for. Option A remains the fallback if, once built,
the two widgets turn out to share >80% of their body — merge then, with
evidence, not now.

## Backdrop types and their JSON shape

The backdrop is a **discriminated union on `kind`** — closed and explicit, so
the zod schema documents each shape to the generator instead of accepting an
opaque node with unstated full-bleed requirements.

### `kind: "image"`

A URL-referenced image (same rule as `figure`: no asset upload, real URLs
only), rendered `object-cover` behind the scrim.

```json
{ "kind": "image", "src": "https://…/smoke.jpg", "alt": "", "focal": "50% 30%" }
```

`alt` is usually `""` here — the backdrop is decorative scenery; the prose
carries the meaning. `focal` maps to `object-position` so the important region
survives tall-phone crops. Per-step image swaps use the step-level override
(below).

### `kind: "node"` — chart / diagram / any widget

Any existing widget node (`data-chart`, `mermaid-diagram`, `figure`,
`infographic`…) promoted to scenery, centered and scaled inside the backdrop
layer. Reuses `nodeSchema` + `asContent` in the registry `adapt` — the exact
pattern Scrollytelling's `sticky` already uses.

```json
{ "kind": "node", "node": { "type": "mermaid-diagram", "props": { "chart": "…" } } }
```

The node renders inert as a backdrop (pointer-events disabled) — an
interactive widget behind a scrim and under scrolling cards is a trap, not a
feature.

### `kind: "words"` — typographic composition

The signature type for podcast-to-story: a full-bleed composition made from
the episode's own words. Pure HTML/CSS — `font-display`, token colors
(`text-primary`, `text-muted-foreground/30`…), size and opacity from a
`weight`, optional slight rotation. No canvas, no layout library: a flex/grid
"word wall" with 10–25 words is deliberate art direction, not a computed word
cloud (a real cloud layout is a dependency and worse typography).

```json
{
  "kind": "words",
  "words": [
    { "text": "humo", "weight": 5 },
    { "text": "productividad", "weight": 4 },
    { "text": "métricas", "weight": 2 },
    { "text": "foco", "weight": 3 }
  ]
}
```

Steps interact with it via `highlight`: the step names the words that light up
(full opacity + `text-primary`) while the rest dim — the graphic-sequence
technique with zero images to source, and it degrades to a handsome static
composition when nothing is highlighted.

## Scroll mechanics

Layered inside one `position: relative` section whose height is
`steps × step-distance`:

1. **Sticky layer** — `position: sticky; top: 0; height: 100cqh` (pane
   height), holding backdrop + scrim, `z-0`. Pure CSS pinning, the same
   mechanism the storyline chrome already relies on, works in every browser
   including iOS Safari inside overflow containers (no `overflow: hidden`
   ancestors between it and the scroller — true today in storyline).
2. **Steps layer** — the prose cards, `z-10`, each wrapped in a
   `min-h-[85cqh]` spacer that provides the scroll distance.
3. **Step tracking** — one `IntersectionObserver`, `rootMargin: "-50% 0px -50% 0px"`,
   exactly as `scrollytelling.tsx` does it (with the same caveat: rootMargin
   resolves against the window when `root` is null, so pass the storyline pane
   — `el.closest('[data-slot=storyline]')` — as `root` when embedded, null
   when standalone). Active step index drives backdrop state: image swap,
   word highlights, dimming inactive cards. State changes are discrete and
   crossfaded — never scrubbed — so they cost nothing and read clearly at any
   scroll speed.
4. **Progress-linked drift (enhancement only)** — the parallax itself: the
   backdrop translates/scales a few percent across the section. CSS
   scroll-driven animations do this with zero JS and zero main-thread cost:

   ```css
   @supports (animation-timeline: view()) {
     [data-slot="backdrop-section"] .backdrop-media {
       animation: wgt-backdrop-drift linear both;
       animation-timeline: view();  /* tracks the storyline pane's scroll */
     }
   }
   @keyframes wgt-backdrop-drift {
     from { transform: scale(1.08) translateY(2%); }
     to   { transform: scale(1)    translateY(-2%); }
   }
   ```

   Support as of mid-2026: Chrome/Edge 115+ and Safari 26+ ship it; Firefox
   still keeps it behind `layout.css.scroll-driven-animations.enabled`. That
   is fine **because the drift carries no meaning**: the `@supports` block is
   the whole fallback story. No JS scroll listener is added for it — if a
   browser can't do it in CSS, it doesn't happen.

Explicitly rejected: scroll-jacking / scroll-snap (fights the storyline's own
scroll and keyboard navigation), JS-scrubbed rAF parallax (jank risk on
mid-tier phones for a decorative effect), and any animation library — GSAP
ScrollTrigger and Motion solve problems (pinning, scrubbed timelines) that
`sticky` + IO + `view()` already cover here. **Zero new dependencies.**

## Accessibility, reduced motion, performance

- **Reduced motion**: drift and crossfades sit behind `motion-safe:` /
  `@media (prefers-reduced-motion: no-preference)`. The reduced experience is
  the full experience minus movement: backdrop still sticks (sticky is
  position, not motion), steps still swap state instantly. Parallax is the
  canonical vestibular trigger — this is mandatory, and one backdrop section
  per guide is the sane ceiling anyway (see lint below).
- **Reading order**: the DOM is backdrop-then-steps, steps in narrative order
  — screen readers get a linear document. The backdrop layer is
  `aria-hidden="true"` when decorative (image with empty alt, words
  composition — the words are scenery, the prose says the actual sentence).
- **Contrast**: the scrim + card background must keep step text at WCAG AA
  regardless of the image behind it — which is why text never sits naked on
  the backdrop; it always lives in a `bg-card/85 backdrop-blur` block.
- **Keyboard**: nothing to do — the section is plain scrollable content in
  the already-focusable storyline pane; no interactive elements are added.
- **Performance**: animate `transform`/`opacity` only; `object-cover` image
  with `loading="lazy"` + `decoding="async"`; no `will-change` unless a real
  device shows jank; one `backdrop-blur` element per visible card is fine,
  but don't blur the backdrop layer itself (full-pane blur is the expensive
  one). The words composition is a dozen text nodes — free.

## Analytics interplay

The section renders inside a module `<section data-module-index>`, so
everything it emits is attributable to its module by the existing
`closest("[data-module-index]")` recipe in `docs/analytics.md`, and the
storyline's own `section_viewed` / `scroll_milestone` / `completed` events are
untouched — the section is just tall content to them.

One new widget-level action is worth having:

| source | widget | action | data |
| --- | --- | --- | --- |
| widget | backdrop-section | `step_viewed` | `{ index, total }` |

Emitted from the IO callback when the active step *changes* — same dedup
discipline as storyline's `section_viewed` (a ref of the last emitted index,
initial index not emitted), so hydration and Strict Mode can't fire it. This
is scroll-driven rather than click-driven, which storyline already treats as a
legitimate user trigger. `backdrop-section` should **not** be in storyline's
`CHALLENGE_TYPES` — it is narrative, not a challenge, and must not inflate the
cover's challenge count.

## Props sketch

```ts
type Backdrop =
  | { kind: "image"; src: string; alt?: string; focal?: string }
  | { kind: "node"; node: WidgetNode }                     // rendered inert
  | { kind: "words"; words: { text: string; weight?: 1 | 2 | 3 | 4 | 5 }[] };

interface BackdropStep {
  content: string | WidgetNode;   // the prose card — RichText-rendered
  backdrop?: Backdrop;            // swap the whole backdrop at this step
  highlight?: string[];           // kind:"words" only — words that light up
}

interface BackdropSectionProps {
  backdrop: Backdrop;             // initial / fallback scene
  steps: BackdropStep[];          // min 1; ~2–5 is the sweet spot
  align?: "start" | "center" | "end";  // card column placement; default center
  parallax?: boolean;             // the CSS drift enhancement; default true
  scrim?: "soft" | "strong";      // default "soft"; "strong" for busy images
}
```

Meta `whenToUse` (draft): *"Use when one graphic should own the whole screen
as a scene while short prose passes over it — an atmospheric image, a diagram
promoted to scenery, or a `words` composition built from the episode's key
terms. 2–5 short steps; at most one per guide. Prefer Scrollytelling when the
reader must study the graphic while reading (it stays beside, not behind, the
text); prefer Figure for an image that just illustrates a paragraph."*

### JSON example node

```json
{
  "type": "backdrop-section",
  "props": {
    "backdrop": {
      "kind": "words",
      "words": [
        { "text": "humo", "weight": 5 },
        { "text": "productividad", "weight": 4 },
        { "text": "métricas", "weight": 2 },
        { "text": "reuniones", "weight": 2 },
        { "text": "foco", "weight": 3 },
        { "text": "entregar", "weight": 3 }
      ]
    },
    "steps": [
      {
        "content": "Half of what we call productivity is **smoke**: motion that photographs well and ships nothing.",
        "highlight": ["humo", "productividad"]
      },
      {
        "content": "The tell isn't the metric — it's whether anything reached a user this week.",
        "highlight": ["entregar", "foco"]
      }
    ],
    "align": "center",
    "scrim": "soft"
  }
}
```

Registry `adapt`: `asContent` on each step's `content` and on
`backdrop.node` / `steps[].backdrop.node` — same shape as the existing
`scrollytelling` entry.

## Phased plan

**Phase 1 — minimal viable** (`backdrop-section` v1):
- Widget with `image` + `words` kinds, sticky layer at `100cqh`, IO step
  tracking, scrim, card steps, `step_viewed` event.
- Storyline: `container-type: size` on the scroll root; `screenWidth` gains
  the full-bleed `has-[[data-slot=backdrop-section]]` breakout.
- No parallax drift yet — sticky + step crossfades already deliver the
  experience; the drift is a later `@supports` block, not architecture.
- Meta + registry + `locales/es.ts` (no chrome labels expected, so possibly
  none) + playground demo + tests. The usual recipe.

**Phase 2**: `kind: "node"` (inert widget scenery), `parallax` drift via CSS
scroll-driven animation, `align`/`scrim` variants, `story lint` rule: at most
one backdrop-section per guide, 2–5 steps.

**Phase 3 (only if asked for)**: per-step focal-point pan on images
(pan-and-zoom technique), podcast-to-story preset guidance for when the
generator should pick a `words` backdrop (episodes with a strong recurring
vocabulary).

## Open questions

- **`100cqh` vs measured height**: making the storyline root a size container
  is the clean path, but standalone use (outside storyline) needs a fallback
  — likely `100svh` when no container is found. Decide in implementation.
- **`view()` inside a nested scroller**: verify on real iOS Safari 26 that
  the timeline tracks the storyline pane (spec says nearest scroll container;
  test before trusting).
- **Thread variant**: in `variant: "thread"` a scroll-driven section is
  meaningless — probably render steps as sequential slides with the backdrop
  as a static background per slide. Punt until thread graduates from
  experimental.
- **Words + glossary**: should `words` entries support `[[term]]` glossary
  hooks? Probably not — the backdrop is aria-hidden scenery; tooltips belong
  in the prose. Revisit if authors ask.
