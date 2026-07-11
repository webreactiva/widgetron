import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Storyline } from "@/widgets/storyline";
import { Quiz } from "@/widgets/quiz";

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
    // DOM and a lock panel shows instead.
    expect(screen.queryByText("contenido del modulo dos")).toBeNull();
    expect(screen.getByText("Locked")).toBeTruthy();

    // Answer module 1's reto → module 2 unlocks (its content mounts, lock gone).
    fireEvent.click(screen.getByText("Correcta"));

    expect(screen.getByText("contenido del modulo dos")).toBeTruthy();
    expect(screen.queryByText("Locked")).toBeNull();
  });

  it("shows every module immediately when not gated", () => {
    render(<Storyline modules={modules} />);
    expect(screen.getByText("contenido del modulo dos")).toBeTruthy();
    expect(screen.queryByText("Locked")).toBeNull();
  });
});
