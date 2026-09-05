import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { NodeGraph } from "@/widgets/node-graph";
import { renderWidget } from "@/lib/registry";
import { onWidgetronEvent, type WidgetronEventDetail } from "@/lib/analytics";

/**
 * jsdom gives every element a zero-sized box, so the arrow GEOMETRY cannot be
 * asserted here — that is a browser job. What these pin is everything the
 * hybrid exists for: that labels stay HTML (and therefore keep RichText), that
 * the structure survives without measurement at all, and that two graphs on one
 * page don't share an arrowhead.
 */
class ResizeObserverStub {
  constructor(private cb: ResizeObserverCallback) {}
  observe() {
    this.cb([], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);

afterEach(cleanup);

const nodes = [
  { id: "browser", label: "Browser", note: "the reader" },
  { id: "api", label: "**API**", note: "your code", detail: "Where auth happens." },
  { id: "db", label: "Database", row: 2, col: 2 },
];
const edges = [
  { from: "browser", to: "api", label: "GET `/product/42`" },
  { from: "api", to: "db", label: "SELECT …" },
  { from: "db", to: "api", dashed: true },
];

describe("NodeGraph", () => {
  it("keeps node and edge labels as rich HTML, not SVG text", () => {
    const { container } = render(<NodeGraph nodes={nodes} edges={edges} />);
    // `**API**` became real emphasis, and `/product/42` real <code> — neither
    // of which survives inside an SVG <text>, which is the point of the hybrid.
    expect(container.querySelector("strong")?.textContent).toBe("API");
    expect(container.querySelector("code")?.textContent).toBe("/product/42");
    expect(container.querySelector("svg text")).toBeNull();
  });

  it("writes the structure out for readers who never get the geometry", () => {
    const { container } = render(<NodeGraph nodes={nodes} edges={edges} />);
    const described = container.querySelector(".sr-only")?.textContent ?? "";
    expect(described).toMatch(/Browser → API/);
    expect(described).toMatch(/API → Database/);
    // The drawing itself is decorative — it is the same information twice.
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("gives each instance its own arrowhead id", () => {
    const { container } = render(
      <>
        <NodeGraph nodes={nodes} edges={edges} />
        <NodeGraph nodes={nodes} edges={edges} />
      </>,
    );
    const ids = Array.from(container.querySelectorAll("marker")).map(
      (m) => m.id,
    );
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it("draws one path per edge once the boxes have been measured", () => {
    const { container } = render(<NodeGraph nodes={nodes} edges={edges} />);
    expect(container.querySelectorAll("[data-slot=node-graph-edge]")).toHaveLength(edges.length);
  });

  it("skips an edge pointing at a node that does not exist, without breaking the rest", () => {
    const { container } = render(
      <NodeGraph
        nodes={nodes}
        edges={[...edges, { from: "api", to: "ghost" }]}
      />,
    );
    expect(container.querySelectorAll("[data-slot=node-graph-edge]")).toHaveLength(edges.length);
  });

  it("opens a node's detail panel and reports it", () => {
    const seen: WidgetronEventDetail[] = [];
    const off = onWidgetronEvent((e) => seen.push(e.detail));
    render(<NodeGraph nodes={nodes} edges={edges} />);
    expect(screen.queryByText(/Where auth happens/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /API/ }));
    off();
    expect(screen.getByText(/Where auth happens/)).toBeTruthy();
    expect(seen.find((e) => e.action === "node_inspected")?.data).toMatchObject({
      id: "api",
    });
  });

  it("renders from a JSON node, with nested content adapted", () => {
    const { container } = render(
      renderWidget({
        type: "node-graph",
        props: {
          nodes: [
            { id: "a", label: "A" },
            { id: "b", label: "B" },
          ],
          edges: [{ from: "a", to: "b", label: "**hop**" }],
        },
      })!,
    );
    expect(container.querySelector("[data-slot=node-graph]")).not.toBeNull();
    expect(container.querySelector("strong")?.textContent).toBe("hop");
  });
});
