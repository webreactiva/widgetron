import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Surprise } from "@/widgets/surprise";

describe("Surprise", () => {
  it("hides the content until revealed", async () => {
    render(
      <Surprise
        teaser="Something's waiting for you"
        content={<p>The hidden payload</p>}
      />,
    );

    // Closed: teaser shows, content does not.
    expect(screen.getByText("Something's waiting for you")).toBeInTheDocument();
    expect(screen.queryByText("The hidden payload")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reveal" }));

    // Open: content is now visible and stays open.
    expect(screen.getByText("The hidden payload")).toBeInTheDocument();
  });

  it("uses translated labels", () => {
    render(<Surprise content="x" labels={{ reveal: "Revelar" }} />);
    expect(
      screen.getByRole("button", { name: "Revelar" }),
    ).toBeInTheDocument();
  });
});
