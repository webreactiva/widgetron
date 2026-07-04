import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { Figure } from "@/widgets/figure";

afterEach(() => {
  cleanup();
});

describe("Figure", () => {
  it("renders an accessible, lazy image with caption and credit", () => {
    render(
      <Figure
        src="https://example.com/pic.png"
        alt="A diagram of the round trip"
        caption="The round trip."
        credit="Source: Web Reactiva"
      />,
    );

    const img = screen.getByRole("img", { name: "A diagram of the round trip" });
    expect(img).toHaveAttribute("src", "https://example.com/pic.png");
    expect(img).toHaveAttribute("loading", "lazy");

    // Caption + credit render inside a real <figcaption>.
    expect(screen.getByText("The round trip.")).toBeInTheDocument();
    expect(screen.getByText("Source: Web Reactiva")).toBeInTheDocument();
  });

  it("wraps the image in a source link when href is given", () => {
    render(
      <Figure
        src="https://example.com/pic.png"
        alt="A picture"
        href="https://example.com/source"
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/source");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
