import { describe, expect, it, vi } from "vitest";

import {
  WIDGETRON_EVENT,
  emitWidgetronEvent,
  onWidgetronEvent,
  type WidgetronEvent,
} from "@/lib/analytics";

describe("emitWidgetronEvent", () => {
  it("dispatches a bubbling event from the element that reaches document", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const received: WidgetronEvent[] = [];
    const off = onWidgetronEvent((e) => received.push(e));

    emitWidgetronEvent(el, {
      source: "widget",
      widget: "quiz",
      action: "answered",
      data: { index: 1, correct: true },
    });

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe(WIDGETRON_EVENT);
    expect(received[0].target).toBe(el);
    expect(received[0].detail).toMatchObject({
      source: "widget",
      widget: "quiz",
      action: "answered",
      data: { index: 1, correct: true },
    });
    expect(typeof received[0].detail.ts).toBe("number");

    off();
    el.remove();
  });

  it("falls back to document when the target is not mounted", () => {
    const received: WidgetronEvent[] = [];
    const off = onWidgetronEvent((e) => received.push(e));

    expect(() =>
      emitWidgetronEvent(null, {
        source: "storyline",
        widget: "storyline",
        action: "section_viewed",
      }),
    ).not.toThrow();

    expect(received).toHaveLength(1);
    expect(received[0].target).toBe(document);
    off();
  });

  it("stops delivering after unsubscribe", () => {
    const handler = vi.fn();
    const off = onWidgetronEvent(handler);
    off();

    emitWidgetronEvent(null, {
      source: "widget",
      widget: "cta",
      action: "clicked",
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
