import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import confetti from "canvas-confetti";

import { Storyline, readStorylineProgress } from "@/widgets/storyline";
import {
  emitWidgetronEvent,
  onWidgetronEvent,
  type WidgetronEventDetail,
} from "@/lib/analytics";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

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
function renderStoryline(extra?: Partial<React.ComponentProps<typeof Storyline>>) {
  const view = render(
    <React.StrictMode>
      <Storyline modules={modules} {...extra} />
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
  vi.mocked(confetti).mockClear();
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

describe("Storyline finale", () => {
  it("counts bubbled child events into the finale scoreboard", () => {
    const { container } = renderStoryline();
    const child = container.querySelector("p") as HTMLElement;

    act(() => {
      emitWidgetronEvent(child, {
        source: "widget",
        widget: "quiz",
        action: "answered",
        data: { index: 1, correct: true },
      });
      emitWidgetronEvent(child, {
        source: "widget",
        widget: "quiz",
        action: "answered",
        data: { index: 0, correct: false },
      });
      emitWidgetronEvent(child, {
        source: "widget",
        widget: "checklist",
        action: "completed",
        data: { total: 3 },
      });
    });

    const finale = container.querySelector(
      "[data-slot=storyline-finale]",
    ) as HTMLElement;
    expect(finale).toHaveTextContent("Challenges passed: 1/2");
    expect(finale).toHaveTextContent("Activities completed: 1");
  });

  it("ignores the storyline's own events in the scoreboard", () => {
    const { container } = renderStoryline();
    // Mount already emitted storyline events (section_viewed) through the
    // same root — the finale must not count them as challenges.
    const finale = container.querySelector(
      "[data-slot=storyline-finale]",
    ) as HTMLElement;
    expect(finale).not.toHaveTextContent("Challenges passed");
  });

  it("renders the outro after the finale", () => {
    const { container } = renderStoryline({ outro: <p>the CTA</p> });
    const outro = container.querySelector("[data-slot=storyline-outro]");
    expect(outro).toHaveTextContent("the CTA");
    const finale = container.querySelector("[data-slot=storyline-finale]")!;
    expect(
      finale.compareDocumentPosition(outro!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("fires confetti once on a real scroll to the end, never on mount", async () => {
    const { container } = renderStoryline();
    expect(confetti).not.toHaveBeenCalled();

    container.scrollTop = 1500;
    fireEvent.scroll(container);
    await vi.waitFor(() => expect(confetti).toHaveBeenCalledTimes(1));

    // Reaching the end again does not re-celebrate.
    fireEvent.scroll(container);
    await Promise.resolve();
    expect(confetti).toHaveBeenCalledTimes(1);
  });

  it("does not fire confetti when celebrate is false", async () => {
    const { container } = renderStoryline({ celebrate: false });
    container.scrollTop = 1500;
    fireEvent.scroll(container);
    await Promise.resolve();
    expect(confetti).not.toHaveBeenCalled();
  });
});

describe("Storyline progress persistence", () => {
  afterEach(() => window.localStorage.clear());

  it("readStorylineProgress parses the JSON format and the legacy bare px", () => {
    window.localStorage.setItem(
      "wgt-storyline:new",
      JSON.stringify({ top: 900, pct: 60, done: true }),
    );
    expect(readStorylineProgress("new")).toEqual({
      top: 900,
      pct: 60,
      done: true,
    });

    window.localStorage.setItem("wgt-storyline:legacy", "1234");
    expect(readStorylineProgress("legacy")).toEqual({
      top: 1234,
      pct: 0,
      done: false,
    });

    window.localStorage.setItem("wgt-storyline:junk", "not json");
    expect(readStorylineProgress("junk")).toBeNull();
    expect(readStorylineProgress("missing")).toBeNull();
  });

  it("persists {top, pct, done} and keeps done sticky across saves", async () => {
    const { container } = renderStoryline({ storageKey: "persist" });
    container.scrollTop = 1500; // 100%
    fireEvent.scroll(container);
    await new Promise((r) => setTimeout(r, 300)); // debounced save
    expect(readStorylineProgress("persist")).toEqual({
      top: 1500,
      pct: 100,
      done: true,
    });

    container.scrollTop = 300; // scroll back up — done must survive
    fireEvent.scroll(container);
    await new Promise((r) => setTimeout(r, 300));
    expect(readStorylineProgress("persist")).toMatchObject({
      top: 300,
      pct: 20,
      done: true,
    });
  });
});

describe("Storyline mobile module index", () => {
  it("opens the bottom sheet from the pill, emits toc_opened, and jumps to a module", () => {
    const { container } = renderStoryline();
    const pill = [...container.querySelectorAll("button")].find((b) =>
      /1\/2/.test(b.textContent ?? ""),
    )!;
    expect(pill).toBeTruthy();
    expect(pill.textContent).toContain("First module");

    fireEvent.click(pill);
    expect(storylineEvents("toc_opened")).toHaveLength(1);

    const sheet = container.querySelector("[data-slot=storyline-toc]")!;
    const rows = sheet.querySelectorAll("ol button");
    expect(rows).toHaveLength(2);
    expect(rows[1].textContent).toContain("Second module");

    const spy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: spy,
    });
    fireEvent.click(rows[1]);
    expect(spy).toHaveBeenCalled();
    // sheet closed
    expect(container.querySelector("[data-slot=storyline-toc]")).toBeNull();
  });
});
