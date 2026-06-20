import { describe, expect, it } from "vitest";

import { evaluateFormula, formatValue } from "@/lib/formula";

describe("evaluateFormula", () => {
  it("respects operator precedence and parentheses", () => {
    expect(evaluateFormula("2 + 3 * 4", {})).toBe(14);
    expect(evaluateFormula("(2 + 3) * 4", {})).toBe(20);
    expect(evaluateFormula("2 ^ 3 ^ 2", {})).toBe(512); // right-associative
  });

  it("resolves variables", () => {
    expect(evaluateFormula("users * 0.05", { users: 100 })).toBeCloseTo(5);
  });

  it("supports safe functions", () => {
    expect(evaluateFormula("max(1, 9, 4)", {})).toBe(9);
    expect(evaluateFormula("clamp(15, 0, 10)", {})).toBe(10);
    expect(evaluateFormula("round(2.6)", {})).toBe(3);
  });

  it("throws on unknown identifiers and prototype lookups", () => {
    expect(() => evaluateFormula("ghost + 1", {})).toThrow();
    expect(() => evaluateFormula("constructor(1)", {})).toThrow();
    expect(() => evaluateFormula("1 + @", {})).toThrow();
  });
});

describe("formatValue", () => {
  it("formats with grouping, decimals and percent", () => {
    expect(formatValue(1234, "integer", "en-US")).toBe("1,234");
    expect(formatValue(1234.5, "decimal", "en-US")).toBe("1,234.5");
    expect(formatValue(5, "percent", "en-US")).toBe("5 %");
  });

  it("returns an em dash for non-finite numbers", () => {
    expect(formatValue(Number.POSITIVE_INFINITY)).toBe("—");
    expect(formatValue(Number.NaN)).toBe("—");
  });
});
