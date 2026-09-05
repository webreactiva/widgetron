import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";

import { MermaidDiagram } from "@/widgets/mermaid-diagram";

/**
 * Mermaid's colour parser predates CSS Color 4: handed an `oklch()` token — what
 * Tailwind v4 emits and what this repo's themes are built from — it throws
 * `Unsupported color format` and the diagram never renders. That shipped, and
 * only the browser pass caught it, because jsdom reports no computed colours at
 * all so nothing ever reached mermaid here.
 *
 * The real conversion needs a canvas, which jsdom has not got. What IS testable
 * here is the contract that matters at the boundary: whatever comes out, mermaid
 * is never handed a format it cannot parse.
 */
const initialize = vi.fn();
vi.mock("mermaid", () => ({
  default: {
    initialize: (...args: unknown[]) => initialize(...args),
    render: vi.fn(async () => ({ svg: "<svg></svg>" })),
  },
}));

afterEach(() => {
  cleanup();
  initialize.mockClear();
  vi.unstubAllGlobals();
});

const themeVars = async () => {
  await waitFor(() => expect(initialize).toHaveBeenCalled());
  const [config] = initialize.mock.calls[0] as [
    { themeVariables: Record<string, string> },
  ];
  return config.themeVariables;
};

const COLOR_KEYS = [
  "primaryColor",
  "primaryBorderColor",
  "primaryTextColor",
  "secondaryColor",
  "lineColor",
  "background",
  "mainBkg",
];

describe("MermaidDiagram theme colours", () => {
  it("never hands mermaid a colour format it cannot parse", async () => {
    // The exact token that broke it in the browser.
    vi.stubGlobal("getComputedStyle", () => ({
      getPropertyValue: (name: string) =>
        name === "--font-sans" ? "" : "oklch(94% .008 90)",
    }));

    render(<MermaidDiagram chart="graph TD; A-->B;" />);
    const vars = await themeVars();

    for (const key of COLOR_KEYS) {
      expect(vars[key], key).toMatch(/^(#|rgb)/);
      expect(vars[key], key).not.toMatch(/oklch|lab\(|color\(/);
    }
  });

  it("passes through the formats mermaid already understands", async () => {
    vi.stubGlobal("getComputedStyle", () => ({
      getPropertyValue: (name: string) =>
        name === "--font-sans" ? "" : "#ff0055",
    }));

    render(<MermaidDiagram chart="graph TD; A-->B;" />);
    const vars = await themeVars();
    expect(vars.lineColor).toBe("#ff0055");
  });
});
