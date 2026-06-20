import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useLabels, WidgetronProvider } from "@/lib/i18n";

const DEFAULTS = { greeting: "Hello", bye: "Bye" };

describe("useLabels", () => {
  it("returns built-in defaults when nothing overrides them", () => {
    const { result } = renderHook(() => useLabels("demo", DEFAULTS));
    expect(result.current).toEqual(DEFAULTS);
  });

  it("merges defaults < provider < prop (prop wins)", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WidgetronProvider labels={{ demo: { greeting: "Hola", bye: "Adiós" } }}>
        {children}
      </WidgetronProvider>
    );
    const { result } = renderHook(
      () => useLabels("demo", DEFAULTS, { greeting: "Ola" }),
      { wrapper },
    );
    expect(result.current.greeting).toBe("Ola"); // per-instance prop wins
    expect(result.current.bye).toBe("Adiós"); // falls back to provider
  });
});
