import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

import { Storyline } from "@/widgets/storyline";

const modules = [
  { title: "Alpha", screens: [<p key="a">a</p>] },
  { title: "Beta", screens: [<p key="b">b</p>] },
  { title: "Gamma", screens: [<p key="c">c</p>] },
];

describe("Storyline module dot keyboard nav", () => {
  beforeEach(() => {
    // jsdom has no layout — stub the browser APIs the storyline reaches for.
    Element.prototype.scrollIntoView = vi.fn();
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
  });
  afterEach(() => cleanup());

  function dots() {
    return Array.from(
      document.querySelectorAll<HTMLButtonElement>("nav[aria-label] button"),
    );
  }

  it("walks modules with Arrow keys and exposes one Tab stop (roving tabindex)", () => {
    render(<Storyline modules={modules} />);
    const [d0, d1, d2] = dots();

    // Only the active module's dot is tabbable; the rest are -1.
    expect(d0.tabIndex).toBe(0);
    expect(d1.tabIndex).toBe(-1);

    d0.focus();
    fireEvent.keyDown(d0, { key: "ArrowDown" });
    expect(document.activeElement).toBe(d1);

    fireEvent.keyDown(d1, { key: "ArrowDown" });
    expect(document.activeElement).toBe(d2);

    // Clamps at the end.
    fireEvent.keyDown(d2, { key: "ArrowDown" });
    expect(document.activeElement).toBe(d2);

    fireEvent.keyDown(d2, { key: "ArrowUp" });
    expect(document.activeElement).toBe(d1);

    fireEvent.keyDown(d1, { key: "Home" });
    expect(document.activeElement).toBe(d0);

    fireEvent.keyDown(d0, { key: "End" });
    expect(document.activeElement).toBe(d2);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
