import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { CodeDiff, diffLines } from "@/widgets/code-diff";

describe("diffLines", () => {
  it("marks only the lines that actually changed", () => {
    const result = diffLines("a\nb\nc", "a\nB\nc");
    expect(result.map((l) => l.kind)).toEqual([
      "context",
      "remove",
      "add",
      "context",
    ]);
    expect(result.filter((l) => l.kind === "add")[0].text).toBe("B");
  });

  it("keeps before/after line numbers on their own side", () => {
    const result = diffLines("a\nb", "a\nx\nb");
    const added = result.find((l) => l.kind === "add")!;
    expect(added.to).toBe(2);
    expect(added.from).toBeUndefined();
    expect(result.at(-1)).toMatchObject({ kind: "context", from: 2, to: 3 });
  });

  it("handles a pure insertion and a pure deletion", () => {
    expect(diffLines("", "new").map((l) => l.kind)).toEqual(["remove", "add"]);
    expect(diffLines("a\nb", "a").map((l) => l.kind)).toEqual([
      "context",
      "remove",
    ]);
  });

  it("ignores a single trailing newline on either side", () => {
    expect(diffLines("a\nb\n", "a\nb").every((l) => l.kind === "context")).toBe(
      true,
    );
  });
});

describe("CodeDiff", () => {
  it("counts the changes and renders the code verbatim", () => {
    render(
      <CodeDiff
        filename="src/app.ts"
        before={"const a = 1\nconst b = 2"}
        after={"const a = 1\nconst b = 3\nconst c = 4"}
        notes={["`b` changed and `c` appeared."]}
      />,
    );

    expect(screen.getByText("src/app.ts")).toBeInTheDocument();
    expect(screen.getByText(/\+2/)).toBeInTheDocument();
    expect(screen.getByText(/−1/)).toBeInTheDocument();
    // Markdown in a note is formatted; code is not touched.
    expect(screen.getByText("const b = 3")).toBeInTheDocument();
    expect(screen.getByText("b").tagName).toBe("CODE");
  });

  it("drops a zero count instead of showing '−0'", () => {
    render(<CodeDiff before={"a"} after={"a\nb"} />);
    expect(screen.getByText(/\+1/)).toBeInTheDocument();
    expect(screen.queryByText(/−/)).not.toBeInTheDocument();
  });
});
