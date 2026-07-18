# Enrichment guide (story-librarian)

The judgment layer. The widget props come from `pnpm story manifest` (the
source of truth); this file is *what external material maps to which widget*,
*where each well lives*, and *how to place enrichment without breaking the base
guide*.

## The four wells (detail)

### 1. Author-supplied + the sidecar `<slug>.sources.md`

The author can paste links/images/ids straight into chat, or drop a sidecar at
`apps/story-studio/content/<slug>.sources.md`. Accept a YAML frontmatter list
(preferred) and/or loose markdown links in the body:

```markdown
---
resources:
  - { label: "How the web loads a page", href: "https://…/round-trip", kind: article, source: "Web Reactiva", meta: "8 min" }
  - { label: "OpenAPI spec", href: "https://spec.openapis.org", kind: docs }
images:
  - { src: "https://…/diagram.png", alt: "The round trip", caption: "Request out, response back.", credit: "Source: …" }
videos:
  - { youtube: "aqz-KE-bpKQ", title: "Walkthrough" }
---

Plain pasted links here are fine too — parse them, but keep only ones with a
real URL.
```

Every field maps 1:1 to `figure` / `resource-list` / `video-clip` props. An
entry without a real URL (or an image with no `src`) is **pending**, not
invented.

### 2. Podcast profile `sources:`

- `web` / `blog` / `newsletter` → evergreen, always-citable → `resource-list`
  items (`kind: link`/`article`, `source:` = the show/family).
- `catalog: "huellas"` → enables well 3.

### 3. Web Reactiva catalog via huellas

Only when the profile declares `catalog: huellas`. For each module's topic, run
the `webreactiva-huellas-search` skill's script (`<huellas-skill>` = the dir
holding its SKILL.md, e.g. `~/.claude/skills/webreactiva-huellas-search`):

```bash
node <huellas-skill>/scripts/search-huellas.mjs "<module topic>" --source=internal --diverse --limit=5
```

Each JSON result → one `resource-list` item, all from **real** fields:

| result field | resource-list |
| --- | --- |
| `parentTitle` | `label` |
| `parentUrl` | `href` (never fabricate this) |
| `parentType` (`wr`/`wrp`/`step` → `episode`; `external` → `article`) | `kind` |
| show/family (e.g. "Web Reactiva") | `source` |
| `parentPubDate` or `startTime` timestamp | `meta` |

Keep only results clearly relevant to the module; drop weak matches. `--diverse`
avoids five chunks from the same episode. This well is provenance-perfect: the
links are the catalog's own, not the model's.

### 4. WebFetch

Only a URL the author named. Fetch it, take the real title + a one-line
summary, cite it as a `resource-list` item (`href` = that URL). If it 404s, is
paywalled, or is unclear → pending, don't cite it.

## Signal → widget map (external material)

| You have | Widget |
| --- | --- |
| A set of links: further reading, references, related episodes | `resource-list` |
| Evergreen show links (web/blog/newsletter) | `resource-list` (`kind: link`) |
| An image URL — diagram, screenshot, chart-as-image | `figure` |
| A real photo worth a scroll reveal (not just an inline illustration) | `unmask-strip` (real image URL only) |
| A real place the material points to (a venue, an org's location) | `map` (real `[lat,lng]` only; host imports `leaflet/dist/leaflet.css`) |
| A before/after pair of images | `compare-slider` |
| An image that needs clickable annotations | `hotspots` |
| A published video (youtube/vimeo id or file URL) | `video-clip` |
| An external definition of a term used across the guide | `storyline.glossary` + `[[term]]` |
| A notable external sentence with real attribution | `quote` |
| One external caveat or insight | `callout-box` |

The single primary next-step link is the guide's CTA — that lives in
`settings.cta` (injected at build) and is podcast-to-story's job. The librarian
uses `resource-list` for *the rest*: the shelf of related, further material.

## Anchoring & placement

- **resource-list**: an end-of-module "Sigue explorando", or one consolidated
  references block as the penultimate screen before the injected CTA.
  `layout: "list"` for reading, `"cards"` for a short reference grid.
- **figure / video-clip**: inline — insert as a new screen right after the one
  whose concept it illustrates.
- **glossary**: merge new keys into `storyline.props.glossary`; never duplicate
  an existing term, and only add terms actually used in the guide.
- **Respect the base's variety rules** (from podcast-to-story's widget-guide):
  never two consecutive screens of the same widget type (across module
  boundaries too — a module that ends in `resource-list` can't be followed by
  one that opens the same way), keep `prose`/`glossary-text` under a third, and
  never enrich the auto cover (the engine renders `meta.title`/`description`).
- **Restraint.** Enrichment supports the lesson, it doesn't bury it. A light
  guide gets ONE "Sigue explorando"; don't sprinkle links across every screen,
  and don't stack two `resource-list`s.

## Verification checklist (before writing each node)

1. Real URL from a named well? If not → pending, skip it.
2. `figure` has a real `src` + `alt`? `resource-list` items each have `href`
   (+ a helpful `kind`/`source`)? `video-clip` has a real id/`src`?
3. Not duplicating an existing screen or an existing glossary term?
4. Does the placement create two consecutive same-type screens? If so, move it.
5. Logged for the handoff: node path + well + URL.
