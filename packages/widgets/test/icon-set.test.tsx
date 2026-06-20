import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useIconSet, WidgetronProvider } from "@/lib/i18n";

describe("useIconSet", () => {
  it("defaults to lucide", () => {
    const { result } = renderHook(() => useIconSet());
    expect(result.current).toBe("lucide");
  });

  it("uses the provider's icon set (the theme's set)", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WidgetronProvider iconSet="pixelarticons">{children}</WidgetronProvider>
    );
    const { result } = renderHook(() => useIconSet(), { wrapper });
    expect(result.current).toBe("pixelarticons");
  });

  it("lets an explicit set win", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <WidgetronProvider iconSet="pixelarticons">{children}</WidgetronProvider>
    );
    const { result } = renderHook(() => useIconSet("mdi"), { wrapper });
    expect(result.current).toBe("mdi");
  });
});
