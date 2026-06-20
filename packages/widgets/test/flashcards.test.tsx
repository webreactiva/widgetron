import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Flashcards } from "@/widgets/flashcards";

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
});
