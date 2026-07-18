import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { BackdropSection } from "@/widgets/backdrop-section";

describe("BackdropSection", () => {
  it("renders the word scene as hidden scenery and every step card", () => {
    const { container } = render(
      <BackdropSection
        backdrop={{
          kind: "words",
          words: [
            { text: "smoke", weight: 5 },
            { text: "focus", weight: 3 },
          ],
        }}
        steps={[
          { content: "Step one prose.", highlight: ["smoke"] },
          { content: "Step two prose." },
        ]}
      />,
    );

    // The backdrop is decorative scenery: aria-hidden, words present.
    const scene = container.querySelector('[aria-hidden="true"]');
    expect(scene).not.toBeNull();
    expect(scene?.textContent).toContain("smoke");
    // The prose cards are the readable document, in order.
    expect(screen.getByText("Step one prose.")).toBeInTheDocument();
    expect(screen.getByText("Step two prose.")).toBeInTheDocument();
  });

  it("keeps a described image scene exposed to assistive tech", () => {
    render(
      <BackdropSection
        backdrop={{ kind: "image", src: "https://example.com/x.jpg", alt: "A smoky room" }}
        steps={[{ content: "Prose." }]}
      />,
    );
    expect(screen.getByAltText("A smoky room")).toBeInTheDocument();
  });
});
