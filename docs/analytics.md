# Analytics — the `widgetron:event` layer

Widgetron ships a **decoupled, dependency-free analytics layer** built on the
browser's native `CustomEvent`. Widgets dispatch a single namespaced event —
`widgetron:event` — from their root element; it bubbles up the DOM (and out of
shadow roots via `composed: true`), so the host page subscribes **once** on
`document` and forwards the payload wherever it wants: Swetrix, GTM, a beacon
endpoint… Widgets never know whether anyone is listening, and when nobody
does, dispatching is inert (near-zero cost). It is always on — there is no
opt-out prop and nothing to configure.

```ts
import { onWidgetronEvent } from "@webreactiva/widgetron";

const off = onWidgetronEvent((e) => console.log(e.detail));
// … later: off()
```

Or with plain DOM (e.g. a `<script>` in a standalone export):

```js
document.addEventListener("widgetron:event", (e) => console.log(e.detail));
```

## Event contract

Every event carries a typed `detail` (`WidgetronEventDetail`):

```ts
{
  source: "widget" | "storyline"; // emitting layer
  widget: string;                 // widget type — equals the root's data-slot
  action: string;                 // semantic action, snake_case
  id?: string;                    // author-provided stable id when one exists
  data?: Record<string, unknown>; // action-specific JSON payload — never PII
  ts: number;                     // Date.now() at emit time
}
```

`WindowEventMap`/`DocumentEventMap` are augmented, so
`document.addEventListener("widgetron:event", …)` is fully typed in TS hosts.

### Actions (v1)

| source | widget | action | data |
| --- | --- | --- | --- |
| widget | quiz | `answered` | `{ index, correct }` |
| widget | checklist | `item_toggled` | `{ index, checked, completed, total }` |
| widget | checklist | `completed` | `{ total }` — once per mount |
| widget | flashcards | `graded` | `{ index, knew, graded, total }` |
| widget | flashcards | `completed` | `{ known, total }` |
| widget | cta | `clicked` | `{ variant: "link", url }` |
| widget | cta | `submitted` | `{ ok }` — **never the email** |
| storyline | storyline | `section_viewed` | `{ index, total, title? }` — when the active module changes |
| storyline | storyline | `scroll_milestone` | `{ percent: 25 \| 50 \| 75 \| 100 }` — monotonic, once per instance |
| storyline | storyline | `completed` | `{}` — alongside the 100 milestone |
| storyline | storyline | `resumed` | `{ top }` — reader used the resume bar |

More widgets (decision-tree, scrubber, drag-and-drop…) will join in v2 — each
is a ~3-line addition via the internal `useWidgetEvents` hook.

## Host adapters (copy-paste)

The library deliberately ships **no** vendor adapters — the `detail` object is
the contract. Forwarding is a few lines:

**Swetrix**

```js
document.addEventListener("widgetron:event", (e) => {
  const d = e.detail;
  window.swetrix?.track({
    ev: `wgt_${d.widget}_${d.action}`,
    meta: { id: d.id ?? "", ...d.data },
  });
});
```

**Google Tag Manager**

```js
window.dataLayer = window.dataLayer || [];
document.addEventListener("widgetron:event", (e) => {
  window.dataLayer.push({ event: "widgetron", ...e.detail });
});
```

**Plain beacon**

```js
document.addEventListener("widgetron:event", (e) => {
  navigator.sendBeacon("/collect", JSON.stringify(e.detail));
});
```

## Attributing widget events to a storyline section

Storyline tags each module `<section>` with `data-module-index`. Because
widget events **bubble through** their section, a host can attribute any
interaction to its module with zero widget code:

```js
document.addEventListener("widgetron:event", (e) => {
  const section = (e.target instanceof Element)
    ? e.target.closest("[data-module-index]")
    : null;
  const moduleIndex = section?.getAttribute("data-module-index");
  // → send { ...e.detail, moduleIndex }
});
```

## Generic click tracking (not shipped, on purpose)

Semantic events carry the value; a raw `click` per widget is noisy and any
host can delegate it in a few lines using the `data-slot` convention every
widget root carries:

```js
document.addEventListener("click", (e) => {
  const root = (e.target instanceof Element) && e.target.closest("[data-slot]");
  if (root) track("widget_click", { widget: root.getAttribute("data-slot") });
});
```

## Standalone story exports

The `dist/<slug>/` folder produced by `story render <slug>` emits these events
on its own `document` with no extra wiring. To collect them, paste your
listener (any adapter above) as a `<script>` in the exported `index.html`
`<head>`.

## Emitting from your own widget

Inside the library, widgets use the internal hook:

```tsx
const { ref, emit } = useWidgetEvents("my-widget", idProp);
// <div ref={ref} data-slot="my-widget" …>
// in a user-triggered handler (NEVER in an effect):
emit("some_action", { foo: 1 });
```

Rules: emit only from user-triggered handlers (immune to hydration and Strict
Mode double-effects), snake_case actions, JSON-serializable `data`, and never
put PII (emails, names, free text typed by the reader) in the payload. Hosts
outside the library can dispatch compatible events with `emitWidgetronEvent`.
