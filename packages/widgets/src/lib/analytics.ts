/**
 * Analytics — a decoupled, dependency-free event layer built on native
 * CustomEvent. Widgets dispatch a single namespaced event ("widgetron:event")
 * from their root element; it bubbles up the DOM (and out of shadow roots), so
 * a host page subscribes once on `document` and forwards the payload wherever
 * it wants (Swetrix, GTM's dataLayer, sendBeacon…). Widgets never know — or
 * care — whether anyone is listening. See docs/analytics.md.
 */

/** The single event name every widgetron analytics event is dispatched under. */
export const WIDGETRON_EVENT = "widgetron:event";

export interface WidgetronEventDetail {
  /** Emitting layer: an individual widget or the storyline reading flow. */
  source: "widget" | "storyline";
  /** Widget type — always equals the emitter's `data-slot` value. */
  widget: string;
  /** Semantic action in snake_case, e.g. "answered", "scroll_milestone". */
  action: string;
  /** Author-provided stable id when one exists (checklist `id`, storyline `storageKey`). */
  id?: string;
  /** Action-specific, JSON-serializable payload. Must never carry PII. */
  data?: Record<string, unknown>;
  /** Date.now() at emit time. */
  ts: number;
}

export type WidgetronEvent = CustomEvent<WidgetronEventDetail>;

declare global {
  interface WindowEventMap {
    [WIDGETRON_EVENT]: WidgetronEvent;
  }
  interface DocumentEventMap {
    [WIDGETRON_EVENT]: WidgetronEvent;
  }
  interface HTMLElementEventMap {
    [WIDGETRON_EVENT]: WidgetronEvent;
  }
}

/**
 * Dispatch a widgetron analytics event from `target` (a widget's root
 * element). Bubbles + composed, so it reaches `document` from anywhere.
 * Falls back to `document` when the target isn't mounted yet, and no-ops
 * during SSR. Inert (near-zero cost) when nobody listens.
 */
export function emitWidgetronEvent(
  target: Element | null | undefined,
  detail: Omit<WidgetronEventDetail, "ts">,
): void {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined")
    return;
  const event: WidgetronEvent = new CustomEvent(WIDGETRON_EVENT, {
    bubbles: true,
    composed: true,
    cancelable: false,
    detail: { ...detail, ts: Date.now() },
  });
  (target ?? document).dispatchEvent(event);
}

/**
 * Subscribe to widgetron analytics events. Returns an unsubscribe function.
 * Listens on `document` by default — the natural place for a host forwarding
 * to Swetrix / GTM / a beacon endpoint.
 */
export function onWidgetronEvent(
  handler: (event: WidgetronEvent) => void,
  target: EventTarget | null = typeof document === "undefined"
    ? null
    : document,
): () => void {
  if (!target) return () => {};
  const listener = handler as EventListener;
  target.addEventListener(WIDGETRON_EVENT, listener);
  return () => target.removeEventListener(WIDGETRON_EVENT, listener);
}
