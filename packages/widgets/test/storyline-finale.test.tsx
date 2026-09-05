import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

import { Storyline } from "@/widgets/storyline";
import { emitWidgetronEvent } from "@/lib/analytics";

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

/**
 * The finale is the last teaching move, not a scoreboard. Two things carry
 * that: the confidence read-out (confident-and-wrong is the one outcome worth
 * naming) and somewhere concrete to go back to.
 */
const modules = [
  { title: "The round trip", screens: [<p key="a">alpha</p>] },
  { title: "Where the time goes", screens: [<p key="b">beta</p>] },
];

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderStoryline() {
  const view = render(<Storyline modules={modules} celebrate={false} />);
  const container = view.container.querySelector(
    "[data-slot=storyline]",
  ) as HTMLElement;
  return container;
}

/** Answer from inside a given module, as a real check nested there would. */
function answer(
  container: HTMLElement,
  moduleIndex: number,
  data: Record<string, unknown>,
) {
  const host = container.querySelector(
    `[data-module-index="${moduleIndex}"] p`,
  ) as HTMLElement;
  act(() => {
    emitWidgetronEvent(host, {
      source: "widget",
      widget: "quiz",
      action: "answered",
      data,
    });
  });
}

const finale = (container: HTMLElement) =>
  container.querySelector("[data-slot=storyline-finale]")?.textContent ?? "";

describe("storyline finale — the last teaching move", () => {
  it("names the confident-and-wrong answers, because that is the belief to repair", () => {
    const container = renderStoryline();
    answer(container, 0, {
      index: 0,
      correct: false,
      confidence: 3,
      calibration: "confident-wrong",
    });
    expect(finale(container)).toMatch(/wrong while you felt sure/);
  });

  it("stays quiet about confidence when the reader never claimed any", () => {
    const container = renderStoryline();
    answer(container, 0, { index: 0, correct: false });
    expect(finale(container)).not.toMatch(/felt sure/);
  });

  it("sends the reader back to the modules where an answer went wrong", () => {
    const container = renderStoryline();
    answer(container, 1, { index: 0, correct: false });
    const text = finale(container);
    expect(text).toMatch(/Worth a second pass/);
    expect(text).toMatch(/Where the time goes/);
    expect(text).not.toMatch(/The round trip/);
  });

  it("lists a shaky module once, however many times it is missed", () => {
    const container = renderStoryline();
    answer(container, 0, { index: 0, correct: false });
    answer(container, 0, { index: 1, correct: false });
    const buttons = Array.from(
      container.querySelectorAll("[data-slot=storyline-finale] button"),
    ).filter((b) => b.textContent === "The round trip");
    expect(buttons).toHaveLength(1);
  });

  it("says so plainly when nothing went wrong, instead of an empty heading", () => {
    const container = renderStoryline();
    answer(container, 0, { index: 0, correct: true });
    const text = finale(container);
    expect(text).toMatch(/Nothing went wrong/);
  });

  it("shows no read-out at all before the reader has answered anything", () => {
    const container = renderStoryline();
    const text = finale(container);
    expect(text).not.toMatch(/second pass/);
    expect(text).not.toMatch(/Nothing went wrong/);
  });
});
