import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { RichText, renderRich } from "@/primitives/rich-text";

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
});
