import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Storyline } from "@/widgets/storyline";

const modules = [
  { title: "Alpha", screens: [<p key="a">a</p>] },
  { title: "Beta", screens: [<p key="b">b</p>] },
];

describe("Storyline help dialog", () => {
  beforeEach(() => {
    // jsdom has no layout — stub what the storyline reaches for on mount.
    Element.prototype.scrollIntoView = vi.fn();
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
  });
  afterEach(() => cleanup());

  it("opens a labelled, focus-managed dialog and restores focus on Escape", () => {
    render(<Storyline modules={modules} />);

    const trigger = screen.getByRole("button", {
      name: "How to move through the guide",
    });
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector("[role=dialog]")).toBeNull();

    fireEvent.click(trigger);

    const dialog = document.querySelector("[role=dialog]") as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    // Accessible name comes from the heading via aria-labelledby.
    const labelledby = dialog.getAttribute("aria-labelledby");
    expect(labelledby).toBeTruthy();
    expect(document.getElementById(labelledby!)?.textContent).toBe(
      "How to move through the guide",
    );
    // Focus moved into the dialog (the close button is data-autofocus).
    expect(dialog.contains(document.activeElement)).toBe(true);

    // Escape closes it and returns focus to the trigger.
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.querySelector("[role=dialog]")).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });
});
