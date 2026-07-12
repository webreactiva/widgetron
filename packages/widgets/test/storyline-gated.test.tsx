import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Storyline } from "@/widgets/storyline";
import { Quiz } from "@/widgets/quiz";

// Answering the reto celebrates (Quiz confetti); jsdom has no canvas, so the
// real animation frame would throw `clearRect` on a null context. Stub it —
// these tests assert gating, not the celebration.
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const modules = [
  {
    title: "Uno",
    screens: [
      <Quiz
        key="q"
        question="¿Listo?"
        options={[{ text: "Correcta", correct: true }, { text: "Otra" }]}
      />,
    ],
  },
  { title: "Dos", screens: [<p key="p">contenido del modulo dos</p>] },
];

describe("Storyline gated progression", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
  });
  afterEach(() => cleanup());

  it("keeps a module locked until the previous module's question is answered", () => {
    render(<Storyline modules={modules} gated />);

    // Module 2 is locked: only its header previews, its body stays out of the
    // DOM and a lock panel shows instead. The finale is locked too (see below),
    // so both panels carry the "Locked" copy.
    expect(screen.queryByText("contenido del modulo dos")).toBeNull();
    expect(screen.getAllByText("Locked")).toHaveLength(2);

    // Answer module 1's reto → module 2 unlocks (its content mounts, lock gone).
    fireEvent.click(screen.getByText("Correcta"));

    expect(screen.getByText("contenido del modulo dos")).toBeTruthy();
    expect(screen.queryByText("Locked")).toBeNull();
  });

  it("locks the finale until the final module is unlocked", () => {
    const { container } = render(<Storyline modules={modules} gated />);
    const finale = () => container.querySelector("[data-slot=storyline-finale]");

    // Gated + not cleared: the short locked previews would otherwise let the
    // reader scroll straight to the payoff. It waits behind the lock instead.
    expect(finale()?.getAttribute("data-locked")).toBe("true");
    expect(finale()?.textContent).not.toContain("You've completed the guide");

    fireEvent.click(screen.getByText("Correcta"));

    expect(finale()?.getAttribute("data-locked")).toBeNull();
    expect(finale()?.textContent).toContain("You've completed the guide");
  });

  it("shows every module and an open finale immediately when not gated", () => {
    const { container } = render(<Storyline modules={modules} />);
    expect(screen.getByText("contenido del modulo dos")).toBeTruthy();
    expect(screen.queryByText("Locked")).toBeNull();
    const finale = container.querySelector("[data-slot=storyline-finale]");
    expect(finale?.getAttribute("data-locked")).toBeNull();
    expect(finale?.textContent).toContain("You've completed the guide");
  });
});
