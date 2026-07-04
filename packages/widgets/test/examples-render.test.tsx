import * as React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { WidgetronProvider } from "@/lib/i18n";
import { renderWidget, widgetManifest } from "@/lib/registry";

/**
 * Runtime smoke coverage for the whole catalog: every registered widget must
 * RENDER its own `meta.example` without throwing (manifest.test.ts already
 * proves the examples validate against their zod schemas — this proves they
 * also survive the DOM). StrictMode doubles effects, so hydration-unsafe
 * side effects fail here too.
 */

// Lazy optional deps never load in the suite.
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: "<svg></svg>" })),
  },
}));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", ObserverStub);
  vi.stubGlobal("ResizeObserver", ObserverStub);
  if (typeof window.matchMedia !== "function") {
    vi.stubGlobal(
      "matchMedia",
      (query: string): MediaQueryList =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = () => {};
  }
});

afterEach(() => {
  cleanup();
});

describe("widget examples render", () => {
  const withExample = widgetManifest.filter((m) => m.example);

  it("every registered widget ships an example", () => {
    const missing = widgetManifest
      .filter((m) => !m.example)
      .map((m) => m.type);
    expect(missing).toEqual([]);
  });

  // Widgets whose example legitimately renders nothing outside a wider
  // context: profile-gate stays closed (no answered ProfileQuiz) by design.
  const MAY_RENDER_EMPTY = new Set(["profile-gate"]);

  for (const entry of withExample) {
    it(`<${entry.type}> renders its meta example`, () => {
      const { container } = render(
        <React.StrictMode>
          <WidgetronProvider>{renderWidget(entry.example!)}</WidgetronProvider>
        </React.StrictMode>,
      );
      if (!MAY_RENDER_EMPTY.has(entry.type)) {
        expect(container.firstElementChild).toBeTruthy();
      }
    });
  }
});
