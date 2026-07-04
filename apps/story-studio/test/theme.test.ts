import { describe, expect, it } from "vitest";

import { compileDesignMarkdown, parseDesign } from "../src/engine/core";

const DESIGN = `---
name: producto
tokens:
  primary: "#0f766e"
  radius: "0.75rem"
  font-display: "Georgia, 'Times New Roman', serif"
dark:
  background: "#0b1512"
---

# Notes
Anything outside the frontmatter is ignored by the compiler.
`;

describe("theme compiler (design.md → [data-theme])", () => {
  it("parses the frontmatter into name/tokens/dark", () => {
    const design = parseDesign(DESIGN);
    expect(design.name).toBe("producto");
    expect(design.tokens.primary).toBe("#0f766e");
    expect(design.tokens["font-display"]).toBe("Georgia, 'Times New Roman', serif");
    expect(design.dark.background).toBe("#0b1512");
  });

  it("emits the light block and the dark variant", () => {
    const { css, warnings } = compileDesignMarkdown(DESIGN);
    expect(css).toContain('[data-theme="producto"] {');
    expect(css).toContain("  --primary: #0f766e;");
    expect(css).toContain('[data-theme="producto"].dark,');
    expect(css).toContain('[data-theme="producto"] .dark {');
    expect(css).toContain("  --background: #0b1512;");
    expect(warnings).toEqual([]);
  });

  it("warns on tokens outside the widget contract (typo guard)", () => {
    const { warnings } = compileDesignMarkdown(
      "---\nname: x\ntokens:\n  primry: \"#fff\"\n---\n",
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('"primry"');
  });

  it("parses and emits the theme's icon set", () => {
    const { iconSet, css } = compileDesignMarkdown(
      '---\nname: x\niconSet: ph\ntokens:\n  primary: "#fff"\n---\n',
    );
    expect(iconSet).toBe("ph");
    expect(css).toContain("  --wgt-icon-set: ph;");
    expect(() =>
      compileDesignMarkdown(
        '---\nname: x\niconSet: Not Valid\ntokens:\n  primary: "#fff"\n---\n',
      ),
    ).toThrow(/iconSet/);
  });

  it("rejects a design without name or frontmatter", () => {
    expect(() => compileDesignMarkdown("no frontmatter")).toThrow(/frontmatter/);
    expect(() =>
      compileDesignMarkdown("---\ntokens:\n  primary: \"#fff\"\n---\n"),
    ).toThrow(/name/);
  });
});
