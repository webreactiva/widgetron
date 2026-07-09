import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Flashcards } from "@/widgets/flashcards";
import {
  onWidgetronEvent,
  type WidgetronEventDetail,
} from "@/lib/analytics";

const cards = [
  { front: "Front 1", back: "Back 1" },
  { front: "Front 2", back: "Back 2" },
];

describe("Flashcards", () => {
  it("completes the deck after grading every card", async () => {
    render(<Flashcards cards={cards} />);

    await userEvent.click(screen.getByText("Knew it"));
    await userEvent.click(screen.getByText("Review"));

    expect(screen.getByText("Deck complete")).toBeInTheDocument();
    expect(screen.getByText(/You knew 1 of 2 cards/)).toBeInTheDocument();
  });

  it("emits graded events and completed when the deck is done", async () => {
    const received: WidgetronEventDetail[] = [];
    const off = onWidgetronEvent((e) => received.push(e.detail));
    render(<Flashcards cards={cards} />);

    await userEvent.click(screen.getByText("Knew it"));
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      widget: "flashcards",
      action: "graded",
      data: { index: 0, knew: true, graded: 1, total: 2 },
    });

    await userEvent.click(screen.getByText("Review"));
    const completed = received.filter((d) => d.action === "completed");
    expect(completed).toHaveLength(1);
    expect(completed[0].data).toEqual({ known: 1, total: 2 });
    off();
  });

  it("emits 'completed' once on a rapid double-click of the last grade", () => {
    const received: WidgetronEventDetail[] = [];
    const off = onWidgetronEvent((e) => received.push(e.detail));
    render(<Flashcards cards={[{ front: "F", back: "B" }]} />);
    const knew = screen.getByText("Knew it");
    // Grading the last card swaps in the done screen — the second click lands on
    // a button that no longer exists, so completion can't be re-emitted.
    fireEvent.click(knew);
    fireEvent.click(knew);
    expect(received.filter((d) => d.action === "completed")).toHaveLength(1);
    off();
  });
});
