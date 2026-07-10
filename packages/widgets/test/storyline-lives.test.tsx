import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import confetti from "canvas-confetti";

import { Storyline } from "@/widgets/storyline";
import {
  emitWidgetronEvent,
  onWidgetronEvent,
  type WidgetronEventDetail,
} from "@/lib/analytics";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const modules = [
  { title: "First module", screens: [<p key="a">alpha</p>] },
  { title: "Second module", screens: [<p key="b">beta</p>] },
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
  Object.defineProperty(container, "scrollHeight", {
    configurable: true,
    value: 2000,
  });
  Object.defineProperty(container, "clientHeight", {
    configurable: true,
    value: 500,
  });
  return { view, container };
}

/** Dispatch a scored answer from a child widget, as a real quiz would. */
function answer(container: HTMLElement, correct: boolean) {
  const child = container.querySelector("p") as HTMLElement;
  act(() => {
    emitWidgetronEvent(child, {
      source: "widget",
      widget: "quiz",
      action: "answered",
      data: { index: 0, correct },
    });
  });
}

function livesLabel(container: HTMLElement): string | null {
  const hud = container.querySelector("[data-slot=storyline-lives]");
  return hud?.querySelector("[role=img]")?.getAttribute("aria-label") ?? null;
}

function finaleText(container: HTMLElement): string {
  return (
    container.querySelector("[data-slot=storyline-finale]")?.textContent ?? ""
  );
}

const originalOffsetTop = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetTop",
);

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
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
  window.localStorage.clear();
  if (originalOffsetTop)
    Object.defineProperty(HTMLElement.prototype, "offsetTop", originalOffsetTop);
});

describe("Storyline game mode (lives) — opt-out by default", () => {
  it("renders no lives HUD and celebrates normally without the prop", async () => {
    const { container } = renderStoryline();
    expect(container.querySelector("[data-slot=storyline-lives]")).toBeNull();

    answer(container, false); // a wrong answer must not touch anything
    expect(storylineEvents("life_lost")).toHaveLength(0);

    container.scrollTop = 1500;
    fireEvent.scroll(container);
    await vi.waitFor(() => expect(confetti).toHaveBeenCalledTimes(1));
  });
});

describe("Storyline game mode (lives) — mechanic", () => {
  it("shows the starting hearts", () => {
    const { container } = renderStoryline({ lives: { total: 3 } });
    expect(livesLabel(container)).toBe("3 of 3 lives left");
  });

  it("loses a life on a wrong answer, exactly once (StrictMode-safe)", () => {
    const { container } = renderStoryline({ lives: { total: 3 } });
    answer(container, false);
    expect(livesLabel(container)).toBe("2 of 3 lives left");
    expect(storylineEvents("life_lost")).toHaveLength(1);
    expect(storylineEvents("life_lost")[0].data).toMatchObject({
      livesLeft: 2,
      total: 3,
    });
  });

  it("wins a life back on a correct answer, clamped to the total", () => {
    const { container } = renderStoryline({ lives: { total: 3 } });
    answer(container, false); // 2
    answer(container, true); // back to 3 — one restore
    expect(livesLabel(container)).toBe("3 of 3 lives left");
    expect(storylineEvents("life_restored")).toHaveLength(1);

    answer(container, true); // already full — no-op, no second restore
    expect(livesLabel(container)).toBe("3 of 3 lives left");
    expect(storylineEvents("life_restored")).toHaveLength(1);
  });

  it("wrong→right nets zero", () => {
    const { container } = renderStoryline({ lives: { total: 2 } });
    answer(container, false);
    answer(container, true);
    expect(livesLabel(container)).toBe("2 of 2 lives left");
  });

  it("emits game_over only on the 0-crossing, clamped at 0", () => {
    const { container } = renderStoryline({ lives: { total: 2 } });
    answer(container, false); // 1
    answer(container, false); // 0 → game over
    answer(container, false); // still 0, no second game_over
    expect(livesLabel(container)).toBe("0 of 2 lives left");
    expect(storylineEvents("game_over")).toHaveLength(1);
    expect(storylineEvents("life_lost")).toHaveLength(2); // the floored 3rd emits nothing
  });
});

describe("Storyline game mode (lives) — finale reward gate", () => {
  it("withholds the reward at 0 lives but keeps the prose readable", async () => {
    const { container } = renderStoryline({ lives: { total: 1 } });
    answer(container, false); // dead

    const finale = finaleText(container);
    expect(finale).toContain("Out of lives!");
    expect(finale).not.toContain("You've completed the guide!");
    // Prose is still in the DOM — reading was never blocked.
    expect(container.textContent).toContain("alpha");
    expect(container.textContent).toContain("beta");

    // Reaching the end while dead does NOT fire confetti.
    container.scrollTop = 1500;
    fireEvent.scroll(container);
    await Promise.resolve();
    expect(confetti).not.toHaveBeenCalled();
  });

  it("restores the reward after a redemption, then celebrates once", async () => {
    const { container } = renderStoryline({ lives: { total: 1 } });
    answer(container, false); // 0 — game over
    expect(finaleText(container)).toContain("Out of lives!");

    answer(container, true); // redemption → 1
    expect(storylineEvents("life_restored")).toHaveLength(1);
    expect(finaleText(container)).toContain("You've completed the guide!");
    expect(finaleText(container)).not.toContain("Out of lives!");

    // The one-shot confetti latch waited for a completion while alive.
    container.scrollTop = 1500;
    fireEvent.scroll(container);
    await vi.waitFor(() => expect(confetti).toHaveBeenCalledTimes(1));
  });

  it("does not spuriously game-over when resuming an already-done guide", () => {
    window.localStorage.setItem(
      "wgt-storyline:done-run",
      JSON.stringify({ top: 1500, pct: 100, done: true }),
    );
    const { container } = renderStoryline({
      storageKey: "done-run",
      lives: { total: 3 },
    });
    // Fresh lives, celebratory finale — no game_over on hydration.
    expect(storylineEvents("game_over")).toHaveLength(0);
    expect(finaleText(container)).toContain("You've completed the guide!");
  });
});
