import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { RichText, renderRich } from "@/primitives/rich-text";
import { GlossaryProvider } from "@/widgets/glossary";

describe("RichText", () => {
  it("formats bold, italic, code and links from a string", () => {
    const { container } = render(
      <RichText>
        {"**bold** and *it* and `code` and [Web](https://webreactiva.com)"}
      </RichText>,
    );
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("it");
    expect(container.querySelector("code")?.textContent).toBe("code");
    const a = container.querySelector("a");
    expect(a?.getAttribute("href")).toBe("https://webreactiva.com");
    expect(a?.getAttribute("target")).toBe("_blank");
    expect(a?.textContent).toBe("Web");
  });

  it("turns newlines into <br>", () => {
    const { container } = render(<RichText>{"line one\nline two"}</RichText>);
    expect(container.querySelectorAll("br").length).toBe(1);
  });

  it("leaves plain prose untouched (no false emphasis on '2 * 3')", () => {
    const { container } = render(<RichText>{"2 * 3 = 6, ratio a_b_c"}</RichText>);
    expect(container.textContent).toBe("2 * 3 = 6, ratio a_b_c");
    expect(container.querySelector("em")).toBeNull();
  });

  it("blocks script-like link targets (no anchor, no scheme leaks)", () => {
    const { container } = render(
      <RichText>{"see [x](javascript:alert(1)) end"}</RichText>,
    );
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("x");
    expect(container.textContent).not.toContain("javascript");
  });

  it("passes non-string nodes through untouched", () => {
    const { container } = render(
      <RichText>
        <span data-x>**not parsed**</span>
      </RichText>,
    );
    expect(container.querySelector("span[data-x]")?.textContent).toBe(
      "**not parsed**",
    );
    expect(container.querySelector("strong")).toBeNull();
  });

  it("renderRich maps mixed arrays (strings formatted, nodes kept)", () => {
    const { container } = render(
      <div>{renderRich(["**a**", <b key="k">b</b>])}</div>,
    );
    expect(container.querySelector("strong")?.textContent).toBe("a");
    expect(container.querySelector("b")?.textContent).toBe("b");
  });

  it("strips [[term]] brackets when no glossary provider is present", () => {
    const { container } = render(
      <RichText>{"a [[value object]] here"}</RichText>,
    );
    expect(container.textContent).toBe("a value object here");
  });

  it("resolves [[term]] to a glossary tooltip term under a GlossaryProvider", () => {
    const { container } = render(
      <GlossaryProvider terms={{ "value object": "Immutable + equal by value." }}>
        <RichText>{"a [[value object]] here"}</RichText>
      </GlossaryProvider>,
    );
    // GlossaryTerm renders its dotted-underline trigger button.
    const term = container.querySelector("button");
    expect(term?.textContent).toBe("value object");
  });

  it("keeps [[term]] literal inside a code span", () => {
    const { container } = render(<RichText>{"use `[[term]]` syntax"}</RichText>);
    expect(container.querySelector("code")?.textContent).toBe("[[term]]");
  });
});
