import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { ComparisonTable } from "@/widgets/comparison-table";

const columns = [
  { label: "npm" },
  { label: "pnpm", note: "workspaces first", highlight: true },
];

const rows = [
  { label: "Strict dependencies", cells: [false, true] },
  { label: "Disk usage", cells: ["High", "Lowest"] },
  { label: "Bundled with Node", cells: [true, null] },
];

describe("ComparisonTable", () => {
  it("renders a real table with the criteria as row headers", () => {
    render(<ComparisonTable columns={columns} rows={rows} caption="Pick one." />);

    expect(screen.getByRole("table")).toHaveAccessibleName("Pick one.");
    expect(
      screen.getByRole("rowheader", { name: /Strict dependencies/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /pnpm/ })).toHaveTextContent(
      "workspaces first",
    );
  });

  it("turns booleans into labelled icons and empty cells into a dash", () => {
    render(<ComparisonTable columns={columns} rows={rows} />);

    const strict = screen.getByRole("row", { name: /Strict dependencies/ });
    expect(within(strict).getByText("No")).toBeInTheDocument();
    expect(within(strict).getByText("Yes")).toBeInTheDocument();

    const bundled = screen.getByRole("row", { name: /Bundled with Node/ });
    expect(within(bundled).getByText("Not applicable")).toBeInTheDocument();
  });

  it("keeps string cells verbatim", () => {
    render(<ComparisonTable columns={columns} rows={rows} />);
    expect(screen.getByText("Lowest")).toBeInTheDocument();
  });

  it("uses translated cell labels", () => {
    render(
      <ComparisonTable
        columns={columns}
        rows={rows}
        labels={{ yes: "Sí", no: "No", unknown: "No aplica" }}
      />,
    );
    expect(screen.getAllByText("Sí")).toHaveLength(2);
    expect(screen.getByText("No aplica")).toBeInTheDocument();
  });
});
