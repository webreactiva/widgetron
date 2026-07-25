# Widgetron wiki

An LLM-maintained knowledge base derived from the code. Descriptive, not
normative — the code is the source of truth. Read
[CONVENTIONS.md](./CONVENTIONS.md) for how it's structured and maintained.

Maintained by three verbs: **`wiki-ingest`** (take the code in — seeds, then
reconciles), **`wiki-query`** (answer a question and file the answer back) and
**`wiki-lint`** (is it sound? `--deep` also reads the pages). Start here, then
open a page.

## Architecture

- [Architecture](./architecture.md) — the monorepo map, the layers, and how a JSON node becomes a rendered widget.

## Flows

- [Render a widget node](./flows/render-widget.md) — how a `{ type, props }` node becomes a React element (registry → migrate → adapt → render).
- [From .story.json to a published guide](./flows/story-pipeline.md) — envelope check, deterministic injection, tree validation, pacing gate, static build.

## Concepts

- [Aseptic tokens & theming](./concepts/aseptic-tokens.md) — semantic tokens only; the opt-in brand theme layers on top.
- [AI generation surface](./concepts/ai-generation-surface.md) — per-widget zod meta, the manifest, recursive JSON validation.
- [RichText](./concepts/rich-text.md) — plain strings → formatted inline content, no markdown dependency.
- [Analytics events](./concepts/analytics-events.md) — the decoupled `widgetron:event` CustomEvent layer.
- [i18n & labels](./concepts/i18n-labels.md) — customizable, translatable strings across three merge layers.

## Components

- [Widgets](./components/widgets.md) — the ~57 widgets: anatomy, families, authoritative list.
  - [Quiz](./components/widgets/quiz.md) — single-question multiple-choice with per-option feedback.
- [Primitives](./components/primitives.md) — button, universal icon, tooltip, RichText.
- [lib](./components/lib.md) — registry, meta, i18n, analytics, formula, icons, utils.
- [registry (shadcn distribution)](./components/registry.md) — generates a shadcn registry from the widget source so widgets install via `npx shadcn add`.
- [Story Studio](./components/story-studio.md) — the app that turns a `.story.json` into a publishable interactive guide: engine, CLI, local editor.
- [Playground](./components/playground.md) — previews every widget in a truthful device frame; where a new widget is verified by eye.

## Decisions

- [Which assessment widget?](./decisions/assessment.md) — quiz vs flashcards vs fill-in-the-blanks vs predict-output vs spot-the-bug vs profile-quiz.
