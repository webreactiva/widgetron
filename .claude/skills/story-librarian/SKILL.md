---
name: story-librarian
description: "Enrich an existing Story Studio document (a .story.json in apps/story-studio/content/) with provenance-tracked external material — captioned images (figure), embedded video (video-clip), further-reading / references (resource-list), external definitions (glossary) and notable external quotes — WITHOUT touching the transcript-derived base. Draws only from four trusted wells (author-supplied links/images or a <slug>.sources.md sidecar, a podcast profile's sources: block, the Web Reactiva huellas catalog, and WebFetch of a URL the author names) and never invents a link, image or citation. Use when: (1) user invokes /story-librarian, (2) user says 'enriquece / añade referencias / imágenes / vídeos / documentación a la guía o storyline', 'sigue explorando', 'haz de bibliotecario', (3) user wants to add external knowledge or links to a .story.json that already exists."
argument-hint: "[--slug=<slug>] [--podcast=<id|file>] [--sources=<file>] [--wells=author,profile,catalog,fetch] [--scope=references|media|all]"
user_invocable: true
---

# Story Librarian — enrich a `.story.json`

A **second pass** over an existing Story Studio document. It ADDS
provenance-tracked external material next to the guide's transcript-derived
base — never rewriting what's there. It is the *sanctioned, traceable* channel
for knowledge that does NOT come from the source material, so honesty about
where each thing came from is the whole point.

Run it AFTER a guide already exists and validates. To generate the base guide
from transcripts, use **podcast-to-story** — that skill's job is "never
invent"; this one's job is "only add what you can stand behind."

## The contract: the widget manifest

Same generation contract as podcast-to-story. Dump it and keep it open:

```bash
pnpm --filter @webreactiva/story-studio story manifest /tmp/widget-manifest.json
```

Enrichment targets these types (all in the manifest): **`figure`** (captioned
image), **`resource-list`** (further reading / references / "keep exploring"),
**`video-clip`**, **`callout-box`**, **`quote`**, and the document-level
**`glossary`** on the `storyline` node. Only emit types present in the
manifest. Envelope schema: `apps/story-studio/src/engine/schema.ts`.

## Inputs

- **Story** (required): the slug of an existing
  `apps/story-studio/content/<slug>.story.json` that already **validates**.
- **Podcast profile** (optional, `--podcast=<id|file>`): its `sources:` block
  is one well. Format: [podcast-to-story's podcast-profile.md](../podcast-to-story/references/podcast-profile.md).
- **The four wells** (below) — the only places material may come from.

## The provenance contract (hard — this is the point)

1. **Only real, verified URLs.** Every enrichment node traces to one of the
   four wells. Never invent a link, an image URL, a video id or a citation.
2. **Don't touch the base.** The librarian only ADDS screens/nodes and MAY
   extend `storyline.props.glossary`. It never rewrites a transcript-derived
   screen or alters its claims.
3. **Verify before emitting.** A URL counts as verified only if: the author
   gave it, it's a `sources:` canonical, it came back from a huellas search (a
   real `parentUrl`), or you WebFetched it and it resolved. Anything you can't
   stand behind does NOT enter the document — it goes to the handoff as
   **pending**.
4. **No open-web guessing.** No autonomous web search for new links. WebFetch
   only a URL the author explicitly named.
5. **Media by URL only.** There is no asset pipeline. An image or video the
   author describes but has no URL for is pending, never invented (no guessed
   Spreaker/YouTube ids, no placeholder images).
6. **Attribution stays honest.** External quotes/definitions are attributed to
   their real source; never blur them into the episode's voice as if the
   episode said them.
7. **Mark every addition.** `.story.json` has no comments, so the handoff lists
   every added node by its path + well + URL, and every pending item with why.

## The four wells

1. **Author-supplied** — links, image URLs, YouTube/Vimeo ids pasted in chat,
   or a sidecar `apps/story-studio/content/<slug>.sources.md` (`--sources`).
   Provenance = the author. Format in the enrichment guide.
2. **Podcast profile `sources:`** — evergreen wells (`web`/`blog`/`newsletter`)
   always citable, plus `catalog: huellas` which unlocks well 3. Load with
   `--podcast`.
3. **Web Reactiva catalog (huellas)** — when the profile declares
   `catalog: huellas`, run the `webreactiva-huellas-search` skill per module
   topic; each result's real `parentUrl` + `parentTitle` + timestamp becomes a
   `resource-list` item. Command + mapping in the enrichment guide.
4. **WebFetch** — fetch one specific URL the author named, to summarize and
   cite it. Only that URL, never a crawl.

Judgment layer — the signal → widget map for external material, the sidecar
format, the huellas command, and anchoring/variety rules — is in
[references/enrichment-guide.md](references/enrichment-guide.md). Read it before
proposing a plan.

## Ask first (AskUserQuestion, one call, recommended defaults)

Skip anything the flags already answer:

1. **Scope** — References only (Recommended) · + media (figure/video) ·
   Everything. (`--scope`)
2. **Wells** (multiSelect) — Author-supplied (default on) · Podcast profile
   `sources:` · WR catalog (huellas) · WebFetch a URL I give. (`--wells`)
3. **How much** — Balanced: one "Sigue explorando" per module + media where it
   fits (Recommended) · Light: a single references block before the CTA ·
   Rich: references + inline media generously.

## Process

1. **Read the story.** Load `content/<slug>.story.json`; confirm it validates
   (`pnpm --filter @webreactiva/story-studio story validate <slug>`). Map its
   modules and their topics.
2. **Gather wells.** Read `--podcast` `sources:`; read `<slug>.sources.md` if
   present; collect author links from chat; if the catalog well is on, run
   huellas searches per module topic; WebFetch any named URLs. Build a
   candidate list, each item tagged with its **well** and its **verified URL**.
3. **Propose the plan.** Per module: what node, from which well, and why — plus
   the pending list (candidates with no real URL). Show it before editing
   unless the AskUserQuestion round already scoped it tightly.
4. **Edit the `.story.json`.** Insert enrichment nodes and/or extend
   `storyline.props.glossary`. Leave every existing screen untouched.
5. **Validate & self-correct.** Re-run `story validate <slug>` until clean;
   node-path errors point exactly at what to fix.
6. **Preview & hand off.** `pnpm dev:studio` → `/s/<slug>` and
   `/s/<slug>/editar`. The handoff MUST list every added node (path + well +
   URL) and every pending/unverified item with the reason it was held back.

Never publish or `story render` without the author's review — enrichment adds
outbound links and media, and the author owns what the guide points at.
