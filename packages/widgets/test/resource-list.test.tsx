import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ResourceList } from "@/widgets/resource-list";
import {
  onWidgetronEvent,
  type WidgetronEventDetail,
} from "@/lib/analytics";

afterEach(() => {
  cleanup();
});

const ITEMS = [
  {
    label: "How the web loads a page",
    href: "https://example.com/round-trip",
    kind: "article" as const,
    source: "Web Reactiva",
    meta: "8 min",
  },
  {
    label: "The episode",
    href: "https://example.com/episode-315",
    kind: "episode" as const,
  },
];

describe("ResourceList", () => {
  it("renders each item as an external link (new tab, safe rel)", () => {
    render(<ResourceList title="Keep exploring" items={ITEMS} />);

    const first = screen.getByRole("link", { name: /How the web loads a page/ });
    expect(first).toHaveAttribute("href", "https://example.com/round-trip");
    expect(first).toHaveAttribute("target", "_blank");
    expect(first).toHaveAttribute("rel", expect.stringContaining("noopener"));

    // Source + qualifier eyebrow is shown.
    expect(screen.getByText("Web Reactiva")).toBeInTheDocument();
    expect(screen.getByText("8 min")).toBeInTheDocument();
  });

  it("emits resource_opened with kind, href and index on click", async () => {
    const received: WidgetronEventDetail[] = [];
    const off = onWidgetronEvent((e) => received.push(e.detail));
    // jsdom cannot navigate — swallow the anchor's default action.
    const stopNav = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("click", stopNav);

    render(<ResourceList items={ITEMS} />);
    await userEvent.click(screen.getByRole("link", { name: /The episode/ }));

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      widget: "resource-list",
      action: "resource_opened",
      data: { kind: "episode", href: "https://example.com/episode-315", index: 1 },
    });

    document.removeEventListener("click", stopNav);
    off();
  });

  it("renders nothing when there are no items", () => {
    const { container } = render(<ResourceList items={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
