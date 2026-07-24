# Wiki log

Append-only, chronological. Each `wiki-init` / `wiki-update` / `wiki-ask` run
adds an entry. The latest `synced:` line is the checkpoint the next diff starts
from.

## 2026-07-24 · wiki-init
synced: c032ded
- seeded 12 pages across architecture / flows / concepts / components / decisions
- architecture: architecture.md
- flows: render-widget.md
- concepts: aseptic-tokens, ai-generation-surface, rich-text, analytics-events, i18n-labels
- components: widgets (module), widgets/quiz (component), primitives, lib
- decisions: assessment
- next: component pages grow on demand via wiki-update / wiki-ask

## 2026-07-24 · wiki-update (coverage pass)
synced: c032ded
- added scripts/wiki-coverage.sh + wiki/.wikiignore (repo→wiki coverage axis)
- new: components/registry.md (@webreactiva/registry was unclaimed)
- aseptic-tokens.md: claimed styles/index.css
- coverage now clean; plumbing (config, lockfiles, tests, root meta) ignored via .wikiignore

## 2026-07-24 · tooling
- state moved to wiki/.state.json (repo checkpoint); log.md is now narrative-only
- added scripts/wiki-drift.sh (staleness from .state.json); hook runs drift + coverage
- adopted ASCII-diagram convention (CONVENTIONS §Diagrams); demo on flows/render-widget.md
