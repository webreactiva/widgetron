import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";

import { Storyline } from "@/widgets/storyline";
import { onWidgetronEvent, type WidgetronEventDetail } from "@/lib/analytics";

const modules = [
  { title: "First module", screens: [<p key="a">a</p>] },
  { title: "Second module", screens: [<p key="b">b</p>] },
];

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let received: WidgetronEventDetail[] = [];
let off: () => void;

function storylineEvents(action?: string) {
  const events = received.filter((d) => d.source === "storyline");
  return action ? events.filter((d) => d.action === action) : events;
}

/** Render inside StrictMode (double effects) and fake the container layout. */
function renderStoryline() {
  const view = render(
    <React.StrictMode>
      <Storyline modules={modules} />
    </React.StrictMode>,
  );
  const container = view.container.querySelector(
    "[data-slot=storyline]",
  ) as HTMLElement;
  const sections = container.querySelectorAll("section");
  Object.defineProperty(container, "scrollHeight", {
    configurable: true,
    value: 2000,
  });
  Object.defineProperty(container, "clientHeight", {
    configurable: true,
    value: 500,
  });
  return { container, sections };
}

// jsdom has no layout, so module offsets must exist BEFORE mount (the scroll
// effect runs once on mount): module 0 sits at 0, module 1 at 1000.
const originalOffsetTop = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetTop",
);

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
  // Synchronous rAF so scroll emissions happen inline.
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  Object.defineProperty(HTMLElement.prototype, "offsetTop", {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute("data-module-index") === "1" ? 1000 : 0;
    },
  });
  received = [];
  off = onWidgetronEvent((e) => received.push(e.detail));
});

afterEach(() => {
  off();
  vi.unstubAllGlobals();
  if (originalOffsetTop)
    Object.defineProperty(HTMLElement.prototype, "offsetTop", originalOffsetTop);
});

describe("Storyline analytics", () => {
  it("tags each module section with data-module-index", () => {
    const { sections } = renderStoryline();
    expect(sections[0]).toHaveAttribute("data-module-index", "0");
    expect(sections[1]).toHaveAttribute("data-module-index", "1");
  });

  it("emits section_viewed for the first module exactly once on mount (StrictMode-safe)", () => {
    renderStoryline();
    const views = storylineEvents("section_viewed");
    expect(views).toHaveLength(1);
    expect(views[0].data).toMatchObject({
      index: 0,
      total: 2,
      title: "First module",
    });
  });

  it("emits monotonic scroll milestones and section changes while scrolling", () => {
    const { container } = renderStoryline();

    // Scroll to 60% (900 / 1500) — center lands in module 2.
    container.scrollTop = 900;
    fireEvent.scroll(container);
    expect(
      storylineEvents("scroll_milestone").map((d) => d.data?.percent),
    ).toEqual([25, 50]);
    expect(storylineEvents("section_viewed")).toHaveLength(2);
    expect(storylineEvents("section_viewed")[1].data).toMatchObject({
      index: 1,
      title: "Second module",
    });

    // Scroll back up — no milestone re-fires.
    container.scrollTop = 0;
    fireEvent.scroll(container);
    expect(storylineEvents("scroll_milestone")).toHaveLength(2);

    // Reach the end — 75 + 100 fire once, plus completed.
    container.scrollTop = 1500;
    fireEvent.scroll(container);
    expect(
      storylineEvents("scroll_milestone").map((d) => d.data?.percent),
    ).toEqual([25, 50, 75, 100]);
    expect(storylineEvents("completed")).toHaveLength(1);

    // Scrolling to the end again emits nothing new.
    fireEvent.scroll(container);
    expect(storylineEvents("scroll_milestone")).toHaveLength(4);
    expect(storylineEvents("completed")).toHaveLength(1);
  });
});
